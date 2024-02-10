import { UserInfo } from "~/types/user";

export abstract class UserService {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  abstract getInfo: () => Promise<UserInfo | undefined>;

  abstract createUpdateUserInfo: (userInfo: UserInfo) => Promise<UserInfo>;
}
