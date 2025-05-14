# Screencloud Telemetry Challenge

## Solution Overview

This project implements a serverless application using AWS Lambda and DynamoDB to manage drone telemetry data. The solution focuses on efficient data processing and storage while maintaining scalability and reliability.

### Architecture Flow

1. Drone events trigger a Lambda function
2. The Lambda function:
   - Validates incoming drone data
   - Processes and transforms it into JSON format
3. Valid rows are stored in the dynamoDB table and can be quried quickly 

### Technical Stack

- **Architecture:** AWS Serverless
- **Language:** TypeScript
- **Database:** DynamoDB
- **Local Development:** Docker
- **Testing:** Test-Driven Development (TDD) approach
- **Infrastructure:** AWS CDK

## Getting Started

### Prerequisites

- Node.js and npm installed
- Docker installed (for local DynamoDB)
- AWS CLI configured (for deployment)

### Installation and Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local DynamoDB:
   ```bash
   docker compose up
   ```

3. Run setup local dynamo db script
   ```bash
    npx ts-node scripts/setup-local-dynamodb.ts
   ```

4. Run generate test data script
   ```bash
    npx ts-node scripts/generate-test-data.ts
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and recompile |
| `npm run test` | Run Jest unit tests |
| `npx cdk deploy` | Deploy stack to AWS |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk synth` | Generate CloudFormation template |

## Development Notes

### Design Considerations

While AWS Step Functions was initially considered as a potential solution, the decision was made to focus on Lambda functions due to my experience and simplicity of implementation.

### Challenges and Learnings

The main challenge encountered was setting up DynamoDB for local development:
- Successfully configured local DynamoDB using Docker
- Faced difficulties integrating the process Lambda with the local DynamoDB container for testing
- In retrospect, while DynamoDB remains the ideal choice for this use case, using a familiar relational database like PostgreSQL might have accelerated initial development   
- I pivoted form connecting to the docker container to mocking th Dynamo db instance using aws-sdk-mock library here https://github.com/dwyl/aws-sdk-mock/blob/main/README.md 