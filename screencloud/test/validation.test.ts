import { validateTelemetryDataTypes, validateTelemetryData } from '../lambda/telemetry-processor/validation';

describe('validateTelemetryDataTypes', () => {
    it('should return true for valid types', () => {
        const data = {
            droneId: 'ABCDEFGH',
            timestamp: 1234567890,
            eventType: 'FLIGHT',
            status: 'ACTIVE',
            telemetryData: {
                batteryLevel: 50,
                location: 'belfast'
            }
        };
        expect(validateTelemetryDataTypes(data)).toBe(true);
    });

    it('should return false if droneId is not a string', () => {
        const data = {
            droneId: 123,
            timestamp: 1234567890,
            eventType: 'FLIGHT',
            status: 'ACTIVE'
        };
        expect(validateTelemetryDataTypes(data)).toBe(false);
    });

    it('should return false if timestamp is not a number', () => {
        const data = {
            droneId: 'ABCDEFGH',
            timestamp: 'not-a-number',
            eventType: 'FLIGHT',
            status: 'ACTIVE'
        };
        expect(validateTelemetryDataTypes(data)).toBe(false);
    });

    it('should return false if eventType is not a string', () => {
        const data = {
            droneId: 'ABCDEFGH',
            timestamp: 1234567890,
            eventType: 123,
            status: 'ACTIVE'
        };
        expect(validateTelemetryDataTypes(data)).toBe(false);
    });

    it('should return false if status is not a string', () => {
        const data = {
            droneId: 'ABCDEFGH',
            timestamp: 1234567890,
            eventType: 'FLIGHT',
            status: 123
        };
        expect(validateTelemetryDataTypes(data)).toBe(false);
    });
});

describe('validateTelemetryData', () => {
    const baseData = {
        droneId: 'drone001',
        timestamp: 1234567890,
        eventType: 'TAKEOFF',
        status: 'ACTIVE',
        telemetryData: {
            batteryLevel: 50,
            location: 'belfast'
        }
    };

    it('should return true for valid telemetry data', () => {
        expect(validateTelemetryData(baseData as any)).toBe(true);
    });

    it('should return false for invalid droneId length', () => {
        const data = { ...baseData, droneId: 'ABC' };
        expect(validateTelemetryData(data as any)).toBe(false);
    });

    it('should return false for batteryLevel < 0', () => {
        const data = { ...baseData, telemetryData: { ...baseData.telemetryData, batteryLevel: -1 } };
        expect(validateTelemetryData(data as any)).toBe(false);
    });

    it('should return false for batteryLevel > 100', () => {
        const data = { ...baseData, telemetryData: { ...baseData.telemetryData, batteryLevel: 101 } };
        expect(validateTelemetryData(data as any)).toBe(false);
    });

    it('should return false if location is missing', () => {
        const data = { ...baseData, telemetryData: { ...baseData.telemetryData, location: undefined } };
        expect(validateTelemetryData(data as any)).toBe(false);
    });
});