import { handler } from '../lambda/telemetry-processor/process';

describe ('processTelemetry', () => {

    it('should process telemetry data correctly', async () => {
        const event = {
            body: JSON.stringify({
                droneId: '12345678',
                timestamp: 1633072800,
                eventType: 'telemetry',
                status: 'active',
                telemetryData: {
                    batteryLevel: 85,
                    location: 'belfast'
                }
            })
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body).message).toBe('Telemetry data processed successfully');
    })
});