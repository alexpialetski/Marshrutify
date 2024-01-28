import * as cdk from "aws-cdk-lib";
// import { AwsCustomResource } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import path = require("path");

export class TelegramClientStack extends cdk.Stack {
  public readonly urlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const startHandler = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      "handler",
      {
        entry: path.join(__dirname, "start.function.ts"),
        handler: "handler",
      }
    );

    const gateway = new cdk.aws_apigateway.LambdaRestApi(this, "Gateway", {
      description: "Endpoint for a simbple Lambda-powered web service",
      handler: startHandler,
    });

    // new AwsCustomResource(this, 'Custom', {
    //   onUpdate: {
    //     service: '',
    //     action: ''
    //   }
    // })

    this.urlOutput = new cdk.CfnOutput(this, "url", { value: gateway.url });
  }
}
