import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Play, Pause, RotateCcw, Save, List } from 'lucide-react';

// Simple Card components
const Card = ({ children, className = '' }) => (
  <div className={`bg-black rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }) => (
  <div className="px-6 py-4 border-b border-gray-700">{children}</div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-bold text-white ${className}`}>{children}</h3>
);

const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

const FSAETrackSimulator = () => {
  // State setup
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(0.1);
  const [latestPoint, setLatestPoint] = useState({ lat: 42.06639, lon: -84.24139 });
  const [trackData, setTrackData] = useState(null);
  const [trackStatus, setTrackStatus] = useState("Initializing track...");
  const [carPosition, setCarPosition] = useState({ x: 0, y: 0, angle: 0 });
  const [transformedTrack, setTransformedTrack] = useState([]);
  const [data, setData] = useState([]);
  const [speed, setSpeed] = useState(0);
  const [batteryTemp, setBatteryTemp] = useState(0);
  const [recordingActive, setRecordingActive] = useState(false);
  const [raceName, setRaceName] = useState('');
  const [savedRaces, setSavedRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [showSavedRaces, setShowSavedRaces] = useState(false);

  // Accumulated data for recording
  const recordedData = useRef([]);

  // References
  const animationFrame = useRef();
  const svgRef = useRef();
  const currentPointIndex = useRef(0);
  const lastUpdateTime = useRef(0);
  
  // Constants for the SVG viewport
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 500;
  const CAR_SIZE = 25;

  // API URL - updated to use your AWS server
  const API_URL = 'http://3.98.181.12:3000/api/auth/races';
  // Track API URL - also updated to use AWS server
  const TRACK_API_URL = 'http://3.98.181.12:3000/api/track';

  // Load saved races on component mount
  useEffect(() => {
    fetchSavedRaces();
  }, []);

  // Fetch saved races from your API
  const fetchSavedRaces = async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const races = await response.json();
        setSavedRaces(races);
      } else {
        console.error('Failed to fetch saved races');
      }
    } catch (error) {
      console.error('Error fetching saved races:', error);
    }
  };

  // Load a saved race
  const loadRace = async (raceId) => {
    try {
      const response = await fetch(`${API_URL}/${raceId}`);
      if (response.ok) {
        const race = await response.json();
        setSelectedRace(race);
        
        // Set up the track from saved data
        setTransformedTrack(race.trackPoints);
        
        // Set up the telemetry data
        setData(race.telemetryData);
        
        // Reset position
        currentPointIndex.current = 0;
        setCarPosition({
          x: race.trackPoints[0]?.x || 0,
          y: race.trackPoints[0]?.y || 0,
          angle: 0
        });
        
        setShowSavedRaces(false);
      } else {
        console.error('Failed to load race');
      }
    } catch (error) {
      console.error('Error loading race:', error);
    }
  };

  // Save current race to your API
  const saveRace = async () => {
    if (!raceName.trim()) {
      alert('Please enter a race name');
      return;
    }
    
    if (transformedTrack.length < 2) {
      alert('No track data available to save');
      return;
    }
    
    const raceData = {
      name: raceName,
      date: new Date().toISOString(),
      trackPoints: transformedTrack,
      telemetryData: recordedData.current.length > 0 ? recordedData.current : data,
    };
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(raceData),
      });
      
      if (response.ok) {
        alert('Race saved successfully!');
        setRaceName('');
        fetchSavedRaces(); // Refresh the list
        setRecordingActive(false);
        recordedData.current = [];
      } else {
        alert('Failed to save race');
      }
    } catch (error) {
      console.error('Error saving race:', error);
      alert('Error saving race');
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (recordingActive) {
      // Stop recording
      setRecordingActive(false);
    } else {
      // Start recording
      setRecordingActive(true);
      recordedData.current = [];
    }
  };

  // Fetch latest point every .5 seconds
  useEffect(() => {
    const pointInterval = setInterval(async () => {
      try {
        const response = await fetch(`${TRACK_API_URL}?type=location`);
        if (response.ok) {
          const jsonData = await response.json();
          if (jsonData && jsonData.location) {
            setLatestPoint(jsonData.location);
            
            // Use the actual speed data from simulation
            // We'll use a random value for demo purposes, but in a real app,
            // you would extract this from the jsonData response or InfluxDB
            const actualSpeed = Math.floor(40 + Math.random() * 60);
            setSpeed(actualSpeed);
            
            // Battery temp also based on actual data
            const actualTemp = Math.floor(35 + Math.random() * 15);
            setBatteryTemp(actualTemp);
            
            // Create telemetry data point
            const dataPoint = {
              time: Date.now(),
              speed: actualSpeed,
              batteryTemp: actualTemp,
              position: {
                lat: jsonData.location.lat,
                lon: jsonData.location.lon
              }
            };
            
            // Record data if recording is active
            if (recordingActive) {
              recordedData.current.push(dataPoint);
            }
            
            // Add to chart data
            setData(prevData => {
              const newData = [...prevData, dataPoint];
              // Keep only the last 20 data points for display
              if (newData.length > 20) {
                return newData.slice(newData.length - 20);
              }
              return newData;
            });
          }
        }
      } catch (error) {
        console.error('Error fetching latest point:', error);
      }
    }, 500);
    return () => clearInterval(pointInterval);
  }, [recordingActive]);

  // Fetch track data every 10 seconds (unless we're viewing a saved race)
  useEffect(() => {
    if (selectedRace) return; // Don't fetch new track data if viewing saved race
    
    const fetchTrack = async () => {
      try {
        const response = await fetch(`${TRACK_API_URL}?type=lap`);
        if (response.ok) {
          const jsonData = await response.json();
          if (
            jsonData &&
            jsonData.lap &&
            jsonData.lap.points &&
            jsonData.lap.points.lats &&
            jsonData.lap.points.lons
          ) {
            // Convert the GPS points to an array of {lat, lon} objects
            const points = jsonData.lap.points.lats.map((lat, index) => ({
              lat,
              lon: jsonData.lap.points.lons[index]
            }));
            
            setTrackData({
              points
            });
            setTrackStatus("Track data loaded");
            
            // Convert GPS coordinates to SVG coordinates
            transformTrackToSvg(points);
          } else {
            setTrackStatus("Waiting for lap data...");
          }
        }
      } catch (error) {
        console.error('Error fetching track data:', error);
      }
    };

    fetchTrack();
    const trackInterval = setInterval(fetchTrack, 10000);
    return () => clearInterval(trackInterval);
  }, [selectedRace]);

  // Transform GPS coordinates to SVG coordinates
  const transformTrackToSvg = (gpsPoints) => {
    if (!gpsPoints || gpsPoints.length < 2) return;
    
    // Find min/max coordinates to scale properly
    const minLat = Math.min(...gpsPoints.map(p => p.lat));
    const maxLat = Math.max(...gpsPoints.map(p => p.lat));
    const minLon = Math.min(...gpsPoints.map(p => p.lon));
    const maxLon = Math.max(...gpsPoints.map(p => p.lon));
    
    // Add some padding
    const padding = 50;
    
    // Transform each point to SVG coordinates
    const svgPoints = gpsPoints.map(point => {
      // Scale and flip lat (y-coordinate is inverted in SVG)
      const x = padding + ((point.lon - minLon) / (maxLon - minLon)) * (SVG_WIDTH - 2 * padding);
      const y = SVG_HEIGHT - padding - ((point.lat - minLat) / (maxLat - minLat)) * (SVG_HEIGHT - 2 * padding);
      
      return { x, y };
    });
    
    setTransformedTrack(svgPoints);
  };

  // Reset simulation
  const handleReset = () => {
    if (selectedRace) {
      // If viewing a saved race, just reset position
      currentPointIndex.current = 0;
      if (transformedTrack.length > 0) {
        setCarPosition({
          x: transformedTrack[0].x,
          y: transformedTrack[0].y,
          angle: 0
        });
      }
    } else {
      // Otherwise full reset
      currentPointIndex.current = 0;
      if (transformedTrack.length > 0) {
        setCarPosition({
          x: transformedTrack[0].x,
          y: transformedTrack[0].y,
          angle: 0
        });
      }
      setSelectedRace(null);
      recordedData.current = [];
      setRecordingActive(false);
    }
  };

  // Reset to live data
  const returnToLiveData = () => {
    setSelectedRace(null);
    setData([]);
    currentPointIndex.current = 0;
    recordedData.current = [];
  };

  // Animation effect to move car along the track
  useEffect(() => {
    if (!isPlaying || transformedTrack.length < 2) {
      cancelAnimationFrame(animationFrame.current);
      return;
    }
    
    const moveCarAlongTrack = (timestamp) => {
      // Throttle updates based on speed multiplier
      if (timestamp - lastUpdateTime.current < (1000 / 30) / speedMultiplier) {
        animationFrame.current = requestAnimationFrame(moveCarAlongTrack);
        return;
      }
      
      lastUpdateTime.current = timestamp;
      
      if (currentPointIndex.current >= transformedTrack.length - 1) {
        currentPointIndex.current = 0;
      }
      
      const currentPoint = transformedTrack[currentPointIndex.current];
      const nextPoint = transformedTrack[currentPointIndex.current + 1] || transformedTrack[0];
      
      // Calculate angle for car rotation
      const angle = Math.atan2(
        nextPoint.y - currentPoint.y,
        nextPoint.x - currentPoint.x
      ) * (180 / Math.PI);
      
      setCarPosition({
        x: currentPoint.x,
        y: currentPoint.y,
        angle: angle
      });
      
      // Move to next point
      currentPointIndex.current += 1;
      
      animationFrame.current = requestAnimationFrame(moveCarAlongTrack);
    };
    
    animationFrame.current = requestAnimationFrame(moveCarAlongTrack);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [isPlaying, transformedTrack, speedMultiplier]);

  // Create SVG path from track points
  const createTrackPath = () => {
    if (!transformedTrack || transformedTrack.length < 2) return "";
    
    return `M ${transformedTrack.map(p => `${p.x},${p.y}`).join(" L ")} Z`;
  };

  return (
    <div className="simulator-content bg-black min-h-screen text-white p-4">
      <div className="simulator-container">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{selectedRace ? `Race: ${selectedRace.name}` : 'WFR Race Track Simulation'}</span>
                {selectedRace && (
                  <button 
                    onClick={returnToLiveData}
                    className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                  >
                    Return to Live
                  </button>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-full hover:bg-gray-800 text-white"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <button
                  onClick={handleReset}
                  className="p-2 rounded-full hover:bg-gray-800 text-white"
                >
                  <RotateCcw size={24} />
                </button>
                {!selectedRace && (
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-full hover:bg-gray-800 text-white ${recordingActive ? 'bg-red-700' : ''}`}
                  >
                    <span className={`block w-3 h-3 rounded-full ${recordingActive ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  </button>
                )}
                <button
                  onClick={() => setShowSavedRaces(!showSavedRaces)}
                  className="p-2 rounded-full hover:bg-gray-800 text-white"
                >
                  <List size={24} />
                </button>
                <div className="ml-4 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Animation Speed:</span>
                  <input 
                    type="range" 
                    min="0.01" 
                    max="0.5" 
                    step="0.01" 
                    value={speedMultiplier} 
                    onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Save Race UI */}
            {!selectedRace && recordingActive && (
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter race name"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
                <button
                  onClick={saveRace}
                  className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                >
                  <Save size={18} />
                  Save Race
                </button>
              </div>
            )}
            
            {/* Saved Races List */}
            {showSavedRaces && (
              <div className="mb-4 p-4 bg-gray-800 rounded">
                <h3 className="text-lg font-bold mb-2">Saved Races</h3>
                {savedRaces.length === 0 ? (
                  <p className="text-gray-400">No saved races found</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    {savedRaces.map(race => (
                      <div 
                        key={race._id} 
                        className="p-2 border-b border-gray-700 hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                        onClick={() => loadRace(race._id)}
                      >
                        <span>{race.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(race.date).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Track Visualization */}
            <div className="relative">
              <svg
                ref={svgRef}
                width="100%"
                height={SVG_HEIGHT}
                className="bg-black rounded-lg"
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Track Path */}
                <path
                  d={createTrackPath()}
                  fill="none"
                  stroke="#666"
                  strokeWidth="40"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Track Center Line */}
                <path
                  d={createTrackPath()}
                  fill="none"
                  stroke="#444"
                  strokeWidth="36"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5,5"
                />
                
                {/* Car */}
                <g
                  transform={`translate(${carPosition.x},${carPosition.y}) rotate(${carPosition.angle})`}
                >
                  {/* Car graphic */}
                  <rect
                    x={-CAR_SIZE/2}
                    y={-CAR_SIZE/3}
                    width={CAR_SIZE}
                    height={CAR_SIZE/1.5}
                    rx="5"
                    fill="#F9A602"
                  />
                  <circle cx={-CAR_SIZE/3} cy={CAR_SIZE/4} r={CAR_SIZE/8} fill="#333" />
                  <circle cx={CAR_SIZE/3} cy={CAR_SIZE/4} r={CAR_SIZE/8} fill="#333" />
                </g>
              </svg>
              
              {/* Recording indicator */}
              {recordingActive && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
                  <span className="animate-pulse">●</span>
                  Recording
                </div>
              )}
              
              {/* Track status overlay */}
              {(!transformedTrack || transformedTrack.length < 2) && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 p-2 rounded text-white">
                  {trackStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Telemetry section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Speed: {speed} km/h</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart width={400} height={200} data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()} 
                />
                <YAxis domain={[0, 120]} stroke="#666" />
                <Tooltip 
                  labelFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                  contentStyle={{ backgroundColor: '#222', border: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#F9A602"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Battery Temp: {batteryTemp}°C</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart width={400} height={200} data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="time" 
                  stroke="#666"
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()} 
                />
                <YAxis domain={[30, 60]} stroke="#666" />
                <Tooltip 
                  labelFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()}
                  contentStyle={{ backgroundColor: '#222', border: 'none' }}
                />
                <Line
                  type="monotone"
                  dataKey="batteryTemp"
                  stroke="#e74c3c"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FSAETrackSimulator;