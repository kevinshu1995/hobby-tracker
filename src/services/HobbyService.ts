import { db } from "../db/db";
import { Hobby } from "../types";
import { BaseService } from "./BaseService";
import { dbObserver } from "../events/dbObserver";
import { DataEvent } from "../events/dataEvents";
import { SyncOperationType, SyncStatus } from "../types/sync/SyncStatus";
import { syncService } from "./SyncService";

/**
 * 興趣項目資料存取服務
 * 提供對 Hobby 資料的存取與管理功能
 */
export class HobbyService extends BaseService<Hobby, string> {
  constructor() {
    super(db.hobbies, "hobbies"); // 傳遞表名作為第二個參數
  }

  /**
   * 依照分類 ID 取得興趣項目列表
   * @param categoryId 分類 ID
   */
  async getByCategoryId(categoryId: string): Promise<Hobby[]> {
    return this.executeDbOperation(
      () => this.table.where("categoryId").equals(categoryId).toArray(),
      `取得分類 ID 為 ${categoryId} 的興趣項目列表失敗`
    );
  }

  /**
   * 依照名稱搜尋興趣項目
   * @param keyword 搜尋關鍵字
   */
  async searchByName(keyword: string): Promise<Hobby[]> {
    return this.executeDbOperation(
      () =>
        this.table
          .filter((hobby) =>
            hobby.name.toLowerCase().includes(keyword.toLowerCase())
          )
          .toArray(),
      `搜尋包含關鍵字 "${keyword}" 的興趣項目失敗`
    );
  }

  /**
   * 依照創建時間排序取得所有興趣項目
   */
  async getSortedByCreatedAt(): Promise<Hobby[]> {
    return this.executeDbOperation(
      () => this.table.orderBy("createdAt").toArray(),
      "依創建時間排序取得興趣項目列表失敗"
    );
  }

  /**
   * 檢查是否有關聯的目標
   * @param hobbyId 興趣項目 ID
   */
  async hasRelatedGoals(hobbyId: string): Promise<boolean> {
    return this.executeDbOperation(
      () =>
        db.goals
          .where("hobbyId")
          .equals(hobbyId)
          .count()
          .then((count) => count > 0),
      `檢查興趣項目 ID 為 ${hobbyId} 的相關目標失敗`
    );
  }

  /**
   * 新增興趣項目記錄並發出變更通知
   * @override
   * @param item 要新增的興趣項目資料
   */
  async add(item: Hobby): Promise<string> {
    const id = await super.add(item);
    // 發出新增興趣項目通知
    dbObserver.notifyChange(DataEvent.HOBBY_ADDED, item);
    return id;
  }

  /**
   * 更新興趣項目記錄並發出變更通知
   * @override
   * @param id 記錄 ID
   * @param changes 部分更新的欄位
   */
  async update(id: string, changes: Partial<Hobby>): Promise<string> {
    const updatedId = await super.update(id, changes);
    // 發出更新興趣項目通知
    dbObserver.notifyChange(DataEvent.HOBBY_UPDATED, { id, ...changes });
    return updatedId;
  }

  /**
   * 刪除興趣項目記錄並發出變更通知
   * @override
   * @param id 記錄 ID
   */
  async delete(id: string): Promise<void> {
    await super.delete(id);
    // 發出刪除興趣項目通知
    dbObserver.notifyChange(DataEvent.HOBBY_DELETED, id);
  }

  /**
   * 安全刪除興趣項目（檢查是否有關聯目標）
   * @param hobbyId 興趣項目 ID
   */
  async safeDelete(
    hobbyId: string
  ): Promise<{ success: boolean; message?: string; confirmAction?: string }> {
    try {
      const hasRelated = await this.hasRelatedGoals(hobbyId);
      if (hasRelated) {
        return {
          success: false,
          message:
            "刪除此興趣項目將同時刪除所有相關的目標及進度記錄。確定要繼續嗎？",
          confirmAction: "deleteWithRelated",
        };
      }

      await this.delete(hobbyId);
      return { success: true };
    } catch (error) {
      console.error(`安全刪除興趣項目 ID 為 ${hobbyId} 失敗:`, error);
      return {
        success: false,
        message: `刪除失敗: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 使用事務刪除興趣項目及其所有相關目標和進度記錄
   * @param hobbyId 興趣項目 ID
   */
  async deleteWithRelated(hobbyId: string): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction(
        "rw",
        [db.hobbies, db.goals, db.progress],
        async () => {
          // 先取得所有相關的目標
          const relatedGoals = await db.goals
            .where("hobbyId")
            .equals(hobbyId)
            .toArray();

          // 刪除所有相關的進度記錄
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

          // 刪除所有相關的目標
          await db.goals.where("hobbyId").equals(hobbyId).delete();
          // 發出刪除興趣項目相關目標通知
          dbObserver.notifyChange(DataEvent.GOAL_DELETED, {
            hobbyId,
          });

          // 標記興趣項目為待同步 (刪除)
          await syncService.markForSync(
            "hobbies",
            hobbyId,
            SyncOperationType.DELETE
          );

          // 最後刪除興趣項目本身
          await db.hobbies.delete(hobbyId);
          // 發出刪除興趣項目通知
          dbObserver.notifyChange(DataEvent.HOBBY_DELETED, hobbyId);
        }
      );
    }, `刪除興趣項目 ID 為 ${hobbyId} 及其相關目標和進度記錄失敗`);
  }

  /**
   * 使用事務批次更新興趣項目
   * @param hobbies 要更新的興趣項目陣列
   */
  async bulkUpdateWithTransaction(hobbies: Hobby[]): Promise<void> {
    return this.executeDbOperation(async () => {
      await db.transaction("rw", db.hobbies, async () => {
        for (const hobby of hobbies) {
          // 更新同步狀態相關欄位
          const hobbyWithSync = {
            ...hobby,
            syncStatus: SyncStatus.PENDING,
            localUpdatedAt: Date.now(),
            pendingOperation: SyncOperationType.UPDATE,
          };

          await db.hobbies.update(hobby.id, hobbyWithSync);

          // 標記為待同步
          await syncService.markForSync(
            "hobbies",
            hobby.id,
            SyncOperationType.UPDATE
          );
        }
      });
      // 發出批次更新興趣項目通知
      dbObserver.notifyChange(DataEvent.HOBBY_CHANGED, {
        bulkUpdate: true,
        count: hobbies.length,
      });
    }, "批次更新興趣項目失敗");
  }

  /**
   * 批次創建興趣項目
   * @param hobbies 要創建的興趣項目陣列
   */
  async bulkCreateWithTransaction(
    hobbies: Omit<Hobby, "id">[]
  ): Promise<string[]> {
    return this.executeDbOperation(async () => {
      const ids: string[] = [];
      const createdHobbies: Hobby[] = [];
      const now = Date.now();

      await db.transaction("rw", db.hobbies, async () => {
        for (const hobby of hobbies) {
          const id = crypto.randomUUID();
          const newHobby = {
            ...hobby,
            id,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncStatus: SyncStatus.PENDING,
            localUpdatedAt: now,
            pendingOperation: SyncOperationType.CREATE,
          } as Hobby;

          await db.hobbies.add(newHobby);
          ids.push(id);
          createdHobbies.push(newHobby);

          // 標記為待同步
          await syncService.markForSync(
            "hobbies",
            id,
            SyncOperationType.CREATE
          );
        }
      });

      // 發出批次創建興趣項目通知
      dbObserver.notifyChange(DataEvent.HOBBY_ADDED, {
        bulkAdd: true,
        hobbies: createdHobbies,
      });

      return ids;
    }, "批次創建興趣項目失敗");
  }
}

// 創建單例實例以供全局使用
export const hobbyService = new HobbyService();
