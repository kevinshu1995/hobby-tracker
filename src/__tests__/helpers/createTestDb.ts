import Dexie from "dexie";
import { SCHEMA } from "../../db/schema";

/**
 * 創建測試用資料庫
 * @param name 資料庫名稱
 * @returns 測試用資料庫實例
 */
export function createTestDb(name = "TestDB") {
  // 創建獨立測試用資料庫
  const testDb = new Dexie(name);

  // 使用相同結構
  testDb.version(1).stores(SCHEMA);

  return testDb;
}
