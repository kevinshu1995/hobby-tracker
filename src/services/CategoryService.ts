import { db } from "../db/db";
import { Category } from "../types";
import { BaseService } from "./BaseService";

/**
 * 興趣分類資料存取服務
 * 提供對 Category 資料的存取與管理功能
 */
export class CategoryService extends BaseService<Category, string> {
  constructor() {
    super(db.categories);
  }

  /**
   * 依照創建時間排序取得所有分類
   */
  async getSortedByCreatedAt(): Promise<Category[]> {
    return this.executeDbOperation(
      () => this.table.orderBy("createdAt").toArray(),
      "依創建時間排序取得分類列表失敗"
    );
  }

  /**
   * 依照名稱搜尋分類
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Category[]> {
    return this.executeDbOperation(
      () =>
        this.table
          .filter((category) =>
            category.name.toLowerCase().includes(keyword.toLowerCase())
          )
          .toArray(),
      `搜尋包含關鍵字 "${keyword}" 的分類失敗`
    );
  }

  /**
   * 檢查是否有關聯的興趣項目
   * @param categoryId 分類 ID
   */
  async hasRelatedHobbies(categoryId: string): Promise<boolean> {
    return this.executeDbOperation(
      () =>
        db.hobbies
          .where("categoryId")
          .equals(categoryId)
          .count()
          .then((count) => count > 0),
      `檢查分類 ID 為 ${categoryId} 的相關興趣項目失敗`
    );
  }

  /**
   * 安全刪除分類（檢查是否有關聯項目）
   * @param categoryId 分類 ID
   */
  async safeDelete(
    categoryId: string
  ): Promise<{ success: boolean; message?: string; confirmAction?: string }> {
    try {
      const hasRelated = await this.hasRelatedHobbies(categoryId);
      if (hasRelated) {
        return {
          success: false,
          message:
            "刪除此分類將同時刪除所有相關聯的興趣項目、目標及進度記錄。確定要繼續嗎？",
          confirmAction: "deleteWithRelated",
        };
      }

      await this.delete(categoryId);
      return { success: true };
    } catch (error) {
      console.error(`安全刪除分類 ID 為 ${categoryId} 失敗:`, error);
      return {
        success: false,
        message: `刪除失敗: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 使用事務刪除分類及其所有相關興趣項目、目標和進度記錄
   * @param categoryId 分類 ID
   */
  async deleteWithRelated(categoryId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction(
        "rw",
        [db.categories, db.hobbies, db.goals, db.progress],
        async () => {
          // 1. 取得所有相關的興趣項目
          const relatedHobbies = await db.hobbies
            .where("categoryId")
            .equals(categoryId)
            .toArray();

          // 2. 針對每個興趣項目，刪除其相關的目標和進度
          for (const hobby of relatedHobbies) {
            // 2.1 取得該興趣項目的所有目標
            const relatedGoals = await db.goals
              .where("hobbyId")
              .equals(hobby.id)
              .toArray();

            // 2.2 針對每個目標，刪除其相關的進度記錄
            for (const goal of relatedGoals) {
              await db.progress.where("goalId").equals(goal.id).delete();
            }

            // 2.3 刪除該興趣項目的所有目標
            await db.goals.where("hobbyId").equals(hobby.id).delete();
          }

          // 3. 刪除所有相關的興趣項目
          await db.hobbies.where("categoryId").equals(categoryId).delete();

          // 4. 最後刪除分類本身
          await db.categories.delete(categoryId);
        }
      );
    }, `刪除分類 ID 為 ${categoryId} 及其相關聯的興趣項目、目標和進度記錄失敗`);
  }

  /**
   * 使用事務批次更新分類
   * @param categories 要更新的分類陣列
   */
  async bulkUpdateWithTransaction(categories: Category[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.categories, async () => {
        for (const category of categories) {
          await db.categories.update(category.id, category);
        }
      });
    }, "批次更新分類失敗");
  }

  /**
   * 批次創建分類
   * @param categories 要創建的分類陣列
   */
  async bulkCreateWithTransaction(
    categories: Omit<Category, "id">[]
  ): Promise<string[]> {
    return this.executeDbOperation(async () => {
      const ids: string[] = [];

      await db.transaction("rw", db.categories, async () => {
        for (const category of categories) {
          const id = crypto.randomUUID();
          const newCategory = {
            ...category,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Category;

          await db.categories.add(newCategory);
          ids.push(id);
        }
      });

      return ids;
    }, "批次創建分類失敗");
  }
}

// 創建單例實例以供全局使用
export const categoryService = new CategoryService();
