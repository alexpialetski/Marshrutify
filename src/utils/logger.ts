import pino from "pino";
import { pinoLambdaDestination } from "pino-lambda";

export const logger = pino(
  process.env.NODE_ENV === "development" ? undefined : pinoLambdaDestination()
);
