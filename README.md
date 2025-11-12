# Influx-to-Website

A real-time data visualization platform for Western Formula Racing that integrates InfluxDB telemetry data with a React-based web interface. This system enables live monitoring of vehicle sensor data and historical data analysis.

## Overview

This project provides:
- Real-time visualization of vehicle telemetry data from InfluxDB
- User authentication and role-based access control
- Interactive data plotting and analysis tools
- Live GPS tracking and lap time detection
- RESTful API for data access

## Technology Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB (user management), InfluxDB (telemetry data)
- **Authentication**: JWT-based authentication
- **Deployment**: GitHub Actions for automated deployment

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Docker
- MongoDB instance
- Python 3.x (for testing data ingestion)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Western-Formula-Racing/Influx-to-Website.git
cd Influx-to-Website
```

2. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../my-react-app && npm install
```

3. Configure environment variables (see Configuration section)

4. Start the development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend (in separate terminal)
cd my-react-app
npm run dev
```

## Configuration

Create a `.env` file in the backend directory with the following variables:

```
DATABASE_URI=mongodb+srv://your_username:your_password@your_cluster_url/?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your_influx_token
INFLUX_ORG=WFR
INFLUX_BUCKET=ourCar
```

## Development Setup

### Setting Up InfluxDB with Docker

1. Install Docker following the official documentation

2. Create directories for persistent storage:
```bash
mkdir -p ~/influxdb/data
mkdir -p ~/influxdb/config
sudo chown -R 1000:1000 ~/influxdb
```

3. Run the InfluxDB container:
```bash
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

4. Access the InfluxDB UI at `http://localhost:8086` and log in with:
   - Username: myuser
   - Password: mypassword123

5. Create an API token from the InfluxDB UI for use in your application

### Testing with Sample Data

1. Clone the testing repository:
```bash
git clone https://github.com/Western-Formula-Racing/car_to_influx
```

2. Use the `readCAN3batchSender.py` script to send test data to InfluxDB

3. Update the script with your InfluxDB token

4. Run the script to populate InfluxDB with test data

For testing constantly changing data, use the sensor reading:
```
ourCar-canBus-sensorReading-M166_Current_info-166-INV_Phase_A_Current
```

## Authentication System

The application includes JWT-based authentication with MongoDB for user storage.

### Initial Setup

1. Create an admin user:
```bash
cd backend
node scripts/setup-admin.js
```

2. Default admin credentials:
   - Username: admin
   - Password: admin123

### Features

- JWT token-based authentication
- Protected routes requiring valid authentication
- Role-based access control (admin privileges)
- Token persistence in localStorage
- User management capabilities for administrators

## API Documentation

### Track API Endpoints

**Base URL**: `/api/track`

#### Get Current Location
```
GET /api/track?type=location
```

Returns the most recent GPS coordinate of the vehicle.

**Response:**
```json
{
  "location": {
    "lat": 42.06648123,
    "lon": -84.24137456
  }
}
```

**Example Usage:**
```bash
curl "http://127.0.0.1:8050/api/track?type=location"
```

```js
fetch("http://127.0.0.1:8050/api/track?type=location")
  .then(res => res.json())
  .then(data => console.log(data.location));
```

#### Get Last Completed Lap
```
GET /api/track?type=lap
```

Returns the latest completed lap with GPS path and timing data.

**Response:**
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

**Example Usage:**
```bash
curl "http://127.0.0.1:8050/api/track?type=lap"
```

```python
import requests
res = requests.get("http://127.0.0.1:8050/api/track?type=lap")
lap = res.json()["lap"]
print(lap["start_time"], lap["end_time"])
```

#### Error Response

If an unsupported `type` is passed:
```json
{
  "error": "Invalid request type"
}
```
**HTTP Status**: `400 Bad Request`

#### Endpoint Summary

| Endpoint                     | Type         | Description                     | Response Key |
|-----------------------------|--------------|----------------------------------|--------------|
| `/api/track?type=location`  | `location`   | Returns latest GPS point         | `location`   |
| `/api/track?type=lap`       | `lap`        | Returns last completed lap       | `lap`        |

## Data Processing Pipeline

The query execution and data processing follows this pipeline:

### 1. Query Execution (`executeQuery` function)

- Takes a Flux query as input
- Makes a POST request to InfluxDB's API endpoint:
  - URL: `${influxConfig.url}/api/v2/query?org=${influxConfig.org}`
  - Authentication: Token-based via headers
  - Request format: Flux query language (`application/vnd.flux`)
  - Response format: CSV (`application/csv`)
- Returns CSV data for parsing

### 2. CSV Parsing (`parseInfluxResponse` function)

**Input Validation:**
```javascript
if (!csvData || csvData.trim() === '') {
  return [];
}
```

**Data Structure Analysis:**
```javascript
const lines = csvData.trim().split('\n');
if (lines.length < 2) {
  return [];
}
```

**Header Processing:**
```javascript
const headers = lines[0].split(',');
const timeIndex = headers.findIndex(h => h === '_time');
const valueIndex = headers.findIndex(h => h === '_value');
```

**Data Transformation:**
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

**Processing Steps:**
1. Skip header row with `slice(1)`
2. Remove empty lines
3. Transform each line into an object with `_time` and `_value`
4. Filter out entries with invalid numerical values

**Example Transformation:**
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

## Production Deployment

### Live Application

- **Production URL**: http://3.98.181.12:8060
- **Auto-deployment**: GitHub Actions triggers on every push to `main` branch

### Server Setup

#### Install Docker

```bash
sudo apt update
sudo apt upgrade -y
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install docker-ce
sudo docker run hello-world
```

#### Deploy InfluxDB Container

1. Pull the InfluxDB image:
```bash
sudo docker pull influxdb:2
```

2. Create persistent storage directories:
```bash
mkdir -p ~/influxdb/data
mkdir -p ~/influxdb/config
sudo chown -R 1000:1000 ~/influxdb
```

3. Run the container:
```bash
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

4. Verify the container is running:
```bash
sudo docker ps -a
```

If the container exits, check logs:
```bash
sudo docker logs influxwfr
```

5. Test the connection:
```bash
# Check if InfluxDB is listening inside the container
sudo docker exec -it influxwfr influx ping
# Expected output: OK

# Test the API locally
curl -i http://localhost:8086/ping
# Expected output: HTTP/1.1 204 No Content

# Test from your local machine (replace YOURIP with server IP)
curl -i http://YOURIP:8086/ping
```

Access the InfluxDB UI at `http://YOURIP:8086`. If this fails, check your firewall rules to allow inbound traffic on port 8086.

6. Retrieve your InfluxDB token:
```bash
sudo docker exec influxwfr influx auth list
```

Copy the admin token for use in your Python script.

7. Update your Python script (`readCANxxx.py`) with the correct InfluxDB credentials:
```python
influx_url = "http://YOURIP:8086"
# Token should be stored in a separate file
```

Run the script:
```bash
python readCAN3batchSender.py
```

#### Configure Auto-Restart

Enable Docker to start on boot and configure the container to restart automatically:

```bash
sudo docker update --restart unless-stopped influxwfr
sudo systemctl enable docker
```

Verify after reboot:
```bash
sudo reboot
sudo docker ps
```

## InfluxDB User Management

### Creating a New User

```bash
sudo docker exec -it influxwfr influx user create \
  --name admin \
  --password pwd \
  --org WFR
```

Note: The `--role` flag is not supported in the current CLI version.

### Changing a User's Password

```bash
sudo docker exec -it influxwfr influx user password --name admin
```

You will be prompted to enter the new password interactively.

### Deleting a User

1. List users to retrieve the user ID:
```bash
sudo docker exec -it influxwfr influx user list
```

2. Delete the user using its ID:
```bash
sudo docker exec -it influxwfr influx user delete --id <user_id>
```

Note: The delete command requires the `--id` flag, not `--name`.

## Feature Roadmap

### Planned Features

1. Custom x-axis configuration to plot sensor values against other values
2. Unit display pulled from InfluxDB metadata
3. Relative time x-axis for live monitor (-60s to 0s instead of absolute time)

### Completed Features

- Graph overlay functionality
- JWT authentication system
- Live GPS tracking
- Lap time detection

## Contributing

This is a Western Formula Racing team project. For contributions or questions, please contact the team directly.

## License

This project is maintained by Western Formula Racing.
