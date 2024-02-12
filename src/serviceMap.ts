import { TelegramClientService } from "./client/telegram/service";
import { marshrutochkaService } from "./service/busProvider/MarshrutochkaService";
import { DynamoDBUserService } from "./service/userService/dynamoDBUserService";
import { stepFunctionsMonitorService } from "./service/stepFunctionsMonitorService";
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
    return marshrutochkaService;
  }

  return marshrutochkaService;
};
const getMonitorService: GetMonitorServiceFn = () =>
  stepFunctionsMonitorService;

export {
  getClientService,
  getUserService,
  getBusProviderService,
  getMonitorService,
};
