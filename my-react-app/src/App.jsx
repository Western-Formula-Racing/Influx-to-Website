import React, { useState, useEffect } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import FSAESimulator from "./fsae-simulator";
import GLV from "./GLV";
import ECVM from './ECVM';
import WFRDownloader from "./WFRDownloader.jsx";
import WFRLogo from './assets/WFR_DAQ_Logo.png';
import OldGLV from "./oldGLV";
import "./App.css";
import WFRFullLogo from './assets/WFR_DAQ_Logo.png';

function Countdown({ eventName, eventDate }) {
  const calculateTimeLeft = () => {
    const difference = new Date(eventDate) - new Date();
    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown-container">
      <h2>{eventName}</h2>
      <div className="countdown-timer">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </div>
    </div>
  );
}


// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
};

function LogoutButton() {
  const { isLoggedIn, setIsLoggedIn, setUser } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleLogout}
      className="logout-button"
    >
      Logout
    </button>
  );
}

function Home() {
  return (
    <div className="hero-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div className="countdown-wrapper">
        <Countdown eventName="New Hampshire Competition" eventDate="April 24, 2025" />
        <Countdown eventName="Michigan Competition" eventDate="June 17, 2025" />
      </div>
      <img
        src={WFRFullLogo}
        alt="Western Formula Racing Data Acquisition"
        style={{
          maxWidth: '80%',
          maxHeight: '80vh',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        {/* Dark overlay */}
        <div className="overlay" />

        {/* Content container with higher z-index */}
        <div className="content-container">
          {/* Navigation */}
          <nav className="navbar">
            <Link to="/">
              <img src={WFRLogo} alt="WFR Logo" className="navbar-logo" />
            </Link>
            <div className="navbar-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/fsae-simulator" className="nav-link">Track Map</Link>
              <Link to="/GLV" className="nav-link">Live View</Link>

              <Link to="/ECVM" className="nav-link">ECVM</Link>
              <Link to="/WFRDownloader" className="nav-link">Data Downloader</Link>
              <Link to="/login" className="nav-link nav-button">
                Login
              </Link>
              <LogoutButton />
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/fsae-simulator"
              element={
                <ProtectedRoute>
                  <FSAESimulator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/GLV"
              element={
                <ProtectedRoute>
                  <GLV />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ECVM"
              element={
                <ProtectedRoute>
                  <ECVM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/WFRDownloader"
              element={
                <ProtectedRoute>
                  <WFRDownloader />
                </ProtectedRoute>
              }
            />
            <Route
              path="/oldGLV"
              element={
                <ProtectedRoute>
                  <OldGLV />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;