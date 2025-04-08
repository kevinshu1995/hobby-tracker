import { db } from "../db/db";
import { Hobby } from "../types";
import { BaseService } from "./BaseService";

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
    return await this.table.where("categoryId").equals(categoryId).toArray();
  }

  /**
   * 依照名稱搜尋興趣項目
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Hobby[]> {
    return await this.table
      .filter((hobby) =>
        hobby.name.toLowerCase().includes(keyword.toLowerCase())
      )
      .toArray();
  }

  /**
   * 依照創建時間排序取得所有興趣項目
   */
  async getSortedByCreatedAt(): Promise<Hobby[]> {
    return await this.table.orderBy("createdAt").toArray();
  }

  /**
   * 檢查是否有關聯的目標
   * @param hobbyId 興趣項目 ID
   */
  async hasRelatedGoals(hobbyId: string): Promise<boolean> {
    const count = await db.goals.where("hobbyId").equals(hobbyId).count();
    return count > 0;
  }

  /**
   * 安全刪除興趣項目（檢查是否有關聯目標）
   * @param hobbyId 興趣項目 ID
   */
  async safeDelete(
    hobbyId: string
  ): Promise<{ success: boolean; message?: string }> {
    const hasRelated = await this.hasRelatedGoals(hobbyId);
    if (hasRelated) {
      return {
        success: false,
        message: "無法刪除此興趣項目，因為有相關聯的目標。請先刪除這些目標。",
      };
    }

    await this.delete(hobbyId);
    return { success: true };
  }
}

// 創建單例實例以供全局使用
export const hobbyService = new HobbyService();
