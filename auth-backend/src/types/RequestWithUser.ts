import { Request } from "express";
import { RequestUser } from "src/common/interfaces/request-user.interface";

export type RequestWithUser = Request & {user?:RequestUser};