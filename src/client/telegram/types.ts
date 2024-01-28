import { BusProviderService } from "../../service/busProviderService";
import { ClientService } from "../../service/clientService";
import { MonitorService } from "../../service/monitorService";
import { UserService } from "../../service/userService";
import { BusProvider } from "../../types/busProvider";
import { Client } from "../../types/client";

export type GetUserServiceFn = (userId: string) => UserService;

export type GetClientServiceFn = (clientName: Client) => ClientService;

export type GetMonitorServiceFn = () => MonitorService;

export type GetBusProviderServiceFn = (
  busProvider: BusProvider
) => BusProviderService;

export type ServiceMap = {
  getUserService: GetUserServiceFn;
  getBusProviderService: GetBusProviderServiceFn;
  getClientService: GetClientServiceFn;
  getMonitorService: GetMonitorServiceFn;
};
