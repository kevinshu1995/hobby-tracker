import { db } from "../db/db";
import { Goal, GoalPeriod, GoalType } from "../types";
import { BaseService } from "./BaseService";

/**
 * 目標資料存取服務
 * 提供對 Goal 資料的存取與管理功能
 */
export class GoalService extends BaseService<Goal, string> {
  // 快取管理
  private completionCache: Map<string, { value: number; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 60000; // 60秒快取時間

  constructor() {
    super(db.goals);
  }

  /**
   * 依照興趣 ID 取得目標列表
   * @param hobbyId 興趣項目 ID
   */
  async getByHobbyId(hobbyId: string): Promise<Goal[]> {
    return this.executeDbOperation(
      () => this.table.where("hobbyId").equals(hobbyId).toArray(),
      `取得興趣 ID 為 ${hobbyId} 的目標列表失敗`
    );
  }

  /**
   * 依照目標類型取得目標列表
   * @param type 目標類型
   */
  async getByType(type: GoalType): Promise<Goal[]> {
    return this.executeDbOperation(
      () => this.table.where("type").equals(type).toArray(),
      `取得類型為 ${type} 的目標列表失敗`
    );
  }

  /**
   * 依照目標週期取得目標列表
   * @param period 目標週期
   */
  async getByPeriod(period: GoalPeriod): Promise<Goal[]> {
    return this.executeDbOperation(
      () => this.table.where("period").equals(period).toArray(),
      `取得週期為 ${period} 的目標列表失敗`
    );
  }

  /**
   * 依照創建時間排序取得所有目標
   */
  async getSortedByCreatedAt(): Promise<Goal[]> {
    return this.executeDbOperation(
      () => this.table.orderBy("createdAt").toArray(),
      "依創建時間排序取得目標列表失敗"
    );
  }

  /**
   * 檢查是否有關聯的進度記錄
   * @param goalId 目標 ID
   */
  async hasRelatedProgress(goalId: string): Promise<boolean> {
    return this.executeDbOperation(
      () =>
        db.progress
          .where("goalId")
          .equals(goalId)
          .count()
          .then((count) => count > 0),
      `檢查目標 ID 為 ${goalId} 的相關進度記錄失敗`
    );
  }

  /**
   * 安全刪除目標（檢查是否有關聯進度記錄）
   * @param goalId 目標 ID
   */
  async safeDelete(
    goalId: string
  ): Promise<{ success: boolean; message?: string; confirmAction?: string }> {
    try {
      const hasRelated = await this.hasRelatedProgress(goalId);
      if (hasRelated) {
        return {
          success: false,
          message: "刪除此目標將同時刪除所有相關的進度記錄。確定要繼續嗎？",
          confirmAction: "deleteWithRelated", // 加入確認動作代碼
        };
      }

      await this.delete(goalId);
      return { success: true };
    } catch (error) {
      console.error(`安全刪除目標 ID 為 ${goalId} 失敗:`, error);
      return {
        success: false,
        message: `刪除失敗: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 使用事務刪除目標及其所有相關進度記錄
   * @param goalId 目標 ID
   */
  async deleteWithRelated(goalId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", [db.goals, db.progress], async () => {
        // 先刪除相關的進度記錄
        await db.progress.where("goalId").equals(goalId).delete();
        // 再刪除目標本身
        await db.goals.delete(goalId);
        // 清除快取
        this.completionCache.delete(goalId);
      });
    }, `刪除目標 ID 為 ${goalId} 及其相關進度記錄失敗`);
  }

  /**
   * 計算目標完成度 (含快取機制)
   * @param goalId 目標 ID
   */
  async calculateCompletion(goalId: string): Promise<number> {
    // 檢查快取
    const now = Date.now();
    const cached = this.completionCache.get(goalId);
    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.value;
    }

    return this.executeDbOperation(async () => {
      const goal = await this.getById(goalId);
      if (!goal) return 0;

      // 取得所有相關進度記錄
      const progressRecords = await db.progress
        .where("goalId")
        .equals(goalId)
        .toArray();

      if (progressRecords.length === 0) return 0;

      // 根據目標類型計算完成度
      let result = 0;

      switch (goal.type) {
        case "count": {
          // 次數型目標計算次數總和與目標值的比例
          const totalCount = progressRecords.reduce(
            (sum, record) => sum + record.value,
            0
          );
          result = Math.min(totalCount / goal.targetValue, 1);
          break;
        }
        case "quantity": {
          // 量化型目標計算累計數值與目標值的比例
          const totalQuantity = progressRecords.reduce(
            (sum, record) => sum + record.value,
            0
          );
          result = Math.min(totalQuantity / goal.targetValue, 1);
          break;
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

          result = Math.min(countCompletion, timeCompletion);
          break;
        }
      }

      // 更新快取
      this.completionCache.set(goalId, { value: result, timestamp: now });

      return result;
    }, `計算目標 ID 為 ${goalId} 的完成度失敗`);
  }

  /**
   * 使用事務批次更新目標
   * @param goals 要更新的目標陣列
   */
  async bulkUpdateWithTransaction(goals: Goal[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.goals, async () => {
        for (const goal of goals) {
          await db.goals.update(goal.id, goal);
        }
      });
    }, "批次更新目標失敗");
  }

  /**
   * 清除計算快取
   * @param goalId 可選，若提供則只清除該目標的快取
   */
  clearCompletionCache(goalId?: string): void {
    if (goalId) {
      this.completionCache.delete(goalId);
    } else {
      this.completionCache.clear();
    }
  }
}

// 創建單例實例以供全局使用
export const goalService = new GoalService();
