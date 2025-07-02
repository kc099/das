import React, { useEffect, useRef, useState } from 'react';

/**
 * DeviceDataModal
 * ----------------
 * Displays real-time sensor data for a single device by listening to the
 * /ws/sensors/ WebSocket endpoint of the EdgeSync backend.
 *
 * Props:
 *  - device:  The device object ({uuid, name, device_id, ...}) whose data we want to view.
 *  - onClose: Function called when the modal should be closed.
 */
function DeviceDataModal({ device, onClose }) {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const accessToken = localStorage.getItem('access_token');

    // Determine backend host for websocket connection.
    // Priority:
    // 1. REACT_APP_WS_BASE_URL env var (e.g., wss://api.yourdomain.com)
    // 2. Same host/port when not on the CRA dev server (3000)
    // 3. localhost:8000 (default Django dev server)

    const envBase = process.env.REACT_APP_WS_BASE_URL;
    let base;
    if (envBase) {
      base = envBase.replace(/\/$/, ''); // strip trailing slash
    } else if (window.location.port === '3000') {
      base = `${protocol}://${window.location.hostname}:8000`;
    } else {
      base = `${protocol}://${window.location.host}`;
    }

    const wsUrl = `${base}/ws/sensors/${accessToken ? `?token=${accessToken}` : ''}`;

    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // The backend includes device_id in the broadcast; filter to selected device
        if (data.device_id === device.device_id || data.device_id === device.uuid) {
          setMessages((prev) => [...prev.slice(-49), data]); // keep last 50 msgs
        }
      } catch (e) {
        // Ignore malformed JSON
      }
    };

    socketRef.current.onerror = (err) => {
      console.error('WebSocket error', err);
    };

    return () => {
      socketRef.current?.close();
    };
  }, [device]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px', width: '90%'}}>
        <div className="modal-header">
          <h2 className="modal-title">Live Data · {device.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
          {messages.length === 0 ? (
            <p>No data received yet…</p>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr>
                  <th style={{textAlign: 'left'}}>Timestamp</th>
                  <th style={{textAlign: 'left'}}>Sensor</th>
                  <th style={{textAlign: 'left'}}>Value</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, idx) => (
                  <tr key={idx} style={{borderTop: '1px solid var(--border-light)'}}>
                    <td>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</td>
                    <td>{msg.sensor_type}</td>
                    <td>{msg.value} {msg.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeviceDataModal; 