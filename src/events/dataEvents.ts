/**
 * 定義資料變更相關的事件類型列舉
 * 提供統一的事件名稱，確保在訂閱和發布時使用一致的字符串
 */
export enum DataEvent {
  // 分類相關事件
  CATEGORY_CHANGED = "category:changed", // 任何分類資料變更
  CATEGORY_ADDED = "category:added", // 新增分類
  CATEGORY_UPDATED = "category:updated", // 更新分類
  CATEGORY_DELETED = "category:deleted", // 刪除分類

  // 興趣項目相關事件
  HOBBY_CHANGED = "hobby:changed", // 任何興趣項目資料變更
  HOBBY_ADDED = "hobby:added", // 新增興趣項目
  HOBBY_UPDATED = "hobby:updated", // 更新興趣項目
  HOBBY_DELETED = "hobby:deleted", // 刪除興趣項目

  // 目標相關事件
  GOAL_CHANGED = "goal:changed", // 任何目標資料變更
  GOAL_ADDED = "goal:added", // 新增目標
  GOAL_UPDATED = "goal:updated", // 更新目標
  GOAL_DELETED = "goal:deleted", // 刪除目標

  // 進度相關事件
  PROGRESS_CHANGED = "progress:changed", // 任何進度資料變更
  PROGRESS_ADDED = "progress:added", // 新增進度記錄
  PROGRESS_UPDATED = "progress:updated", // 更新進度記錄
  PROGRESS_DELETED = "progress:deleted", // 刪除進度記錄

  // 資料庫層級事件
  DATABASE_CHANGED = "database:changed", // 資料庫有任何變更

  // 同步相關事件
  SYNC_STARTED = "sync:started", // 同步開始
  SYNC_COMPLETED = "sync:completed", // 同步完成
  SYNC_FAILED = "sync:failed", // 同步失敗
}

/**
 * 資料事件的泛型類型，用於定義事件資料結構
 */
export interface DataEventPayload<T> {
  type: DataEvent; // 事件類型
  data?: T; // 事件資料
  timestamp: number; // 事件發生時間戳
  source?: "local" | "remote" | "sync"; // 事件來源
}
