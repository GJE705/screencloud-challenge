import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { TelemetryData } from './types';
import { validateTelemetryData, validateTelemetryDataTypes } from './validation';
import AWS from 'aws-sdk';

export const handler = async (event: SQSEvent | APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Check if this is an SQS event
    if ('Records' in event) {
      const results = {
        successful: [] as TelemetryData[],
        failed: [] as Array<{ row: string; error: string }>
      };

      for (const record of event.Records) {
        try {
          // Parse the CSV data from SQS message
          const csvLines = record.body.split('\n');
          console.log('CSV lines:', csvLines);

          // Skip header row and empty lines
          const dataRows = csvLines.slice(1).filter(line => line.trim());
          console.log('Data rows:', dataRows);

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
        } catch (recordError) {
          console.error('Error processing SQS record:', recordError);
          results.failed.push({ row: record.body, error: 'Record processing failed: ' + String(recordError) });
        }
      }

      return {
        statusCode: results.failed.length === 0 ? 200 : 207,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Processed ${event.Records.length} messages`,
          successful: results.successful.length,
          failed: results.failed.length,
          details: results
        })
      };
    }

    // Handle direct API Gateway requests (legacy support)
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


  // Due to issues with my local DynamoDB setup, I had to split the database interaction code into a separate Lambda function.
// Ideally, I would have handled the database operations within this Lambda, but I encountered authorization errors 
// with the Docker container for DynamoDB that I couldn't resolve. 
// My plan was to trigger the "push to DB" Lambda with the telemetry data contained in the 'successful' array.
//due to time the pushToDBLambda function is not in a working state ,


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