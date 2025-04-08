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
   * 取得所有記錄
   */
  async getAll(): Promise<T[]> {
    return await this.table.toArray();
  }

  /**
   * 依照 ID 取得單一記錄
   * @param id 記錄 ID
   */
  async getById(id: K): Promise<T | undefined> {
    return await this.table.get(id);
  }

  /**
   * 新增記錄
   * @param item 要新增的資料
   */
  async add(item: T): Promise<K> {
    return await this.table.add(item);
  }

  /**
   * 更新記錄
   * @param id 記錄 ID
   * @param changes 部分更新的欄位
   */
  async update(id: K, changes: UpdateSpec<T>): Promise<K> {
    await this.table.update(id, changes);
    return id;
  }

  /**
   * 刪除記錄
   * @param id 記錄 ID
   */
  async delete(id: K): Promise<void> {
    await this.table.delete(id);
  }
}
