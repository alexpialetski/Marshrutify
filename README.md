# Marshrutify

Application developed to notify about bus availability on the requested date. Architecture allows to add different bus providers if necessary data can be acquired from the public means.

# Table of contents

1. [Clients](#clients)
   1. [Telegram](#telegram)
2. [Deployment](#deployment)
   1. [CLI](#cli)
   2. [CI/CD](#cicd)
3. [CDK](#cdk)

# .env file

```bash
TELEGRAM_BOT_TOKEN=
GITHUB_TOKEN=
AWS_CLI_PROFILE=
```

# Setup

This project is hosted on AWS. IaC tool is AWS CDK.

## CLI

CLI setup is needed for:

- AWS cli.
  - [SSO authentication](https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html)
- CDK cli
  - [CDK setup](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html)

## Setup

Github access token **MarshrutifyCodepipeline** should be <ins>scoped</ins> to this repository and have <ins>minimum set of rights</ins>:

- Commit statuses
- Contents
- Metadata
- Webhooks

Run command `npm run setup:env` to set up AWS account

# Clients

## Telegram

### Commands

start - Start
info - View user info and ongoing monitors
setup - Reconfigure user info
monitor - Set monitor to listen for availability of bus seats
stop_monitor - Stop running monitor

# CDK

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
