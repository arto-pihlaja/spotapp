export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; username: string; role: string };
}

export interface RegisterInput {
  username: string;
  password: string;
  invitationCode: string;
  _hp?: string;
  _ts?: number;
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

export interface MeResponse {
  id: string;
  username: string;
  email: string | null;
  emailVerifiedAt: string | null;
  photoUrl: string | null;
  externalLink: string | null;
  role: string;
  createdAt: string;
}
