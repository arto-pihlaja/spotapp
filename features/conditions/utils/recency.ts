export type RecencyTier = 'fresh' | 'recent' | 'stale' | 'old';

interface RecencyInfo {
  tier: RecencyTier;
  color: string;
  label: string;
  accessibilityLabel: string;
  minutesAgo: number;
}

const THRESHOLDS = {
  fresh: 30,    // <30 minutes
  recent: 90,   // 30-90 minutes
  stale: 180,   // 90min-3h
} as const;

const COLORS: Record<RecencyTier, string> = {
  fresh: '#10B981',   // green
  recent: '#FBBF24',  // yellow
  stale: '#F97316',   // orange
  old: '#9CA3AF',     // grey
};

function getTier(minutesAgo: number): RecencyTier {
  if (minutesAgo < THRESHOLDS.fresh) return 'fresh';
  if (minutesAgo < THRESHOLDS.recent) return 'recent';
  if (minutesAgo < THRESHOLDS.stale) return 'stale';
  return 'old';
}

function formatRelativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${Math.floor(minutesAgo)}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function formatAccessibilityTime(minutesAgo: number): string {
  if (minutesAgo < 1) return 'reported just now';
  if (minutesAgo < 60) return `reported ${Math.floor(minutesAgo)} minutes ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `reported ${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `reported ${days} day${days > 1 ? 's' : ''} ago`;
}

export function getRecencyInfo(createdAt: string): RecencyInfo {
  const minutesAgo = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  const tier = getTier(minutesAgo);

  return {
    tier,
    color: COLORS[tier],
    label: formatRelativeTime(minutesAgo),
    accessibilityLabel: formatAccessibilityTime(minutesAgo),
    minutesAgo,
  };
}

export function getRecencyColor(createdAt: string): string {
  const minutesAgo = (Date.now() - new Date(createdAt).getTime()) / 60_000;
  return COLORS[getTier(minutesAgo)];
}
