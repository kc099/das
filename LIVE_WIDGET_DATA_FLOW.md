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

## 2. Tracked variables

*When a user visualises a **device node** in Flow Editor → “Create Widget”*

1. `create_widget_from_node` (in `flows/views.py`) saves a `TrackedVariable` row:
   * `device_id`, `sensor_type`, `widget_id`, `dashboard_uuid`, `max_samples=50`.
2. This row declares **which** variables should be buffered for the widget.

## 3. Short-term buffer (WidgetSample)

`_handle_widget_tracking()` performs three jobs **for every incoming reading** :

1. `WidgetSample.objects.create(...)` – append the point.
2. `_trim_samples()` – delete rows beyond the last 50.
3. `channel_layer.group_send('widget_<widget_id>', …)` – push the point to browsers.

Result: at most **50 rows per widget** in `widget_samples`, regardless of device publish rate.

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
### Table Summary
| Stage | Component / Table | Purpose |
|-------|-------------------|---------|
| Ingestion | `SensorDataConsumer` | Receive & persist raw readings |
| Buffer declaration | `TrackedVariable` | Which device+sensor feeds which widget |
| Buffer storage | `WidgetSample` | Last 50 samples per widget |
| Broadcast | Channels group `widget_<id>` | Push new samples live |
| Rest API | `/samples/` endpoint | Initial fetch |
| Front-end hook | `useDeviceWidgetData` | Fetch + subscribe |
| Rendering | `WidgetFactory` → widgets | Display live data |

---
_Updated: 2025-07-09_ 