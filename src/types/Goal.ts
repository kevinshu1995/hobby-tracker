export type GoalType = "count" | "quantity" | "composite";
export type GoalPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface CustomPeriodConfig {
  frequency: number; // 頻率數量
  unit: "day" | "week" | "month"; // 單位
}

export interface Goal {
  id: string;
  hobbyId: string;
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  targetUnit?: string;
  customPeriod?: CustomPeriodConfig;
  timeRequirement?: number; // 分鐘，僅用於複合型目標
  createdAt: Date;
  updatedAt: Date;
}
