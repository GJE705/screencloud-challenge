import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import AWS from 'aws-sdk';

// Configure AWS for local development
const config = process.env.IS_LOCAL ? {
  region: 'eu-west-1',
  credentials: new AWS.Credentials('dummy', 'dummy'),
  endpoint: 'http://localhost:8000'
} : { region: 'eu-west-1' };




const documentClient = new AWS.DynamoDB.DocumentClient(config);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error('TABLE_NAME environment variable is not set');
    }

    // Create a hello world item
    const item = {
      droneId: 'test-drone-001',
      timestamp: Date.now(),
      message: 'Hello World',
      ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours from now
    };

    await documentClient.put({
      TableName: tableName,
      Item: item
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello world item stored successfully',
        item: item
      })
    };

  } catch (error) {
    console.error('Error storing item:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: String(error) })
    };
  }
};