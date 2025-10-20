# Live Widget Data Flow

This document explains how raw device telemetry becomes **live, realtime data** inside a dashboard widget.

---

## 1. Ingestion (Device → Back-end)

```
ESP32 / sensor → MQTT publish → `SensorDataConsumer` (WebSocket) → `SensorData` row
```
1. The device publishes JSON: `{device_id, sensor_type, value, unit}` (or a bulk `readings` array).
2. `SensorDataConsumer` authenticates the socket (device token or user JWT).
3. Each reading is persisted to the `sensors_sensordata` table.
4. The consumer then calls `_handle_widget_tracking()`.

## 2. Tracked Variables (CRITICAL!)

*When a user visualizes a **device node** in Flow Editor → "Visualize Output"*

### Frontend (PropertiesPanel.js)
1. User selects a device node in the flow editor
2. User selects a **variable** (sensor type) from dropdown - e.g., "temperature", "humidity"
3. User clicks "Visualize Output" → selects widget type and dashboard
4. Frontend calls: `POST /api/flows/{flowUuid}/nodes/{nodeId}/create-widget/`
   - **CRITICAL**: Must include `sensor_variable` in request body
   - Example: `{ sensor_variable: "humidity", widget_type: "time_series", ... }`

### Backend (flows/views.py)
1. `create_widget_from_node` endpoint receives the request
2. Extracts `device_id` from `nodeId` (format: `{device_uuid}-{timestamp}`)
3. Gets `sensor_type` from `request.data['sensor_variable']` **← PRIMARY SOURCE**
4. Creates `TrackedVariable` entry:
   ```python
   TrackedVariable.objects.update_or_create(
       device_id=device_uuid,      # e.g., "95b2524b-fa0e-4717-b4ba-9ae9aff3365d"
       sensor_type=sensor_var,     # e.g., "humidity"
       widget_id=widget_id,        # e.g., "flow-widget-20251019-080729-cb2f1d17"
       defaults={
           'dashboard_uuid': dashboard_uuid,
           'max_samples': 50,
       }
   )
   ```

### Why TrackedVariable is Critical
- Without `TrackedVariable`, the widget receives **NO DATA**
- `_handle_widget_tracking()` looks up `TrackedVariable` to find which widgets need updates
- If lookup fails, sensor data is stored but **not** sent to widgets
- **Common mistake**: Frontend not sending `sensor_variable` → no TrackedVariable created → no data

### Verification
Check if TrackedVariable exists:
```python
from sensors.models import TrackedVariable
tv = TrackedVariable.objects.filter(widget_id='your-widget-id').first()
print(tv.device_id, tv.sensor_type)  # Should match device UUID and variable
```

## 3. Short-term buffer (WidgetSample)

`_handle_widget_tracking()` in `SensorDataConsumer` performs three jobs **for every incoming reading**:

1. **Lookup**: Finds all `TrackedVariable` entries matching `(device_id, sensor_type)`
2. **Store**: `WidgetSample.objects.create(...)` – append the data point for each widget
3. **Trim**: `_trim_samples()` – delete rows beyond the last 50 per widget
4. **Broadcast**: `channel_layer.group_send('widget_<widget_id>', ...)` – push the point to browsers via WebSocket

**Data Flow**:
```
Device sends: {device_id: "95b25...", sensor_type: "humidity", value: 50.21}
    ↓
SensorDataConsumer receives & saves to SensorData table
    ↓
_handle_widget_tracking() queries: TrackedVariable.objects.filter(device_id="95b25...", sensor_type="humidity")
    ↓
For each TrackedVariable found:
    → Create WidgetSample(widget=tracked_var, value=50.21, ...)
    → Trim old samples (keep last 50)
    → Send WebSocket message to widget_{widget_id} channel
```

Result: at most **50 rows per widget** in `widget_samples`, regardless of device publish rate.

**If no TrackedVariable found**: Data is saved to SensorData table but **NOT** propagated to any widgets!

## 4. Transport to the browser

Path A – **initial page load**:
```
GET /api/dashboard-templates/<dash_uuid>/widgets/<widget_id>/samples/ → JSON list (≤50)
```
Path B – **realtime updates**:
```
ws://<host>/ws/widgets/<widget_id>/
```
Every sample has shape:
```json
{ "timestamp": "2025-07-09T07:15:02Z", "value": 24.8, "unit": "°C" }
```

## 5. Front-end integration

1. `useDeviceWidgetData(dashboardUuid, widget)`
   * fetches the initial 50 samples (Path A).
   * opens the WebSocket (Path B) and appends new points, keeping the last 50 in memory.
2. `WidgetFactory` supplies this `data` array to the concrete widget component—e.g. `TimeSeriesWidget`.
3. The widget re-renders automatically on every state update and shows live data without page refresh.

## 6. Flow node widgets (non-device)

Widgets linked to **internal flow nodes** continue to use `flowAPI.getNodeOutput*` endpoints. The new tracked-variable path is **only** for device-node widgets.

---

## Troubleshooting

### Widget shows "Connecting..." but no data

**Symptoms**:
- Widget WebSocket connects successfully
- Old dashboards with widgets show data (50 samples)
- New widget shows 0 samples and stays in loading state

**Diagnosis**:
```python
# Check if TrackedVariable exists for the widget
from sensors.models import TrackedVariable, WidgetSample

tv = TrackedVariable.objects.filter(widget_id='your-widget-id').first()
if not tv:
    print("❌ No TrackedVariable found - this is the problem!")
else:
    print(f"✅ TrackedVariable exists: device={tv.device_id}, sensor={tv.sensor_type}")
    sample_count = WidgetSample.objects.filter(widget=tv).count()
    print(f"   Samples in buffer: {sample_count}")
```

**Root Causes**:
1. Frontend didn't send `sensor_variable` in create-widget request
2. User didn't select a variable from dropdown before clicking "Visualize Output"
3. Backend failed to extract device_id from node_id
4. Device doesn't exist in database
5. **FIXED**: Backend relied on `node_data.category == 'device'` but flow nodes don't have this field set

**Backend Fix Applied** (flows/views.py):
The backend now uses a more reliable detection method - it attempts to extract the device UUID from the node_id format and checks if a Device exists, rather than relying on the `category` field:

```python
# Device node detection based on node_id structure and device existence
parts = node_id.split('-')
if len(parts) >= 5:  # UUID (5 parts) + timestamp
    device_uuid = '-'.join(parts[:5])
    try:
        device = Device.objects.get(uuid=device_uuid)
        # If device exists, create TrackedVariable
        sensor_var = widget_config.get('sensor_variable') or ...
        if sensor_var:
            TrackedVariable.objects.update_or_create(...)
    except Device.DoesNotExist:
        pass  # Not a device node
```

**Manual Fix (if needed)**:
```python
# Manual fix: Create TrackedVariable
from sensors.models import TrackedVariable, Device

device_uuid = "95b2524b-fa0e-4717-b4ba-9ae9aff3365d"  # Extract from node_id
sensor_type = "humidity"  # The variable user selected
widget_id = "flow-widget-20251019-080729-cb2f1d17"  # From widget config
dashboard_uuid = "462e41a4-4c65-4568-84e6-b1e1f8156595"  # From dashboard

device = Device.objects.get(uuid=device_uuid)  # Verify device exists

TrackedVariable.objects.create(
    device_id=device_uuid,
    sensor_type=sensor_type,
    widget_id=widget_id,
    dashboard_uuid=dashboard_uuid,
    max_samples=50
)
```

**Prevention**:
1. Ensure PropertiesPanel.js includes `sensor_variable` in the API request payload
2. Backend now auto-detects device nodes by checking if a Device exists with the extracted UUID

---

### Automatic Cleanup

**TrackedVariable and WidgetSample Cleanup**:
When widgets are deleted or dashboards are removed, the system automatically cleans up associated database entries to prevent unbounded growth:

**Widget Deletion** (dashboard update):
- When a user deletes a widget from a dashboard in DashboardCreator, the frontend updates the dashboard's `widgets` array
- Backend compares old widget IDs vs new widget IDs (line 1222-1240 in user/views.py)
- For each deleted widget: deletes all WidgetSample entries, then deletes TrackedVariable entry
- This prevents orphaned TrackedVariable and WidgetSample records

**Dashboard Deletion**:
- When a dashboard template is deleted entirely (line 1252-1269 in user/views.py)
- Backend extracts all widget IDs from the dashboard
- For each widget: deletes all WidgetSample entries, then deletes TrackedVariable entry
- Dashboard is then deleted

**Implementation**:
```python
# In dashboard_template_detail_view (PUT method)
old_widget_ids = {w.get('id') for w in template.widgets or []}
# ... serializer.save() ...
new_widget_ids = {w.get('id') for w in updated_template.widgets or []}
deleted_widget_ids = old_widget_ids - new_widget_ids

if deleted_widget_ids:
    for widget_id in deleted_widget_ids:
        tracked_vars = TrackedVariable.objects.filter(widget_id=widget_id, dashboard_uuid=template.uuid)
        for tv in tracked_vars:
            WidgetSample.objects.filter(widget=tv).delete()
        tracked_vars.delete()
```

**Why This Matters**:
- Without cleanup, every widget ever created would leave permanent TrackedVariable entries
- Sensor data would continue being routed to deleted widgets, wasting database space
- WidgetSample table would grow unbounded with samples for non-existent widgets

---
### Table Summary
| Stage | Component / Table | Purpose | Critical Fields |
|-------|-------------------|---------|----------------|
| Ingestion | `SensorDataConsumer` | Receive & persist raw readings | device_id, sensor_type, value |
| Buffer declaration | `TrackedVariable` | Which device+sensor feeds which widget | **device_id, sensor_type, widget_id** |
| Buffer storage | `WidgetSample` | Last 50 samples per widget | widget (FK), timestamp, value |
| Broadcast | Channels group `widget_<id>` | Push new samples live | widget_id |
| Rest API | `/samples/` endpoint | Initial fetch | dashboard_uuid, widget_id |
| Front-end hook | `useDeviceWidgetData` | Fetch + subscribe | dashboardUuid, widget.id |
| Rendering | `WidgetFactory` → widgets | Display live data | widget.dataSource |

---
_Updated: 2025-10-19 - Added TrackedVariable troubleshooting, fixed device node detection logic, and implemented automatic cleanup for deleted widgets_ 