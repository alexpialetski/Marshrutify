import { UserInfo } from "../types/user";
import { UserService } from "./userService";

const MEMORY_USER_INFO = new Map<string, UserInfo>();

export class MockedUserService extends UserService {
  constructor(chatId: string) {
    super(chatId);
  }

  getInfo = () => {
    return Promise.resolve(MEMORY_USER_INFO.get(this.userId));
  };

  createUpdateUserInfo = async (userInfo: UserInfo) => {
    const updatedUserInfo: UserInfo = { ...userInfo, id: this.userId };
    MEMORY_USER_INFO.set(this.userId, updatedUserInfo);

    return Promise.resolve(updatedUserInfo);
  };
}
