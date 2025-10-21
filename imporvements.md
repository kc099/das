Additions in future:

Websockets based syreaming, authentication and enpoint creations. is encryption necessary? 
Add devices tabs. Device templates? OEE, Andon, Energy Monitoring. 


To test MQTT edit username, pwd and ACL rules. 

Webhooks in blynk IoT on;y fetches data from a url without publisin to it. 

Immediate Priorities (3-6 months):


Mobile App: Operators need mobile dashboards and alerts
Edge Computing: Add offline-first capabilities for unreliable industrial networks
Advanced Security: Industrial-grade encryption, role-based access, audit logs

// OPCODES (1 byte)
enum Opcode {
  // Control Flow (0x00-0x0F)
  NOP           = 0x00,  // No operation
  HALT          = 0x01,  // Stop execution
  JUMP          = 0x02,  // Jump to instruction
  JUMP_IF       = 0x03,  // Conditional jump
  CALL          = 0x04,  // Call subroutine
  RETURN        = 0x05,  // Return from subroutine
  
  // Digital I/O (0x10-0x1F)
  READ_DI       = 0x10,  // Read digital input
  WRITE_DO      = 0x11,  // Write digital output
  READ_AI       = 0x12,  // Read analog input
  WRITE_AO      = 0x13,  // Write analog output
  
  // Modbus (0x20-0x2F)
  MODBUS_READ_HOLDING  = 0x20,
  MODBUS_READ_INPUT    = 0x21,
  MODBUS_WRITE_SINGLE  = 0x22,
  MODBUS_WRITE_MULTI   = 0x23,
  
  // CAN Bus (0x30-0x3F)
  CAN_SEND      = 0x30,
  CAN_RECEIVE   = 0x31,
  
  // MQTT (0x40-0x4F)
  MQTT_PUBLISH  = 0x40,
  MQTT_SUBSCRIBE = 0x41,
  
  // Math Operations (0x50-0x5F)
  ADD           = 0x50,
  SUBTRACT      = 0x51,
  MULTIPLY      = 0x52,
  DIVIDE        = 0x53,
  MODULO        = 0x54,
  
  // Logic Operations (0x60-0x6F)
  AND           = 0x60,
  OR            = 0x61,
  NOT           = 0x62,
  XOR           = 0x63,
  
  // Comparison (0x70-0x7F)
  EQUAL         = 0x70,
  NOT_EQUAL     = 0x71,
  GREATER       = 0x72,
  LESS          = 0x73,
  GREATER_EQ    = 0x74,
  LESS_EQ       = 0x75,
  
  // Data Manipulation (0x80-0x8F)
  LOAD_CONST    = 0x80,  // Load constant to register
  LOAD_REG      = 0x81,  // Load from register
  STORE_REG     = 0x82,  // Store to register
  COPY_REG      = 0x83,  // Copy register to register
  
  // Transform (0x90-0x9F)
  MOVING_AVG    = 0x90,
  RATE_LIMIT    = 0x91,
  DEBOUNCE      = 0x92,
  SCALE         = 0x93,
  
  // Timer/Delay (0xA0-0xAF)
  TIMER_START   = 0xA0,
  TIMER_STOP    = 0xA1,
  DELAY         = 0xA2,
  
  // Extended (0xF0-0xFF)
  EXTENDED      = 0xFF   // For future expansion
};