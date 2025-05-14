# Screencloud telemetry challenge
o A brief overview of your solution design.


initial plan lambda to handle parsing the data 

- update can handle parsing transforming and storage in one lambda

- thoughts: step functions would be a suitable solution here



o Explanation of your key choices (architecture, language/framework, database, schema, IaC/container approach, testing strategy).

Typescript with AWS 


## Instructions on how to install dependencies, configure (if needed), run the application locally, and run the tests.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npm i `   install the dependencies 
* `docker compose up` start the dynamoDb docker container


## Any assumptions made or challenges encountered
Challenges encountered, i wanted to implement dynamo db i had set this up using a docker container however experienced issues when tyring to get the process lambda to run tests against the local container, i spent too much time on this and lost  