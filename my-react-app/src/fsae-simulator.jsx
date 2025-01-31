import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Play, Pause, RotateCcw, Edit, Check } from 'lucide-react';


const FSAESimulator = () => {
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [data, setData] = useState([]);
  const [carPosition, setCarPosition] = useState({ x: 0, y: 0, angle: 0 });
  const [trackName, setTrackName] = useState('');
  //Initial track points
  const [trackPoints, setTrackPoints] = useState([
    { x: 150, y: 300 },
    { x: 250, y: 300 },
    { x: 300, y: 200 },
    { x: 300, y: 150 },
    { x: 300, y: 50 },
    { x: 450, y: 50 },
    { x: 500, y: 150 },
    { x: 550, y: 250 },
    { x: 700, y: 250 },
    { x: 750, y: 150 },
    { x: 800, y: 50 },
    { x: 900, y: 100 },
    { x: 900, y: 200 },
    { x: 900, y: 300 },
    { x: 800, y: 350 },
    { x: 700, y: 300 },
    { x: 600, y: 250 },
    { x: 500, y: 300 },
    { x: 400, y: 350 },
    { x: 300, y: 400 },
    { x: 100, y: 350 },
    { x: 150, y: 300 }
  ]);

  const animationFrame = useRef();
  const startTime = useRef(Date.now());
  const pathLength = useRef(0);
  const pathRef = useRef();


  const saveTrack = async () => {
    try {
      const response = await fetch("http://localhost:3000/track/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trackName,
          points: trackPoints,
        }),
      });
      const result = await response.json();
      if (result.success) {
        console.log("Track saved successfully");
      } else {
        console.error("Error saving track:", result.error);
      }
    } catch (error) {
      console.error("Error saving track:", error.message);
    }
  };
  

  const loadTrack = async () => {
    try {
      const response = await fetch("http://localhost:3000/track/load/defaultTrack");
      const result = await response.json();
      if (result.success) {
        setTrackPoints(result.points);
      } else {
        console.error("Error loading track:", result.message);
      }
    } catch (error) {
      console.error("Error loading track:", error.message);
    }
  };
  

  //Handles user movement of the track points
  const handlePointDrag = (index, event) => {
    if (trackPoints.length < 2) {
      console.error("Cannot drag points with less than 2 track points.");
      return;
    }
  
    const svg = event.target.ownerSVGElement;
    const { left, top } = svg.getBoundingClientRect();
    const newTrackPoints = [...trackPoints];
    newTrackPoints[index] = {
      x: event.clientX - left,
      y: event.clientY - top,
    };
    setTrackPoints(newTrackPoints);
  };
  
  

  const generatePathD = () => {
    if (trackPoints.length < 2) {
      console.error("Insufficient track points to generate a valid path.");
      return ""; // Return an empty string to avoid errors
    }
  
    return `M ${trackPoints.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  };

  const setPathName = (name) => {

  };

  
  
  
  

  const handleReset = () => {
    startTime.current = Date.now(); // Reset the start time
    setData([]); // Clear data
    setCarPosition({ x: trackPoints[0].x, y: trackPoints[0].y, angle: 0 }); // Reset car position
  };
  

  useEffect(() => {
    if (pathRef.current) {
      try {
        pathLength.current = pathRef.current.getTotalLength();
        if (isNaN(pathLength.current) || pathLength.current <= 0) {
          console.error("Path length is invalid:", pathLength.current);
        } else {
          console.log("Valid Path Length:", pathLength.current);
        }
      } catch (error) {
        console.error("Error calculating path length:", error.message);
      }
    }
  }, [trackPoints]);
  

  useEffect(() => {
    console.log("Track Points Updated:", trackPoints);
  }, [trackPoints]);
  
  useEffect(() => {
    if (trackPoints.length < 2) {
      console.warn("Resetting track to default points.");
      setTrackPoints([
        { x: 150, y: 300 },
        { x: 250, y: 300 },
        { x: 300, y: 200 },
      ]);
    }
  }, [trackPoints]);
  

  
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animationFrame.current);
      return;
    }
  
    const updateSimulation = () => {
      if (!pathRef.current || pathLength.current <= 0) {
        console.error("Path is invalid or has insufficient length.");
        return;
      }
    
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime.current) / 1000;
    
      try {
        const distance = (elapsedTime * 100) % pathLength.current;
        const point = pathRef.current.getPointAtLength(distance);
        const nextPoint = pathRef.current.getPointAtLength(distance + 1);
    
        if (!point || !nextPoint) {
          console.error("Failed to calculate point or nextPoint on the path.");
          return;
        }
    
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
    
        setCarPosition({
          x: point.x,
          y: point.y,
          angle: angle,
        });
      } catch (error) {
        console.error("Error in updateSimulation:", error.message);
      }
    
      animationFrame.current = requestAnimationFrame(updateSimulation);
    };
    
    
    
    
  
    animationFrame.current = requestAnimationFrame(updateSimulation);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [isPlaying]);
  

  
  


  return (
    <div className="simulator-content" style={{ marginTop: "300px" }}>
      <div className="simulator-container flex">
        {/* Side Column */}
        <div className="w-1/4 p-4 border-r border-gray-200">
          <h2 className="text-lg font-bold">Track Editor</h2>
               

          <p className="text-sm text-gray-600 mb-4">
            {isEditMode
              ? "Click and drag points to edit the track"
              : "Click the edit button to start editing the track"}
          </p>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="w-full p-2 bg-blue-500 text-white rounded-mb mb-4"
          >
            {isEditMode ? "Save Track" : "Edit Track"}
          </button>
          <button
            onClick={handleReset}
            className="w-full p-2 bg-gray-500 text-white rounded-md"
          >
            Reset Simulation
          </button>

          
          <button
            onClick={saveTrack}
            className="w-full p-2 bg-green-500 text-white rounded-md mt-4"
          >
            Save Track to MongoDB
          </button>

          
          
          <button
            onClick={loadTrack}
            className="w-full p-2 bg-purple-500 text-white rounded-md mt-4"
          >
            Load Track from MongoDB
          </button>
        </div>

        <div>
            <label>
              Track Name:
              <input
                type="text"
                value = {trackName}
                onChange={(e) => setTrackName(e.target.value)}/>
            </label>
          </div>     

        
  
        {/* Main Content */}
        <div className="w-3/4 max-w-6xl mx-auto p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>FSAE Race Track Simulation</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <RotateCcw size={24} />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <svg
                width="1000"
                height="400"
                className="border border-gray-200 rounded-lg bg-gray-50"
              >
                {/* Race Track */}
                <path
                  ref={pathRef}
                  d={generatePathD()}
                  fill="none"
                  stroke="#333"
                  strokeWidth="40"
                  strokeLinecap="round"
                />
                <path
                  d={generatePathD()}
                  fill="none"
                  stroke="#666"
                  strokeWidth="38"
                  strokeLinecap="round"
                  strokeDasharray="5,5"
                />
  
                {/* Editable Points */}
                {isEditMode &&
                  trackPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="10"
                      fill="blue"
                      className="cursor-pointer"
                      onMouseDown={(e) => {
                        const moveHandler = (event) =>
                          handlePointDrag(index, event);
                        const upHandler = () => {
                          document.removeEventListener(
                            "mousemove",
                            moveHandler
                          );
                          document.removeEventListener("mouseup", upHandler);
                        };
                        document.addEventListener("mousemove", moveHandler);
                        document.addEventListener("mouseup", upHandler);
                      }}
                    />
                  ))}
  
                {/* FSAE Race Car */}
                <g
                  transform={`translate(${carPosition.x},${carPosition.y}) rotate(${carPosition.angle})`}
                >
                  <rect
                    x="-15"
                    y="-10"
                    width="30"
                    height="20"
                    rx="5"
                    fill="#e11d48"
                  />
                  <circle cx="-10" cy="10" r="4" fill="#333" />
                  <circle cx="10" cy="10" r="4" fill="#333" />
                  <path
                    d="M15,-5 L22,0 L15,5"
                    fill="none"
                    stroke="#333"
                    strokeWidth="2"
                  />
                </g>
              </svg>
            </CardContent>
          </Card>
  
          {/* Speed and Battery Temperature Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Speed (km/h)</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart width={400} height={200} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{ value: "Time (s)", position: "bottom" }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    stroke="#e11d48"
                    dot={false}
                  />
                </LineChart>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle>Battery Temperature (°C)</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart width={400} height={200} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{ value: "Time (s)", position: "bottom" }}
                  />
                  <YAxis domain={[40, 60]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="batteryTemp"
                    stroke="#2563eb"
                    dot={false}
                  />
                </LineChart>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
  

export default FSAESimulator;