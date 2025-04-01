import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import daqcar from '../../../my-react-app/src/assets/daqcar.png';

const LiveTrackMap = () => {
    // Default fallback location for map centering
    const [latestPoint, setLatestPoint] = useState({ lat: 42.06639, lon: -84.24139 });
    const [trackData, setTrackData] = useState(null);
    const [trackStatus, setTrackStatus] = useState("Track data not available, waiting to request in 20 seconds");

    // Fetch latest point every .5 seconds
    useEffect(() => {
        const pointInterval = setInterval(async () => {
            try {
                const response = await fetch('http://127.0.0.1:8050/api/track?type=location');
                if (response.ok) {
                    const jsonData = await response.json();
                    if (jsonData && jsonData.location) {
                        setLatestPoint(jsonData.location);
                    }
                } else {
                    console.error('Failed to fetch latest point:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching latest point:', error);
            }
        }, 500);
        return () => clearInterval(pointInterval);
    }, []);

    // Fetch track data every 20 seconds
    useEffect(() => {
        const trackInterval = setInterval(async () => {
            try {
                const response = await fetch('http://127.0.0.1:8050/api/track?type=lap');
                if (response.ok) {
                    const jsonData = await response.json();
                    if (
                        jsonData &&
                        jsonData.lap &&
                        jsonData.lap.points &&
                        jsonData.lap.points.lats &&
                        jsonData.lap.points.lons
                    ) {
                        setTrackData({
                            lats: jsonData.lap.points.lats,
                            lons: jsonData.lap.points.lons
                        });
                        setTrackStatus("Track data available");
                    } else {
                        setTrackData(null);
                        setTrackStatus("Track data not available, waiting to request in 20 seconds");
                    }
                } else {
                    console.error('Failed to fetch track data:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching track data:', error);
            }
        }, 20000);
        return () => clearInterval(trackInterval);
    }, []);

    // Fallback: use empty arrays if trackData is null
    const trackLats = trackData?.lats || [];
    const trackLons = trackData?.lons || [];

    return (
        <div style={{ width: "100%", height: "300px", marginBottom: "1rem", position: "relative" }}>
            <Plot
                data={[
                    // Trace for the latest point (red marker)
                    {
                        type: "scattermapbox",
                        mode: "markers",
                        lat: [latestPoint.lat],
                        lon: [latestPoint.lon],
                        marker: { size: 12, color: "#ff0000" }
                    },
                    // Trace for the track (50% translucent green line)
                    {
                        type: "scattermapbox",
                        mode: "lines",
                        lat: trackLats,
                        lon: trackLons,
                        line: { width: 4, color: "rgba(74, 222, 128, 0.5)" }
                    }
                ]}
                layout={{
                    mapbox: {
                        style: "carto-darkmatter",
                        center: trackData
                            ? {
                                lat: trackLats.reduce((sum, lat) => sum + lat, 0) / trackLats.length,
                                lon: trackLons.reduce((sum, lon) => sum + lon, 0) / trackLons.length
                            }
                            : {
                                lat: latestPoint.lat,
                                lon: latestPoint.lon
                            },
                        zoom: 13
                    },
                    margin: { t: 0, b: 0, l: 0, r: 0 },
                    paper_bgcolor: "black",
                    plot_bgcolor: "black"
                }}
                config={{ displayModeBar: false }}
                style={{ width: "100%", height: "100%" }}
            />
            {/* Always display a status message when track data is not available */}
            {!trackData && (
                <div style={{
                    position: "absolute",
                    top: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "5px",
                    fontSize: "0.9rem"
                }}>
                    {trackStatus}
                </div>
            )}
        </div>
    );
};

export default LiveTrackMap;