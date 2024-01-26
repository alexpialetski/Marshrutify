import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");

export class MarshrutifyStack extends cdk.Stack {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const handler = new cdk.aws_lambda_nodejs.NodejsFunction(this, "handler", {
      entry: path.join(__dirname, "marshrutify.function.ts"),
      handler: "handler",
    });

    const gateway = new cdk.aws_apigateway.LambdaRestApi(this, "Gateway", {
      description: "Endpoint for a simbple Lambda-powered web service",
      handler,
    });

    this.urlOutput = new cdk.CfnOutput(this, "url", { value: gateway.url });
  }
}
