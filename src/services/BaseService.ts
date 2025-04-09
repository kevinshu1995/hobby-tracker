import { Table, UpdateSpec } from "dexie";

/**
 * 基礎資料存取服務，提供通用的 CRUD 操作
 * @template T 資料模型類型
 * @template K 主鍵類型
 */
export abstract class BaseService<T, K> {
  protected table: Table<T, K>;

  constructor(table: Table<T, K>) {
    this.table = table;
  }

  /**
   * 執行資料庫操作，包含統一錯誤處理
   * @param operation 要執行的資料庫操作函數
   * @param errorMessage 發生錯誤時的錯誤訊息
   * @returns 操作結果
   */
  protected async executeDbOperation<R>(
    operation: () => Promise<R>,
    errorMessage: string
  ): Promise<R> {
    try {
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      throw new Error(`${errorMessage}: ${(error as Error).message}`);
    }
  }

  /**
   * 取得所有記錄
   */
  async getAll(): Promise<T[]> {
    return this.executeDbOperation(
      () => this.table.toArray(),
      "取得所有記錄失敗"
    );
  }

  /**
   * 依照 ID 取得單一記錄
   * @param id 記錄 ID
   */
  async getById(id: K): Promise<T | undefined> {
    return this.executeDbOperation(
      () => this.table.get(id),
      `取得 ID 為 ${String(id)} 的記錄失敗`
    );
  }

  /**
   * 新增記錄
   * @param item 要新增的資料
   */
  async add(item: T): Promise<K> {
    return this.executeDbOperation(() => this.table.add(item), "新增記錄失敗");
  }

  /**
   * 更新記錄
   * @param id 記錄 ID
   * @param changes 部分更新的欄位
   */
  async update(id: K, changes: UpdateSpec<T>): Promise<K> {
    return this.executeDbOperation(async () => {
      await this.table.update(id, changes);
      return id;
    }, `更新 ID 為 ${String(id)} 的記錄失敗`);
  }

  /**
   * 刪除記錄
   * @param id 記錄 ID
   */
  async delete(id: K): Promise<void> {
    return this.executeDbOperation(
      () => this.table.delete(id),
      `刪除 ID 為 ${String(id)} 的記錄失敗`
    );
  }

  /**
   * 批次新增記錄
   * @param items 要新增的資料陣列
   * @returns 新增記錄的 ID 陣列
   */
  async bulkAdd(items: T[]): Promise<K[]> {
    return this.executeDbOperation(
      () => this.table.bulkAdd(items, { allKeys: true }),
      "批次新增記錄失敗"
    );
  }

  /**
   * 批次更新記錄
   * @param items 要更新的資料陣列 (必須包含 ID)
   */
  async bulkPut(items: T[]): Promise<void> {
    return this.executeDbOperation(
      () => this.table.bulkPut(items),
      "批次更新記錄失敗"
    );
  }

  /**
   * 批次刪除記錄
   * @param ids 要刪除的記錄 ID 陣列
   */
  async bulkDelete(ids: K[]): Promise<void> {
    return this.executeDbOperation(
      () => this.table.bulkDelete(ids),
      "批次刪除記錄失敗"
    );
  }
}
