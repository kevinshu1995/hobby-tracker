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
    return await this.table.orderBy("createdAt").toArray();
  }

  /**
   * 依照名稱搜尋分類
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Category[]> {
    return await this.table
      .filter((category) =>
        category.name.toLowerCase().includes(keyword.toLowerCase())
      )
      .toArray();
  }

  /**
   * 檢查是否有關聯的興趣項目
   * @param categoryId 分類 ID
   */
  async hasRelatedHobbies(categoryId: string): Promise<boolean> {
    const count = await db.hobbies
      .where("categoryId")
      .equals(categoryId)
      .count();
    return count > 0;
  }

  /**
   * 安全刪除分類（檢查是否有關聯項目）
   * @param categoryId 分類 ID
   */
  async safeDelete(
    categoryId: string
  ): Promise<{ success: boolean; message?: string }> {
    const hasRelated = await this.hasRelatedHobbies(categoryId);
    if (hasRelated) {
      return {
        success: false,
        message:
          "無法刪除此分類，因為有相關聯的興趣項目。請先刪除或移動這些項目。",
      };
    }

    await this.delete(categoryId);
    return { success: true };
  }
}

// 創建單例實例以供全局使用
export const categoryService = new CategoryService();
