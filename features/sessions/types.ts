export type SportType = 'WING_FOIL' | 'WINDSURF' | 'KITE' | 'PUMPFOIL' | 'SUP' | 'SURF' | 'EFOIL' | 'OTHER';
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
  PUMPFOIL: '\u{1F42C}',
  SUP: '\u{1F6A3}',
  SURF: '\u{1F3C4}',
  EFOIL: '\u{26A1}',
  OTHER: '\u{1F30A}',
};

export interface SessionsResult {
  sessions: Session[];
  sessionCount: number;
}

export const PRIMARY_SPORTS: { value: SportType; label: string }[] = [
  { value: 'WING_FOIL', label: 'Wing Foil' },
  { value: 'WINDSURF', label: 'Windsurf' },
  { value: 'KITE', label: 'Kite' },
];

export const MORE_SPORTS: { value: SportType; label: string }[] = [
  { value: 'PUMPFOIL', label: 'Pumpfoil' },
  { value: 'SUP', label: 'SUP' },
  { value: 'SURF', label: 'Surf' },
  { value: 'EFOIL', label: 'eFoil' },
];

/** @deprecated Use PRIMARY_SPORTS and MORE_SPORTS instead */
export const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  ...PRIMARY_SPORTS,
  ...MORE_SPORTS,
  { value: 'OTHER', label: 'Other' },
];

export const TIME_PRESETS = [
  { label: 'Now', value: 'now' },
  { label: '+1h', value: '+1h' },
  { label: '+2h', value: '+2h' },
  { label: '+3h', value: '+3h' },
  { label: 'Custom', value: 'custom' },
] as const;

export type TimePreset = (typeof TIME_PRESETS)[number]['value'];
