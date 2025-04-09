import { db } from "../db/db";
import { Hobby } from "../types";
import { BaseService } from "./BaseService";
import { goalService } from "./GoalService";

/**
 * 興趣項目資料存取服務
 * 提供對 Hobby 資料的存取與管理功能
 */
export class HobbyService extends BaseService<Hobby, string> {
  constructor() {
    super(db.hobbies);
  }

  /**
   * 依照分類 ID 取得興趣項目列表
   * @param categoryId 分類 ID
   */
  async getByCategoryId(categoryId: string): Promise<Hobby[]> {
    return this.executeDbOperation(
      () => this.table.where("categoryId").equals(categoryId).toArray(),
      `取得分類 ID 為 ${categoryId} 的興趣項目列表失敗`
    );
  }

  /**
   * 依照名稱搜尋興趣項目
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Hobby[]> {
    return this.executeDbOperation(
      () =>
        this.table
          .filter((hobby) =>
            hobby.name.toLowerCase().includes(keyword.toLowerCase())
          )
          .toArray(),
      `搜尋包含關鍵字 "${keyword}" 的興趣項目失敗`
    );
  }

  /**
   * 依照創建時間排序取得所有興趣項目
   */
  async getSortedByCreatedAt(): Promise<Hobby[]> {
    return this.executeDbOperation(
      () => this.table.orderBy("createdAt").toArray(),
      "依創建時間排序取得興趣項目列表失敗"
    );
  }

  /**
   * 檢查是否有關聯的目標
   * @param hobbyId 興趣項目 ID
   */
  async hasRelatedGoals(hobbyId: string): Promise<boolean> {
    return this.executeDbOperation(
      () =>
        db.goals
          .where("hobbyId")
          .equals(hobbyId)
          .count()
          .then((count) => count > 0),
      `檢查興趣項目 ID 為 ${hobbyId} 的相關目標失敗`
    );
  }

  /**
   * 安全刪除興趣項目（檢查是否有關聯目標）
   * @param hobbyId 興趣項目 ID
   */
  async safeDelete(
    hobbyId: string
  ): Promise<{ success: boolean; message?: string; confirmAction?: string }> {
    try {
      const hasRelated = await this.hasRelatedGoals(hobbyId);
      if (hasRelated) {
        return {
          success: false,
          message:
            "刪除此興趣項目將同時刪除所有相關的目標及進度記錄。確定要繼續嗎？",
          confirmAction: "deleteWithRelated",
        };
      }

      await this.delete(hobbyId);
      return { success: true };
    } catch (error) {
      console.error(`安全刪除興趣項目 ID 為 ${hobbyId} 失敗:`, error);
      return {
        success: false,
        message: `刪除失敗: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 使用事務刪除興趣項目及其所有相關目標和進度記錄
   * @param hobbyId 興趣項目 ID
   */
  async deleteWithRelated(hobbyId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction(
        "rw",
        [db.hobbies, db.goals, db.progress],
        async () => {
          // 先取得所有相關的目標
          const relatedGoals = await db.goals
            .where("hobbyId")
            .equals(hobbyId)
            .toArray();

          // 刪除所有相關的進度記錄
          for (const goal of relatedGoals) {
            await db.progress.where("goalId").equals(goal.id).delete();
          }

          // 刪除所有相關的目標
          await db.goals.where("hobbyId").equals(hobbyId).delete();

          // 最後刪除興趣項目本身
          await db.hobbies.delete(hobbyId);
        }
      );
    }, `刪除興趣項目 ID 為 ${hobbyId} 及其相關目標和進度記錄失敗`);
  }

  /**
   * 使用事務批次更新興趣項目
   * @param hobbies 要更新的興趣項目陣列
   */
  async bulkUpdateWithTransaction(hobbies: Hobby[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.hobbies, async () => {
        for (const hobby of hobbies) {
          await db.hobbies.update(hobby.id, hobby);
        }
      });
    }, "批次更新興趣項目失敗");
  }

  /**
   * 批次創建興趣項目
   * @param hobbies 要創建的興趣項目陣列
   */
  async bulkCreateWithTransaction(
    hobbies: Omit<Hobby, "id">[]
  ): Promise<string[]> {
    return this.executeDbOperation(async () => {
      const ids: string[] = [];

      await db.transaction("rw", db.hobbies, async () => {
        for (const hobby of hobbies) {
          const id = crypto.randomUUID();
          const newHobby = {
            ...hobby,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Hobby;

          await db.hobbies.add(newHobby);
          ids.push(id);
        }
      });

      return ids;
    }, "批次創建興趣項目失敗");
  }
}

// 創建單例實例以供全局使用
export const hobbyService = new HobbyService();
