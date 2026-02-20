// src/components/BluetoothExplorer.jsx
import React, { useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const BluetoothExplorer = () => {
  const { isDark } = useOutletContext();
  
  const [isSupported] = useState(() => 'bluetooth' in navigator);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  
  const deviceRef = useRef(null);
  const serverRef = useRef(null);

  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }].slice(-50));
  }, []);

  const checkBluetoothAvailability = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setError('Web Bluetooth API is not supported in this browser. Try Chrome or Edge.');
      return false;
    }
    
    try {
      const available = await navigator.bluetooth.getAvailability();
      if (!available) {
        setError('Bluetooth is not available on this device.');
        return false;
      }
      addLog('Bluetooth is available and ready', 'success');
      return true;
    } catch (err) {
      addLog(`Availability check failed: ${err.message}`, 'error');
      return true;
    }
  }, [addLog]);

  const scanForDevices = useCallback(async () => {
    setError(null);
    setIsScanning(true);
    addLog('Starting device scan...', 'info');

    const available = await checkBluetoothAvailability();
    if (!available) {
      setIsScanning(false);
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'heart_rate',
          'generic_access',
          'generic_attribute',
        ]
      });

      addLog(`Device found: ${device.name || 'Unknown Device'}`, 'success');
      
      deviceRef.current = device;
      setConnectedDevice({
        name: device.name || 'Unknown Device',
        id: device.id,
      });

      device.addEventListener('gattserverdisconnected', () => {
        addLog('Device disconnected', 'warning');
        setConnectedDevice(null);
        setDeviceInfo(null);
        setServices([]);
        deviceRef.current = null;
        serverRef.current = null;
      });

      await connectToDevice(device);
      
    } catch (err) {
      if (err.name === 'NotFoundError') {
        addLog('No device selected or scan cancelled', 'warning');
      } else {
        addLog(`Scan error: ${err.message}`, 'error');
        setError(err.message);
      }
    } finally {
      setIsScanning(false);
    }
  }, [addLog, checkBluetoothAvailability]);

  const connectToDevice = useCallback(async (device) => {
    addLog('Connecting to GATT server...', 'info');
    
    try {
      const server = await device.gatt.connect();
      serverRef.current = server;
      addLog('Connected to GATT server', 'success');

      addLog('Discovering services...', 'info');
      const primaryServices = await server.getPrimaryServices();
      
      const servicesData = [];
      
      for (const service of primaryServices) {
        const serviceInfo = {
          uuid: service.uuid,
          isPrimary: service.isPrimary,
          characteristics: []
        };

        try {
          const characteristics = await service.getCharacteristics();
          
          for (const char of characteristics) {
            const charInfo = {
              uuid: char.uuid,
              properties: {
                read: char.properties.read,
                write: char.properties.write,
                writeWithoutResponse: char.properties.writeWithoutResponse,
                notify: char.properties.notify,
                indicate: char.properties.indicate,
              },
              value: null,
              decodedValue: null
            };

            if (char.properties.read) {
              try {
                const value = await char.readValue();
                const parsed = parseCharacteristicValue(value, char.uuid);
                charInfo.value = parsed.hex;
                charInfo.decodedValue = parsed.text;
                addLog(`Read ${char.uuid.slice(4,8).toUpperCase()}: ${parsed.text || parsed.hex}`, 'info');
              } catch (readErr) {
                addLog(`Could not read ${char.uuid.slice(4,8).toUpperCase()}: ${readErr.message}`, 'warning');
              }
            }

            serviceInfo.characteristics.push(charInfo);
          }
        } catch (charErr) {
          addLog(`Could not get characteristics: ${charErr.message}`, 'warning');
        }

        servicesData.push(serviceInfo);
      }

      setServices(servicesData);
      addLog(`Discovered ${servicesData.length} services`, 'success');

      await getDeviceInformation(server);

    } catch (err) {
      addLog(`Connection error: ${err.message}`, 'error');
      setError(err.message);
    }
  }, [addLog]);

  // Parse characteristic values - returns hex and decoded text
  const parseCharacteristicValue = (dataView, uuid) => {
    const bytes = new Uint8Array(dataView.buffer);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    
    let text = null;
    
    // Battery level
    if (uuid.includes('2a19')) {
      text = `${dataView.getUint8(0)}% Battery`;
    }
    // Device name and other string values
    else if (uuid.includes('2a00') || uuid.includes('2a29') || uuid.includes('2a24') || 
             uuid.includes('2a25') || uuid.includes('2a27') || uuid.includes('2a26') || 
             uuid.includes('2a28')) {
      text = new TextDecoder('utf-8').decode(dataView.buffer);
    }
    // Heart rate
    else if (uuid.includes('2a37')) {
      const flags = dataView.getUint8(0);
      const rate16Bits = flags & 0x1;
      text = rate16Bits ? `${dataView.getUint16(1, true)} BPM` : `${dataView.getUint8(1)} BPM`;
    }
    // Try to decode as text if it looks like printable ASCII
    else {
      try {
        const decoded = new TextDecoder('utf-8').decode(dataView.buffer);
        if (/^[\x20-\x7E]+$/.test(decoded) && decoded.length > 0) {
          text = decoded;
        }
      } catch {}
    }
    
    return { hex, text };
  };

  const getDeviceInformation = useCallback(async (server) => {
    try {
      const deviceInfoService = await server.getPrimaryService('device_information');
      const info = {};

      const charMap = {
        '2a29': 'manufacturer',
        '2a24': 'model',
        '2a25': 'serial',
        '2a27': 'hardware',
        '2a26': 'firmware',
        '2a28': 'software'
      };

      for (const [uuid, key] of Object.entries(charMap)) {
        try {
          const char = await deviceInfoService.getCharacteristic(parseInt('0x' + uuid, 16));
          const value = await char.readValue();
          info[key] = new TextDecoder().decode(value.buffer);
        } catch {}
      }

      if (Object.keys(info).length > 0) {
        setDeviceInfo(info);
        addLog('Retrieved device information', 'success');
      }
    } catch {
      addLog('Device information service not available', 'info');
    }
  }, [addLog]);

  const subscribeToNotifications = useCallback(async (serviceUuid, charUuid) => {
    if (!serverRef.current) return;

    try {
      const service = await serverRef.current.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(charUuid);
      
      await characteristic.startNotifications();
      
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const parsed = parseCharacteristicValue(event.target.value, charUuid);
        addLog(`📡 ${charUuid.slice(4,8).toUpperCase()}: ${parsed.text || parsed.hex}`, 'info');
      });

      addLog(`Subscribed to ${charUuid.slice(4,8).toUpperCase()}`, 'success');
    } catch (err) {
      addLog(`Subscription error: ${err.message}`, 'error');
    }
  }, [addLog]);

  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
      addLog('Disconnected from device', 'info');
    }
    setConnectedDevice(null);
    setDeviceInfo(null);
    setServices([]);
  }, [addLog]);

  const getServiceName = (uuid) => {
    const names = {
      '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
      '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
      '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
      '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
      '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
    };
    return names[uuid] || 'Custom Service';
  };

  const getCharName = (uuid) => {
    const short = uuid.slice(4, 8).toLowerCase();
    const names = {
      '2a00': 'Device Name',
      '2a01': 'Appearance', 
      '2a19': 'Battery Level',
      '2a29': 'Manufacturer',
      '2a24': 'Model Number',
      '2a37': 'Heart Rate',
    };
    return names[short];
  };

  const cardClass = `rounded-xl border p-4 ${
    isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white/60 border-gray-200'
  }`;
  
  const buttonPrimary = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
  }`;
  
  const buttonSecondary = `px-4 py-2 rounded-lg font-medium transition-all ${
    isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
  }`;

  if (!isSupported) {
    return (
      <div className={cardClass}>
        <div className="text-center py-8">
          <div className="text-6xl mb-4"></div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Web Bluetooth Not Supported
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
            Please use Chrome, Edge, or Opera on desktop/Android.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bluetooth Explorer
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Discover and interact with nearby BLE devices
          </p>
        </div>
        
        <div className="flex gap-2">
          {connectedDevice ? (
            <button onClick={disconnect} className={buttonSecondary}>
              Disconnect
            </button>
          ) : (
            <button onClick={scanForDevices} disabled={isScanning} className={buttonPrimary}>
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Scanning...
                </span>
              ) : 'Scan for Devices'}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected Device */}
      <AnimatePresence>
        {connectedDevice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cardClass}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                isDark ? 'bg-green-600/20' : 'bg-green-100'
              }`}>
                
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {connectedDevice.name}
                </h3>
                <p className={`text-xs font-mono ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {connectedDevice.id}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  Connected
                </span>
              </div>
            </div>

            {deviceInfo && (
              <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Device Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(deviceInfo).map(([key, value]) => (
                    <div key={key}>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </span>{' '}
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services */}
      {services.length > 0 && (
        <div className={cardClass}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Services ({services.length})
          </h3>
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-gray-100/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {getServiceName(service.uuid)}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {service.characteristics.length} characteristics
                  </span>
                </div>
                
                {service.characteristics.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {service.characteristics.map((char, charIdx) => (
                      <div key={charIdx} className={`p-3 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <code className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {char.uuid.slice(4, 8).toUpperCase()}
                            </code>
                            {getCharName(char.uuid) && (
                              <span className={`ml-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {getCharName(char.uuid)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {char.properties.read && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-500">R</span>
                            )}
                            {char.properties.write && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-500">W</span>
                            )}
                            {char.properties.notify && (
                              <button
                                onClick={() => subscribeToNotifications(service.uuid, char.uuid)}
                                className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                              >
                                N
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Value Display - Shows decoded text + hex */}
                        {char.value && (
                          <div className={`mt-2 p-2 rounded text-sm ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                            {char.decodedValue && (
                              <div className={`font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                 {char.decodedValue}
                              </div>
                            )}
                            <div className={`text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'} ${char.decodedValue ? 'mt-1' : ''}`}>
                              {char.value}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div className={`h-48 overflow-y-auto rounded-lg p-3 font-mono text-xs ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {logs.length === 0 ? (
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              Click "Scan for Devices" to start...
            </p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>
                  [{log.timestamp}]
                </span>
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
    </div>
  );
};

export default BluetoothExplorer;