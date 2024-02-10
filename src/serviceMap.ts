import { TelegramClientService } from "./client/telegram/service";
import { MarshrutochkaService } from "./service/MarshrutochkaService";
import { DynamoDBUserService } from "./service/dynamoDBUserService";
import { StepFunctionsMonitorService } from "./service/stepFunctionsMonitorService";
import {
  GetBusProviderServiceFn,
  GetClientServiceFn,
  GetMonitorServiceFn,
  GetUserServiceFn,
} from "./service/types";

const getClientService: GetClientServiceFn = () => new TelegramClientService();
const getUserService: GetUserServiceFn = (userId) =>
  new DynamoDBUserService(userId);
const getBusProviderService: GetBusProviderServiceFn = (busProvider) => {
  if (busProvider === "MARSHRUTOCHKA") {
    return new MarshrutochkaService();
  }

  return new MarshrutochkaService();
};
const getMonitorService: GetMonitorServiceFn = () =>
  new StepFunctionsMonitorService();

export {
  getClientService,
  getUserService,
  getBusProviderService,
  getMonitorService,
};
