export interface TelemetryData {
    droneId: string;
    timestamp: number; //need to update the format here 
    eventType: string; // e.g., TAKEOFF, FLYING, LANDING, LANDED, WARNING potential to change this to enbum
    status: string;
    telemetryData: {
        batteryLevel: number;
        location: string;
    };
}
