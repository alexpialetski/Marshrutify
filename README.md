# Marshrutify

Application developed to notify about bus availability on the requested date. Architecture allows to add different bus providers if necessary data can be acquired from the public means.

# Table of contents

1. [Deployment](#deployment)
   1. [CLI](#cli)
   2. [CI/CD](#cicd)
2. [CDK](#cdk)

# Deployment

This project is set up with AWS CDK. If AWS environment (account) is not bootstrapped yet: `cdk bootstrap`

## CLI

CLI setup is needed for:

- AWS cli.
  - [SSO authentication](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html)
- CDK cli
  - [CDK setup](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

## CI/CD

In order for CI/CD to work with this repository **Github access token** should be put in the Secrets Manager in AWS.

Github access token **MarshrutifyCodepipeline** should be <ins>scoped</ins> to this repository and have <ins>minimum set of rights</ins>:

- Commit statuses
- Contents
- Metadata
- Webhooks

Secrets Manager token name is **marshrutify-github-token**.

# CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
