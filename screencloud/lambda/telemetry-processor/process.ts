import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TelemetryData } from './types';
import { validateTelemetryData, validateTelemetryDataTypes } from './validation';
import AWS from 'aws-sdk';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse the incoming CSV data
    console.log('Received event body:', event.body);
    
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {


          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No data provided' })
      };
    }

    const csvLines = event.body.split('\n');
    console.log('CSV lines:', csvLines);

    // Skip header row and empty lines
    const dataRows = csvLines.slice(1).filter(line => line.trim());
    console.log('Data rows:', dataRows);
    
    const results = {
      successful: [] as TelemetryData[],
      failed: [] as Array<{ row: string; error: string }>
    };
    
    for (const row of dataRows) {
      try {
        const [droneId, timestamp, eventType, status, batteryLevel, location] = row.split(',').map(str => str.trim());
        
        const telemetryData: TelemetryData = {
          droneId,
          timestamp: parseInt(timestamp, 10),
          eventType,
          status,
          telemetryData: {
            batteryLevel: parseInt(batteryLevel, 10),
            location
          }
        };

        if (!validateTelemetryDataTypes(telemetryData)) {
          console.log('Failed type validation for row:', row);
          results.failed.push({ row, error: 'Invalid telemetry data types' });
          continue;
        }

        if (!validateTelemetryData(telemetryData)) {
          console.log('Failed data validation for row:', row);
          results.failed.push({ row, error: 'Invalid telemetry data format' });
          continue;
        }

        results.successful.push(telemetryData);
      } catch (rowError) {
        console.error('Error processing row:', row, rowError);
        results.failed.push({ row, error: 'Row processing failed: ' + String(rowError) });
      }
    }

    //currently consuming the data as csv froma post request
    //due to issue with dynamo im going to break up the lambda into two parts 
    //this lambda will process the csv and validate the data
    //the next lambda will take the data and put it into the db
    // Store successful telemetry data in DynamoD

    return {
      statusCode: results.failed.length === 0 ? 200 : 207, 
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Processed ${dataRows.length} rows`,
        successful: results.successful.length,
        failed: results.failed.length,
        details: results
      })
    };
  } catch (error) {
    console.error('Error processing telemetry data:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: String(error) })
    };
  }
};