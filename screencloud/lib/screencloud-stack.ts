import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ScreencloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const telemetryQueue = new sqs.Queue(this, 'TelemetryQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14)
    });

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

    // Create API Gateway resource for SQS integration
    const telemetry = api.root.addResource('telemetry');
    telemetry.addMethod('POST', new apigateway.AwsIntegration({
      service: 'sqs',
      path: `${cdk.Aws.ACCOUNT_ID}/${telemetryQueue.queueName}`,
      integrationHttpMethod: 'POST',
      options: {
        credentialsRole: new iam.Role(this, 'TelemetryApiRole', {
          assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
          inlinePolicies: {
            'SQSAccess': new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: ['sqs:SendMessage'],
                  resources: [telemetryQueue.queueArn]
                })
              ]
            })
          }
        }),
        requestParameters: {
          'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'"
        },
        requestTemplates: {
          'application/json': 'Action=SendMessage&MessageBody=$input.body'
        },
        integrationResponses: [{
          statusCode: '200',
          responseTemplates: {
            'application/json': '{"message": "Message sent to queue"}'
          }
        }]
      }
    }), {
      methodResponses: [{
        statusCode: '200',
        responseModels: {
          'application/json': apigateway.Model.EMPTY_MODEL
        }
      }]
    });

    // Add SQS queue as event source for telemetryProcessor
    telemetryProcessor.addEventSource(new SqsEventSource(telemetryQueue, {
      batchSize: 1
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
