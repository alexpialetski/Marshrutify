import { BusProvider } from "./busProvider";
import { DestinationInfo } from "./path";

export type PartialUserInfo = {
  id: string;
  busProvider: BusProvider;
  from?: DestinationInfo;
  to?: DestinationInfo;
};

export type FullUserInfo = Required<PartialUserInfo>;

export type UserInfo = PartialUserInfo | FullUserInfo;

export const isFullUserInfo = (userInfo?: UserInfo): userInfo is FullUserInfo =>
  Boolean(userInfo && userInfo.from && userInfo.to);
