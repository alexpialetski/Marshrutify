import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { MarshrutifyStack } from "./marshrutify-stack";

export class MarshrutifyStackStage extends cdk.Stage {
  public readonly primaryStack: MarshrutifyStack;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    this.primaryStack = new MarshrutifyStack(this, "MarshrutifyStack");
  }
}
