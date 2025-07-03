# Widget Structure for Flow Editor, imporvements to flow UI

Each flow editor shold show the devices connected to the project in the side window.

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