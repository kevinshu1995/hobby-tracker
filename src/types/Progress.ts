export interface Progress {
  id: string;
  goalId: string;
  recordedAt: Date;
  value: number;
  duration?: number; // 分鐘，僅用於複合型目標
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
