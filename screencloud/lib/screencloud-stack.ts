import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class ScreencloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const telemetryTable = new dynamodb.Table(this, 'DroneTelemetryTable', {
      partitionKey: { name: 'droneId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
    });

    const telemetryProcessor = new lambda.Function(this, 'TelemetryProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'process.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/telemetry-processor'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npm run build && mkdir -p /asset-output && cp -r dist/* /asset-output/ && cp package.json /asset-output/'
          ],
          user: 'root'
        },
      }),
      environment: {
        TABLE_NAME: telemetryTable.tableName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'TelemetryApi', {
      restApiName: 'Drone Telemetry API',
      description: 'API for processing drone telemetry data'
    });

    // Create API Gateway resource Post request to handler 
    const telemetry = api.root.addResource('telemetry');
    telemetry.addMethod('POST', new apigateway.LambdaIntegration(telemetryProcessor, {
      proxy: true
    }));

    // Create the push to DB Lambda
    const pushToDBLambda = new lambda.Function(this, 'PushToDBLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'pushToDBlambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/telemetry-processor'), {
        bundling: {
          image: lambda.Runtime.NODEJS_18_X.bundlingImage,
          command: [
            'bash', '-c',
            'npm install && npm run build && mkdir -p /asset-output && cp -r dist/* /asset-output/ && cp package.json /asset-output/'
          ],
          user: 'root'
        },
      }),
      environment: {
        TABLE_NAME: telemetryTable.tableName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    // Grant the Lambda function permissions to write to DynamoDB
    telemetryTable.grantWriteData(pushToDBLambda);

    // Add an endpoint for the push to DB Lambda
    const pushToDB = api.root.addResource('push-to-db');
    pushToDB.addMethod('POST', new apigateway.LambdaIntegration(pushToDBLambda, {
      proxy: true
    }));
  }
}
