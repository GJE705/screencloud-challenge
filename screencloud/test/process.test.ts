import { handler } from "../lambda/telemetry-processor/process";
import AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import { GetItemInput, PutItemInput } from "aws-sdk/clients/dynamodb";

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
