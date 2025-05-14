import * as fs from 'fs';
import * as path from 'path';
import { TelemetryData } from '../lambda/types';

const baseDate = new Date('2025-05-14T08:00:00Z');
const data: TelemetryData[] = [];

// Generate 100 records
for (let i = 0; i < 100; i++) {
    const droneNumber = Math.floor(i / 10) + 1;
    const droneId = `drone${droneNumber.toString().padStart(3, '0')}`;
    const timestamp = baseDate.getTime() + (i * 60000); // Add one minute for each record
    const eventTypes = ['TAKEOFF', 'FLYING', 'LANDING', 'LANDED', 'WARNING'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const status = eventType === 'LANDED' ? 'INACTIVE' : 'ACTIVE';

    data.push({
        droneId,
        timestamp,
        eventType,
        status,
        telemetryData: {
            batteryLevel: Math.floor(Math.random() * 101), // Random battery level between 0 and 100
            location: "belfast" // Random location
        }
    });
}

// Write to CSV
const csvContent = ['droneId,timestamp,eventType,status,batteryLevel,location'];
data.forEach(record => {
    csvContent.push(`${record.droneId},${record.timestamp},${record.eventType},${record.status},${record.telemetryData.batteryLevel},${record.telemetryData.location}`);
});

fs.writeFileSync(
    path.join(__dirname, '../test-data.csv'),
    csvContent.join('\n')
);

console.log('Test data generated successfully!');
