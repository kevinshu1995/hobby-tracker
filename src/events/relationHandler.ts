import { eventBus } from "./eventBus";
import { DataEvent } from "./dataEvents";
import {
  useCategoryStore,
  useHobbyStore,
  useGoalStore,
  useProgressStore,
} from "../store";

/**
 * 設置資料關聯處理器
 * 處理不同資料實體間的連鎖關係和反應機制
 * 例如：分類被刪除時，相關的興趣項目可能需要更新
 */
export function setupRelationHandlers(): () => void {
  console.debug("[RelationHandler] 初始化資料關聯處理器");

  // 存儲所有訂閱的取消函數，便於清理
  const unsubscribeFunctions: Array<() => void> = [];

  // 當分類被刪除時，可能需要更新相關的興趣項目
  const unsubCategoryDeleted = eventBus.subscribe(
    DataEvent.CATEGORY_DELETED,
    (categoryId: string) => {
      console.debug(
        `[RelationHandler] 分類被刪除 (${categoryId})，更新相關興趣項目`
      );
      // 重新載入興趣項目列表，以反映分類變更
      useHobbyStore.getState().fetchHobbies();
    }
  );
  unsubscribeFunctions.push(unsubCategoryDeleted);

  // 當分類被更新時，可能需要更新相關的興趣項目顯示
  const unsubCategoryUpdated = eventBus.subscribe(
    DataEvent.CATEGORY_UPDATED,
    () => {
      console.debug("[RelationHandler] 分類被更新，更新相關興趣項目顯示");
      // 重新載入興趣項目以刷新分類名稱或顏色等
      useHobbyStore.getState().fetchHobbies();
    }
  );
  unsubscribeFunctions.push(unsubCategoryUpdated);

  // 當興趣項目被刪除時，需要更新相關的目標
  const unsubHobbyDeleted = eventBus.subscribe(
    DataEvent.HOBBY_DELETED,
    (hobbyId: string) => {
      console.debug(
        `[RelationHandler] 興趣項目被刪除 (${hobbyId})，更新相關目標`
      );
      useGoalStore.getState().fetchGoals();
    }
  );
  unsubscribeFunctions.push(unsubHobbyDeleted);

  // 當目標被刪除時，可能需要更新相關的進度記錄
  const unsubGoalDeleted = eventBus.subscribe(
    DataEvent.GOAL_DELETED,
    (goalId: string) => {
      console.debug(
        `[RelationHandler] 目標被刪除 (${goalId})，更新相關進度記錄`
      );
      useProgressStore.getState().fetchProgress();
    }
  );
  unsubscribeFunctions.push(unsubGoalDeleted);

  // 當進度記錄新增或更新時，更新目標完成度
  const unsubProgressAdded = eventBus.subscribe(
    DataEvent.PROGRESS_ADDED,
    (progress: any) => {
      if (progress && progress.goalId) {
        console.debug(
          `[RelationHandler] 新增進度記錄，更新目標完成度 (${progress.goalId})`
        );
        useGoalStore.getState().calculateCompletionRate(progress.goalId);
      }
    }
  );
  unsubscribeFunctions.push(unsubProgressAdded);

  const unsubProgressUpdated = eventBus.subscribe(
    DataEvent.PROGRESS_UPDATED,
    (progress: any) => {
      if (progress && progress.goalId) {
        console.debug(
          `[RelationHandler] 更新進度記錄，更新目標完成度 (${progress.goalId})`
        );
        useGoalStore.getState().calculateCompletionRate(progress.goalId);
      }
    }
  );
  unsubscribeFunctions.push(unsubProgressUpdated);

  const unsubProgressDeleted = eventBus.subscribe(
    DataEvent.PROGRESS_DELETED,
    (data: any) => {
      if (data && data.goalId) {
        console.debug(
          `[RelationHandler] 刪除進度記錄，更新目標完成度 (${data.goalId})`
        );
        useGoalStore.getState().calculateCompletionRate(data.goalId);
      }
    }
  );
  unsubscribeFunctions.push(unsubProgressDeleted);

  // 當資料庫發生通用變更時，可能需要處理特殊情況
  const unsubDatabaseChanged = eventBus.subscribe(
    DataEvent.DATABASE_CHANGED,
    (data: any) => {
      // 這裡可以處理一些特定的資料庫通用變更邏輯
      console.debug("[RelationHandler] 資料庫變更:", data?.specificEvent);
    }
  );
  unsubscribeFunctions.push(unsubDatabaseChanged);

  // 返回取消所有訂閱的清理函數
  return () => {
    console.debug("[RelationHandler] 清理資料關聯處理器");
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
  };
}
