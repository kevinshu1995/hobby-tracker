import Dexie, { Table } from "dexie";
import { Category, Hobby, Goal, Progress } from "../types";
import { DB_VERSION, SCHEMA } from "./schema";

/**
 * 興趣追蹤應用程式主資料庫類別
 * 使用 Dexie.js 管理 IndexedDB 連接和操作
 */
export class HobbyTrackerDatabase extends Dexie {
  // 定義表格與對應的類型
  categories!: Table<Category, string>;
  hobbies!: Table<Hobby, string>;
  goals!: Table<Goal, string>;
  progress!: Table<Progress, string>;

  constructor() {
    super("HobbyTrackerDB");
    this.version(DB_VERSION).stores(SCHEMA);
  }
}

// 創建資料庫單例實例
export const db = new HobbyTrackerDatabase();
