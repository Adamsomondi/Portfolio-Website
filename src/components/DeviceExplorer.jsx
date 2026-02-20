// src/components/DeviceExplorer.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const DeviceExplorer = () => {
  const context = useOutletContext();
  const isDark = context?.isDark ?? false;

  const [activeTab, setActiveTab] = useState('battery');
  const [logs, setLogs] = useState([]);
  
  // States
  const [battery, setBattery] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [network, setNetwork] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clipText, setClipText] = useState('');
  const [pasted, setPasted] = useState('');

  const log = (msg, type = 'info') => {
    setLogs(p => [...p.slice(-30), { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  // Online/Offline
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => { setIsOnline(true); log('🟢 Online', 'success'); };
    const off = () => { setIsOnline(false); log('🔴 Offline', 'error'); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Battery
  const getBattery = async () => {
    if (!('getBattery' in navigator)) {
      log('Battery API not supported', 'error');
      return;
    }
    try {
      const b = await navigator.getBattery();
      setBattery({ level: Math.round(b.level * 100), charging: b.charging });
      log(`🔋 ${Math.round(b.level * 100)}%`, 'success');
    } catch (e) {
      log(e.message, 'error');
    }
  };

  // Network
  const getNetwork = () => {
    const c = navigator.connection;
    if (!c) {
      log('Network API not supported', 'error');
      return;
    }
    setNetwork({ type: c.effectiveType, downlink: c.downlink, rtt: c.rtt });
    log(`📡 ${c.effectiveType}`, 'success');
  };

  // Location
  const getLocation = () => {
    if (!navigator.geolocation) {
      log('Geolocation not supported', 'error');
      return;
    }
    setLoading(true);
    log('📍 Getting location...', 'info');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy });
        setLoading(false);
        log(`📍 Found!`, 'success');
      },
      (e) => {
        setLoading(false);
        log(e.message, 'error');
      }
    );
  };

  // Clipboard
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clipText);
      log('📋 Copied!', 'success');
    } catch (e) {
      log(e.message, 'error');
    }
  };

  const paste = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setPasted(t);
      log('📋 Pasted!', 'success');
    } catch (e) {
      log(e.message, 'error');
    }
  };

  // Share
  const share = async () => {
    if (!navigator.share) {
      log('Share not supported', 'error');
      return;
    }
    try {
      await navigator.share({ title: 'Check this!', url: location.href });
      log('📤 Shared!', 'success');
    } catch (e) {
      if (e.name !== 'AbortError') log(e.message, 'error');
    }
  };

  // Vibrate
  const vibrate = (ms) => {
    if (!navigator.vibrate) {
      log('Vibration not supported', 'warning');
      return;
    }
    navigator.vibrate(ms);
    log(`📳 Vibrated`, 'success');
  };

  // Styles
  const card = `rounded-xl p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`;
  const btn = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`;
  const btn2 = `px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`;
  const tab = (active) => `px-4 py-2 rounded-lg text-sm font-medium ${active ? 'bg-blue-500 text-white' : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>📱 Device Explorer</h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Battery, Network, Location, Clipboard, Share & Vibration</p>
      </div>

      {/* Status */}
      <div className={`p-3 rounded-lg flex gap-4 ${isOnline ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        <span className={isOnline ? 'text-green-500' : 'text-red-500'}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
        {battery && <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>🔋 {battery.level}%{battery.charging ? ' ⚡' : ''}</span>}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {['battery', 'network', 'location', 'clipboard', 'share', 'vibration'].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={tab(activeTab === t)}>
            {t === 'battery' && '🔋'}{t === 'network' && '📡'}{t === 'location' && '📍'}
            {t === 'clipboard' && '📋'}{t === 'share' && '📤'}{t === 'vibration' && '📳'} {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={card}>
        {activeTab === 'battery' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>🔋 Battery</h3>
              <button onClick={getBattery} className={btn}>Get Battery</button>
            </div>
            {battery && (
              <div className="space-y-4">
                <div className={`h-16 rounded-xl ${isDark ? 'bg-gray-900' : 'bg-gray-100'} overflow-hidden`}>
                  <div className={`h-full ${battery.level > 50 ? 'bg-green-500' : battery.level > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${battery.level}%` }} />
                </div>
                <p className={`text-center text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {battery.level}% {battery.charging && '⚡'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>📡 Network</h3>
              <button onClick={getNetwork} className={btn}>Get Info</button>
            </div>
            {network && (
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{network.type?.toUpperCase()}</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Speed</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{network.downlink} Mbps</p>
                </div>
                <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RTT</p>
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{network.rtt} ms</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>📍 Location</h3>
              <button onClick={getLocation} disabled={loading} className={btn}>
                {loading ? '⏳...' : 'Get Location'}
              </button>
            </div>
            {location && (
              <div className="space-y-4">
                <iframe
                  title="map"
                  className="w-full h-48 rounded-lg"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}&marker=${location.lat},${location.lng}`}
                />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className={`p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lat</p>
                    <p className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{location.lat.toFixed(4)}</p>
                  </div>
                  <div className={`p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Lng</p>
                    <p className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>{location.lng.toFixed(4)}</p>
                  </div>
                  <div className={`p-2 rounded ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acc</p>
                    <p className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>±{location.acc?.toFixed(0)}m</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clipboard' && (
          <div className="space-y-4">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>📋 Clipboard</h3>
            <div className="flex gap-2">
              <input
                value={clipText}
                onChange={e => setClipText(e.target.value)}
                placeholder="Type to copy..."
                className={`flex-1 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
              />
              <button onClick={copy} className={btn}>Copy</button>
            </div>
            <div className="flex gap-2">
              <button onClick={paste} className={btn2}>Paste from Clipboard</button>
            </div>
            {pasted && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <p className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{pasted}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'share' && (
          <div className="space-y-4 text-center py-8">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>📤 Share</h3>
            <button onClick={share} className={`${btn} text-xl px-8 py-4`}>📤 Share This Page</button>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Opens native share dialog (mobile)</p>
          </div>
        )}

        {activeTab === 'vibration' && (
          <div className="space-y-4">
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>📳 Vibration</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Works on mobile devices</p>
            <div className="grid grid-cols-4 gap-3">
              {[{ n: 'Short', v: 100 }, { n: 'Long', v: 500 }, { n: 'Double', v: [100,50,100] }, { n: 'SOS', v: [100,50,100,50,100,100,300,50,300,50,300] }].map(p => (
                <button key={p.n} onClick={() => vibrate(p.v)} className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-100'}`}>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{p.n}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Log */}
      <div className={card}>
        <div className="flex justify-between mb-2">
          <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Log</h3>
          <button onClick={() => setLogs([])} className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Clear</button>
        </div>
        <div className={`h-24 overflow-y-auto rounded p-2 text-xs font-mono ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {logs.map((l, i) => (
            <div key={i}>
              <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>[{l.time}]</span>{' '}
              <span className={l.type === 'error' ? 'text-red-500' : l.type === 'success' ? 'text-green-500' : isDark ? 'text-gray-300' : 'text-gray-700'}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeviceExplorer;