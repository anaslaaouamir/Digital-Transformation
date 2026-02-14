import api from "./axios";
import { LoginRequest, LoginResponse } from "@/types/auth.types";

export const loginApi = (data: LoginRequest) =>
  api.post<LoginResponse>("/auth/login", data);
