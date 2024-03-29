import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { MarshrutifyStack } from "./marshrutify.stack";

class MarshrutifyStackStage extends cdk.Stage {
  public readonly stack: MarshrutifyStack;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    this.stack = new MarshrutifyStack(this, "Marshrutify");
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new cdk.pipelines.CodePipeline(this, "Pipeline", {
      synth: new cdk.pipelines.ShellStep("Synth", {
        input: cdk.pipelines.CodePipelineSource.gitHub(
          "alexpialetski/Marshrutify",
          "main",
          {
            authentication: cdk.SecretValue.secretsManager(
              "marshrutify-project-github-token"
            ),
          }
        ),
        commands: ["npm ci", "npm run build", "npm run test", "npx cdk synth"],
      }),
    });

    const prod = new MarshrutifyStackStage(this, "Prod");

    pipeline.addStage(prod, {
      stackSteps: [
        {
          stack: prod.stack,
          changeSet: [
            new cdk.pipelines.ManualApprovalStep("ChangeSet Approval"),
          ],
          // post: [
          //   new cdk.pipelines.ShellStep("Integration tests", {
          //     envFromCfnOutputs: {
          //       URL: prod.stack.urlOutput,
          //     },
          //     commands: ["curl -Ssf $URL"], // TODO use actual integration tests
          //   }),
          // ],
        },
      ],
    });
  }
}
