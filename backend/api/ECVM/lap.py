#!/usr/bin/env python3
import math
import time
import threading
import random
from dash import Dash, dcc, html, Output, Input
import plotly.graph_objs as go
from flask_cors import CORS

# Constants for the simulation
CENTER_LAT = 42.06639
CENTER_LON = -84.24139
SEMIMAJOR = 0.006  # in degrees (approx 111 m per degree lat)
SEMIMINOR = 0.004  # in degrees
LAP_DURATION = 20.0  # seconds per lap
DIST_THRESHOLD = 20  # meters to consider track closed
MIN_LAP_DISTANCE = 50  # meters minimum lap length
LAT_FACTOR = 111320  # m per degree latitude
LON_FACTOR = 111320 * math.cos(math.radians(CENTER_LAT))  # m per degree longitude

# Global variables to hold simulation data
track = []         # List of (lat, lon) tuples for current lap
laps = []          # List of completed laps
latest_point = (CENTER_LAT, CENTER_LON)
lap_start_time = time.time()   # Timestamp when current lap started

def generate_point(t):
    """Generate a point on an elliptical path with slight noise."""
    theta = 2 * math.pi * ((t % LAP_DURATION) / LAP_DURATION)
    drift_meters = 5  # maximum drift in meters
    lat_drift = random.uniform(-drift_meters, drift_meters) / LAT_FACTOR
    lon_drift = random.uniform(-drift_meters, drift_meters) / LON_FACTOR
    lat = CENTER_LAT + SEMIMAJOR * math.sin(theta) + lat_drift
    lon = CENTER_LON + SEMIMINOR * math.cos(theta) + lon_drift
    return lat, lon

def euclidean_distance(lat1, lon1, lat2, lon2):
    """Compute the Euclidean distance in meters between two lat/lon points."""
    dx = (lon2 - lon1) * LON_FACTOR
    dy = (lat2 - lat1) * LAT_FACTOR
    return math.sqrt(dx**2 + dy**2)

def simulation_loop():
    """Continuously simulate GPS points and detect laps."""
    global track, laps, latest_point, lap_start_time
    start_time = time.time()
    while True:
        t = time.time() - start_time
        lat, lon = generate_point(t)
        latest_point = (lat, lon)
        track.append((lat, lon))

        # Lap detection: if current point is near the starting point and track is long enough
        if len(track) > 10:
            start = track[0]
            if euclidean_distance(lat, lon, start[0], start[1]) < DIST_THRESHOLD:
                total_dist = sum(
                    euclidean_distance(track[i-1][0], track[i-1][1], track[i][0], track[i][1])
                    for i in range(1, len(track))
                )
                if total_dist > MIN_LAP_DISTANCE:
                    lap = {
                        "lap_number": len(laps) + 1,
                        "lap_distance": round(total_dist, 2),
                        "points": track.copy(),
                        "start_time": lap_start_time,
                        "end_time": time.time()
                    }
                    laps.append(lap)
                    print(f"Lap {lap['lap_number']} complete: {lap['lap_distance']} m")
                    track = [latest_point]  # Reset for the next lap, starting with the latest point
                    lap_start_time = time.time()  # Reset lap start time for next lap

        time.sleep(0.2)  # simulate a new point every 0.2 seconds

# Start the simulation in a background thread
sim_thread = threading.Thread(target=simulation_loop, daemon=True)
sim_thread.start()

# Build the Dash app
app = Dash(__name__)
CORS(app.server)
from flask import jsonify, request

@app.server.route('/api/track', methods=['GET'])
def get_track():
    req_type = request.args.get('type', 'location')
    if req_type == 'location':
        return jsonify({
            'location': {
                'lat': latest_point[0],
                'lon': latest_point[1]
            }
        })
    elif req_type == 'lap':
        if laps:
            last_lap = laps[-1]
            lap_data = {
                'points': {
                    'lats': [pt[0] for pt in last_lap['points']],
                    'lons': [pt[1] for pt in last_lap['points']]
                },
                'start_time': last_lap.get('start_time'),
                'end_time': last_lap.get('end_time')
            }
        else:
            lap_data = None
        return jsonify({
            'lap': lap_data
        })
    else:
        return jsonify({'error': 'Invalid request type'}), 400

app.layout = html.Div([
    html.H1("Live Car Track - ECVM"),
    dcc.Graph(id='live-track'),
    dcc.Interval(id='interval-component', interval=1000, n_intervals=0)
])

@app.callback(
    Output('live-track', 'figure'),
    Input('interval-component', 'n_intervals')
)



def update_graph(n):
    # Use global track data; copy to avoid thread conflicts
    global track
    if track:
        lats, lons = zip(*track)
    else:
        lats, lons = [], []

    # Create a scattermap figure
    fig = go.Figure(go.Scattermapbox(
        mode="lines+markers",
        lat=list(lats),
        lon=list(lons),
        marker={'size': 8},
        line={'width': 2}
    ))
    # Center the map on the speedway
    fig.update_layout(
        mapbox=dict(
            style="open-street-map",
            center={"lat": CENTER_LAT, "lon": CENTER_LON},
            zoom=13
        ),
        margin={'l':0, 'r':0, 't':0, 'b':0},
        autosize=True
    )
    return fig

if __name__ == '__main__':
    app.run(debug=True, port=8050)