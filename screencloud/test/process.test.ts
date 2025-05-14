import { handler } from '../lambda/telemetry-processor/process';
import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { GetItemInput, PutItemInput } from 'aws-sdk/clients/dynamodb';

//testing approach from https://github.com/dwyl/aws-sdk-mock/blob/main/README.md 

describe('processTelemetry', () => {
      it('should mock reading from DocumentClient', async () => {
    // Overwriting DynamoDB.DocumentClient.get()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB.DocumentClient', 'get', (params: GetItemInput, callback: Function) => {
      console.log('DynamoDB.DocumentClient', 'get', 'mock called');
      callback(null, {pk: 'foo', sk: 'bar'});
    });

    const input:GetItemInput = { TableName: '', Key: {} };
    const client = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
    expect(await client.get(input).promise()).toStrictEqual({ pk: 'foo', sk: 'bar' });

    AWSMock.restore('DynamoDB.DocumentClient');
  });

 it('should process telemetry data correctly', async () => {
        AWSMock.setSDKInstance(AWS);
        
        AWSMock.mock('DynamoDB.DocumentClient', 'put', (params: PutItemInput, callback: Function) => {
            // Return an empty object or the structure your handler expects
            callback(null, {});
        });

        const testData = {
            droneId: '12345678',
            timestamp: 1633072800,
            eventType: 'WARNING',
            status: 'ACTIVE',
            telemetryData: {
                batteryLevel: 85,
                location: 'belfast'
            }
        }
        const event = {
            body: JSON.stringify(testData)
        };

        const result = await handler(event as any);

        // Log result for debugging if test fails
        if (result.statusCode !== 200) {
            console.error('Handler result:', result);
        }

        expect(result.statusCode).toBe(200);

        AWSMock.restore('DynamoDB.DocumentClient');
    });

});