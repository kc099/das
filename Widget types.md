Perfect! I've fixed all the issues you mentioned:

  ✅ Issues Fixed:

  1. Device Node Variable Validation

  - Visualization limited to output and device nodes only - Other node types no longer show the visualization
   option
  - Variable validation for device nodes - Shows warning "⚠️ Please select a variable first" and disables the
   "Visualize Output" button until a variable is selected
  - Visual feedback - Warning appears in yellow box when variable is not selected

  2. Data Source Connection Fixed

  - Backend API enhanced - The get_node_output endpoint now handles both flow nodes and device nodes
  - Device node data retrieval - For device nodes, it queries the SensorData model to get recent sensor
  readings (last 5 minutes)
  - Sensor type filtering - When a specific sensor variable is selected (like 'temperature'), it filters the
  data accordingly

  3. Selected Variable Included

  - Widget configuration updated - The selected variable is now included in the widget config as:
    - output_field: The selected sensor variable
    - sensor_variable: The selected sensor variable
    - sensorVariable: In the widget config for frontend use
  - API parameter passing - The widget properties panel now passes the sensor variable to the backend when
  checking data source status

  4. Variable Display in Properties Panel

  - Sensor type filtering - When checking device node data, it now filters by the selected sensor variable
  - Real-time data preview - The properties panel will show actual sensor data for the selected variable
  - Status indicators - Proper status checking for device nodes with selected variables

  🎯 How it works now:

  1. Device Node Setup: Select a device node → choose a variable (temperature/humidity) → click "Visualize
  Output"
  2. Validation: Button is disabled until variable is selected
  3. Widget Creation: Widget is created with the selected variable properly configured
  4. Data Source: Widget properties panel can now successfully connect to device data and show real sensor
  readings
  5. Real-time Preview: Properties panel shows actual sensor data for the selected variable

  The system now properly handles device node visualization with variable selection and real-time data
  connection!