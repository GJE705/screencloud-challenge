import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Context } from 'aws-lambda';
import { parse as csvParse } from 'csv-parse/sync';
import * as fs from 'fs';
import { TelemetryData } from '../types';

const ddbClient = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(ddbClient);

function validateTelemetryData(data: any): data is TelemetryData {
  return (
    typeof data.droneId === 'string' &&
    typeof data.timestamp === 'number' &&
    typeof data.eventType === 'string' &&
    typeof data.status === 'string' && 
    typeof data.telemetryData === 'object'
  );
}

async function processCsvRow(row: any): Promise<void> {
  try {
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

    if (!validateTelemetryData(telemetryData)) {
      console.error('Invalid row data:', row);
      return;
    }

    await documentClient.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        ...telemetryData,
        ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days retention
      }
    }));
  } catch (error) {
    console.error('Error processing row:', row, error);
  }
}

export async function handler(event: any, context: Context): Promise<any> {
  try {
    // Check if a CSV file path is provided
    if (!event.csvFilePath) {
      throw new Error('No CSV file path provided');
    }

    const csvFilePath = event.csvFilePath;
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    return new Promise((resolve, reject) => {
      const parser = csvParse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      const processRows = async () => {
        const rows = [];
        for await (const row of parser) {
          rows.push(processCsvRow(row));
        }
        await Promise.all(rows);
      };

      processRows()
        .then(() => {
          resolve({
            statusCode: 200,
            body: JSON.stringify({ message: 'CSV processing completed successfully' })
          });
        })
        .catch((error) => {
          console.error('Error processing CSV:', error);
          reject({
            statusCode: 500,
            body: JSON.stringify({ error: 'Error processing CSV file' })
          });
        });
    });
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
}