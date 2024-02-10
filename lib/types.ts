import { ENVVariable } from "~/types/env";

// AWS_REGION is set by lambda runtime
export type LambdaEnvVariable = Exclude<ENVVariable, "AWS_REGION">;
