# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npm i `   install the dependencies 




initial plan lambda for each of the incoming data actions

- update can handle parsing transforming and storage in one lambda

- thoughts: step functions would be a suitable solution here


A README file detailing:
o A brief overview of your solution design.
o Explanation of your key choices (architecture, language/framework,
database, schema, IaC/container approach, testing strategy).
o Clear instructions on how to install dependencies, configure (if needed), run
the application locally, and run the tests.
o Any assumptions made or challenges encountered.