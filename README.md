# screencloud-challenege

The Goal
This challenge assesses your ability to think about event-driven systems, design data
processing workflows, define infrastructure, handle data validation, and write testable code.
It’s your chance to demonstrate how you approach building scalable and reliable backend
systems.

The Scenario
Our company operates a growing fleet of autonomous drones making deliveries across the city.
These drones constantly send back status updates and telemetry data – things like successful
deliveries, battery levels, route adjustments, or sensor readings. We need a system that can
automatically ingest this raw data as it arrives, make sense of it, validate it, and store it reliably
for later analysis, monitoring dashboards, and potential alerting.

Design and implement a backend service (or set of services) that:
●
Reacts to Incoming Data: Your system should automatically process new drone
telemetry data shortly after it becomes available. Choose an appropriate mechanism to
ingest the data.
Please keep in mind that all data fields may not be guaranteed, they could also be incomplete
or corrupted.
●
●
●
●
Processes the Data: Read the incoming raw data.
Parse the key information from each telemetry record.
Transform the valid data into a structured format suitable for storage.
Store the Processed Data: Persist each valid, structured telemetry record into a data
store of your choice. Think about how this data might be queried later (e.g., find all
events for a specific drone, or all errors within a time window).
Input Data (Example)
Assume drone telemetry arrives as individual records, potentially batched in files (like CSV) or
as messages (like JSON). A typical record might contain:
·
·
·
·
·
droneId
timestamp
eventType
statusCode
telemetryData e.g. battery level or location
Feel free to define a reasonable structure for the input data based on the scenario. The exact
format (CSV, JSON, etc.) and specific fields are less critical than handling the processing flow.
Your Implementation
Processing Logic
·
·
·
Write the core application code, preferably in Typescript (which is what we use day
to day).
Implement the logic for ingestion, parsing, validation, and database interaction.
Include robust error handling and clear logging.
Infrastructure Definition
Define how your service(s) and any dependencies would be set up. Choose the approach that
best suits your solution:
·
·
·
Infrastructure as Code (IaC): Use your preferred tool (we use Pulumi and Serverless
Framework internally, but others like Terraform, AWS CDK/SAM, etc., are fine) to
define resources if you’re thinking cloud-native.
Container Definitions: Provide Dockerfile(s) and ideally a docker-compose.yml to
orchestrate your application and local dependencies (like a database) for easy local
testing.
Briefly consider and mention necessary permissions/access controls.
While demonstrating a deployed setup is encouraged, it is not required. A local solution that
runs is equally as valid for this task. Focus first on creating a robust, well-documented solution,
as this is the primary requirement.
T esting
·
·
Include unit tests for your core processing logic (parsing, validation,
transformation).
o Use a standard testing framework for your chosen language. Mock external
dependencies as required.
Describe in your README how you would approach integration testing for your
chosen setup.
What We’re Looking For
·
·
·
·
·
·
Your approach to designing an event-driven system.
Clean, well-structured, and understandable code.
Solid data validation and error-handling strategies.
Clear definition of your application’s infrastructure (IaC or containers).
A practical testing strategy.
Crucially: Your explanations in the README relating to why you chose a specific
architecture and any assumptions you made. Additionally, if you have not
completed everything explain where you would go next in all of the missing
sections.
Deliverables
·
·
A link to a Git repository (e.g., on GitHub, GitLab). The repository should contain:
o Your application source code.
o IaC files (if present)
o Unit tests.
o Any necessary configuration files.
A README file detailing:
o A brief overview of your solution design.
o Explanation of your key choices (architecture, language/framework,
database, schema, IaC/container approach, testing strategy).
o Clear instructions on how to install dependencies, configure (if needed), run
the application locally, and run the tests.
o Any assumptions made or challenges encountered.