export type SportType = 'WING_FOIL' | 'WINDSURF' | 'KITE' | 'OTHER';
export type SessionType = 'NOW' | 'PLANNED';

export interface Session {
  id: string;
  spotId: string;
  type: SessionType;
  sportType: SportType;
  scheduledAt: string;
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; username: string };
  isOwn: boolean;
}

export interface SessionCountResponse {
  sessionCount: number;
}

export interface CreateSessionInput {
  type: 'now' | 'planned';
  sportType: SportType;
  scheduledAt?: string;
}

export const SPORT_EMOJI: Record<SportType, string> = {
  WING_FOIL: '\u{1F985}',
  WINDSURF: '\u{1F3C4}',
  KITE: '\u{1FA81}',
  OTHER: '\u{1F30A}',
};

export interface SessionsResult {
  sessions: Session[];
  sessionCount: number;
}

export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'WING_FOIL', label: 'Wing Foil' },
  { value: 'WINDSURF', label: 'Windsurf' },
  { value: 'KITE', label: 'Kite' },
  { value: 'OTHER', label: 'Other' },
];

export const TIME_PRESETS = [
  { label: 'Now', value: 'now' },
  { label: '+1h', value: '+1h' },
  { label: '+2h', value: '+2h' },
  { label: '+3h', value: '+3h' },
] as const;

export type TimePreset = (typeof TIME_PRESETS)[number]['value'];
