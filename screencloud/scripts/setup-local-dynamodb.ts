import { DynamoDBClient, CreateTableCommand, ScalarAttributeType } from '@aws-sdk/client-dynamodb';

async function createLocalTable() {
  const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'local',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local'
    },
    retryMode: 'standard',
    maxAttempts: 3
  });

  // using docs from https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/getting-started-step-1.html 

  const command = new CreateTableCommand({
    TableName: 'LocalTable',
    KeySchema: [
      { AttributeName: 'droneId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'droneId', AttributeType: ScalarAttributeType.S },
      { AttributeName: 'timestamp', AttributeType: ScalarAttributeType.N }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  try {
    const result = await client.send(command);
    console.log('Table created successfully:', result);
  } catch (error) {
    if ((error as any).name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
      throw error;
    }
  }
}

createLocalTable();