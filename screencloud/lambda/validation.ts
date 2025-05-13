import { TelemetryData } from "./types";

export function validateTelemetryDataTypes(data: any): data is TelemetryData {
  return (
    typeof data.droneId === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.eventType === 'string' &&
    typeof data.status === 'string' && 
    typeof data.telemetryData === 'object'
  );
}

export function validateTelemetryData(data: TelemetryData): boolean {
  if (data.droneId.length !== 8) {
    return false;
  }

  if (data.telemetryData.batteryLevel < 0 || data.telemetryData.batteryLevel > 100) {
    return false;
  }

  if (typeof data.telemetryData.location !== 'string') {
    return false;
  }

  return true;
}

