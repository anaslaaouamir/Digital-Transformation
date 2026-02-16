import api from "./axios"; // Imports the file above
import { LoginRequest, LoginResponse } from "@/types/auth.types"; // Ensure you have these types

// 3. THIS FUNCTION COMBINES THEM
// "http://localhost:8080/api" + "/auth/login"
export const loginApi = (data: LoginRequest) =>
  api.post<LoginResponse>("/auth/login", data);