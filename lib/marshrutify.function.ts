import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  _: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return Promise.resolve<APIGatewayProxyResult>({
    body: "Hello from Lambda!",
    statusCode: 200,
  });
};
