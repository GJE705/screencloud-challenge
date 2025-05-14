import { TelemetryData } from "./types";

export function validateTelemetryDataTypes(data: any): data is TelemetryData {
 

  return (
    typeof data.droneId === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.eventType === 'string' &&
    typeof data.status === 'string' 
  );
}

export function validateTelemetryData(data: TelemetryData): boolean {
 
  if (data.droneId.length !== 8) {
    console.log('Invalid droneId length');
    return false;
  }

  if (data.telemetryData.batteryLevel < 0 || data.telemetryData.batteryLevel > 100) {
    console.log('Invalid battery level');
    return false;
  }

  if (!data.telemetryData.location) {
    console.log('Missing location');
    return false;
  }

  return true;
}

