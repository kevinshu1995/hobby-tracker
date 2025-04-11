import { Table, UpdateSpec } from "dexie";
import { syncService } from "./SyncService";
import { SyncOperationType, SyncStatus } from "../types/sync/SyncStatus";

/**
 * 確保實體具有 id 屬性的介面
 * @template K 主鍵型別
 */
interface HasId<K> {
  id: K;
}

/**
 * 基礎資料存取服務，提供通用的 CRUD 操作
 * @template T 資料模型類型
 * @template K 主鍵類型
 */
export abstract class BaseService<T extends HasId<K>, K> {
  protected table: Table<T, K>;
  protected tableName: string;

  constructor(table: Table<T, K>, tableName: string) {
    this.table = table;
    this.tableName = tableName;
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
    return this.executeDbOperation(async () => {
      // 將同步狀態設為待同步
      const itemWithSync = {
        ...item,
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: Date.now(),
        pendingOperation: SyncOperationType.CREATE,
      } as T;

      const id = await this.table.add(itemWithSync);

      // 使用 syncService 標記為待同步
      await syncService.markForSync(
        this.tableName,
        String(id),
        SyncOperationType.CREATE
      );

      return id;
    }, "新增記錄失敗");
  }

  /**
   * 更新記錄
   * @param id 記錄 ID
   * @param changes 部分更新的欄位
   */
  async update(id: K, changes: UpdateSpec<T>): Promise<K> {
    return this.executeDbOperation(async () => {
      // 添加同步相關欄位
      const changesWithSync = {
        ...changes,
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: Date.now(),
        pendingOperation: SyncOperationType.UPDATE,
      } as UpdateSpec<T>;

      await this.table.update(id, changesWithSync);

      // 使用 syncService 標記為待同步
      await syncService.markForSync(
        this.tableName,
        String(id),
        SyncOperationType.UPDATE
      );

      return id;
    }, `更新 ID 為 ${String(id)} 的記錄失敗`);
  }

  /**
   * 刪除記錄
   * @param id 記錄 ID
   */
  async delete(id: K): Promise<void> {
    return this.executeDbOperation(async () => {
      // 標記為待同步 (刪除)
      await syncService.markForSync(
        this.tableName,
        String(id),
        SyncOperationType.DELETE
      );

      // 執行刪除操作
      await this.table.delete(id);
    }, `刪除 ID 為 ${String(id)} 的記錄失敗`);
  }

  /**
   * 批次新增記錄
   * @param items 要新增的資料陣列
   * @returns 新增記錄的 ID 陣列
   */
  async bulkAdd(items: T[]): Promise<K[]> {
    return this.executeDbOperation(async () => {
      // 添加同步相關欄位
      const now = Date.now();
      const itemsWithSync = items.map((item) => ({
        ...item,
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: now,
        pendingOperation: SyncOperationType.CREATE,
      })) as T[];

      const ids = await this.table.bulkAdd(itemsWithSync, { allKeys: true });

      // 標記所有新增的記錄為待同步
      await Promise.all(
        ids.map((id) =>
          syncService.markForSync(
            this.tableName,
            String(id),
            SyncOperationType.CREATE
          )
        )
      );

      return ids;
    }, "批次新增記錄失敗");
  }

  /**
   * 批次更新記錄
   * @param items 要更新的資料陣列 (必須包含 ID)
   */
  async bulkPut(items: T[]): Promise<void> {
    return this.executeDbOperation(async () => {
      // 添加同步相關欄位
      const now = Date.now();
      const itemsWithSync = items.map((item) => ({
        ...item,
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: now,
        pendingOperation: SyncOperationType.UPDATE,
      })) as T[];

      await this.table.bulkPut(itemsWithSync);

      // 獲取 ID 陣列並標記為待同步
      const ids = itemsWithSync.map((item) => item.id);
      await Promise.all(
        ids.map((id) =>
          syncService.markForSync(
            this.tableName,
            String(id),
            SyncOperationType.UPDATE
          )
        )
      );
    }, "批次更新記錄失敗");
  }

  /**
   * 批次刪除記錄
   * @param ids 要刪除的記錄 ID 陣列
   */
  async bulkDelete(ids: K[]): Promise<void> {
    return this.executeDbOperation<void>(async () => {
      // 標記所有要刪除的記錄為待同步
      await Promise.all(
        ids.map((id) =>
          syncService.markForSync(
            this.tableName,
            String(id),
            SyncOperationType.DELETE
          )
        )
      );

      await this.table.bulkDelete(ids);
    }, "批次刪除記錄失敗");
  }
}
