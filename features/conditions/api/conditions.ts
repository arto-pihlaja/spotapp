import { api } from '@/lib/apiClient';
import type { ConditionReport, CreateConditionInput } from '../types';

export async function fetchConditions(spotId: string): Promise<ConditionReport[]> {
  const res = await api.get<ConditionReport[]>(`/spots/${spotId}/conditions`);
  return res.data;
}

export async function submitCondition(
  spotId: string,
  input: CreateConditionInput,
): Promise<ConditionReport> {
  const res = await api.post<ConditionReport>(`/spots/${spotId}/conditions`, input);
  return res.data;
}

export async function confirmCondition(
  spotId: string,
  conditionId: string,
): Promise<{ conditionId: string; confirmCount: number }> {
  const res = await api.post<{ conditionId: string; confirmCount: number }>(
    `/spots/${spotId}/conditions/${conditionId}/confirm`,
    {},
  );
  return res.data;
}
