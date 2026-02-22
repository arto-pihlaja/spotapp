export interface ServerToClientEvents {
  'condition:new': (payload: { spotId: string; condition: unknown }) => void;
  'condition:confirmed': (payload: { spotId: string; conditionId: string; confirmCount: number }) => void;
  'session:joined': (payload: { spotId: string; session: unknown }) => void;
  'session:left': (payload: { spotId: string; sessionId: string }) => void;
  'session:expired': (payload: { spotId: string; sessionId: string }) => void;
  'spot:created': (payload: { spot: unknown }) => void;
  'spot:updated': (payload: { spot: unknown }) => void;
}

export interface ClientToServerEvents {
  'spot:join': (spotId: string) => void;
  'spot:leave': (spotId: string) => void;
}
