import { request } from './client';

export interface AnomalyAlert {
  id: number;
  category: string;
  amount: number;
  expectedAvg: number;
  percentage: number;
  explanation: string;
  isDismissed: boolean;
  createdAt: string;
}

export const anomalyApi = {
  list: () => request<AnomalyAlert[]>('/anomalies'),
  dismiss: (id: number) =>
    request<AnomalyAlert>(`/anomalies/${id}/dismiss`, { method: 'PATCH' }),
};
