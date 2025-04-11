import { createTestDb } from "../helpers/createTestDb";
import {
  SyncService,
  syncService,
  SyncGlobalStatusEventData,
} from "../../services/SyncService";
import {
  SyncStatus,
  SyncOperationType,
  SyncableEntity,
} from "../../types/sync/SyncStatus";
import { db } from "../../db";
import { eventBus } from "../../events/eventBus";
import { SyncEvent } from "../../services/SyncService";

// 定義測試類型
interface TestCategory extends SyncableEntity {
  name: string;
  color: string;
  icon?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 同步服務測試套件
 */
describe("SyncService", () => {
  // 測試前準備環境
  beforeEach(async () => {
    // 建立測試資料庫
    await createTestDb();
  });

  /**
   * 測試標記實體為待同步
   */
  test("標記實體為待同步狀態", async () => {
    // 建立測試資料
    const categoryId = "test-category-1";
    const category: TestCategory = {
      id: categoryId,
      name: "測試分類",
      color: "#FF0000",
      icon: "star",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 新增測試資料到資料庫
    await db.categories.add(category);

    // 標記為待同步
    await syncService.markForSync(
      "categories",
      categoryId,
      SyncOperationType.UPDATE
    );

    // 檢查是否已標記為待同步
    const updatedCategory = await db.categories.get(categoryId);
    expect(updatedCategory).toBeDefined();
    expect(updatedCategory?.syncStatus).toBe(SyncStatus.PENDING);
    expect(updatedCategory?.pendingOperation).toBe(SyncOperationType.UPDATE);
    expect(updatedCategory?.localUpdatedAt).toBeDefined();
  });

  /**
   * 測試獲取待同步實體列表
   */
  test("獲取待同步實體列表", async () => {
    // 建立多筆測試資料
    const items: TestCategory[] = [
      {
        id: "test-category-1",
        name: "待同步分類1",
        color: "#FF0000",
        icon: "star",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: Date.now(),
        pendingOperation: SyncOperationType.UPDATE,
      },
      {
        id: "test-category-2",
        name: "已同步分類",
        color: "#00FF00",
        icon: "heart",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.SYNCED,
        lastSyncedAt: Date.now(),
      },
      {
        id: "test-category-3",
        name: "待同步分類2",
        color: "#0000FF",
        icon: "flag",
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: SyncStatus.PENDING,
        localUpdatedAt: Date.now(),
        pendingOperation: SyncOperationType.CREATE,
      },
    ];

    // 新增測試資料
    await db.categories.bulkAdd(items);

    // 獲取待同步實體
    const pendingItems = await syncService.getSyncEntities(
      "categories",
      SyncStatus.PENDING
    );

    // 驗證結果
    expect(pendingItems.length).toBe(2);
    expect(
      pendingItems.some((item) => item.id === "test-category-1")
    ).toBeTruthy();
    expect(
      pendingItems.some((item) => item.id === "test-category-3")
    ).toBeTruthy();
    expect(
      pendingItems.every((item) => item.syncStatus === SyncStatus.PENDING)
    ).toBeTruthy();
  });

  /**
   * 測試更新同步狀態統計資訊
   */
  test("計算同步狀態統計資訊", async () => {
    // 建立多筆測試資料
    const items: TestCategory[] = [
      { id: "c1", name: "分類1", syncStatus: SyncStatus.PENDING },
      { id: "c2", name: "分類2", syncStatus: SyncStatus.SYNCED },
      { id: "c3", name: "分類3", syncStatus: SyncStatus.FAILED },
      { id: "c4", name: "分類4", syncStatus: SyncStatus.CONFLICT },
    ];

    await db.categories.bulkAdd(items);

    // 監聽同步狀態變更事件
    let capturedEvent: SyncGlobalStatusEventData | null = null;
    const unsubscribe = eventBus.subscribe(
      SyncEvent.GLOBAL_SYNC_STATUS_CHANGED,
      (data: SyncGlobalStatusEventData) => {
        capturedEvent = data;
      }
    );

    // 呼叫更新同步計數的私有方法 (通過調用別的公有方法間接觸發)
    await syncService.markForSync("categories", "c2", SyncOperationType.UPDATE);

    // 驗證結果
    expect(capturedEvent).not.toBeNull();
    expect(capturedEvent?.pendingItemsCount).toBe(2); // 原有1個加上新標記的c2
    expect(capturedEvent?.failedItemsCount).toBe(1);
    expect(capturedEvent?.conflictItemsCount).toBe(1);

    // 清理
    unsubscribe();
  });

  /**
   * 測試處理同步衝突
   */
  test("處理同步衝突", async () => {
    // 建立衝突測試資料
    const categoryId = "conflict-category";
    const localData: TestCategory = {
      id: categoryId,
      name: "本地版本",
      color: "#FF0000",
      syncStatus: SyncStatus.CONFLICT,
      conflictData: JSON.stringify({ name: "伺服器版本", color: "#0000FF" }),
    };

    await db.categories.add(localData);

    // 處理衝突 - 使用伺服器版本
    const serverData: TestCategory = {
      id: categoryId,
      name: "伺服器版本",
      color: "#0000FF",
    };
    await syncService.resolveConflict(
      "categories",
      categoryId,
      localData,
      serverData,
      "server"
    );

    // 驗證結果
    const resolvedCategory = await db.categories.get(categoryId);
    expect(resolvedCategory).toBeDefined();
    expect(resolvedCategory?.name).toBe("伺服器版本");
    expect(resolvedCategory?.color).toBe("#0000FF");
    expect(resolvedCategory?.syncStatus).toBe(SyncStatus.SYNCED);
    expect(resolvedCategory?.conflictData).toBeNull();
  });
});
