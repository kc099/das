export const nodeCategories = {
  common: {
    label: 'Common',
    color: '#6366f1',
    nodes: {
      input: {
        label: 'Input',
        icon: 'ArrowDown',
        subtypes: {
          button: { label: 'Button', config: { text: 'Click me' } },
          slider: { label: 'Slider', config: { min: 0, max: 100, value: 50 } },
          text: { label: 'Text Input', config: { placeholder: 'Enter text' } },
          number: { label: 'Number Input', config: { min: 0, max: 1000, value: 0 } }
        }
      },
      output: {
        label: 'Output',
        icon: 'ArrowUp',
        subtypes: {
          digital: { label: 'Digital Output', config: { state: false } },
          analog: { label: 'Analog Output', config: { value: 0, range: [0, 255] } },
          display: { label: 'Display', config: { text: '', format: 'text' } }
        }
      },
      comment: {
        label: 'Comment',
        icon: 'MessageSquare',
        config: { text: 'Add your comment here...' }
      },
      debug: {
        label: 'Debug',
        icon: 'Bug',
        config: { showTimestamp: true, showPayload: true }
      }
    }
  },
  function: {
    label: 'Function',
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
      },
      customPython: {
        label: 'Custom Python',
        icon: 'Code',
        config: { 
          code: 'def process(msg):\n    # Your Python code here\n    return msg',
          timeout: 5000
        }
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
      websocket: {
        label: 'WebSocket',
        icon: 'Zap',
        config: {
          url: 'ws://localhost:8080',
          reconnect: true,
          reconnectInterval: 5000
        }
      }
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
  }
};

export const defaultFlowData = {
  nodes: [
    {
      id: '1',
      type: 'input',
      position: { x: 100, y: 100 },
      data: {
        category: 'common',
        nodeType: 'input',
        subtype: 'button',
        label: 'Start Button',
        config: { text: 'Start Process' }
      }
    },
    {
      id: '2',
      type: 'function',
      position: { x: 300, y: 100 },
      data: {
        category: 'function',
        nodeType: 'movingAverage',
        label: 'Moving Average',
        config: { windowSize: 5, outputInterval: 1000 }
      }
    },
    {
      id: '3',
      type: 'output',
      position: { x: 500, y: 100 },
      data: {
        category: 'common',
        nodeType: 'output',
        subtype: 'display',
        label: 'Display Output',
        config: { text: '', format: 'number' }
      }
    },
    {
      id: '4',
      type: 'comment',
      position: { x: 200, y: 200 },
      data: {
        category: 'common',
        nodeType: 'comment',
        label: 'Info',
        config: { text: 'This flow processes sensor data using a moving average filter to smooth out noise and fluctuations.' }
      }
    }
  ],
  edges: [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      sourceHandle: 'output',
      targetHandle: 'input'
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      sourceHandle: 'output',
      targetHandle: 'input'
    }
  ]
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