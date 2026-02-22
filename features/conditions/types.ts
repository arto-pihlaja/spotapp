const CARDINAL_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type CardinalDirection = (typeof CARDINAL_LABELS)[number];

/** Convert a wind angle (0-355) to the nearest cardinal direction label. */
export function getCardinalLabel(degrees: number): CardinalDirection {
  const index = Math.round(((degrees % 360 + 360) % 360) / 45) % 8;
  return CARDINAL_LABELS[index];
}

export interface ConditionReport {
  id: string;
  spotId: string;
  waveHeight: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  createdAt: string;
  confirmCount: number;
  hasConfirmed?: boolean;
  reporter?: { id: string; username: string };
}

export interface CreateConditionInput {
  waveHeight?: number;
  windSpeed?: number;
  windDirection?: number;
}
