#!/bin/bash

source .env

if  [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$GITHUB_TOKEN" ] || [ -z "$AWS_CLI_PROFILE" ]; then
    echo "VAR is unset or set to the empty string"
    exit 1;
fi

export AWS_DEFAULT_PROFILE="$AWS_CLI_PROFILE"

aws sso login

cdk bootstrap

declare -A SECRETS
SECRETS=(
    ["marshrutify-project-github-token"]="$GITHUB_TOKEN"
    ["marshrutify-telegram-bot-token"]="$TELEGRAM_BOT_TOKEN"
)

for SECRET_NAME in "${!SECRETS[@]}"; do
    SECRET_VALUE="${SECRETS[$SECRET_NAME]}"

    # Check if secret already exists
    if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" >/dev/null 2>&1; then
        # If secret exists, update it
        aws secretsmanager put-secret-value \
            --secret-id "$SECRET_NAME" \
            --secret-string "$SECRET_VALUE"
        echo "Secret updated: $SECRET_NAME"
    else
        # If secret doesn't exist, create it
        aws secretsmanager create-secret \
            --name "$SECRET_NAME" \
            --description "Secret for $SECRET_NAME." \
            --secret-string "$SECRET_VALUE"
        echo "Secret created: $SECRET_NAME"
    fi
done