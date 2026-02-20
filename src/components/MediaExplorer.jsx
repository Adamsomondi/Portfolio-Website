// src/components/MediaExplorer.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MediaExplorer = () => {
  const { isDark } = useOutletContext();
  
  // Active tab
  const [activeTab, setActiveTab] = useState('devices');
  
  // Devices state
  const [devices, setDevices] = useState({ audio: [], video: [], output: [] });
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedVideoInput, setSelectedVideoInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  
  // Media streams
  const [cameraStream, setCameraStream] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingType, setRecordingType] = useState(null); // 'camera', 'screen', 'audio'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  
  // Picture-in-Picture state
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [isPiPSupported] = useState(() => 'pictureInPictureEnabled' in document);
  
  // Media Session state
  const [mediaSessionSupported] = useState(() => 'mediaSession' in navigator);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Demo Track',
    artist: 'Web API Explorer',
    album: 'Learning APIs',
    playing: false
  });
  const audioRef = useRef(null);
  
  // Image Capture state
  const [imageCaptureSupported, setImageCaptureSupported] = useState(false);
  const [photoCapabilities, setPhotoCapabilities] = useState(null);
  const [photoSettings, setPhotoSettings] = useState({});
  const imageCaptureRef = useRef(null);
  
  // Audio visualization
  const [audioData, setAudioData] = useState(new Uint8Array(0));
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  
  // Video refs
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  
  // Logs
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  
  // Permissions state
  const [permissions, setPermissions] = useState({
    camera: 'unknown',
    microphone: 'unknown'
  });

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }].slice(-50));
  }, []);

  // Check permissions
  const checkPermissions = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const camera = await navigator.permissions.query({ name: 'camera' });
        const mic = await navigator.permissions.query({ name: 'microphone' });
        
        setPermissions({
          camera: camera.state,
          microphone: mic.state
        });
        
        camera.onchange = () => setPermissions(p => ({ ...p, camera: camera.state }));
        mic.onchange = () => setPermissions(p => ({ ...p, microphone: mic.state }));
      }
    } catch (err) {
      // Permissions API not fully supported
    }
  }, []);

  // Enumerate all media devices
  const enumerateDevices = useCallback(async () => {
    try {
      addLog('Enumerating media devices...', 'info');
      
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        tempStream.getTracks().forEach(track => track.stop());
      } catch {
        // Permission denied
      }
      
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      
      const audio = allDevices.filter(d => d.kind === 'audioinput');
      const video = allDevices.filter(d => d.kind === 'videoinput');
      const output = allDevices.filter(d => d.kind === 'audiooutput');
      
      setDevices({ audio, video, output });
      
      addLog(`Found ${audio.length} mics, ${video.length} cameras, ${output.length} speakers`, 'success');
      
      const bluetoothDevices = allDevices.filter(d => 
        d.label.toLowerCase().includes('bluetooth') ||
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('wireless')
      );
      
      if (bluetoothDevices.length > 0) {
        addLog(`🔵 Found ${bluetoothDevices.length} Bluetooth device(s)!`, 'success');
      }
      
      if (audio.length > 0) setSelectedAudioInput(audio[0].deviceId);
      if (video.length > 0) setSelectedVideoInput(video[0].deviceId);
      if (output.length > 0) setSelectedAudioOutput(output[0].deviceId);
      
    } catch (err) {
      addLog(`Error enumerating devices: ${err.message}`, 'error');
      setError(err.message);
    }
  }, [addLog]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      addLog('Requesting camera access...', 'info');
      
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints = {
        video: selectedVideoInput 
          ? { deviceId: { exact: selectedVideoInput } }
          : true,
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      
      addLog(`📹 Camera started: ${videoTrack.label}`, 'success');
      addLog(`Resolution: ${settings.width}x${settings.height} @ ${settings.frameRate?.toFixed(0) || '?'}fps`, 'info');
      
      // Setup Image Capture API if supported
      if ('ImageCapture' in window) {
        try {
          const imageCapture = new ImageCapture(videoTrack);
          imageCaptureRef.current = imageCapture;
          setImageCaptureSupported(true);
          
          const capabilities = await imageCapture.getPhotoCapabilities();
          setPhotoCapabilities(capabilities);
          addLog('📷 Image Capture API ready', 'success');
        } catch (err) {
          addLog(`Image Capture not available: ${err.message}`, 'warning');
        }
      }
      
    } catch (err) {
      addLog(`Camera error: ${err.message}`, 'error');
      setError(err.message);
    }
  }, [cameraStream, selectedVideoInput, addLog]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
      imageCaptureRef.current = null;
      setImageCaptureSupported(false);
      setPhotoCapabilities(null);
      addLog('Camera stopped', 'info');
    }
  }, [cameraStream, addLog]);

  // Start microphone with visualization
  const startMicrophone = useCallback(async () => {
    try {
      addLog('Requesting microphone access...', 'info');
      
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      const constraints = {
        audio: selectedAudioInput 
          ? { deviceId: { exact: selectedAudioInput } }
          : true,
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicStream(stream);
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const audioTrack = stream.getAudioTracks()[0];
      addLog(`🎤 Microphone started: ${audioTrack.label}`, 'success');
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVisualization = () => {
        analyser.getByteFrequencyData(dataArray);
        setAudioData(new Uint8Array(dataArray));
        animationRef.current = requestAnimationFrame(updateVisualization);
      };
      
      updateVisualization();
      
    } catch (err) {
      addLog(`Microphone error: ${err.message}`, 'error');
      setError(err.message);
    }
  }, [micStream, selectedAudioInput, addLog]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioData(new Uint8Array(0));
    addLog('Microphone stopped', 'info');
  }, [micStream, addLog]);

  // Start screen capture
  const startScreenCapture = useCallback(async () => {
    try {
      addLog('Requesting screen capture...', 'info');
      
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: true
      });
      
      setScreenStream(stream);
      
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }
      
      const videoTrack = stream.getVideoTracks()[0];
      addLog(`🖥️ Screen capture started: ${videoTrack.label}`, 'success');
      
      videoTrack.onended = () => {
        setScreenStream(null);
        addLog('Screen sharing stopped by user', 'info');
      };
      
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        addLog('Screen capture cancelled by user', 'warning');
      } else {
        addLog(`Screen capture error: ${err.message}`, 'error');
        setError(err.message);
      }
    }
  }, [screenStream, addLog]);

  // Stop screen capture
  const stopScreenCapture = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = null;
      }
      addLog('Screen capture stopped', 'info');
    }
  }, [screenStream, addLog]);

  // ==================== NEW API #1: MediaRecorder ====================
  
  const startRecording = useCallback((type) => {
    let stream;
    
    if (type === 'camera' && cameraStream) {
      stream = cameraStream;
    } else if (type === 'screen' && screenStream) {
      stream = screenStream;
    } else if (type === 'audio' && micStream) {
      stream = micStream;
    } else {
      addLog(`No ${type} stream available to record`, 'error');
      return;
    }
    
    try {
      const mimeType = type === 'audio' ? 'audio/webm' : 'video/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${Date.now()}.${type === 'audio' ? 'webm' : 'webm'}`;
        a.click();
        
        URL.revokeObjectURL(url);
        addLog(`💾 Recording saved! (${(blob.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
        
        setRecordedChunks([]);
        setRecordingDuration(0);
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingType(type);
      
      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      addLog(`🔴 Recording ${type} started...`, 'success');
      
    } catch (err) {
      addLog(`Recording error: ${err.message}`, 'error');
    }
  }, [cameraStream, screenStream, micStream, addLog]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingType(null);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      addLog('Recording stopped', 'info');
    }
  }, [isRecording, addLog]);

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== NEW API #2: Picture-in-Picture ====================
  
  const togglePictureInPicture = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
        addLog('Exited Picture-in-Picture', 'info');
      } else if (cameraVideoRef.current && cameraStream) {
        await cameraVideoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
        addLog('📌 Entered Picture-in-Picture mode', 'success');
      } else if (screenVideoRef.current && screenStream) {
        await screenVideoRef.current.requestPictureInPicture();
        setIsPiPActive(true);
        addLog('📌 Entered Picture-in-Picture mode', 'success');
      } else {
        addLog('No video stream available for PiP', 'warning');
      }
    } catch (err) {
      addLog(`PiP error: ${err.message}`, 'error');
    }
  }, [cameraStream, screenStream, addLog]);

  // Listen for PiP events
  useEffect(() => {
    const handlePiPEnter = () => setIsPiPActive(true);
    const handlePiPExit = () => setIsPiPActive(false);
    
    if (cameraVideoRef.current) {
      cameraVideoRef.current.addEventListener('enterpictureinpicture', handlePiPEnter);
      cameraVideoRef.current.addEventListener('leavepictureinpicture', handlePiPExit);
    }
    
    return () => {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.removeEventListener('enterpictureinpicture', handlePiPEnter);
        cameraVideoRef.current.removeEventListener('leavepictureinpicture', handlePiPExit);
      }
    };
  }, [cameraStream]);

  // ==================== NEW API #3: Media Session ====================
  
  const setupMediaSession = useCallback(() => {
    if (!mediaSessionSupported) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: currentTrack.album,
      artwork: [
        { src: 'https://via.placeholder.com/96', sizes: '96x96', type: 'image/png' },
        { src: 'https://via.placeholder.com/128', sizes: '128x128', type: 'image/png' },
        { src: 'https://via.placeholder.com/256', sizes: '256x256', type: 'image/png' },
      ]
    });
    
    navigator.mediaSession.setActionHandler('play', () => {
      setCurrentTrack(prev => ({ ...prev, playing: true }));
      audioRef.current?.play();
      addLog('▶️ Media Session: Play', 'info');
    });
    
    navigator.mediaSession.setActionHandler('pause', () => {
      setCurrentTrack(prev => ({ ...prev, playing: false }));
      audioRef.current?.pause();
      addLog('⏸️ Media Session: Pause', 'info');
    });
    
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      addLog('⏮️ Media Session: Previous Track', 'info');
    });
    
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      addLog('⏭️ Media Session: Next Track', 'info');
    });
    
    addLog('🎵 Media Session API configured', 'success');
  }, [mediaSessionSupported, currentTrack, addLog]);

  const togglePlayback = useCallback(() => {
    if (currentTrack.playing) {
      audioRef.current?.pause();
      setCurrentTrack(prev => ({ ...prev, playing: false }));
      navigator.mediaSession.playbackState = 'paused';
    } else {
      audioRef.current?.play();
      setCurrentTrack(prev => ({ ...prev, playing: true }));
      navigator.mediaSession.playbackState = 'playing';
    }
  }, [currentTrack.playing]);

  // ==================== NEW API #4: Audio Output (setSinkId) ====================
  
  const changeAudioOutput = useCallback(async (deviceId) => {
    try {
      if (typeof audioRef.current?.setSinkId === 'function') {
        await audioRef.current.setSinkId(deviceId);
        setSelectedAudioOutput(deviceId);
        const device = devices.output.find(d => d.deviceId === deviceId);
        addLog(`🔊 Audio output changed to: ${device?.label || 'Unknown'}`, 'success');
      } else {
        addLog('setSinkId not supported in this browser', 'warning');
      }
    } catch (err) {
      addLog(`Error changing output: ${err.message}`, 'error');
    }
  }, [devices.output, addLog]);

  // ==================== NEW API #5: Image Capture ====================
  
  const takeAdvancedPhoto = useCallback(async () => {
    if (!imageCaptureRef.current) {
      addLog('Image Capture not available', 'error');
      return;
    }
    
    try {
      const blob = await imageCaptureRef.current.takePhoto(photoSettings);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `photo-${Date.now()}.jpg`;
      a.click();
      
      URL.revokeObjectURL(url);
      addLog(`📸 Photo captured! (${(blob.size / 1024).toFixed(1)} KB)`, 'success');
    } catch (err) {
      addLog(`Photo capture error: ${err.message}`, 'error');
    }
  }, [photoSettings, addLog]);

  const grabFrame = useCallback(async () => {
    if (!imageCaptureRef.current) {
      addLog('Image Capture not available', 'error');
      return;
    }
    
    try {
      const bitmap = await imageCaptureRef.current.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-${Date.now()}.png`;
      a.click();
      
      addLog(`🖼️ Frame grabbed! (${bitmap.width}x${bitmap.height})`, 'success');
    } catch (err) {
      addLog(`Frame grab error: ${err.message}`, 'error');
    }
  }, [addLog]);

  // Take simple photo (fallback)
  const takePhoto = useCallback(() => {
    if (!cameraVideoRef.current || !cameraStream) return;
    
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const link = document.createElement('a');
    link.download = `photo-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    addLog('📸 Photo captured!', 'success');
  }, [cameraStream, addLog]);

  // Initialize
  useEffect(() => {
    checkPermissions();
    enumerateDevices();
    
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      if (micStream) micStream.getTracks().forEach(t => t.stop());
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Styles
  const cardClass = `rounded-xl border p-4 ${
    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/60 border-gray-200'
  }`;
  
  const buttonPrimary = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
  }`;
  
  const buttonDanger = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
  }`;
  
  const buttonSecondary = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`;

  const buttonSuccess = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
  }`;

  const tabClass = (isActive) => `px-4 py-2 rounded-lg font-medium transition-all text-sm ${
    isActive 
      ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
      : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }`;

  const selectClass = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDark 
      ? 'bg-gray-900 border-gray-700 text-white' 
      : 'bg-white border-gray-300 text-gray-900'
  }`;

  const getDeviceIcon = (device) => {
    const label = device.label.toLowerCase();
    if (label.includes('bluetooth') || label.includes('airpods') || label.includes('buds') || label.includes('wireless')) {
      return '🔵';
    }
    if (device.kind === 'videoinput') return '📹';
    if (device.kind === 'audioinput') return '🎤';
    if (device.kind === 'audiooutput') return '🔊';
    return '📱';
  };

  const isBluetoothDevice = (device) => {
    const label = device.label.toLowerCase();
    return label.includes('bluetooth') || label.includes('airpods') || 
           label.includes('buds') || label.includes('wireless');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🎬 Media Explorer
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          11 Web APIs: Camera, Microphone, Screen, Recording, PiP, Media Session & more!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'devices', label: '📱 Devices' },
          { id: 'camera', label: '📹 Camera' },
          { id: 'microphone', label: '🎤 Mic' },
          { id: 'screen', label: '🖥️ Screen' },
          { id: 'recording', label: '🔴 Record' },
          { id: 'session', label: '🎵 Session' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={tabClass(activeTab === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500"
          >
            <div className="flex justify-between items-start">
              <div><strong>Error:</strong> {error}</div>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permissions Status */}
      <div className={`flex gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <span className="flex items-center gap-1">
          Camera: 
          <span className={permissions.camera === 'granted' ? 'text-green-500' : permissions.camera === 'denied' ? 'text-red-500' : 'text-yellow-500'}>
            {permissions.camera === 'granted' ? '✓' : permissions.camera === 'denied' ? '✕' : '?'}
          </span>
        </span>
        <span className="flex items-center gap-1">
          Microphone: 
          <span className={permissions.microphone === 'granted' ? 'text-green-500' : permissions.microphone === 'denied' ? 'text-red-500' : 'text-yellow-500'}>
            {permissions.microphone === 'granted' ? '✓' : permissions.microphone === 'denied' ? '✕' : '?'}
          </span>
        </span>
        {isRecording && (
          <span className="flex items-center gap-2 text-red-500 ml-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording: {formatDuration(recordingDuration)}
          </span>
        )}
      </div>

      {/* Hidden audio element for Media Session */}
      <audio 
        ref={audioRef} 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        onPlay={() => setCurrentTrack(prev => ({ ...prev, playing: true }))}
        onPause={() => setCurrentTrack(prev => ({ ...prev, playing: false }))}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <motion.div
            key="devices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                All Media Devices
              </h2>
              <button onClick={enumerateDevices} className={buttonSecondary}>
                🔄 Refresh
              </button>
            </div>

            {/* Audio Inputs */}
            <div className={cardClass}>
              <h3 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🎤 Audio Inputs
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {devices.audio.length}
                </span>
              </h3>
              <div className="space-y-2">
                {devices.audio.map((device, idx) => (
                  <div 
                    key={device.deviceId || idx}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      isBluetoothDevice(device)
                        ? isDark ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                        : isDark ? 'bg-gray-900/50' : 'bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{getDeviceIcon(device)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {device.label || `Microphone ${idx + 1}`}
                      </p>
                    </div>
                    {isBluetoothDevice(device) && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        Bluetooth
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Video Inputs */}
            <div className={cardClass}>
              <h3 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                📹 Video Inputs
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {devices.video.length}
                </span>
              </h3>
              <div className="space-y-2">
                {devices.video.map((device, idx) => (
                  <div key={device.deviceId || idx} className={`p-3 rounded-lg flex items-center gap-3 ${isDark ? 'bg-gray-900/50' : 'bg-gray-100'}`}>
                    <span className="text-xl">📹</span>
                    <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {device.label || `Camera ${idx + 1}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Outputs */}
            <div className={cardClass}>
              <h3 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🔊 Audio Outputs
                <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {devices.output.length}
                </span>
              </h3>
              <div className="space-y-2">
                {devices.output.map((device, idx) => (
                  <div 
                    key={device.deviceId || idx}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      isBluetoothDevice(device)
                        ? isDark ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
                        : isDark ? 'bg-gray-900/50' : 'bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{getDeviceIcon(device)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {device.label || `Speaker ${idx + 1}`}
                      </p>
                    </div>
                    {isBluetoothDevice(device) && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        Bluetooth
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select Camera
                  </label>
                  <select 
                    value={selectedVideoInput}
                    onChange={(e) => setSelectedVideoInput(e.target.value)}
                    className={selectClass}
                    disabled={cameraStream !== null}
                  >
                    {devices.video.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  {cameraStream ? (
                    <>
                      {imageCaptureSupported ? (
                        <>
                          <button onClick={takeAdvancedPhoto} className={buttonSuccess}>
                            📷 Photo
                          </button>
                          <button onClick={grabFrame} className={buttonSecondary}>
                            🖼️ Frame
                          </button>
                        </>
                      ) : (
                        <button onClick={takePhoto} className={buttonSecondary}>
                          📸 Photo
                        </button>
                      )}
                      {isPiPSupported && (
                        <button onClick={togglePictureInPicture} className={buttonSecondary}>
                          {isPiPActive ? '📌 Exit PiP' : '📌 PiP'}
                        </button>
                      )}
                      <button onClick={stopCamera} className={buttonDanger}>
                        Stop
                      </button>
                    </>
                  ) : (
                    <button onClick={startCamera} className={buttonPrimary}>
                      Start Camera
                    </button>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className={`relative rounded-lg overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ aspectRatio: '16/9' }}>
                {cameraStream ? (
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl">📹</span>
                      <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Click "Start Camera" to begin
                      </p>
                    </div>
                  </div>
                )}
                
                {cameraStream && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded bg-green-500 text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                )}
                
                {isPiPActive && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-purple-500 text-white text-xs">
                    PiP Active
                  </div>
                )}
              </div>

              {/* Image Capture Capabilities */}
              {photoCapabilities && (
                <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    📷 Image Capture Capabilities
                  </h4>
                  <div className={`text-xs grid grid-cols-2 gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {photoCapabilities.imageWidth && (
                      <span>Width: {photoCapabilities.imageWidth.min}-{photoCapabilities.imageWidth.max}</span>
                    )}
                    {photoCapabilities.imageHeight && (
                      <span>Height: {photoCapabilities.imageHeight.min}-{photoCapabilities.imageHeight.max}</span>
                    )}
                    {photoCapabilities.fillLightMode && (
                      <span>Flash: {photoCapabilities.fillLightMode.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Microphone Tab */}
        {activeTab === 'microphone' && (
          <motion.div
            key="microphone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className={cardClass}>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select Microphone
                  </label>
                  <select 
                    value={selectedAudioInput}
                    onChange={(e) => setSelectedAudioInput(e.target.value)}
                    className={selectClass}
                    disabled={micStream !== null}
                  >
                    {devices.audio.map((device, idx) => (
                      <option key={device.deviceId || idx} value={device.deviceId}>
                        {device.label || `Microphone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  {micStream ? (
                    <button onClick={stopMicrophone} className={buttonDanger}>
                      Stop Microphone
                    </button>
                  ) : (
                    <button onClick={startMicrophone} className={buttonPrimary}>
                      Start Microphone
                    </button>
                  )}
                </div>
              </div>

              {/* Audio Visualization */}
              <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Audio Visualization {micStream ? '(speak to see the bars!)' : ''}
                </p>
                <div className="h-32 flex items-end justify-center gap-1">
                  {audioData.length > 0 ? (
                    Array.from(audioData).slice(0, 64).map((value, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-t transition-all duration-75 ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`}
                        style={{ 
                          height: `${Math.max(4, (value / 255) * 100)}%`,
                          opacity: 0.3 + (value / 255) * 0.7
                        }}
                      />
                    ))
                  ) : (
                    <div className="text-center">
                      <span className="text-4xl">🎤</span>
                      <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Start the microphone to see visualization
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Screen Tab */}
        {activeTab === 'screen' && (
          <motion.div
            key="screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className={cardClass}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Screen Capture</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Share your screen, window, or tab
                  </p>
                </div>
                <div className="flex gap-2">
                  {screenStream && isPiPSupported && (
                    <button onClick={togglePictureInPicture} className={buttonSecondary}>
                      📌 PiP
                    </button>
                  )}
                  {screenStream ? (
                    <button onClick={stopScreenCapture} className={buttonDanger}>
                      Stop
                    </button>
                  ) : (
                    <button onClick={startScreenCapture} className={buttonPrimary}>
                      Start Screen Share
                    </button>
                  )}
                </div>
              </div>

              <div className={`relative rounded-lg overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} style={{ aspectRatio: '16/9' }}>
                {screenStream ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-6xl">🖥️</span>
                      <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Click "Start Screen Share" to begin
                      </p>
                    </div>
                  </div>
                )}
                
                {screenStream && (
                  <div className="absolute top-2 left-2 flex items-center gap-2 px-2 py-1 rounded bg-red-500 text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    SHARING
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recording Tab */}
        {activeTab === 'recording' && (
          <motion.div
            key="recording"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className={cardClass}>
              <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🔴 MediaRecorder API
              </h3>
              
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Record your camera, screen, or microphone to a downloadable file.
              </p>

              {isRecording ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg flex items-center justify-between ${isDark ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                      <span className={isDark ? 'text-red-400' : 'text-red-600'}>
                        Recording {recordingType}... {formatDuration(recordingDuration)}
                      </span>
                    </div>
                    <button onClick={stopRecording} className={buttonDanger}>
                      ⏹️ Stop & Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => startRecording('camera')}
                    disabled={!cameraStream}
                    className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                      cameraStream
                        ? isDark ? 'border-blue-500/50 hover:bg-blue-500/10 text-white' : 'border-blue-400 hover:bg-blue-50 text-gray-900'
                        : isDark ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    <span className="text-3xl">📹</span>
                    <p className="mt-2 font-medium">Record Camera</p>
                    <p className={`text-xs mt-1 ${cameraStream ? 'text-green-500' : ''}`}>
                      {cameraStream ? '✓ Ready' : 'Start camera first'}
                    </p>
                  </button>

                  <button
                    onClick={() => startRecording('screen')}
                    disabled={!screenStream}
                    className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                      screenStream
                        ? isDark ? 'border-blue-500/50 hover:bg-blue-500/10 text-white' : 'border-blue-400 hover:bg-blue-50 text-gray-900'
                        : isDark ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    <span className="text-3xl">🖥️</span>
                    <p className="mt-2 font-medium">Record Screen</p>
                    <p className={`text-xs mt-1 ${screenStream ? 'text-green-500' : ''}`}>
                      {screenStream ? '✓ Ready' : 'Start screen share first'}
                    </p>
                  </button>

                  <button
                    onClick={() => startRecording('audio')}
                    disabled={!micStream}
                    className={`p-4 rounded-lg border-2 border-dashed transition-all ${
                      micStream
                        ? isDark ? 'border-blue-500/50 hover:bg-blue-500/10 text-white' : 'border-blue-400 hover:bg-blue-50 text-gray-900'
                        : isDark ? 'border-gray-700 text-gray-600' : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    <span className="text-3xl">🎤</span>
                    <p className="mt-2 font-medium">Record Audio</p>
                    <p className={`text-xs mt-1 ${micStream ? 'text-green-500' : ''}`}>
                      {micStream ? '✓ Ready' : 'Start microphone first'}
                    </p>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Media Session Tab */}
        {activeTab === 'session' && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className={cardClass}>
              <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                🎵 Media Session API
              </h3>
              
              <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Control how your media appears in OS notifications and respond to media keys.
              </p>

              {!mediaSessionSupported ? (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                  <p className={isDark ? 'text-yellow-400' : 'text-yellow-700'}>
                    Media Session API not supported in this browser.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Now Playing Card */}
                  <div className={`p-6 rounded-xl ${isDark ? 'bg-gradient-to-br from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-br from-purple-100 to-blue-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-4xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        🎵
                      </div>
                      <div className="flex-1">
                        <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {currentTrack.title}
                        </p>
                        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {currentTrack.artist}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                          {currentTrack.album}
                        </p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="flex justify-center gap-4 mt-6">
                      <button className={`p-3 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}>
                        ⏮️
                      </button>
                      <button 
                        onClick={() => {
                          setupMediaSession();
                          togglePlayback();
                        }}
                        className={`p-4 rounded-full ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white text-xl`}
                      >
                        {currentTrack.playing ? '⏸️' : '▶️'}
                      </button>
                      <button className={`p-3 rounded-full ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}>
                        ⏭️
                      </button>
                    </div>
                  </div>

                  {/* Audio Output Selection */}
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      🔊 Audio Output (setSinkId API)
                    </label>
                    <select
                      value={selectedAudioOutput}
                      onChange={(e) => changeAudioOutput(e.target.value)}
                      className={selectClass}
                    >
                      {devices.output.map((device, idx) => (
                        <option key={device.deviceId || idx} value={device.deviceId}>
                          {getDeviceIcon(device)} {device.label || `Speaker ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    💡 Press play, then check your OS media controls (keyboard media keys, lock screen, etc.)
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Log */}
      <div className={cardClass}>
        <div className="flex justify-between items-center mb-3">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activity Log
          </h3>
          {logs.length > 0 && (
            <button 
              onClick={() => setLogs([])}
              className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              Clear
            </button>
          )}
        </div>
        <div className={`h-32 overflow-y-auto rounded-lg p-3 font-mono text-xs ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {logs.length === 0 ? (
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>Waiting for activity...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>[{log.timestamp}]</span>
                <span className={
                  log.type === 'error' ? 'text-red-500' :
                  log.type === 'success' ? 'text-green-500' :
                  log.type === 'warning' ? 'text-yellow-500' :
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }>
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Summary */}
      <div className={cardClass}>
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📚 APIs in This Page: 11
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
          {[
            { name: 'enumerateDevices()', status: '✅', desc: 'List devices' },
            { name: 'getUserMedia(video)', status: '✅', desc: 'Camera access' },
            { name: 'getUserMedia(audio)', status: '✅', desc: 'Mic access' },
            { name: 'getDisplayMedia()', status: '✅', desc: 'Screen capture' },
            { name: 'Web Audio API', status: '✅', desc: 'Visualization' },
            { name: 'Permissions API', status: '✅', desc: 'Check status' },
            { name: 'MediaRecorder', status: '✅', desc: 'Record media' },
            { name: 'Picture-in-Picture', status: isPiPSupported ? '✅' : '❌', desc: 'Float video' },
            { name: 'Media Session', status: mediaSessionSupported ? '✅' : '❌', desc: 'Now Playing' },
            { name: 'setSinkId()', status: '✅', desc: 'Change output' },
            { name: 'Image Capture', status: '✅', desc: 'Advanced photos' },
          ].map((api, idx) => (
            <div key={idx} className={`p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
              <span className="mr-2">{api.status}</span>
              <span className={`font-mono ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{api.name}</span>
              <span className={`ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>- {api.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaExplorer;