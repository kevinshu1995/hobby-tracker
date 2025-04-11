/**
 * 同步狀態追蹤機制
 *
 * 此文件定義了用於追蹤資料同步狀態的類型和介面，包括:
 * - 同步狀態枚舉: 定義資料項可能的同步狀態
 * - 同步元數據介面: 描述資料項的同步相關信息
 * - 可同步實體介面: 為資料模型提供同步屬性擴展
 */

/**
 * 同步狀態枚舉
 * 定義資料項的同步狀態類型
 */
export enum SyncStatus {
  SYNCED = "synced", // 已同步，本地和伺服器資料一致
  PENDING = "pending", // 待同步，本地有未同步到伺服器的變更
  SYNCING = "syncing", // 同步中，正在進行同步操作
  CONFLICT = "conflict", // 衝突，本地和伺服器的資料有衝突需要解決
  FAILED = "failed", // 同步失敗，同步操作遇到錯誤
  OFFLINE = "offline", // 離線狀態，無法連接到伺服器
}

/**
 * 同步操作類型枚舉
 * 定義可能的同步操作類型
 */
export enum SyncOperationType {
  CREATE = "create", // 創建操作
  UPDATE = "update", // 更新操作
  DELETE = "delete", // 刪除操作
  NONE = "none", // 無操作
}

/**
 * 同步元數據介面
 * 描述資料項的同步相關資訊
 */
export interface SyncMetadata {
  status: SyncStatus; // 同步狀態
  lastSyncedAt?: number; // 最後同步時間戳 (毫秒)
  localUpdatedAt?: number; // 本地更新時間戳 (毫秒)
  serverUpdatedAt?: number; // 伺服器更新時間戳 (毫秒)
  pendingOperation?: SyncOperationType; // 待處理的操作類型
  conflictData?: string; // 衝突資料 (JSON 字串)
  errorMessage?: string; // 錯誤訊息
  retryCount?: number; // 重試次數
  lastAttemptAt?: number; // 上次嘗試同步的時間戳 (毫秒)
}

/**
 * 可同步實體介面
 * 為資料模型提供同步屬性擴展
 * 可以被任何需要同步功能的資料模型所實現
 */
export interface SyncableEntity {
  id: string; // 實體 ID
  syncMetadata?: SyncMetadata; // 同步元數據 (用於序列化/反序列化時的資料結構)

  // 資料庫中實際存儲的同步欄位
  syncStatus?: SyncStatus; // 同步狀態
  lastSyncedAt?: number; // 最後同步時間戳
  localUpdatedAt?: number; // 本地更新時間戳
  serverUpdatedAt?: number; // 伺服器更新時間戳
  pendingOperation?: SyncOperationType; // 待處理操作類型
  conflictData?: string; // 衝突資料
  errorMessage?: string; // 錯誤訊息
  retryCount?: number; // 重試次數
  lastAttemptAt?: number; // 上次嘗試同步時間
}

/**
 * 全域同步狀態介面
 * 描述應用程式的全域同步狀態
 */
export interface GlobalSyncState {
  isSyncing: boolean; // 是否正在同步
  lastSyncAt: number | null; // 最後完成同步的時間戳
  pendingItemsCount: number; // 待同步項目數量
  failedItemsCount: number; // 同步失敗的項目數量
  conflictItemsCount: number; // 有衝突的項目數量
  syncProgress: number; // 同步進度 (0-100)
  isOnline: boolean; // 網路是否連線
  currentError: string | null; // 當前同步錯誤
}

/**
 * 同步狀態變更事件介面
 * 描述同步狀態變更的事件資料
 */
export interface SyncStatusChangeEvent {
  entityType: string; // 實體類型 (如 "category", "hobby" 等)
  entityId: string; // 實體 ID
  oldStatus?: SyncStatus; // 變更前的狀態
  newStatus: SyncStatus; // 變更後的狀態
  timestamp: number; // 變更時間戳
  metadata?: SyncMetadata; // 相關的同步元數據
}
