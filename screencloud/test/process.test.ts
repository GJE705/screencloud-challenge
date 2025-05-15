import { handler } from "../lambda/telemetry-processor/process";
import AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import { GetItemInput, PutItemInput } from "aws-sdk/clients/dynamodb";
import { SQSEvent } from "aws-lambda";

//testing approach from https://github.com/dwyl/aws-sdk-mock/blob/main/README.md

describe("processTelemetry", () => {

//this is a test I was using to check if i could actually mock the DynamoDB connection and response 
  it("should mock reading from DocumentClient", async () => {
    // Overwriting DynamoDB.DocumentClient.get()
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock(
      "DynamoDB.DocumentClient",
      "get",
      (params: GetItemInput, callback: Function) => {
        console.log("DynamoDB.DocumentClient", "get", "mock called");
        callback(null, { pk: "test1", sk: "test2" });
      }
    );

    const input: GetItemInput = { TableName: "", Key: {} };
    const client = new AWS.DynamoDB.DocumentClient({
      apiVersion: "2012-08-10",
    });
    expect(await client.get(input).promise()).toStrictEqual({
      pk: "test1",
      sk: "test2",
    });

    AWSMock.restore("DynamoDB.DocumentClient");
  });

  describe("API Gateway events", () => {
    it("should process telemetry data correctly via API Gateway", async () => {
      const validCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
      drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
  `;
      const event = {
        body: validCsvTestData,
      };

      const result = await handler(event as any);

      if (result.statusCode !== 200) {
        console.error("Handler result:", result);
      }

      expect(result.statusCode).toBe(200);
    });

    it("should fail if csv formatting is invalid via API Gateway", async () => {
      const invalidCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
      12345678,1747209600000,TAKEOFF,ACTIVE,80,belfast
  `;
      const event = {
        body: invalidCsvTestData,
      };

      const result = await handler(event as any);
      expect(result.statusCode).toBe(207);
    });

    it("should fail with an empty event via API Gateway", async () => {
      const event = {}

      const result = await handler(event as any);

      expect(result.statusCode).toBe(400);
    });

    it("should handle malformed CSV data via API Gateway", async () => {
      const malformedCsvData = `droneId,timestamp,eventType,status,batteryLevel,location
  drone001,1747209600000,TAKEOFF,ACTIVE,80`; 

      const event = {
        body: malformedCsvData,
      };

      const result = await handler(event as any);
      expect(result.statusCode).toBe(207);
    });

    it("should handle multiple valid rows in CSV via API Gateway", async () => {
      const multiRowCsvData = `droneId,timestamp,eventType,status,batteryLevel,location
  drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
  drone002,1747209600001,FLYING,ACTIVE,75,dublin
  drone003,1747209600002,LANDING,ACTIVE,60,cork`;

      const event = {
        body: multiRowCsvData,
      };

      const result = await handler(event as any);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.successful).toBe(3);
      expect(body.failed).toBe(0);
    });
  });

  describe("SQS events", () => {
    it("should process telemetry data correctly via SQS", async () => {
      const validCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
      drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
      `;
      const sqsEvent: SQSEvent = {
        Records: [{
          messageId: '1',
          receiptHandle: 'handle',
          body: validCsvTestData,
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1573251510000',
            SenderId: 'sender',
            ApproximateFirstReceiveTimestamp: '1573251510000'
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account:queue',
          awsRegion: 'region'
        }]
      };

      const result = await handler(sqsEvent);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.successful).toBe(1);
      expect(body.failed).toBe(0);
    });

    it("should handle multiple SQS records", async () => {
      const validCsvTestData1 = `droneId,timestamp,eventType,status,batteryLevel,location
      drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
      `;
      const validCsvTestData2 = `droneId,timestamp,eventType,status,batteryLevel,location
      drone002,1747209600001,FLYING,ACTIVE,75,dublin
      `;
      const sqsEvent: SQSEvent = {
        Records: [
          {
            messageId: '1',
            receiptHandle: 'handle1',
            body: validCsvTestData1,
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1573251510000',
              SenderId: 'sender',
              ApproximateFirstReceiveTimestamp: '1573251510000'
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:region:account:queue',
            awsRegion: 'region'
          },
          {
            messageId: '2',
            receiptHandle: 'handle2',
            body: validCsvTestData2,
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1573251510000',
              SenderId: 'sender',
              ApproximateFirstReceiveTimestamp: '1573251510000'
            },
            messageAttributes: {},
            md5OfBody: 'md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:region:account:queue',
            awsRegion: 'region'
          }
        ]
      };

      const result = await handler(sqsEvent);
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.successful).toBe(2);
      expect(body.failed).toBe(0);
    });

    it("should handle invalid CSV data in SQS message", async () => {
      const invalidCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
      12345678,1747209600000,TAKEOFF,ACTIVE,80,belfast
      `;
      const sqsEvent: SQSEvent = {
        Records: [{
          messageId: '1',
          receiptHandle: 'handle',
          body: invalidCsvTestData,
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1573251510000',
            SenderId: 'sender',
            ApproximateFirstReceiveTimestamp: '1573251510000'
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account:queue',
          awsRegion: 'region'
        }]
      };

      const result = await handler(sqsEvent);
      expect(result.statusCode).toBe(207);
      const body = JSON.parse(result.body);
      expect(body.successful).toBe(0);
      expect(body.failed).toBe(1);
    });
  });

  it("should process telemetry data correctly", async () => {
    const validCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
    drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
`;
    const event = {
      body: validCsvTestData,
    };

    const result = await handler(event as any);

    if (result.statusCode !== 200) {
      console.error("Handler result:", result);
    }

    expect(result.statusCode).toBe(200);
  });

  it("should fail if csv formatting is invalid", async () => {
    const invalidCsvTestData = `droneId,timestamp,eventType,status,batteryLevel,location
    12345678,1747209600000,TAKEOFF,ACTIVE,80,belfast
`;
    const event = {
      body: invalidCsvTestData,
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(207);
  });


  it("should fail with an empty event", async () => {

    const event = {}

    const result = await handler(event as any);

    expect(result.statusCode).toBe(400);
  });

    it("should handle malformed CSV data", async () => {
    const malformedCsvData = `droneId,timestamp,eventType,status,batteryLevel,location
drone001,1747209600000,TAKEOFF,ACTIVE,80`; 

    const event = {
      body: malformedCsvData,
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(207);
  });

    it("should handle multiple valid rows in CSV", async () => {
    const multiRowCsvData = `droneId,timestamp,eventType,status,batteryLevel,location
drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
drone002,1747209600001,FLYING,ACTIVE,75,dublin
drone003,1747209600002,LANDING,ACTIVE,60,cork`;

    const event = {
      body: multiRowCsvData,
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.successful).toBe(3);
    expect(body.failed).toBe(0);
  });

  it("should handle mixed valid and invalid rows in CSV", async () => {
    const mixedCsvData = `droneId,timestamp,eventType,status,batteryLevel,location
drone001,1747209600000,TAKEOFF,ACTIVE,80,belfast
invalid123,1747209600001,FLYING,ACTIVE,75,dublin
drone003,1747209600002,INVALID_EVENT,ACTIVE,60,cork`;

    const event = {
      body: mixedCsvData,
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(207);
    const body = JSON.parse(result.body);
    expect(body.successful).toBe(1);
    expect(body.failed).toBe(2);
  });

});
