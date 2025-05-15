import express from 'express';
import { handler } from '../lambda/telemetry-processor/process';
import { APIGatewayProxyEvent, SQSEvent } from 'aws-lambda';

// Set environment variables for local development
process.env.IS_LOCAL = 'true';
process.env.AWS_ACCESS_KEY_ID = 'dummy';
process.env.AWS_SECRET_ACCESS_KEY = 'dummy';
process.env.AWS_REGION = 'eu-west-1';

const app = express();
const port = 3000;

// Parse raw bodies
app.use(express.text({ type: 'text/csv' }));
app.use(express.json({ type: 'application/json' }));

// Endpoint to simulate API Gateway -> Lambda
app.post('/telemetry', async (req, res) => {
    try {
        console.log('Received request:', {
            headers: req.headers,
            body: req.body,
            contentType: req.get('Content-Type')
        });

        // Simulate SQS event
        const sqsEvent: SQSEvent = {
            Records: [{
                messageId: 'local-message-id',
                receiptHandle: 'local-receipt-handle',
                body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
                attributes: {
                    ApproximateReceiveCount: '1',
                    SentTimestamp: Date.now().toString(),
                    SenderId: 'local-sender',
                    ApproximateFirstReceiveTimestamp: Date.now().toString()
                },
                messageAttributes: {},
                md5OfBody: 'local-md5',
                eventSource: 'aws:sqs',
                eventSourceARN: 'arn:aws:sqs:local:000000000000:LocalQueue',
                awsRegion: 'local'
            }]
        };
        
        // Create an API Gateway event from the Express request
        const event: APIGatewayProxyEvent = {
            body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
            headers: req.headers as { [key: string]: string },
            httpMethod: 'POST',
            isBase64Encoded: false,
            path: '/telemetry',
            pathParameters: null,
            queryStringParameters: null,
            stageVariables: null,
            requestContext: {
                accountId: 'local',
                apiId: 'local',
                authorizer: null,
                protocol: 'HTTP/1.1',
                httpMethod: 'POST',
                identity: {
                    accessKey: null,
                    accountId: null,
                    apiKey: null,
                    apiKeyId: null,
                    caller: null,
                    clientCert: null,
                    cognitoAuthenticationProvider: null,
                    cognitoAuthenticationType: null,
                    cognitoIdentityId: null,
                    cognitoIdentityPoolId: null,
                    principalOrgId: null,
                    sourceIp: '127.0.0.1',
                    user: null,
                    userAgent: null,
                    userArn: null,
                },
                path: '/telemetry',
                stage: 'local',
                requestId: 'local',
                requestTimeEpoch: Date.now(),
                resourceId: 'local',
                resourcePath: '/telemetry',
            },
            resource: '/telemetry',
            multiValueHeaders: {},
            multiValueQueryStringParameters: null,
        };

        // Set environment variable for local development
        process.env.IS_LOCAL = 'true';
        process.env.TABLE_NAME = 'LocalTable';

        // Call the Lambda handler
        // Try SQS event first, fallback to direct API Gateway event
        const result = await handler(sqsEvent);

        // Send the response
        res.status(result.statusCode).set(result.headers).send(result.body);

        // Log success message
        console.log('Successfully processed message through SQS simulation');
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Local development server running at http://localhost:${port}`);
    console.log('POST http://localhost:3000/telemetry');
    console.log('Example body:');
    console.log(JSON.stringify({
        droneId: "drone001",
        timestamp: Date.now(),
        eventType: "TAKEOFF",
        status: "ACTIVE"
    }, null, 2));
});
