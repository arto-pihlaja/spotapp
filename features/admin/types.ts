export interface UserForModeration {
  id: string;
  username: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  stats: {
    sessionCount: number;
    conditionReportCount: number;
  };
}

export interface BlockUserResponse {
  userId: string;
  username: string;
  isBlocked: boolean;
}

export interface SpotForModeration {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  creator: { username: string };
  hasWiki: boolean;
  sessionCount: number;
  conditionReportCount: number;
}

export interface DeleteSpotResponse {
  spotId: string;
  spotName: string;
}

export interface RevertWikiResponse {
  id: string;
  spotId: string;
  content: string;
  updatedAt: string;
}

export type AuditAction = 'USER_BLOCKED' | 'USER_UNBLOCKED' | 'SPOT_DELETED' | 'WIKI_REVERTED';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  adminUsername: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InvitationCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  createdBy: string;
  creator: { username: string };
}

export interface CreateInvitationCodeInput {
  maxUses: number;
  expiresAt?: string;
}
