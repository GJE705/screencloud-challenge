import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Context } from 'aws-lambda';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import { TelemetryData } from '../types';
import { validateTelemetryData, validateTelemetryDataTypes } from '../validation';

const ddbClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});
const documentClient = DynamoDBDocumentClient.from(ddbClient);

async function processCsvRow(row: any): Promise<void> {
  try {
    //parse the csv data into telemetry data type
    const telemetryData: TelemetryData = {
      droneId: row.drone_id,
      timestamp: Date.parse(row.timestamp),
      eventType: row.eventType,
      status: row.status,
      telemetryData: {
        batteryLevel: parseFloat(row.batteryLevel),
        location: row.location
      }
    };

    // if (!validateTelemetryDataTypes(telemetryData) || !validateTelemetryData(telemetryData)) {
    //   console.error('Invalid telemetry data:', telemetryData);
    //   console.error('Invalid row data:', row);
    //   return;
    // }

    //add only the valid telemetry data to the database
    await documentClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME || 'LocalTestTable',
      Item: {
        ...telemetryData
      }
    }));
  } catch (error) {
    console.error('Error processing row:', row, error);
  }
}

export const handler = async (event: any): Promise<any> {
  try {
    // Handle CSV file input
    if (event.csvFilePath) {
      console.log('Processing CSV file:', event.csvFilePath);
      const fileContent = fs.readFileSync(event.csvFilePath, 'utf-8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      for (const row of records) {
        await processCsvRow(row);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'CSV processing completed successfully' })
      };
    }

    // Handle JSON input
    if (event.body) {
      const parsedData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      
      if (!validateTelemetryDataTypes(parsedData) || !validateTelemetryData(parsedData)) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid telemetry data format' })
        };
      }

      await documentClient.send(new PutCommand({
        TableName: process.env.TABLE_NAME || 'LocalTestTable',
        Item: parsedData
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Telemetry data processed successfully' })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No input provided' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}