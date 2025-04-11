import { db } from "../db/db";
import { Progress } from "../types";
import { BaseService } from "./BaseService";

/**
 * 進度記錄資料存取服務
 * 提供對 Progress 資料的存取與管理功能
 */
export class ProgressService extends BaseService<Progress, string> {
  constructor() {
    super(db.progress, "progress");
  }

  /**
   * 依照目標 ID 取得進度記錄列表
   * @param goalId 目標 ID
   */
  async getByGoalId(goalId: string): Promise<Progress[]> {
    return this.executeDbOperation(
      () => this.table.where("goalId").equals(goalId).toArray(),
      `取得目標 ID 為 ${goalId} 的進度記錄列表失敗`
    );
  }

  /**
   * 依照記錄日期範圍取得進度記錄
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param options 選項（分頁、排序）
   */
  async getByDateRange(
    startDate: Date,
    endDate: Date,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    return this.executeDbOperation(async () => {
      let query = this.table
        .where("recordedAt")
        .between(startDate, endDate, true, true);

      // 套用排序
      if (options.orderBy === "desc") {
        query = query.reverse();
      }

      // 套用分頁
      if (options.offset !== undefined) {
        query = query.offset(options.offset);
      }

      if (options.limit !== undefined) {
        query = query.limit(options.limit);
      }

      return await query.toArray();
    }, `取得日期從 ${startDate.toISOString()} 到 ${endDate.toISOString()} 的進度記錄失敗`);
  }

  /**
   * 依照目標 ID 和日期範圍取得進度記錄
   * @param goalId 目標 ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param options 選項（分頁、排序）
   */
  async getByGoalAndDateRange(
    goalId: string,
    startDate: Date,
    endDate: Date,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    return this.executeDbOperation(async () => {
      // 使用複合索引查詢
      let collection = this.table
        .where("[goalId+recordedAt]")
        .between([goalId, startDate], [goalId, endDate], true, true);

      // 套用排序
      if (options.orderBy === "desc") {
        collection = collection.reverse();
      }

      // 套用分頁
      if (options.offset !== undefined) {
        collection = collection.offset(options.offset);
      }

      if (options.limit !== undefined) {
        collection = collection.limit(options.limit);
      }

      return await collection.toArray();
    }, `取得目標 ID 為 ${goalId} 且日期從 ${startDate.toISOString()} 到 ${endDate.toISOString()} 的進度記錄失敗`);
  }

  /**
   * 依照特定日期取得進度記錄
   * @param date 日期
   * @param options 選項（分頁、排序）
   */
  async getByDate(
    date: Date,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getByDateRange(startOfDay, endOfDay, options);
  }

  /**
   * 依照目標 ID 和特定日期取得進度記錄
   * @param goalId 目標 ID
   * @param date 日期
   * @param options 選項（分頁、排序）
   */
  async getByGoalAndDate(
    goalId: string,
    date: Date,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getByGoalAndDateRange(goalId, startOfDay, endOfDay, options);
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
    return this.executeDbOperation(async () => {
      const records = await this.getByGoalAndDateRange(
        goalId,
        startDate,
        endDate
      );
      return records.reduce((sum, record) => sum + record.value, 0);
    }, `計算目標 ID 為 ${goalId} 從 ${startDate.toISOString()} 到 ${endDate.toISOString()} 的累計進度失敗`);
  }

  /**
   * 依照創建時間排序取得進度記錄
   * @param options 選項（分頁、排序方向）
   */
  async getSortedByCreatedAt(
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    return this.executeDbOperation(async () => {
      let collection = this.table.orderBy("createdAt");

      // 套用排序方向
      if (options.orderBy === "desc") {
        collection = collection.reverse();
      }

      // 套用分頁
      if (options.offset !== undefined) {
        collection = collection.offset(options.offset);
      }

      if (options.limit !== undefined) {
        collection = collection.limit(options.limit);
      }

      return await collection.toArray();
    }, "依創建時間排序取得進度記錄失敗");
  }

  /**
   * 依照記錄日期排序取得進度記錄
   * @param options 選項（分頁、排序方向）
   */
  async getSortedByRecordedAt(
    options: {
      limit?: number;
      offset?: number;
      orderBy?: "asc" | "desc";
    } = {}
  ): Promise<Progress[]> {
    return this.executeDbOperation(async () => {
      let collection = this.table.orderBy("recordedAt");

      // 套用排序方向
      if (options.orderBy === "desc") {
        collection = collection.reverse();
      }

      // 套用分頁
      if (options.offset !== undefined) {
        collection = collection.offset(options.offset);
      }

      if (options.limit !== undefined) {
        collection = collection.limit(options.limit);
      }

      return await collection.toArray();
    }, "依記錄日期排序取得進度記錄失敗");
  }

  /**
   * 批次新增進度記錄（使用事務）
   * @param records 要新增的進度記錄陣列
   * @returns 新增的記錄 ID 陣列
   */
  async bulkAddWithTransaction(
    records: Omit<Progress, "id">[]
  ): Promise<string[]> {
    return this.executeDbOperation(async () => {
      const ids: string[] = [];

      await db.transaction("rw", db.progress, async () => {
        for (const record of records) {
          const id = crypto.randomUUID();
          const newRecord = {
            ...record,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Progress;

          await db.progress.add(newRecord);
          ids.push(id);
        }
      });

      return ids;
    }, "批次新增進度記錄失敗");
  }

  /**
   * 使用事務批次更新進度記錄
   * @param records 要更新的進度記錄陣列
   */
  async bulkUpdateWithTransaction(records: Progress[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.progress, async () => {
        for (const record of records) {
          // 更新 updatedAt 時間戳
          record.updatedAt = new Date();
          await db.progress.update(record.id, record);
        }
      });
    }, "批次更新進度記錄失敗");
  }

  /**
   * 取得目標的最近記錄
   * @param goalId 目標 ID
   * @param limit 限制筆數，預設 1
   */
  async getLatestRecords(goalId: string, limit = 1): Promise<Progress[]> {
    return this.executeDbOperation(async () => {
      return await this.table
        .where("goalId")
        .equals(goalId)
        .reverse()
        .sortBy("recordedAt")
        .then((records) => records.slice(0, limit));
    }, `取得目標 ID 為 ${goalId} 的最近 ${limit} 筆記錄失敗`);
  }
}

// 創建單例實例以供全局使用
export const progressService = new ProgressService();
