# Widget Structure for Flow Editor, imporvements to flow UI

Instead of one MQTT node,there should be three seperate nodes named 
mqtt_pub(published input message to a topic),
mqtt_sub (subscribes to a topic and forwards the message to next node), 
mqtt_broker(hosts a broker with a custom username and password),

Web scoket node should be two separate nodes
websocket_in: websocket input node
websocket_out: webscoket output node

HTTP node should be instead 
http_response: sends a request to a specified url and returns the reposne 

# Dashboard Template Components

dashboards should have following chart widgets
Time series
Bar chart
Gauge
Stat Panel (Big text with changable fonts and sizes, content)
Pie chart
Table
Histogram
XY Chart
Trend chart when x!= time

Features of each chart is: 
Each dashboard template can have some connected datasources. currently support MYSQL, postgreSQL, Influx
There should be a facility to enter sql query or a custom javascript function that can be exceuted on a connected datasource. 
Update frequency of each dashboard.
connection timeout in case of databases. 
Postgresql, mysql, influxdb support as datasources for each chart