import pino from "pino";
import { pinoLambdaDestination } from "pino-lambda";

export const logger = pino(
  {
    redact: {
      paths: [
        "userId",
        "monitorInfo.userId",
        "monitorEventData.monitorInfo.userId",
      ], // TODO
    },
  },
  process.env.NODE_ENV === "development" ? undefined : pinoLambdaDestination()
);
