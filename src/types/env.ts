export type ENVVariable =
  | "AWS_REGION"
  | "MONITOR_TABLE_NAME"
  | "MONITOR_TABLE_GSI_NAME"
  | "STATE_MACHINE_ARN"
  | "TELEGRAM_BOT_TOKEN_SECRET_ID"
  | "TELEGRAM_BOT_PATH"
  | "USER_TABLE_NAME"
  | "MINUTES_BEFORE_MONITOR_UNSUBSCRIPTION";

export type ENVVariableArray<T extends ENVVariable> = T[];

export const getLambdaEnvArray = <T extends ENVVariable>(arr: T[]): T[] => arr;
