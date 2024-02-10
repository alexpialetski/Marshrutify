import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class UserTableConstruct extends Construct {
  public readonly table: cdk.aws_dynamodb.TableV2;

  constructor(scope: Construct, id = "UserTable") {
    super(scope, id);

    this.table = new cdk.aws_dynamodb.TableV2(this, "Table", {
      partitionKey: { name: "id", type: cdk.aws_dynamodb.AttributeType.STRING },
    });

    new cdk.CfnOutput(this, "UserTableNameOutput", {
      value: this.table.tableName,
    });
  }
}
