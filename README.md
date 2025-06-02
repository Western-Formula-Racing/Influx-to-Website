# Influx-to-Website

npm install @influxdata/influxdb-client





# Next Steps

Feature Requests

1. Allow custom x-axis, to plot sensor value against another value
2. [completed] Overlay of graphs (Influxdb graph viewer supports natively) 
3. Pull units from InfluxDB and display on the graph
# Testing setup - with Python script and docker Influx - HZ



1. clone https://github.com/Western-Formula-Racing/car_to_influx
2. The relevant Python script here is [**readCAN3batchSender.py**](https://github.com/Western-Formula-Racing/car_to_influx/blob/main/readCAN3batchSender.py)
3. Make sure to set the correct TOKEN in the script



## Docker - Influx

1. Install Docker
2. in cmd: 

```
sudo docker run -d \
  --name influxwfr \
  -p 8086:8086 \
  -v ~/influxdb/data:/var/lib/influxdb2 \
  -v ~/influxdb/config:/etc/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=myuser \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=mypassword123 \
  -e DOCKER_INFLUXDB_INIT_ORG=WFR \
  -e DOCKER_INFLUXDB_INIT_BUCKET=ourCar \
  influxdb:2
```





In the address bar at the top, type: `http://localhost:8086`

You should see a login screen

Log in using:

- Username: myuser
- Password: mypassword123

Then: 

1. Find API Key
2. Create an organization called WFR
   1. click your profile icon, then click Create Organization
3. Create a new bucket in Influx: call it "ourCar" <- you can change this in the python script, just make sure it matches.
   1. Consider changing the data retention policy to 1 hour to keep it clean for every testing session



Now, start running the Python code and use the graph viewer to view the testing data:

If you want something that's constantly moving:

ourCar-canBus-sensorReading-M166_Current_info-166-INV_Phase_A_Current



## Query Data Processing Pipeline

1. **Query Execution (executeQuery function)**:
   - Takes a Flux query as input
   - Makes a POST request to InfluxDB's API endpoint with:
     * URL: `${influxConfig.url}/api/v2/query?org=${influxConfig.org}`
     * Authentication: Token-based via headers
     * Request format: Flux query language (`application/vnd.flux`)
     * Response format: CSV (`application/csv`)
   - Checks for successful response (response.ok)
   - Converts response to text (CSV format)
   - Passes CSV to parseInfluxResponse

2. **CSV Parsing (parseInfluxResponse function)**:
   
   Input Validation:
   ```javascript
   if (!csvData || csvData.trim() === '') {
     return [];
   }
   ```
   - Checks if data exists and isn't empty
   
   Data Structure Analysis:
   ```javascript
   const lines = csvData.trim().split('\n');
   if (lines.length < 2) {
     return [];
   }
   ```
   - Splits CSV into lines
   - Ensures there's at least a header and one data row
   
   Header Processing:
   ```javascript
   const headers = lines[0].split(',');
   const timeIndex = headers.findIndex(h => h === '_time');
   const valueIndex = headers.findIndex(h => h === '_value');
   ```
   - Extracts column headers
   - Locates critical columns: '_time' and '_value'
   
   Data Transformation Pipeline:
   ```javascript
   return lines.slice(1)
       .filter(line => line.trim() !== '')
       .map(line => {
         const values = line.split(',');
         return {
           _time: values[timeIndex],
           _value: parseFloat(values[valueIndex])
         };
       })
       .filter(point => !isNaN(point._value));
   ```
   1. `slice(1)`: Skips header row
   2. First `filter`: Removes empty lines
   3. `map`: Transforms each line into an object with _time and _value
   4. Second `filter`: Removes entries with invalid numerical values

The final output is an array of objects, each containing:
- `_time`: Timestamp from InfluxDB
- `_value`: Numerical value (sensor reading)

Example transformation:
```
Input CSV:
_time,_value,_field,_measurement
2024-02-09T12:00:00Z,23.5,temperature,sensors
2024-02-09T12:00:01Z,24.0,temperature,sensors

Output:
[
  { _time: "2024-02-09T12:00:00Z", _value: 23.5 },
  { _time: "2024-02-09T12:00:01Z", _value: 24.0 }
]
```


Future Development: 
On the live monitor dashboard, the x-axis of the plot should be -60s to 0s (current), instead of absolute time. 





# Hosting

### Install Docker

```
sudo apt update
sudo apt upgrade -y
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update

sudo apt-get install docker-ce
sudo docker run hello-world
```



### Set up Docker/Influx

1. Export local docker: docker tag influxdb:latest myusername/influxdb:latest

docker push myusername/influxdb:latest

**🚀 Step 1: Pull the Latest InfluxDB Image**

```
sudo docker pull influxdb:2
```

------

**🚀 Step 2: Create Directories for Persistent Storage**

Create directories on your **Lightsail instance** to store **InfluxDB data** and **configurations**:

```
mkdir -p ~/influxdb/data
mkdir -p ~/influxdb/config
```

Give Docker permission to access them:

```
sudo chown -R 1000:1000 ~/influxdb
```



**🚀 Step 3: Run the InfluxDB Container with the Correct Settings**

Now, run the container using your updated configuration:

```
sudo docker run -d \
  --name influxwfr \
  -p 8086:8086 \
  -v ~/influxdb/data:/var/lib/influxdb2 \
  -v ~/influxdb/config:/etc/influxdb2 \
  -e DOCKER_INFLUXDB_INIT_MODE=setup \
  -e DOCKER_INFLUXDB_INIT_USERNAME=myuser \
  -e DOCKER_INFLUXDB_INIT_PASSWORD=mypassword123 \
  -e DOCKER_INFLUXDB_INIT_ORG=WFR \
  -e DOCKER_INFLUXDB_INIT_BUCKET=ourCar \
  influxdb:2
```

**🚀 Step 4: Verify the Container is Running**

Check the status:

```
sudo docker ps -a
```

​	•	If **STATUS** is Up, the container is running. ✅

​	•	If it **exits**, check logs:

```
sudo docker logs influxwfr
```



**🚀 Step 5: Test the Connection**

1️⃣ Check if InfluxDB is listening inside the container:

```
sudo docker exec -it influxwfr influx ping
```

Expected output:

```
OK
```

2️⃣ Test the API on your **Lightsail instance**:

```
curl -i http://localhost:8086/ping
```

Expected output:

```
HTTP/1.1 204 No Content
```

3️⃣ Test from your **local machine**:

```
curl -i http://YOURIP:8086/ping
```

You can also try to access the GUI through http://YOURIP:8086

If this fails, double-check **AWS Lightsail Firewall Rules** to **allow inbound traffic on port 8086**.



**🚀 Step 6: Retrieve Your InfluxDB Token**

Run:

```
sudo docker exec influxwfr influx auth list
```

Copy the **admin token**, as you’ll need it for your Python script.



**🚀 Step 7: Update Your Python Script (readCANxxx.py)**

Modify your script to use the correct InfluxDB credentials:

```
influx_url = "http://YOURIP:8086"
token is saved in a seperate txt
```

Run the script:

```
python readCAN3batchSender.py
```



### Set Auto Start on Ubuntu for Docker

```
sudo docker update --restart unless-stopped influxwfr

sudo systemctl enable docker
```



Check if it works:

sudo reboot

sudo docker ps





# Authentication System

This project now includes a comprehensive authentication system using MongoDB and JWT (JSON Web Tokens).



## Features
- User authentication with JWT tokens
- Protected routes for authorized access
- MongoDB integration for user storage
- Role-based access control (admin users)

## Setup
1. Make sure MongoDB is properly configured with your connection string in `.env` file:
    DATABASE_URI=mongodb+srv://your_username:your_password@your_cluster_url/?retryWrites=true&w=majority
    JWT_SECRET=your_jwt_secret

2. Create an admin user by running:
  ``` cmd
  cd backend
  node scripts/setup-admin.js
  npm install
  npm install -g nodemon
  nodemon index.js
  ```

3. Default admin credentials:
- Username: admin
- Password: admin123

## Usage
- Login via the login page to receive a JWT token
- Protected routes will automatically check for valid authentication
- The token is stored in localStorage and will persist until logout
- Admin users have additional privileges to manage other users



# lap.py Lap Detector
<img src="my-react-app/src/assets/lappy.png" alt="Lappy Logo" width="200"/>
## 🚀 API: `GET /api/track`

### 1. 📍 Location Data
- **Query**: `?type=location`
- **Description**: Returns the most recent GPS coordinate (latitude and longitude) of the vehicle.
- **Response**:
```json
{
  "location": {
    "lat": 42.06648123,
    "lon": -84.24137456
  }
}
```
- **Example Usage**:
```bash
curl "http://127.0.0.1:8050/api/track?type=location"
```

```js
fetch("http://127.0.0.1:8050/api/track?type=location")
  .then(res => res.json())
  .then(data => console.log(data.location));
```

---

### 2. 🏁 Last Completed Lap
- **Query**: `?type=lap`
- **Description**: Returns the latest completed lap with GPS path and start/end timestamps.
- **Response**:
```json
{
  "lap": {
    "points": {
      "lats": [42.0664, 42.0665, ...],
      "lons": [-84.2413, -84.2412, ...]
    },
    "start_time": 1711931802.745823,
    "end_time": 1711931823.462191
  }
}
```
- **Example Usage**:
```bash
curl "http://127.0.0.1:8050/api/track?type=lap"
```

```python
import requests
res = requests.get("http://127.0.0.1:8050/api/track?type=lap")
lap = res.json()["lap"]
print(lap["start_time"], lap["end_time"])
```

---

### 3. ❌ Invalid Request
- If an unsupported `type` is passed, the response will be:
```json
{
  "error": "Invalid request type"
}
```
- **HTTP Status**: `400 Bad Request`

---

### 📘 Summary

| Endpoint                     | Type         | Description                     | Response Key |
|-----------------------------|--------------|----------------------------------|--------------|
| `/api/track?type=location`  | `location`   | Returns latest GPS point         | `location`   |
| `/api/track?type=lap`       | `lap`        | Returns last completed lap       | `lap`        |





# Influx CLI User Management

**InfluxDB 2.x User Management Notecard**



**1. Creating a New User**

To create a new user (e.g., “admin”) within the organization “WFR”, use:

```
sudo docker exec -it influxwfr influx user create \
  --name admin \
  --password pwd \
  --org WFR
```

*Note:* The --role flag is not supported in the current CLI version.



------



**2. Changing a User’s Password**

To update the password for a user (e.g., “admin”), run:

```
sudo docker exec -it influxwfr influx user password --name admin
```

You will be prompted to enter the new password interactively.



------



**3. Deleting a User**

To delete a user, first list users to retrieve the user’s ID:

```
sudo docker exec -it influxwfr influx user list
```

Then delete the user using its unique ID (for example, 0eaa6d2e8865b000):

```
sudo docker exec -it influxwfr influx user delete --id 0eaa6d2e8865b000
```

*Note:* The delete command requires the --id flag—not --name.


# Frontend Deployment

The React frontend is automatically deployed to the production server using GitHub Actions.

## Live Application
- **Production URL**: http://3.98.181.12:8060
- **Auto-deployment**: Triggers on every push to `main` branch

## 🛠️ Development Setup

### Local Development
```
cd my-react-app
npm install
npm run dev  # Runs on http://localhost:5173
