/**
 * 資料庫版本號，每次結構變更時需遞增
 */
export const DB_VERSION = 1;

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
  categories: "id, name, color, icon, createdAt, updatedAt",
  hobbies:
    "id, categoryId, name, description, createdAt, updatedAt, *categoryId",
  goals:
    "id, hobbyId, type, period, targetValue, createdAt, updatedAt, *hobbyId",
  progress:
    "id, goalId, recordedAt, value, createdAt, updatedAt, *goalId, [goalId+recordedAt]",
};
