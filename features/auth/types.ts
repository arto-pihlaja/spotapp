export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string; role: string };
}
