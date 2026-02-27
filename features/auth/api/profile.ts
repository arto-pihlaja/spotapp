import { api } from '@/lib/apiClient';
import type { UserProfile } from '../types';

export function fetchUserProfile(userId: string) {
  return api.get<UserProfile>(`/users/${userId}`).then((r) => r.data);
}
