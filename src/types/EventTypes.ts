import { DataEvent, DataEventPayload } from "../events/dataEvents";
import { Progress } from "./Progress";
import { Goal } from "./Goal";
import { Hobby } from "./Hobby";
import { Category } from "./Category";

/**
 * 進度刪除事件的資料結構
 */
export interface ProgressDeleteData {
  id: string;
  goalId: string;
}

/**
 * 資料庫變更事件的資料結構
 */
export interface DatabaseChangeData {
  specificEvent?: string;
  [key: string]: string | number | boolean | Date | object | null | undefined;
}

/**
 * 事件名稱到事件資料型別的映射
 */
export interface EventDataMap {
  // 分類相關事件
  [DataEvent.CATEGORY_CHANGED]: DataEventPayload<Category>;
  [DataEvent.CATEGORY_ADDED]: DataEventPayload<Category>;
  [DataEvent.CATEGORY_UPDATED]: DataEventPayload<Category>;
  [DataEvent.CATEGORY_DELETED]: string; // categoryId

  // 興趣項目相關事件
  [DataEvent.HOBBY_CHANGED]: DataEventPayload<Hobby>;
  [DataEvent.HOBBY_ADDED]: DataEventPayload<Hobby>;
  [DataEvent.HOBBY_UPDATED]: DataEventPayload<Hobby>;
  [DataEvent.HOBBY_DELETED]: string; // hobbyId

  // 目標相關事件
  [DataEvent.GOAL_CHANGED]: DataEventPayload<Goal>;
  [DataEvent.GOAL_ADDED]: DataEventPayload<Goal>;
  [DataEvent.GOAL_UPDATED]: DataEventPayload<Goal>;
  [DataEvent.GOAL_DELETED]: string; // goalId

  // 進度相關事件
  [DataEvent.PROGRESS_CHANGED]: DataEventPayload<Progress>;
  [DataEvent.PROGRESS_ADDED]: Progress;
  [DataEvent.PROGRESS_UPDATED]: Progress;
  [DataEvent.PROGRESS_DELETED]: ProgressDeleteData;

  // 資料庫層級事件
  [DataEvent.DATABASE_CHANGED]: DatabaseChangeData;

  // 同步相關事件
  [DataEvent.SYNC_STARTED]: { source: string };
  [DataEvent.SYNC_COMPLETED]: { changesCount: number };
  [DataEvent.SYNC_FAILED]: { error: string };
}

// 擴展字串型別以包含所有自定義事件
export type EventName = keyof EventDataMap | string;

// 獲取指定事件名稱對應的資料型別
export type EventData<T extends EventName> = T extends keyof EventDataMap
  ? EventDataMap[T]
  : never;
