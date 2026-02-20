// src/components/SpeechExplorer.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

const SpeechExplorer = () => {
  const context = useOutletContext();
  const isDark = context?.isDark ?? false;

  const [activeTab, setActiveTab] = useState('recognition');
  const [logs, setLogs] = useState([]);

  // ==================== SPEECH RECOGNITION STATE ====================
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recognitionLang, setRecognitionLang] = useState('en-US');
  const [continuous, setContinuous] = useState(true);
  const [transcriptHistory, setTranscriptHistory] = useState([]);
  const recognitionRef = useRef(null);
  
  // ==================== SPEECH SYNTHESIS STATE ====================
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [synthText, setSynthText] = useState('Hello! I am your browser speaking to you using the Web Speech API.');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Support checks
  const recognitionSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const synthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const log = useCallback((msg, type = 'info') => {
    setLogs(p => [...p.slice(-50), { msg, type, time: new Date().toLocaleTimeString() }]);
  }, []);

  // ==================== SPEECH RECOGNITION ====================
  useEffect(() => {
    if (!recognitionSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = recognitionLang;

    recognition.onstart = () => {
      setIsListening(true);
      log('🎤 Listening...', 'success');
    };

    recognition.onend = () => {
      setIsListening(false);
      log('🎤 Stopped listening', 'info');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript(prev => prev + ' ' + final);
        setTranscriptHistory(prev => [...prev, { text: final.trim(), time: new Date().toLocaleTimeString() }]);
        log(`📝 "${final.trim()}"`, 'success');
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      log(`Error: ${event.error}`, 'error');
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [recognitionSupported, continuous, recognitionLang, log]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.lang = recognitionLang;
      recognitionRef.current.continuous = continuous;
      try {
        recognitionRef.current.start();
      } catch (e) {
        log(e.message, 'error');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setTranscriptHistory([]);
    log('Transcript cleared', 'info');
  };

  const copyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcript.trim());
      log('📋 Copied to clipboard!', 'success');
    } catch (e) {
      log(e.message, 'error');
    }
  };

  // ==================== SPEECH SYNTHESIS ====================
  useEffect(() => {
    if (!synthesisSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Try to find an English voice first
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(englishVoice?.name || availableVoices[0].name);
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.cancel();
    };
  }, [synthesisSupported, selectedVoice]);

  const speak = () => {
    if (!synthesisSupported || !synthText.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(synthText);
    
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      log('🔊 Speaking...', 'success');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      log('🔊 Finished speaking', 'info');
    };

    utterance.onerror = (e) => {
      log(`Speech error: ${e.error}`, 'error');
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (isSpeaking && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
      log('⏸️ Paused', 'info');
    }
  };

  const resumeSpeech = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      log('▶️ Resumed', 'info');
    }
  };

  const stopSpeech = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    log('⏹️ Stopped', 'info');
  };

  // Sample texts for TTS
  const sampleTexts = [
    { label: '👋 Greeting', text: 'Hello! Welcome to the Web Speech API Explorer. I can speak in many different voices and languages!' },
    { label: '🌤️ Weather', text: 'Today will be sunny with a high of 75 degrees. Perfect weather for a walk in the park!' },
    { label: '📰 News', text: 'Breaking news: Scientists have discovered a new species of butterfly in the Amazon rainforest.' },
    { label: '🎭 Story', text: 'Once upon a time, in a land far away, there lived a brave knight who dreamed of adventure.' },
    { label: '🔢 Numbers', text: 'One, two, three, four, five, six, seven, eight, nine, ten!' },
    { label: '🌍 Languages', text: 'The Web Speech API supports many languages including English, Spanish, French, German, and more.' },
  ];

  // Languages for recognition
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'ru-RU', name: 'Russian' },
  ];

  // Styles
  const card = `rounded-xl p-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`;
  const btn = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`;
  const btnDanger = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`;
  const btnSuccess = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`;
  const btn2 = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`;
  const tab = (active) => `px-4 py-2 rounded-lg text-sm font-medium transition ${active ? 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;
  const select = `px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const textarea = `w-full px-3 py-2 rounded-lg border resize-none ${isDark ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🗣️ Speech Explorer
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Speech Recognition (Voice → Text) & Speech Synthesis (Text → Voice)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('recognition')} className={tab(activeTab === 'recognition')}>
          🎤 Speech Recognition
        </button>
        <button onClick={() => setActiveTab('synthesis')} className={tab(activeTab === 'synthesis')}>
          🔊 Speech Synthesis
        </button>
      </div>

      {/* Speech Recognition Tab */}
      {activeTab === 'recognition' && (
        <div className="space-y-4">
          {!recognitionSupported ? (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <p className={isDark ? 'text-yellow-400' : 'text-yellow-700'}>
                ⚠️ Speech Recognition not supported in this browser. Try Chrome or Edge.
              </p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className={card}>
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🎤 Voice to Text
                  </h3>
                  <div className="flex gap-2">
                    {!isListening ? (
                      <button onClick={startListening} className={btnSuccess}>
                        🎤 Start Listening
                      </button>
                    ) : (
                      <button onClick={stopListening} className={btnDanger}>
                        ⏹️ Stop
                      </button>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Language
                    </label>
                    <select 
                      value={recognitionLang} 
                      onChange={(e) => setRecognitionLang(e.target.value)}
                      disabled={isListening}
                      className={`w-full ${select}`}
                    >
                      {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <input
                        type="checkbox"
                        checked={continuous}
                        onChange={(e) => setContinuous(e.target.checked)}
                        disabled={isListening}
                        className="w-4 h-4 rounded"
                      />
                      Continuous listening
                    </label>
                  </div>
                </div>

                {/* Listening Animation */}
                {isListening && (
                  <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-green-900/30 border border-green-500/30' : 'bg-green-50 border border-green-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-green-500 rounded-full animate-pulse"
                            style={{
                              height: `${Math.random() * 20 + 10}px`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-green-500 font-medium">Listening... Speak now!</span>
                    </div>
                  </div>
                )}

                {/* Interim Result */}
                {interimTranscript && (
                  <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      <span className="font-medium">Hearing: </span>
                      <span className="italic">{interimTranscript}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Transcript */}
              <div className={card}>
                <div className="flex justify-between items-center mb-3">
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📝 Transcript
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={copyTranscript} className={btn2} disabled={!transcript.trim()}>
                      📋 Copy
                    </button>
                    <button onClick={clearTranscript} className={btn2}>
                      🗑️ Clear
                    </button>
                  </div>
                </div>
                <div className={`min-h-32 p-4 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  {transcript.trim() ? (
                    <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {transcript.trim()}
                    </p>
                  ) : (
                    <p className={`text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Your speech will appear here...
                    </p>
                  )}
                </div>
              </div>

              {/* History */}
              {transcriptHistory.length > 0 && (
                <div className={card}>
                  <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📜 History ({transcriptHistory.length} phrases)
                  </h3>
                  <div className={`max-h-48 overflow-y-auto rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    {transcriptHistory.map((item, idx) => (
                      <div key={idx} className={`p-2 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.time}</span>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Speech Synthesis Tab */}
      {activeTab === 'synthesis' && (
        <div className="space-y-4">
          {!synthesisSupported ? (
            <div className={`p-4 rounded-lg ${isDark ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
              <p className={isDark ? 'text-yellow-400' : 'text-yellow-700'}>
                ⚠️ Speech Synthesis not supported in this browser.
              </p>
            </div>
          ) : (
            <>
              {/* Text Input */}
              <div className={card}>
                <h3 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🔊 Text to Speech
                </h3>
                <textarea
                  value={synthText}
                  onChange={(e) => setSynthText(e.target.value)}
                  placeholder="Type something for me to say..."
                  rows={4}
                  className={textarea}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {sampleTexts.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSynthText(sample.text)}
                      className={`text-xs ${btn2}`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Settings */}
              <div className={card}>
                <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ⚙️ Voice Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Voice Selection */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Voice ({voices.length} available)
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className={`w-full ${select}`}
                    >
                      {voices.map((voice, idx) => (
                        <option key={idx} value={voice.name}>
                          {voice.name} ({voice.lang}) {voice.default && '⭐'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rate */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Speed: {rate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Slow</span>
                      <span>Normal</span>
                      <span>Fast</span>
                    </div>
                  </div>

                  {/* Pitch */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Pitch: {pitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span>Normal</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Volume */}
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Volume: {Math.round(volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>🔇</span>
                      <span>🔉</span>
                      <span>🔊</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playback Controls */}
              <div className={card}>
                <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🎛️ Playback
                </h3>
                
                {/* Status */}
                {isSpeaking && (
                  <div className={`p-3 rounded-lg mb-4 flex items-center gap-3 ${
                    isPaused 
                      ? isDark ? 'bg-yellow-900/30 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
                      : isDark ? 'bg-green-900/30 border border-green-500/30' : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                    <span className={isPaused ? 'text-yellow-500' : 'text-green-500'}>
                      {isPaused ? '⏸️ Paused' : '🔊 Speaking...'}
                    </span>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  {!isSpeaking ? (
                    <button 
                      onClick={speak} 
                      disabled={!synthText.trim()}
                      className={`${btnSuccess} text-lg px-8 py-3`}
                    >
                      ▶️ Speak
                    </button>
                  ) : (
                    <>
                      {!isPaused ? (
                        <button onClick={pauseSpeech} className={`${btn} text-lg px-6 py-3`}>
                          ⏸️ Pause
                        </button>
                      ) : (
                        <button onClick={resumeSpeech} className={`${btnSuccess} text-lg px-6 py-3`}>
                          ▶️ Resume
                        </button>
                      )}
                      <button onClick={stopSpeech} className={`${btnDanger} text-lg px-6 py-3`}>
                        ⏹️ Stop
                      </button>
                    </>
                  )}
                </div>

                {/* Quick Test Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quick Tests:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Hello!', 'Testing 1 2 3', 'Web Speech API is awesome!', '🎉 Congratulations!'].map((text, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSynthText(text);
                          setTimeout(() => {
                            const utterance = new SpeechSynthesisUtterance(text);
                            const voice = voices.find(v => v.name === selectedVoice);
                            if (voice) utterance.voice = voice;
                            utterance.rate = rate;
                            utterance.pitch = pitch;
                            speechSynthesis.speak(utterance);
                          }, 100);
                        }}
                        className={btn2}
                      >
                        🔊 {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Activity Log */}
      <div className={card}>
        <div className="flex justify-between items-center mb-2">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Log</h3>
          <button onClick={() => setLogs([])} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Clear
          </button>
        </div>
        <div className={`h-24 overflow-y-auto rounded p-2 text-xs font-mono ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {logs.length === 0 ? (
            <p className={isDark ? 'text-gray-600' : 'text-gray-400'}>Waiting for activity...</p>
          ) : (
            logs.map((l, i) => (
              <div key={i}>
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>[{l.time}]</span>{' '}
                <span className={
                  l.type === 'error' ? 'text-red-500' : 
                  l.type === 'success' ? 'text-green-500' : 
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }>{l.msg}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Summary */}
      <div className={card}>
        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>📚 APIs in This Page</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{recognitionSupported ? '✅' : '❌'}</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Speech Recognition</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Convert voice to text in real-time. Supports multiple languages and continuous listening.
            </p>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span>{synthesisSupported ? '✅' : '❌'}</span>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Speech Synthesis</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Convert text to speech. Multiple voices, adjustable speed, pitch, and volume.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechExplorer;