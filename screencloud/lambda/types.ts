export interface TelemetryData {
    droneId: string;
    timestamp: number;
    eventType: string;
    status: string;
    telemetryData: {
        batteryLevel: number;
        location: string;
    };
}
