import { useQuery } from '@tanstack/react-query';
import { fetchAuditLogs } from '../api/admin';
import type { AuditAction } from '../types';

export function useAuditLogs(params: { page?: number; limit?: number; action?: AuditAction } = {}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 30_000,
  });
}
