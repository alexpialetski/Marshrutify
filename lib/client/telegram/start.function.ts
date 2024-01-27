import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(event);

  return Promise.resolve<APIGatewayProxyResult>({
    body: "Hello from Lambda!",
    statusCode: 200,
  });
};
