import { db } from "../db/db";
import { Category } from "../types";
import { BaseService } from "./BaseService";
import { dbObserver } from "../events/dbObserver";
import { DataEvent } from "../events/dataEvents";
import { SyncOperationType, SyncStatus } from "../types/sync/SyncStatus";
import { syncService } from "./SyncService";

/**
 * 興趣分類資料存取服務
 * 提供對 Category 資料的存取與管理功能
 */
export class CategoryService extends BaseService<Category, string> {
  constructor() {
    super(db.categories, "categories"); // 傳遞表名作為第二個參數
  }

  /**
   * 依照創建時間排序取得所有分類
   */
  async getSortedByCreatedAt(): Promise<Category[]> {
    return this.executeDbOperation(
      () => this.table.orderBy("createdAt").toArray(),
      "依創建時間排序取得分類列表失敗"
    );
  }

  /**
   * 依照名稱搜尋分類
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Category[]> {
    return this.executeDbOperation(
      () =>
        this.table
          .filter((category) =>
            category.name.toLowerCase().includes(keyword.toLowerCase())
          )
          .toArray(),
      `搜尋包含關鍵字 "${keyword}" 的分類失敗`
    );
  }

  /**
   * 檢查是否有關聯的興趣項目
   * @param categoryId 分類 ID
   */
  async hasRelatedHobbies(categoryId: string): Promise<boolean> {
    return this.executeDbOperation(
      () =>
        db.hobbies
          .where("categoryId")
          .equals(categoryId)
          .count()
          .then((count) => count > 0),
      `檢查分類 ID 為 ${categoryId} 的相關興趣項目失敗`
    );
  }

  /**
   * 新增分類記錄並發出變更通知
   * @override
   * @param item 要新增的分類資料
   */
  async add(item: Category): Promise<string> {
    const id = await super.add(item);
    // 發出新增分類通知
    dbObserver.notifyChange(DataEvent.CATEGORY_ADDED, item);
    return id;
  }

  /**
   * 更新分類記錄並發出變更通知
   * @override
   * @param id 記錄 ID
   * @param changes 部分更新的欄位
   */
  async update(id: string, changes: any): Promise<string> {
    const updatedId = await super.update(id, changes);
    // 發出更新分類通知
    dbObserver.notifyChange(DataEvent.CATEGORY_UPDATED, { id, ...changes });
    return updatedId;
  }

  /**
   * 刪除分類記錄並發出變更通知
   * @override
   * @param id 記錄 ID
   */
  async delete(id: string): Promise<void> {
    await super.delete(id);
    // 發出刪除分類通知
    dbObserver.notifyChange(DataEvent.CATEGORY_DELETED, id);
  }

  /**
   * 安全刪除分類（檢查是否有關聯項目）
   * @param categoryId 分類 ID
   */
  async safeDelete(
    categoryId: string
  ): Promise<{ success: boolean; message?: string; confirmAction?: string }> {
    try {
      const hasRelated = await this.hasRelatedHobbies(categoryId);
      if (hasRelated) {
        return {
          success: false,
          message:
            "刪除此分類將同時刪除所有相關聯的興趣項目、目標及進度記錄。確定要繼續嗎？",
          confirmAction: "deleteWithRelated",
        };
      }

      await this.delete(categoryId);
      return { success: true };
    } catch (error) {
      console.error(`安全刪除分類 ID 為 ${categoryId} 失敗:`, error);
      return {
        success: false,
        message: `刪除失敗: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 使用事務刪除分類及其所有相關興趣項目、目標和進度記錄
   * @param categoryId 分類 ID
   */
  async deleteWithRelated(categoryId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction(
        "rw",
        [db.categories, db.hobbies, db.goals, db.progress],
        async () => {
          // 1. 取得所有相關的興趣項目
          const relatedHobbies = await db.hobbies
            .where("categoryId")
            .equals(categoryId)
            .toArray();

          // 2. 針對每個興趣項目，刪除其相關的目標和進度
          for (const hobby of relatedHobbies) {
            // 2.1 取得該興趣項目的所有目標
            const relatedGoals = await db.goals
              .where("hobbyId")
              .equals(hobby.id)
              .toArray();

            // 2.2 針對每個目標，刪除其相關的進度記錄
            for (const goal of relatedGoals) {
              // 標記相關進度記錄為待同步 (刪除)
              const progressRecords = await db.progress
                .where("goalId")
                .equals(goal.id)
                .toArray();

              for (const progress of progressRecords) {
                await syncService.markForSync(
                  "progress",
                  progress.id,
                  SyncOperationType.DELETE
                );
              }

              await db.progress.where("goalId").equals(goal.id).delete();
              // 發出刪除目標相關進度記錄通知
              dbObserver.notifyChange(DataEvent.PROGRESS_DELETED, {
                goalId: goal.id,
              });
            }

            // 標記目標為待同步 (刪除)
            for (const goal of relatedGoals) {
              await syncService.markForSync(
                "goals",
                goal.id,
                SyncOperationType.DELETE
              );
            }

            // 2.3 刪除該興趣項目的所有目標
            await db.goals.where("hobbyId").equals(hobby.id).delete();
            // 發出刪除興趣相關目標通知
            dbObserver.notifyChange(DataEvent.GOAL_DELETED, {
              hobbyId: hobby.id,
            });
          }

          // 標記興趣項目為待同步 (刪除)
          for (const hobby of relatedHobbies) {
            await syncService.markForSync(
              "hobbies",
              hobby.id,
              SyncOperationType.DELETE
            );
          }

          // 3. 刪除所有相關的興趣項目
          await db.hobbies.where("categoryId").equals(categoryId).delete();
          // 發出刪除分類相關興趣項目通知
          dbObserver.notifyChange(DataEvent.HOBBY_DELETED, { categoryId });

          // 標記分類為待同步 (刪除)
          await syncService.markForSync(
            "categories",
            categoryId,
            SyncOperationType.DELETE
          );

          // 4. 最後刪除分類本身
          await db.categories.delete(categoryId);
          // 發出刪除分類通知
          dbObserver.notifyChange(DataEvent.CATEGORY_DELETED, categoryId);
        }
      );
    }, `刪除分類 ID 為 ${categoryId} 及其相關聯的興趣項目、目標和進度記錄失敗`);
  }

  /**
   * 使用事務批次更新分類
   * @param categories 要更新的分類陣列
   */
  async bulkUpdateWithTransaction(categories: Category[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.categories, async () => {
        for (const category of categories) {
          // 更新同步狀態相關欄位
          const categoryWithSync = {
            ...category,
            syncStatus: SyncStatus.PENDING,
            localUpdatedAt: Date.now(),
            pendingOperation: SyncOperationType.UPDATE,
          };

          await db.categories.update(category.id, categoryWithSync);

          // 標記為待同步
          await syncService.markForSync(
            "categories",
            category.id,
            SyncOperationType.UPDATE
          );
        }
      });
      // 發出批次更新分類通知
      dbObserver.notifyChange(DataEvent.CATEGORY_CHANGED, {
        bulkUpdate: true,
        count: categories.length,
      });
    }, "批次更新分類失敗");
  }

  /**
   * 批次創建分類
   * @param categories 要創建的分類陣列
   */
  async bulkCreateWithTransaction(
    categories: Omit<Category, "id">[]
  ): Promise<string[]> {
    return this.executeDbOperation(async () => {
      const ids: string[] = [];
      const createdCategories: Category[] = [];
      const now = Date.now();

      await db.transaction("rw", db.categories, async () => {
        for (const category of categories) {
          const id = crypto.randomUUID();
          const newCategory = {
            ...category,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: SyncStatus.PENDING,
            localUpdatedAt: now,
            pendingOperation: SyncOperationType.CREATE,
          } as Category;

          await db.categories.add(newCategory);
          ids.push(id);
          createdCategories.push(newCategory);

          // 標記為待同步
          await syncService.markForSync(
            "categories",
            id,
            SyncOperationType.CREATE
          );
        }
      });

      // 發出批次創建分類通知
      dbObserver.notifyChange(DataEvent.CATEGORY_ADDED, {
        bulkAdd: true,
        categories: createdCategories,
      });

      return ids;
    }, "批次創建分類失敗");
  }
}

// 創建單例實例以供全局使用
export const categoryService = new CategoryService();
