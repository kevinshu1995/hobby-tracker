import { db } from "../db/db";
import { Goal, GoalPeriod, GoalType } from "../types";
import { BaseService } from "./BaseService";

/**
 * 目標資料存取服務
 * 提供對 Goal 資料的存取與管理功能
 */
export class GoalService extends BaseService<Goal, string> {
  constructor() {
    super(db.goals);
  }

  /**
   * 依照興趣 ID 取得目標列表
   * @param hobbyId 興趣項目 ID
   */
  async getByHobbyId(hobbyId: string): Promise<Goal[]> {
    return await this.table.where("hobbyId").equals(hobbyId).toArray();
  }

  /**
   * 依照目標類型取得目標列表
   * @param type 目標類型
   */
  async getByType(type: GoalType): Promise<Goal[]> {
    return await this.table.where("type").equals(type).toArray();
  }

  /**
   * 依照目標週期取得目標列表
   * @param period 目標週期
   */
  async getByPeriod(period: GoalPeriod): Promise<Goal[]> {
    return await this.table.where("period").equals(period).toArray();
  }

  /**
   * 依照創建時間排序取得所有目標
   */
  async getSortedByCreatedAt(): Promise<Goal[]> {
    return await this.table.orderBy("createdAt").toArray();
  }

  /**
   * 檢查是否有關聯的進度記錄
   * @param goalId 目標 ID
   */
  async hasRelatedProgress(goalId: string): Promise<boolean> {
    const count = await db.progress.where("goalId").equals(goalId).count();
    return count > 0;
  }

  /**
   * 安全刪除目標（檢查是否有關聯進度記錄）
   * @param goalId 目標 ID
   */
  async safeDelete(
    goalId: string
  ): Promise<{ success: boolean; message?: string }> {
    const hasRelated = await this.hasRelatedProgress(goalId);
    if (hasRelated) {
      return {
        success: false,
        message: "刪除此目標將同時刪除所有相關的進度記錄。確定要繼續嗎？",
      };
    }

    await this.delete(goalId);
    return { success: true };
  }

  /**
   * 計算目標完成度
   * @param goalId 目標 ID
   */
  async calculateCompletion(goalId: string): Promise<number> {
    const goal = await this.getById(goalId);
    if (!goal) return 0;

    // 取得所有相關進度記錄
    const progressRecords = await db.progress
      .where("goalId")
      .equals(goalId)
      .toArray();

    if (progressRecords.length === 0) return 0;

    // 根據目標類型計算完成度
    switch (goal.type) {
      case "count": {
        // 次數型目標計算次數總和與目標值的比例
        const totalCount = progressRecords.reduce(
          (sum, record) => sum + record.value,
          0
        );
        return Math.min(totalCount / goal.targetValue, 1);
      }
      case "quantity": {
        // 量化型目標計算累計數值與目標值的比例
        const totalQuantity = progressRecords.reduce(
          (sum, record) => sum + record.value,
          0
        );
        return Math.min(totalQuantity / goal.targetValue, 1);
      }
      case "composite": {
        // 複合型目標需要同時考慮次數和時間
        const totalTime = progressRecords.reduce(
          (sum, record) => sum + (record.duration || 0),
          0
        );
        const requiredTime = goal.timeRequirement || 1; // 預設為 1 分鐘，避免除以 0

        // 計算次數和時間的達成度，取較低者
        const countCompletion = Math.min(
          progressRecords.length / goal.targetValue,
          1
        );
        const timeCompletion = Math.min(totalTime / requiredTime, 1);

        return Math.min(countCompletion, timeCompletion);
      }
      default:
        return 0;
    }
  }
}

// 創建單例實例以供全局使用
export const goalService = new GoalService();
