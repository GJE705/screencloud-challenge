import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { TelemetryData } from '../types';
import { validateTelemetryData, validateTelemetryDataTypes } from '../validation';
import AWS from 'aws-sdk';

// Configure DynamoDB client based on environment
const documentClient = new AWS.DynamoDB.DocumentClient(process.env.IS_LOCAL ? {
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
} : {});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  // return { statusCode: 200, body: '{Hello from Lambda!}' };
  try {
    // Parse the incoming JSON body
    const telemetryData = JSON.parse(event.body || '');
    console.log('Received telemetry data:', JSON.stringify(telemetryData, null, 2));

    // Validate data types first
    if (!validateTelemetryDataTypes(telemetryData)) {
      console.log('Failed type validation');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid telemetry data types' })
      };
    }

    // Then validate the actual data
    if (!validateTelemetryData(telemetryData)) {
      console.log('Failed data validation');
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Invalid telemetry data format' })
      };
    }

    // Store in DynamoDB
    // await documentClient.put({
    //   TableName: process.env.TABLE_NAME || 'LocalTable',
    //   Item: {
    //     ...telemetryData,
    //     ttl: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days retention
    //   }
    // }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: 'Telemetry data processed successfully',
        droneId: telemetryData.droneId
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