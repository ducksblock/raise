# 🔃 Raise Server

Back-end code and resources for the Raise platform.

## ⏱ Quick Start

This quick start will help you get the server up and running on your local machine, and explain how to make changes.

Commands should be typed into your terminal, in the raise-server directory if not otherwise specified. VS Code comes with a built-in terminal that sets this up for you when you've opened the folder (Menu > Terminal > New Terminal).

### 🔧 Setup

You only need to do this once.

1. Install [Node](https://nodejs.org/) (choose the LTS version) and [VS Code](https://code.visualstudio.com/Download)
2. Install [Java](https://adoptium.net/) (choose the latest LTS version)
3. Clone the repository ([more info](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository))
4. Open the folder with VS Code
5. Run `npm install` and `npm run build` in the shared folder
6. Run `npm install` in the server folder

### 🏃 Running the local server

Run the command `npm start`

To run with Stripe webhooks, you may need to [set up your own Stripe account for testing](https://dashboard.stripe.com/register) or get access to a shared one. Then update the environment variables in `src/env/local.ts` to [your test API keys](https://stripe.com/docs/keys), install [the Stripe CLI](https://stripe.com/docs/stripe-cli) and follow the [instructions to listen to webhook events with the Stripe CLI](https://stripe.com/docs/stripe-cli/webhooks) (probably `stripe listen --forward-to localhost:8001/stripe/webhook`).

The ports the local server hosts on are:
- `8001`: the API (this is probably what you want most of the time)
- `8002`: serverless-offline websockets
- `8003`: serverless-offline AWS Lambda API
- `8004`: serverless-dynamodb-local instance of DynamoDB for serverless-offline
- `8005`: serverless-dynamodb-local instance of DynamoDB for tests
- `8006`: serverless-offline-ses-v2 instance of ses

### 📝 Making changes

We follow the [GitHub flow model](https://guides.github.com/introduction/flow/) (aka: feature branches and pull/merge requests).

Try to make small, independent changes to make reviewing easy and minimize merge conflicts. Follow existing conventions and leave comments explaining why the code you've written exists/exists in the way it does.

The free [Git book](https://git-scm.com/book/en/v2) is a great resource to learn more about using git effectively.

1. Check you're up to date with the latest changes in the repository, using [VS code](https://code.visualstudio.com/docs/editor/versioncontrol) or git commands (probably `git checkout master && git pull` if you're starting a new branch, or `git pull && git rebase origin/master` if you want to update your branch).
2. Create a feature branch for your work, using [VS code](https://code.visualstudio.com/docs/editor/versioncontrol) or git commands (probably `git checkout -b my-new-feature`)
3. Make your changes. If the local server is running, your changes will generally immediately update the server, except for:
    - Adding or removing entire endpoints or functions
    - Changing the database seed data
    - Resetting the database
    - Making changes in the shared folder (see the instructions there)
See the other sections in this README for more details on where you might want to make changes.
4. Check your changes work as expected, and ideally write some unit tests for them. Use the command `npm test` to run the tests.
5. Commit your changes, and push the branch. Raise a merge request and get someone to review it. If you've paired on a piece of work, you should still review the changes you've made but it's fine to merge if you are both happy. Iterate until you and your reviewer are comfortable and understand all your changes.
6. Merge once the CI pipeline passes.

Tips:
- If you break the server in a weird way, sometimes DynamoDB will keep running in the background. This usually results in the error `Exception in thread "main" java.io.IOException: Failed to bind to 0.0.0.0/0.0.0.0:8004`. To stop it use the command `killall java` (NB: this will also kill any other java processes on your system which may or may not be fine depending on what you've got going on)

## 📁 File structure

(in rough order of what is more likely to be useful to you)

- `src`: The bulk of the source code - you probably want to work in here most of the time
  - `api`: Code for endpoints on the HTTP API. The file system structure represents the path and method used for the endpoint, e.g. `src/api/admin/fundraisers/get.ts` represents the handler when for the route `GET /admin/fundraisers`. See the request handling section for more details about writing API endpoints.
  - `env`: Environment configuration, named `{environment}.ts` (e.g. `local.ts`). For security reasons, configuration for the dev and prod environments should not be checked into the repository. When running or deploying the server, the environment config will be copied to a file `env.ts` which is actually used - this will be overwritten so do not edit this file directly!
  - `scheduler`: Code for scheduled functions. Generally this should not contain lots of logic, and should instead make calls to the API which handle more of the logic. This is so we get the nice things we are used to with the API middleware e.g. schema checks and audit logging.
  - `helpers`: Helper functions and types that support the rest of the codebase
- `local`: Devtools and database seed files
  - `table_*.json`: Seed file for database. When running locally, the relevant database table is prepopulated with this data so you have something to work with. The data is reset to this each time the local database is restarted.
- `serverless.ts`: Defines infrastructure and settings for the [serverless](https://www.serverless.com/framework/docs) framework and related plugins
- `package.json`: Defines depenedencies to use, and npm commands ([more info](https://docs.npmjs.com/cli/v7/configuring-npm/package-json))
- `package-lock.json`: Edited automatically by NPM, specifies exact versions of dependencies based on `package.json` ([more info](https://docs.npmjs.com/cli/v7/configuring-npm/package-lock-json))
- `.eslintrc`: Configuration for [ESLint](https://eslint.org/), the linter that prevents some bad coding practices and enforces consistent code formatting
- `.github`: Defines GitHub configuration, most importantly CI and CD pipelines ([more info](https://docs.github.com/en/actions/automating-builds-and-tests/about-continuous-integration))
- `.gitignore`: Defines what files git should ignore ([more info](https://git-scm.com/docs/gitignore))
- `.gitpod.yml`: Defines Gitpod configuration ([more info](https://www.gitpod.io/docs/references/gitpod-yml))#
- `webpack.config.js`: Defines [webpack](https://webpack.js.org/) settings (related to [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack)) for bundling up our code before running or deploying it
- `.vscode`: Configuration files for improving the code editing experience in [VS Code](https://code.visualstudio.com/docs/getstarted/settings)

## 📦 Concepts

- fundraiser: A top-level object that represents an individual donations push. Generally corresponds to a chapter in a specific year e.g. 'Raise Demo 2021'. Has zero or more donations.
- donation: A donation by a specific donor, e.g. 'Donation from John Doe'. Associated with a fundraiser. Has zero or more payments.
- payment: A payment in relation to a specific donation e.g. 'John Doe's 3rd weekly recurring payment of £9'. Associated with a donation.
- admin: Anyone or anything that can be issued a JWT, including members of the national team, local teams and the scheduler
- user: Anyone or anything that interacts with the Raise server, including admins and members of the public

## 🧅 Request handling

Our HTTP API is hosted on [AWS API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html). This [delegates](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html) to [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html), which recieves a payload of a certain form from API Gateway.

We use a library called [middy](https://github.com/middyjs/middy) to transform this request into something more useful and do appropriate checks (e.g. JWT authentication, schema validation, parsing JSON) before passing it to the actual handler. Middy implements a onion-like middleware pattern, which we register middlewares to.

In general, you don't need to worry about the inner workings of this. However, you should know that:
- You should wrap any API handlers in `middify` to attach the relevant middleware (see existing endpoints for examples)
- Middy will ensure the body you are receiving satisfies the requestSchema, and that the body you are returning satisfies the responseSchema. These schemas should be [JSON Schemas](https://json-schema.org/), probably defined in `src/helpers/schemas.ts`. To generate the corresponding TypeScript types for these JSON schemas (helpful for use in TypeScript code) you should run `npm run schemas` which will update the `src/helpers/schemaTypes.ts` file. You should keep the two files in sync by running this whenever the schemas change.
- If the requiresAuth parameter is set to true, middy will perform authentication. This ensures the caller has provided a valid access token. However, this does not perform authorisation, i.e. checking whether the caller should be able to use the endpoint. You need to implement this yourself, maybe using the helper method `assertHasGroup`.
- Your handler will be passed an event object - you can use the TypeScript types to explore what's attached to it, but briefly the key things you'll want are:
  - `event.body`: the parsed request sent to the endpoint
  - `event.pathParameters`: the path parameters (e.g. for `PATCH /admin/fundraisers/ABCD` you'd get `{ fundraiserId: "ABCD" }`)
  - `event.auth`: authentication details
- You should create and throw detailed errors with the `createHttpError` from the `http-errors` package, e.g. `throw new createHttpError.BadRequest("You cannot change the donationAmount on a card payment")`

## 💳 Payments

We use Stripe to process payments.

The one-off donation flow is:
1. The front-end sends a request to `POST /public/fundraisers/{fundraiserId}/donation` to create a Stripe payment intent and a donation with a pending payment. We return the client id for this payment intent.
2. The front-end uses this client id for the payment intent to set up a and confirm a card payment.
3. Stripe sends us a `payment_intent.succeeded` webhook, confirming their payment to `POST /stripe/webhook`. We validate and cross-reference the details with our records and mark their payment as paid if everything looks good. We allocate match funding, and update the amounts on their donation and the fundraiser.

The recurring donation flow is:
1. The front-end sends a request to `POST /public/fundraisers/{fundraiserId}/donation` to create a Stripe payment intent and a donation with a pending payment. We tell Stripe we want to save this card for use in the future. We return the client id for this payment intent.
2. The front-end uses this client id for the payment intent to set up a and confirm a card payment, and to set up their card for future use.
3. Stripe sends us a `payment_intent.succeeded` webhook, confirming their payment to `POST /stripe/webhook`. We validate and cross-reference the details with our records and mark their payment as paid if everything looks good. We allocate match funding, and update the amounts on their donation and the fundraiser. We create a Stripe customer and save their payment method to this customer for future usage. We store the customer and payment method ids on the donation.
4. Later on (e.g. weekly), a scheduled function runs which calls the `POST /scheduler/collect-payments` endpoint. This endpoint makes all the card payments due by creating payment intents with the customer and payment method id for immediate confirmation. If a payment fails, it will be retried later unless marked as cancelled by an admin.

## 🗃 Database

The database we use is [AWS DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html). It is a managed NoSQL database that helps us:
- minimize database maintenance
- minimize costs
- integrate well with AWS Lambda and AWS IAM

While we don't have a lot of concepts from a SQL database, for simplicity and maintainability we have mapped each entity to its own table and enforce a strict schema.

Tables are defined in `src/helpers/tables.ts` which then influences the `serverless.ts` file. Helper functions to access and modify the data are provided in `src/helpers/db.ts` - you should strongly avoid writing custom database logic elsewhere.

We use condition expressions and transactions liberally to ensure the integrity of our data and prevent concurrency-related errors. Note that because multiple functions may be editing the same item and reads are only eventually consistent by default, we need to be extra vigilant about concurrency bugs.

## 🕵 Security, governance and auditing

If you think you have found a security issue, no matter how serious or whether you caused it, please immediately report it to the national team's tech person. If you're unsure whether something is a security problem, please report it.

### 🔒 JWT authentication and authorization

Where enabled, the API uses [JWTs](https://jwt.io/introduction) for authentication and authorization. Our implementation of this uses public/private key cryptography: when users login we issue them an access token which is a JWT signed with our private key. When they access resources, we check the access token they provide was signed correctly with our private key, by using our public key. We can also embed information like their email and groups to make decisions about what they should be able to access.

In general:
- the national team is granted access to everything
- local teams are granted access to everything under their fundraisers
- admins can see all fundraisers, but not the donations or payments under those fundraisers

### ✅ Checks

To ensure data integrity, API operations must conduct checks to ensure what users are requesting is sensible.

Any code changes to the server must be peer-reviewed to ensure the code is correct and free of security defects. Additionally, we use unit tests to ensure our code does what we expect/want it to.

Any (human) admins using must be given appropriate training in the correct usage of the system as well as information security training before being given access to the production system.

### 👀 Auditing

To review incidents and put things right if there is a problem, we store basic logs of API requests. For deeper investigations, we also store audit logs which monitor for suspicious activity (e.g. failed logins) and all database edits.

In production, we also store comprehensive database backups to ensure we can examine or roll back to a previous state in case of a problem.

## 🏗 Infrastructure

The server is hosted on Amazon Web Services (AWS). This is a cloud platform provided by Amazon that allows the server to scale to meet demand, minimizes the burden of running our own servers, and allows us to save on costs when there is no traffic.

The primary computation platform we use is AWS Lambda. This is what actually runs the code in the functions.

We store data in AWS DynamoDB, a managed NoSQL database. More details can be found in the database section.

Our HTTP API is served by AWS API Gateway, which then forwards on the requests to AWS Lambda for us.

Scheduled events are triggered by AWS CloudWatch.

We manage permissions between the different AWS services with AWS IAM (e.g. to allow the Lambda functions to talk to the DynamoDB database).

We use the Serverless framework to manage all this infrastructure, which users AWS CloudFormation under the hood. We define the configuration for the framework (and therefore the AWS resources we want) in `serverless.ts`.

Serverless also comes with plugins that help us:
- `serverless-webpack`: Allows us to use webpack to bundle up our code in the way AWS Lambda expects before running or deploying it
- `serverless-offline`: Allows us to mock many AWS services (Lambda, API Gateway, CloudWatch) locally so we can run the server ourselves
- `serverless-dynamodb-local`: Allows us to mock AWS DynamoDB locally so we can run the server ourselves

## 👷 CI

We have CI pipelines that run in GitHub Actions. These check that our TypeScript compiles correctly, our code abides by lint rules and our tests pass. These checks are important, and we should only merge in branches when the pipeline succeeds. If the master branch has a failing pipeline, this should be investigated and fixed with high priority.

On the master branch, our CI pipeline deploys our changes to the dev environment in AWS.