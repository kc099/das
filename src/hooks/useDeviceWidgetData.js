import { useEffect, useRef, useState } from 'react';
import { dashboardAPI } from '../services/api/dashboard';

// Helper function to format timestamp for different widget types
const formatTimestamp = (isoString, widgetType) => {
  const date = new Date(isoString);
  
  switch (widgetType) {
    case 'time_series':
      // Return time in HH:MM format for time series charts
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    default:
      return isoString;
  }
};

// Helper function to transform WebSocket data for widget consumption
const transformWidgetData = (rawDataPoint, widgetType) => {
  const transformed = {
    timestamp: formatTimestamp(rawDataPoint.timestamp, widgetType),
    value: rawDataPoint.value
  };
  
  // Add additional fields based on widget type
  if (widgetType === 'time_series') {
    // For time series, we might have multiple sensor readings
    // Keep the original sensor name as a separate field
    if (rawDataPoint.unit) {
      transformed.unit = rawDataPoint.unit;
    }
  }
  
  return transformed;
};

export const useDeviceWidgetData = (dashboardUuid, widget) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // If the dashboard has not been persisted yet we cannot fetch samples.
    if (!dashboardUuid) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const fetchInitial = async () => {
      try {
        const res = await dashboardAPI.getWidgetSamples(dashboardUuid, widget.id);
        if (!isMounted) return;
        
        // Transform initial data to match widget format
        const rawData = res.data.data || [];
        const transformedData = rawData.map(item => transformWidgetData(item, widget.type));
        setData(transformedData);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message);
        setLoading(false);
      }
    };
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [dashboardUuid, widget.id, widget.type]);

  useEffect(() => {
    // Open live WebSocket stream only when the widget belongs to a saved dashboard
    if (!dashboardUuid) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    // Support proxying when the React dev server (port 3000) is separate from
    // the Django backend (default 8000). We mirror the logic used elsewhere
    // in the codebase (e.g. PropertiesPanel.js, DeviceDataModal.js).
    const envBase = process.env.REACT_APP_WS_BASE_URL;
    let base;
    if (envBase) {
      base = envBase.replace(/\/$/, '');
    } else if (window.location.port === '3000') {
      base = `${protocol}://${window.location.hostname}:8000`;
    } else {
      base = `${protocol}://${window.location.host}`;
    }

    const accessToken = localStorage.getItem('access_token');
    // FIX: Remove extra slash before query parameter
    const wsUrl = `${base}/ws/widgets/${widget.id}${accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''}`;
    
    console.log(`🔌 Connecting to widget WebSocket: ${widget.id}`);
    
    wsRef.current = new WebSocket(wsUrl);
    
    // Add connection state handlers for debugging
    wsRef.current.onopen = (evt) => {
      console.log(`✅ Widget WebSocket connected: ${widget.id}`);
    };
    
    wsRef.current.onmessage = (evt) => {
      try {
        const rawPayload = JSON.parse(evt.data);
        
        // Transform the data for widget consumption
        const transformedPayload = transformWidgetData(rawPayload, widget.type);
        
        setData((prev) => {
          // Keep only the last 50 points and add the new one
          const next = [...prev, transformedPayload].slice(-50);
          return next;
        });
      } catch (e) {
        console.warn('Failed to parse widget message:', e);
      }
    };
    
    wsRef.current.onerror = (e) => {
      console.error('❌ Widget WS error:', e);
    };
    
    wsRef.current.onclose = (evt) => {
      console.log(`🔌 Widget WebSocket closed: ${widget.id}, code: ${evt.code}`);
    };
    
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log(`👋 Closing widget WebSocket: ${widget.id}`);
        wsRef.current.close();
      }
    };
  }, [dashboardUuid, widget.id, widget.type]);

  return { data, loading, error };
}; 