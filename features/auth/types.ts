export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string; role: string };
}

export interface UserProfile {
  id: string;
  username: string;
  photoUrl: string | null;
  externalLink: string | null;
  role: string;
  createdAt: string;
  stats: {
    sessionCount: number;
    spotsVisited: number;
  };
}
