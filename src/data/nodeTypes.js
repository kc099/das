export const nodeCategories = {
  input: {
    label: 'Input Contacts',
    color: '#3b82f6',
    nodes: {
      contact_no: {
        label: 'NO Contact',
        icon: 'Square',
        config: { tag: 'I0.0', description: 'Normally Open Contact' }
      },
      contact_nc: {
        label: 'NC Contact',
        icon: 'SquareSlash',
        config: { tag: 'I0.1', description: 'Normally Closed Contact' }
      },
      rising_edge: {
        label: 'Rising Edge',
        icon: 'TrendingUp',
        config: { tag: 'I0.2', description: 'Rising Edge Trigger' }
      },
      falling_edge: {
        label: 'Falling Edge',
        icon: 'TrendingDown',
        config: { tag: 'I0.3', description: 'Falling Edge Trigger' }
      }
    }
  },
  output: {
    label: 'Output Coils',
    color: '#ef4444',
    nodes: {
      coil: {
        label: 'Output Coil',
        icon: 'Circle',
        config: { tag: 'Q0.0', description: 'Output Coil' }
      },
      coil_set: {
        label: 'Set Coil',
        icon: 'CircleDot',
        config: { tag: 'Q0.1', description: 'Set Coil (Latch)' }
      },
      coil_reset: {
        label: 'Reset Coil',
        icon: 'CircleOff',
        config: { tag: 'Q0.2', description: 'Reset Coil (Unlatch)' }
      }
    }
  },
  function: {
    label: 'Math',
    color: '#22c55e',
    nodes: {
      movingAverage: {
        label: 'Moving Average',
        icon: 'TrendingUp',
        config: { windowSize: 10, outputInterval: 1000 }
      },
      min: {
        label: 'Minimum',
        icon: 'ChevronDown',
        config: { windowSize: 10, resetOnOutput: false }
      },
      max: {
        label: 'Maximum',
        icon: 'ChevronUp',
        config: { windowSize: 10, resetOnOutput: false }
      }
    }
  },
  network: {
    label: 'Network',
    color: '#f59e0b',
    nodes: {
      mqtt: {
        label: 'MQTT',
        icon: 'Wifi',
        config: {
          broker: 'localhost',
          port: 1883,
          topic: 'sensor/data',
          qos: 0,
          retain: false
        }
      },
      http: {
        label: 'HTTP Request',
        icon: 'Globe',
        config: {
          method: 'GET',
          url: 'https://api.example.com',
          headers: {},
          timeout: 5000
        }
      },
      // websocket: {
      //   label: 'WebSocket',
      //   icon: 'Zap',
      //   config: {
      //     url: 'ws://localhost:8080',
      //     reconnect: true,
      //     reconnectInterval: 5000
      //   }
      // }
    }
  },
  storage: {
    label: 'Storage',
    color: '#8b5cf6',
    nodes: {
      mysql: {
        label: 'MySQL',
        icon: 'Database',
        config: {
          host: 'localhost',
          port: 3306,
          database: 'sensor_data',
          username: '',
          password: '',
          query: 'SELECT * FROM sensors WHERE id = ?'
        }
      },
      postgres: {
        label: 'PostgreSQL',
        icon: 'Database',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'sensor_data',
          username: '',
          password: '',
          query: 'SELECT * FROM sensors WHERE id = $1'
        }
      }
    }
  },
  device: {
    label: 'Device',
    color: '#0ea5e9',
    nodes: {}
  }
};

export const defaultFlowData = {
  nodes: [],
  edges: []
};

export const flowMetadata = {
  id: null,
  name: 'Untitled Flow',
  description: '',
  createdAt: null,
  updatedAt: null,
  version: '1.0.0',
  tags: [],
  isActive: false
};
