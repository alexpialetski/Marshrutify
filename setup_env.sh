#!/bin/bash

source .env

if  [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$GITHUB_TOKEN" ] || [ -z "$AWS_CLI_PROFILE" ]; then
    echo "VAR is unset or set to the empty string"
    exit 1;
fi

export AWS_DEFAULT_PROFILE="$AWS_CLI_PROFILE"

aws sso login

cdk bootstrap

SECRET_NAME="marshrutify-github-token"
SECRET_VALUE="$GITHUB_TOKEN"

if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
    aws secretsmanager put-secret-value \
        --secret-id "$SECRET_NAME"  \
        --secret-string "$SECRET_VALUE"
    echo "Secret updated: $SECRET_NAME"
else
    aws secretsmanager create-secret \
        --name "$SECRET_NAME"  \
        --description "Marshrutify Github access token." \
        --secret-string "$SECRET_VALUE"
    echo "Secret created: $SECRET_NAME"
fi
