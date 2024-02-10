import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class MonitorTableConstruct extends Construct {
  public readonly monitorTableGSINameOutput: cdk.CfnOutput;
  public readonly table: cdk.aws_dynamodb.TableV2;

  constructor(scope: Construct, id = "MonitorTable") {
    super(scope, id);

    this.table = new cdk.aws_dynamodb.TableV2(this, "MyTable", {
      partitionKey: {
        name: "id",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    });

    const GSIIndex: cdk.aws_dynamodb.GlobalSecondaryIndexPropsV2 = {
      indexName: "StatusIndex",
      partitionKey: {
        name: "status",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "userId_date",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
    };

    this.table.addGlobalSecondaryIndex(GSIIndex);

    this.monitorTableGSINameOutput = new cdk.CfnOutput(
      this,
      "MonitorTableGSINameOutput",
      {
        value: GSIIndex.indexName,
      }
    );
  }
}
