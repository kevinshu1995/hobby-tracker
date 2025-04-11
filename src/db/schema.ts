/**
 * 資料庫版本號，每次結構變更時需遞增
 */
export const DB_VERSION = 2; // 遞增版本號

/**
 * 資料庫架構定義
 * 格式: '索引欄位1, 索引欄位2, [複合索引1+複合索引2], *外部索引'
 *
 * 特殊符號說明:
 * - &: 表示該欄位為主鍵 (主鍵固定為索引)
 * - *: 表示該欄位為外部索引 (用於關聯查詢)
 * - [x+y]: 表示複合索引 (用於依多欄位聯合查詢)
 */
export const SCHEMA = {
  categories:
    "id, name, color, icon, createdAt, updatedAt, syncStatus, lastSyncedAt",
  hobbies:
    "id, categoryId, name, description, createdAt, updatedAt, *categoryId, syncStatus, lastSyncedAt",
  goals:
    "id, hobbyId, type, period, targetValue, createdAt, updatedAt, *hobbyId, syncStatus, lastSyncedAt",
  progress:
    "id, goalId, recordedAt, value, createdAt, updatedAt, *goalId, [goalId+recordedAt], syncStatus, lastSyncedAt",
};

/**
 * 同步狀態相關欄位
 * 為每個數據表添加的同步相關欄位清單
 */
export const SYNC_FIELDS = [
  "syncStatus", // 同步狀態
  "lastSyncedAt", // 最後同步時間
  "localUpdatedAt", // 本地更新時間
  "serverUpdatedAt", // 伺服器更新時間
  "pendingOperation", // 待處理操作
  "conflictData", // 衝突數據
  "errorMessage", // 錯誤訊息
  "retryCount", // 重試次數
  "lastAttemptAt", // 上次嘗試同步時間
];
