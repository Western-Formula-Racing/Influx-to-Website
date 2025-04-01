import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js'; // **Added Plotly import for live map component**
import LiveTrackMap from '../../backend/api/ECVM/LiveTrackMap.jsx'

const FSAEDisplay = () => {
    // Extended state with additional sensor values
    const [data, setData] = useState({
        // Existing sensors
        wheelSpeedFL: 0,
        wheelSpeedFR: 0,
        wheelSpeedRL: 0,
        wheelSpeedRR: 0,
        inverterSpeed: 0,
        batteryVoltage: 0,
        drsPosition: 0,
        lowVoltageWarning: false,
        rtdStatus: false,
        batteryTemp: 0,
        acceleratorPosition: 0,
        brakePosition: 0,
        steeringAngle: 0,
        lateralG: 0,
        longitudinalG: 0,
        motorTemp: 0,
        groundSpeed: 0,
        satelliteSpeed: 0,
        pitotSpeed: 0,
        // New sensors (examples)
        bmsMaxChargeCurrent: 0,
        bmsMaxDischargeCurrent: 0,
        invGateDriverBoardTemp: 0,
        invModuleATemp: 0,
        invModuleBTemp: 0,
        invModuleCTemp: 0,
        invControlBoardTemp: 0,
        invCoolantTemp: 0,
        invHotSpotTemp: 0,
        invTorqueShudder: 0,
        invAnalogInput1: 0,
        invDigitalInput1: false
    });

    // Function to simulate data fetching from InfluxDB (using random values)
    const fetchData = () => {
        // Helper for random number generation within range
        const randomValue = (min, max, decimals = 0) => {
            const value = Math.random() * (max - min) + min;
            return Number(value.toFixed(decimals));
        };

        const baseSpeed = randomValue(0, 120, 1);
        const variability = 0.05;

        setData({
            // Existing sensors
            wheelSpeedFL: baseSpeed * (1 + randomValue(-variability, variability, 3)),
            wheelSpeedFR: baseSpeed * (1 + randomValue(-variability, variability, 3)),
            wheelSpeedRL: baseSpeed * (1 + randomValue(-variability, variability, 3)),
            wheelSpeedRR: baseSpeed * (1 + randomValue(-variability, variability, 3)),
            inverterSpeed: Math.round(baseSpeed * 60),
            batteryVoltage: randomValue(350, 400, 1),
            drsPosition: baseSpeed > 80 ? randomValue(60, 100) : 0, // DRS engaged if speed > 80
            lowVoltageWarning: Math.random() > 0.9,
            rtdStatus: Math.random() > 0.1,
            batteryTemp: randomValue(20, 45, 1),
            acceleratorPosition: randomValue(0, 100),
            brakePosition: randomValue(0, 80),
            steeringAngle: randomValue(-35, 35, 1),
            lateralG: randomValue(-1.5, 1.5, 2),
            longitudinalG: randomValue(-2, 2, 2),
            motorTemp: randomValue(50, 120, 1),
            groundSpeed: baseSpeed,
            satelliteSpeed: baseSpeed * (1 + randomValue(-0.03, 0.03, 3)),
            pitotSpeed: baseSpeed * (1 + randomValue(-0.05, 0.05, 3)),
            // New sensor simulations
            bmsMaxChargeCurrent: randomValue(300, 500, 1),
            bmsMaxDischargeCurrent: randomValue(300, 500, 1),
            invGateDriverBoardTemp: randomValue(30, 60, 1),
            invModuleATemp: randomValue(30, 60, 1),
            invModuleBTemp: randomValue(30, 60, 1),
            invModuleCTemp: randomValue(30, 60, 1),
            invControlBoardTemp: randomValue(30, 60, 1),
            invCoolantTemp: randomValue(20, 40, 1),
            invHotSpotTemp: randomValue(40, 80, 1),
            invTorqueShudder: randomValue(0, 5, 1),
            invAnalogInput1: randomValue(0, 10, 1),
            invDigitalInput1: Math.random() > 0.5
        });
    };

    useEffect(() => {
        const interval = setInterval(fetchData, 1000);
        return () => clearInterval(interval);
    }, []);

    // Helper to return inline style for text color based on thresholds
    const getColorStyle = (value, thresholds) => {
        if (value > thresholds.high) return { color: "#ef4444" }; // red
        if (value < thresholds.low) return { color: "#f59e0b" }; // amber
        return { color: "#4ade80" }; // green
    };

    // Existing VehicleOutline component (unchanged)
    const VehicleOutline = () => {
        const containerStyle = {
            position: "relative",
            margin: "0 auto",
            width: "12rem",  // **Changed width to be narrower**
            height: "16rem", // **Changed height to be taller**
            border: "2px solid #6b7280",
            borderRadius: "0.25rem"
        };

        const carOutlineStyle = {
            position: "absolute",
            top: "2rem",
            left: "2rem",
            right: "2rem",
            bottom: "2rem",
            border: "2px solid #6b7280",
            borderRadius: "0.25rem"
        };

        const wheelStyle = {
            position: "absolute",
            width: "3rem",
            height: "3rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.875rem"
        };

        const centerTextStyle = {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        };

        const speedTextStyle = {
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "white"
        };

        const subTextStyle = {
            fontSize: "0.75rem",
            color: "#4ade80"
        };

        return (
            <div style={containerStyle}>
                <div style={carOutlineStyle}></div>
                <div style={{ position: "absolute", top: "1.5rem", left: "-0.75rem", width: "1.5rem", height: "3rem", backgroundColor: "#6b7280", borderRadius: "0.25rem" }}></div>
                <div style={{ position: "absolute", top: "1.5rem", right: "-0.75rem", width: "1.5rem", height: "3rem", backgroundColor: "#6b7280", borderRadius: "0.25rem" }}></div>
                <div style={{ position: "absolute", bottom: "1.5rem", left: "-0.75rem", width: "1.5rem", height: "3rem", backgroundColor: "#6b7280", borderRadius: "0.25rem" }}></div>
                <div style={{ position: "absolute", bottom: "1.5rem", right: "-0.75rem", width: "1.5rem", height: "3rem", backgroundColor: "#6b7280", borderRadius: "0.25rem" }}></div>
                <div style={{ ...wheelStyle, top: "1rem", left: "1rem" }}>
                    <span style={getColorStyle(data.wheelSpeedFL, { low: 0, high: 100 })}>
                        {data.wheelSpeedFL.toFixed(1)}
                    </span>
                </div>
                <div style={{ ...wheelStyle, top: "1rem", right: "1rem" }}>
                    <span style={getColorStyle(data.wheelSpeedFR, { low: 0, high: 100 })}>
                        {data.wheelSpeedFR.toFixed(1)}
                    </span>
                </div>
                <div style={{ ...wheelStyle, bottom: "1rem", left: "1rem" }}>
                    <span style={getColorStyle(data.wheelSpeedRL, { low: 0, high: 100 })}>
                        {data.wheelSpeedRL.toFixed(1)}
                    </span>
                </div>
                <div style={{ ...wheelStyle, bottom: "1rem", right: "1rem" }}>
                    <span style={getColorStyle(data.wheelSpeedRR, { low: 0, high: 100 })}>
                        {data.wheelSpeedRR.toFixed(1)}
                    </span>
                </div>
                <div style={centerTextStyle}>
                    <div style={speedTextStyle}>
                        {Math.round(data.groundSpeed)} km/h
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "0 1rem",
                            marginTop: "0.5rem"
                        }}
                    >
                        <div style={subTextStyle}>SAT: {data.satelliteSpeed.toFixed(1)}</div>
                        <div style={subTextStyle}>PITOT: {data.pitotSpeed.toFixed(1)}</div>
                    </div>
                </div>
            </div>
        );
    };

    // Existing SystemStatus component (unchanged)
    const SystemStatus = () => {
        const containerStyle = {
            width: "100%",
            padding: "1rem",
            border: "2px solid #6b7280",
            borderRadius: "0.25rem",
            boxSizing: "border-box"
        };

        const titleStyle = {
            color: "white",
            fontSize: "1.125rem",
            fontWeight: "bold",
            marginBottom: "0.5rem"
        };

        const gridStyle = {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem"
        };

        const labelStyle = {
            color: "#d1d5db",
            fontSize: "0.875rem"
        };

        const valueStyle = (color) => ({
            fontSize: "1.125rem",
            fontFamily: "monospace",
            color: color
        });

        return (
            <div style={containerStyle}>
                <div style={titleStyle}>SYSTEM</div>
                <div style={gridStyle}>
                    <div>
                        <div style={labelStyle}>BATTERY</div>
                        <div style={valueStyle(getColorStyle(data.batteryVoltage, { low: 360, high: 390 }).color)}>
                            {data.batteryVoltage.toFixed(1)} V
                        </div>
                        <div style={valueStyle(getColorStyle(data.batteryTemp, { low: 15, high: 40 }).color)}>
                            {data.batteryTemp.toFixed(1)} °C
                        </div>
                    </div>
                    <div>
                        <div style={labelStyle}>MOTOR</div>
                        <div style={valueStyle(getColorStyle(data.inverterSpeed, { low: 0, high: 8000 }).color)}>
                            {Math.round(data.inverterSpeed)} RPM
                        </div>
                        <div style={valueStyle(getColorStyle(data.motorTemp, { low: 0, high: 100 }).color)}>
                            {data.motorTemp.toFixed(1)} °C
                        </div>
                    </div>
                    <div>
                        <div style={labelStyle}>G-FORCE</div>
                        <div style={{ fontSize: "1.125rem", fontFamily: "monospace", color: "#4ade80" }}>
                            Lateral: {data.lateralG.toFixed(2)} g
                        </div>
                        <div style={{ fontSize: "1.125rem", fontFamily: "monospace", color: "#4ade80" }}>
                            Longitudinal: {data.longitudinalG.toFixed(2)} g
                        </div>
                        {data.verticalG !== undefined && (
                            <div style={{ fontSize: "1.125rem", fontFamily: "monospace", color: "#4ade80" }}>
                                Vertical: {data.verticalG.toFixed(2)} g
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // New PowertrainStatus component to display additional sensor readings
    const PowertrainStatus = () => {
        const containerStyle = {
            width: "100%",
            padding: "1rem",
            border: "2px solid #6b7280",
            borderRadius: "0.25rem",
            boxSizing: "border-box",
            marginTop: "1rem"
        };

        const titleStyle = {
            color: "white",
            fontSize: "1.125rem",
            fontWeight: "bold",
            marginBottom: "0.5rem"
        };

        const gridStyle = {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem"
        };

        const labelStyle = {
            color: "#d1d5db",
            fontSize: "0.875rem"
        };

        const valueStyle = (color) => ({
            fontSize: "1.125rem",
            fontFamily: "monospace",
            color: color
        });

        return (
            <div style={containerStyle}>
                <div style={titleStyle}>POWERTRAIN STATUS</div>
                <div style={gridStyle}>
                    <div>
                        <div style={labelStyle}>BMS Max Charge Current</div>
                        <div style={valueStyle("#4ade80")}>
                            {data.bmsMaxChargeCurrent.toFixed(1)} A
                        </div>
                        <div style={labelStyle}>BMS Max Discharge Current</div>
                        <div style={valueStyle("#4ade80")}>
                            {data.bmsMaxDischargeCurrent.toFixed(1)} A
                        </div>
                    </div>
                    <div>
                        <div style={labelStyle}>INV Gate Driver Board Temp</div>
                        <div style={valueStyle(getColorStyle(data.invGateDriverBoardTemp, { low: 30, high: 60 }).color)}>
                            {data.invGateDriverBoardTemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Module A Temp</div>
                        <div style={valueStyle(getColorStyle(data.invModuleATemp, { low: 30, high: 60 }).color)}>
                            {data.invModuleATemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Module B Temp</div>
                        <div style={valueStyle(getColorStyle(data.invModuleBTemp, { low: 30, high: 60 }).color)}>
                            {data.invModuleBTemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Module C Temp</div>
                        <div style={valueStyle(getColorStyle(data.invModuleCTemp, { low: 30, high: 60 }).color)}>
                            {data.invModuleCTemp.toFixed(1)} °C
                        </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                        <div style={labelStyle}>INV Control Board Temp</div>
                        <div style={valueStyle(getColorStyle(data.invControlBoardTemp, { low: 30, high: 60 }).color)}>
                            {data.invControlBoardTemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Coolant Temp</div>
                        <div style={valueStyle(getColorStyle(data.invCoolantTemp, { low: 20, high: 40 }).color)}>
                            {data.invCoolantTemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Hot Spot Temp</div>
                        <div style={valueStyle(getColorStyle(data.invHotSpotTemp, { low: 40, high: 80 }).color)}>
                            {data.invHotSpotTemp.toFixed(1)} °C
                        </div>
                        <div style={labelStyle}>INV Torque Shudder</div>
                        <div style={valueStyle("#f59e0b")}>
                            {data.invTorqueShudder.toFixed(1)}
                        </div>
                        <div style={labelStyle}>INV Analog Input 1</div>
                        <div style={valueStyle("#4ade80")}>
                            {data.invAnalogInput1.toFixed(1)} V
                        </div>
                        <div style={labelStyle}>INV Digital Input 1</div>
                        <div style={valueStyle(data.invDigitalInput1 ? "#4ade80" : "#ef4444")}>
                            {data.invDigitalInput1 ? "ON" : "OFF"}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // DRSFlap component (with animation and a small spacer)
    const DRSFlap = () => {
        const engaged = data.drsPosition > 0;
        const flapStyle = {
            width: "3rem",
            height: "0.5rem",
            backgroundColor: engaged ? "#4ade80" : "#ef4444",
            transition: "transform 0.3s ease-out",
            transform: engaged ? "rotate(0deg)" : "rotate(30deg)",
            transformOrigin: "left center"
        };
        const labelStyle = {
            marginTop: "0.5rem",
            fontSize: "1rem",
            color: engaged ? "#4ade80" : "#ef4444"
        };

        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={flapStyle}></div>
                <div style={{ height: "1rem" }}></div> {/* Spacer */}
                <div style={labelStyle}>
                    {engaged ? "ENGAGED" : "DISENGAGED"}
                </div>
            </div>
        );
    };

    // Updated ControlInputs component with the DRSFlap animation
    const ControlInputs = () => {
        const containerStyle = {
            width: "100%",
            padding: "1rem",
            border: "2px solid #6b7280",
            borderRadius: "0.25rem",
            boxSizing: "border-box"
        };

        const titleStyle = {
            color: "white",
            fontSize: "1.125rem",
            fontWeight: "bold",
            marginBottom: "0.5rem"
        };

        const gridStyle = {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem"
        };

        const labelStyle = {
            color: "#d1d5db",
            fontSize: "0.875rem"
        };

        const progressContainerStyle = {
            flex: 1,
            backgroundColor: "#374151",
            height: "1rem",
            borderRadius: "0.25rem"
        };

        const progressBarStyle = (width, bgColor) => ({
            backgroundColor: bgColor,
            height: "100%",
            borderRadius: "0.25rem",
            width: `${width}%`
        });

        return (
            <div style={containerStyle}>
                <div style={titleStyle}>CONTROLS</div>
                <div style={gridStyle}>
                    <div>
                        <div style={labelStyle}>DRS</div>
                        <DRSFlap />
                    </div>
                    <div>
                        <div style={labelStyle}>INPUTS</div>
                        <div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                            <div style={{ width: "6rem", fontSize: "0.875rem", color: "white" }}>
                                Throttle:
                            </div>
                            <div style={progressContainerStyle}>
                                <div style={progressBarStyle(data.acceleratorPosition, "#4ade80")}></div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                            <div style={{ width: "6rem", fontSize: "0.875rem", color: "white" }}>
                                Brake:
                            </div>
                            <div style={progressContainerStyle}>
                                <div style={progressBarStyle(data.brakePosition, "#ef4444")}></div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                            <div style={{ width: "6rem", fontSize: "0.875rem", color: "white" }}>
                                Steering:
                            </div>
                            <div style={{ flex: 1, backgroundColor: "#374151", height: "1rem", borderRadius: "0.25rem", position: "relative" }}>
                                <div
                                    style={{
                                        backgroundColor: "#60a5fa",
                                        height: "100%",
                                        width: "0.5rem",
                                        position: "absolute",
                                        top: 0,
                                        borderRadius: "0.25rem",
                                        left: `${50 + (data.steeringAngle / 70 * 50)}%`
                                    }}
                                ></div>
                            </div>
                            <div style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "white" }}>
                                {data.steeringAngle.toFixed(0)}°
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // WarningPanel component
    const WarningPanel = () => {
        const containerStyle = {
            width: "100%",
            padding: "1rem",
            border: "2px solid #6b7280",
            borderRadius: "0.25rem",
            boxSizing: "border-box"
        };

        const titleStyle = {
            color: "white",
            fontSize: "1.125rem",
            fontWeight: "bold",
            marginBottom: "0.5rem"
        };

        const gridStyle = {
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem"
        };

        const boxStyle = (bgColor) => ({
            padding: "0.5rem",
            borderRadius: "0.25rem",
            backgroundColor: bgColor,
            color: "white",
            textAlign: "center",
            fontWeight: "bold"
        });

        const borderBoxStyle = {
            marginTop: "1rem",
            padding: "0.5rem",
            border: "1px solid #6b7280",
            borderRadius: "0.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
        };

        const labelStyle = {
            fontSize: "0.875rem",
            color: "white"
        };

        return (
            <div style={containerStyle}>
                <div style={titleStyle}>STATUS</div>
                <div style={gridStyle}>
                    <div>
                        <div style={boxStyle(data.rtdStatus ? "#14532d" : "#7f1d1d")}>
                            RTD: {data.rtdStatus ? "READY" : "NOT READY"}
                        </div>
                        <div style={borderBoxStyle}>
                            <div style={labelStyle}>SEAT BELT:</div>
                            <div style={{ fontWeight: "bold", color: data.rtdStatus ? "#4ade80" : "#6b7280" }}>
                                {data.rtdStatus ? "ON" : ""}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style={boxStyle(data.lowVoltageWarning ? "#7f1d1d" : "#14532d")}>
                            LV: {data.lowVoltageWarning ? "WARNING" : "NORMAL"}
                        </div>
                        <div style={borderBoxStyle}>
                            <div style={labelStyle}>NO SMOKING:</div>
                            <div style={{ fontWeight: "bold", color: !data.lowVoltageWarning ? "#4ade80" : "#6b7280" }}>
                                {!data.lowVoltageWarning ? "ON" : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Outer container styles and overall layout
    const outerContainerStyle = {
        backgroundColor: "black",
        color: "white",
        padding: "1.5rem",
        fontFamily: "monospace",
        width: "100%",
        height: "100%",
        boxSizing: "border-box"
    };

    const headerStyle = {
        textAlign: "center",
        fontSize: "1.5rem",
        fontWeight: "bold",
        marginBottom: "1rem"
    };

    const gridContainerStyle = {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem"
    };

    const columnStyle = {
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
    };

    return (
        <div style={outerContainerStyle}>
            <div style={headerStyle}>ELECTRONIC CENTRALIZED VEHICLE MONITORING</div>
            <div style={gridContainerStyle}>
                <div style={columnStyle}>
                    {/*Components for the left column*/}
                    <VehicleOutline />
                    <PowertrainStatus />

                </div>
                {/*Components for the right column*/}
                <div style={columnStyle}>
                    <SystemStatus />
                    <ControlInputs />
                    <WarningPanel />
                    <LiveTrackMap /> {/* Moved here to place under Status */}
                </div>
            </div>
        </div>
    );
};

export default FSAEDisplay;