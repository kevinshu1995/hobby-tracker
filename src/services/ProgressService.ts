import { db } from "../db/db";
import { Progress } from "../types";
import { BaseService } from "./BaseService";

/**
 * 進度記錄資料存取服務
 * 提供對 Progress 資料的存取與管理功能
 */
export class ProgressService extends BaseService<Progress, string> {
  constructor() {
    super(db.progress);
  }

  /**
   * 依照目標 ID 取得進度記錄列表
   * @param goalId 目標 ID
   */
  async getByGoalId(goalId: string): Promise<Progress[]> {
    return await this.table.where("goalId").equals(goalId).toArray();
  }

  /**
   * 依照記錄日期範圍取得進度記錄
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<Progress[]> {
    return await this.table
      .where("recordedAt")
      .between(startDate, endDate)
      .toArray();
  }

  /**
   * 依照目標 ID 和日期範圍取得進度記錄
   * @param goalId 目標 ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  async getByGoalAndDateRange(
    goalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Progress[]> {
    return await this.table
      .where("goalId")
      .equals(goalId)
      .and((record) => {
        const recordDate = new Date(record.recordedAt);
        return recordDate >= startDate && recordDate <= endDate;
      })
      .toArray();
  }

  /**
   * 依照特定日期取得進度記錄
   * @param date 日期
   */
  async getByDate(date: Date): Promise<Progress[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.getByDateRange(startOfDay, endOfDay);
  }

  /**
   * 依照目標 ID 和特定日期取得進度記錄
   * @param goalId 目標 ID
   * @param date 日期
   */
  async getByGoalAndDate(goalId: string, date: Date): Promise<Progress[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.getByGoalAndDateRange(goalId, startOfDay, endOfDay);
  }

  /**
   * 計算特定時間區間內目標的累計進度
   * @param goalId 目標 ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   */
  async calculateTotalProgress(
    goalId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const records = await this.getByGoalAndDateRange(
      goalId,
      startDate,
      endDate
    );
    return records.reduce((sum, record) => sum + record.value, 0);
  }

  /**
   * 依照創建時間排序取得進度記錄
   */
  async getSortedByCreatedAt(): Promise<Progress[]> {
    return await this.table.orderBy("createdAt").toArray();
  }

  /**
   * 依照記錄日期排序取得進度記錄
   */
  async getSortedByRecordedAt(): Promise<Progress[]> {
    return await this.table.orderBy("recordedAt").toArray();
  }
}

// 創建單例實例以供全局使用
export const progressService = new ProgressService();
