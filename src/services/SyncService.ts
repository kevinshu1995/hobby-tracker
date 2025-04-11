/**
 * 同步狀態服務
 * 負責管理資料實體的同步狀態，包括狀態查詢、更新等操作
 */

import { db } from "../db";
import {
  SyncStatus,
  SyncMetadata,
  SyncOperationType,
  SyncStatusChangeEvent,
  SyncableEntity,
} from "../types/sync/SyncStatus";
import { eventBus } from "../events/eventBus";

/**
 * 定義同步事件類型，擴展現有的 DataEvent 枚舉
 */
export enum SyncEvent {
  // 同步狀態變更事件
  SYNC_STATUS_CHANGED = "sync:status:changed",
  // 實體同步狀態變更事件
  ENTITY_SYNC_STATUS_CHANGED = "sync:entity:status:changed",
  // 全域同步狀態變更事件
  GLOBAL_SYNC_STATUS_CHANGED = "sync:global:status:changed",
}

/**
 * 全域同步狀態事件資料介面
 */
export interface SyncGlobalStatusEventData {
  pendingItemsCount: number;
  failedItemsCount: number;
  conflictItemsCount: number;
  timestamp: number;
}

/**
 * 同步狀態服務類別
 * 負責管理資料實體的同步狀態
 */
export class SyncService {
  /**
   * 更新實體的同步狀態
   * @param table 資料表名稱
   * @param id 實體ID
   * @param status 新的同步狀態
   * @param metadata 其他同步元數據
   */
  async updateEntitySyncStatus(
    table: string,
    id: string,
    status: SyncStatus,
    metadata: Partial<SyncMetadata> = {}
  ): Promise<void> {
    try {
      // 獲取當前狀態
      const entity = await db.table(table).get(id);
      if (!entity) {
        console.warn(`嘗試更新不存在的實體同步狀態：${table}.${id}`);
        return;
      }

      // 獲取舊的同步狀態
      const oldStatus = entity.syncStatus as SyncStatus | undefined;

      // 建立更新資料
      const syncMetadata: SyncMetadata = {
        status,
        ...metadata,
        lastAttemptAt: metadata.lastAttemptAt || Date.now(),
      };

      // 根據需要更新其他欄位
      if (status === SyncStatus.SYNCED) {
        syncMetadata.lastSyncedAt = Date.now();
      }

      // 更新資料庫
      await db.table(table).update(id, {
        syncStatus: status,
        lastSyncedAt: syncMetadata.lastSyncedAt,
        localUpdatedAt: syncMetadata.localUpdatedAt,
        serverUpdatedAt: syncMetadata.serverUpdatedAt,
        pendingOperation: syncMetadata.pendingOperation,
        conflictData: syncMetadata.conflictData,
        errorMessage: syncMetadata.errorMessage,
        retryCount: syncMetadata.retryCount,
        lastAttemptAt: syncMetadata.lastAttemptAt,
      });

      // 發送同步狀態變更事件
      this.notifySyncStatusChanged(table, id, oldStatus, status, syncMetadata);

      // 更新全域同步計數
      await this.updateGlobalSyncCounts();
    } catch (error) {
      console.error(`更新同步狀態時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 批量更新實體的同步狀態
   * @param table 資料表名稱
   * @param entities 實體陣列，每個實體包含 id 和狀態信息
   */
  async batchUpdateSyncStatus(
    table: string,
    entities: Array<{
      id: string;
      status: SyncStatus;
      metadata?: Partial<SyncMetadata>;
    }>
  ): Promise<void> {
    try {
      // 使用事務批次更新
      await db.transaction("rw", db.table(table), async () => {
        for (const entity of entities) {
          await this.updateEntitySyncStatus(
            table,
            entity.id,
            entity.status,
            entity.metadata
          );
        }
      });
    } catch (error) {
      console.error(`批量更新同步狀態時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 標記實體為待同步狀態
   * @param table 資料表名稱
   * @param id 實體ID
   * @param operation 操作類型（創建/更新/刪除）
   */
  async markForSync(
    table: string,
    id: string,
    operation: SyncOperationType = SyncOperationType.UPDATE
  ): Promise<void> {
    await this.updateEntitySyncStatus(table, id, SyncStatus.PENDING, {
      localUpdatedAt: Date.now(),
      pendingOperation: operation,
    });
  }

  /**
   * 獲取指定表中待同步的實體列表
   * @param table 資料表名稱
   * @param status 同步狀態（可選，預設為 PENDING）
   * @param limit 最大返回數量
   */
  async getSyncEntities<T extends SyncableEntity>(
    table: string,
    status: SyncStatus = SyncStatus.PENDING,
    limit: number = 50
  ): Promise<T[]> {
    try {
      return await db
        .table(table)
        .where("syncStatus")
        .equals(status)
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error(`獲取同步實體時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 獲取各個同步狀態的實體數量
   * @param table 資料表名稱
   */
  async getSyncStatusCounts(
    table: string
  ): Promise<Record<SyncStatus, number>> {
    const result: Record<SyncStatus, number> = {
      [SyncStatus.SYNCED]: 0,
      [SyncStatus.PENDING]: 0,
      [SyncStatus.SYNCING]: 0,
      [SyncStatus.CONFLICT]: 0,
      [SyncStatus.FAILED]: 0,
      [SyncStatus.OFFLINE]: 0,
    };

    try {
      // 獲取所有同步狀態的計數
      await Promise.all(
        Object.keys(SyncStatus).map(async (statusKey) => {
          const status = SyncStatus[statusKey as keyof typeof SyncStatus];
          const count = await db
            .table(table)
            .where("syncStatus")
            .equals(status)
            .count();
          result[status] = count;
        })
      );

      return result;
    } catch (error) {
      console.error(`獲取同步狀態計數時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 處理同步衝突
   * @param table 資料表名稱
   * @param id 實體ID
   * @param localData 本地資料
   * @param serverData 伺服器資料
   * @param resolution 解決方式：'local'（使用本地版本）或 'server'（使用伺服器版本）
   */
  async resolveConflict<T extends SyncableEntity>(
    table: string,
    id: string,
    localData: T,
    serverData: T,
    resolution: "local" | "server"
  ): Promise<void> {
    try {
      if (resolution === "local") {
        // 使用本地版本，標記為待同步
        await this.markForSync(table, id, SyncOperationType.UPDATE);
      } else {
        // 使用伺服器版本，更新本地資料並標記為已同步
        await db.table(table).update(id, {
          ...serverData,
          syncStatus: SyncStatus.SYNCED,
          lastSyncedAt: Date.now(),
          serverUpdatedAt: Date.now(),
          conflictData: null,
          errorMessage: null,
        });

        // 通知狀態變更
        this.notifySyncStatusChanged(
          table,
          id,
          SyncStatus.CONFLICT,
          SyncStatus.SYNCED
        );
      }

      await this.updateGlobalSyncCounts();
    } catch (error) {
      console.error(`解決同步衝突時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 標記所有離線狀態的實體為待同步
   */
  async markOfflineEntitiesForSync(): Promise<void> {
    const tables = ["categories", "hobbies", "goals", "progress"];

    try {
      for (const table of tables) {
        const offlineEntities = await this.getSyncEntities(
          table,
          SyncStatus.OFFLINE
        );

        if (offlineEntities.length > 0) {
          await this.batchUpdateSyncStatus(
            table,
            offlineEntities.map((entity) => ({
              id: entity.id,
              status: SyncStatus.PENDING,
              metadata: {
                localUpdatedAt: Date.now(),
                pendingOperation:
                  entity.pendingOperation || SyncOperationType.UPDATE,
              },
            }))
          );
        }
      }
    } catch (error) {
      console.error(`標記離線實體為待同步時發生錯誤：`, error);
      throw error;
    }
  }

  /**
   * 更新全域同步統計資訊
   */
  private async updateGlobalSyncCounts(): Promise<void> {
    const tables = ["categories", "hobbies", "goals", "progress"];
    let pendingTotal = 0;
    let failedTotal = 0;
    let conflictTotal = 0;

    try {
      for (const table of tables) {
        const counts = await this.getSyncStatusCounts(table);
        pendingTotal += counts[SyncStatus.PENDING];
        failedTotal += counts[SyncStatus.FAILED];
        conflictTotal += counts[SyncStatus.CONFLICT];
      }

      // 發布全域同步狀態變更事件
      eventBus.publish(SyncEvent.GLOBAL_SYNC_STATUS_CHANGED, {
        pendingItemsCount: pendingTotal,
        failedItemsCount: failedTotal,
        conflictItemsCount: conflictTotal,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`更新全域同步計數時發生錯誤：`, error);
    }
  }

  /**
   * 發送同步狀態變更事件通知
   * @param table 資料表名稱
   * @param id 實體ID
   * @param oldStatus 舊狀態
   * @param newStatus 新狀態
   * @param metadata 同步元數據
   */
  private notifySyncStatusChanged(
    table: string,
    id: string,
    oldStatus?: SyncStatus,
    newStatus?: SyncStatus,
    metadata?: SyncMetadata
  ): void {
    const event: SyncStatusChangeEvent = {
      entityType: table,
      entityId: id,
      oldStatus,
      newStatus: newStatus || SyncStatus.PENDING,
      timestamp: Date.now(),
      metadata,
    };

    // 發布實體同步狀態變更事件
    eventBus.publish(SyncEvent.ENTITY_SYNC_STATUS_CHANGED, event);

    // 發布特定實體類型的同步狀態變更事件
    eventBus.publish(`${SyncEvent.ENTITY_SYNC_STATUS_CHANGED}:${table}`, event);
  }
}

/**
 * 匯出同步狀態服務單例實例
 */
export const syncService = new SyncService();
