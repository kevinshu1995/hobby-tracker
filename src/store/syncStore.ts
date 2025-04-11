/**
 * 同步狀態管理 Store
 * 使用 Zustand 實現全域同步狀態的管理
 */

import { create } from "zustand";
import { GlobalSyncState, SyncStatus } from "../types/sync/SyncStatus";
import { eventBus } from "../events/eventBus";
import { SyncEvent, SyncGlobalStatusEventData } from "../services/SyncService";
import { DataEvent } from "../events/dataEvents";

/**
 * 同步統計資訊介面
 */
interface SyncStats {
  pendingItemsCount?: number;
  failedItemsCount?: number;
  conflictItemsCount?: number;
  [key: string]: any;
}

/**
 * 定義同步狀態 Store 的狀態與方法
 */
interface SyncStore extends GlobalSyncState {
  // 狀態變更方法
  startSync: () => void;
  completeSync: (stats?: SyncStats) => void;
  failSync: (error: string) => void;
  updateProgress: (progress: number) => void;
  updatePendingCount: (count: number) => void;
  updateFailedCount: (count: number) => void;
  updateConflictCount: (count: number) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  resetSyncState: () => void;
}

/**
 * 初始全域同步狀態
 */
const initialState: GlobalSyncState = {
  isSyncing: false,
  lastSyncAt: null,
  pendingItemsCount: 0,
  failedItemsCount: 0,
  conflictItemsCount: 0,
  syncProgress: 0,
  isOnline: navigator.onLine, // 初始網路狀態
  currentError: null,
};

/**
 * 建立同步狀態 Store
 */
export const useSyncStore = create<SyncStore>((set, get) => ({
  ...initialState,

  /**
   * 開始同步處理
   */
  startSync: () => {
    set({
      isSyncing: true,
      syncProgress: 0,
      currentError: null,
    });
    eventBus.publish(DataEvent.SYNC_STARTED);
  },

  /**
   * 完成同步處理
   * @param stats 同步統計資訊
   */
  completeSync: (stats) => {
    set({
      isSyncing: false,
      lastSyncAt: Date.now(),
      syncProgress: 100,
      currentError: null,
      ...stats, // 可能包含 pendingItemsCount 等統計資訊
    });
    eventBus.publish(DataEvent.SYNC_COMPLETED, stats);
  },

  /**
   * 同步失敗處理
   * @param error 錯誤訊息
   */
  failSync: (error) => {
    set({
      isSyncing: false,
      currentError: error,
    });
    eventBus.publish(DataEvent.SYNC_FAILED, { error });
  },

  /**
   * 更新同步進度
   * @param progress 進度百分比 (0-100)
   */
  updateProgress: (progress) => {
    set({ syncProgress: progress });
  },

  /**
   * 更新待同步項目計數
   * @param count 待同步項目數量
   */
  updatePendingCount: (count) => {
    set({ pendingItemsCount: count });
  },

  /**
   * 更新同步失敗項目計數
   * @param count 同步失敗項目數量
   */
  updateFailedCount: (count) => {
    set({ failedItemsCount: count });
  },

  /**
   * 更新同步衝突項目計數
   * @param count 同步衝突項目數量
   */
  updateConflictCount: (count) => {
    set({ conflictItemsCount: count });
  },

  /**
   * 設置網路連線狀態
   * @param isOnline 是否連線
   */
  setOnlineStatus: (isOnline) => {
    set({ isOnline });
  },

  /**
   * 重置同步狀態
   */
  resetSyncState: () => {
    set({
      ...initialState,
      isOnline: navigator.onLine, // 保持當前的網路狀態
    });
  },
}));

/**
 * 設置同步狀態事件監聽器
 * 用於監聽同步狀態變更事件，自動更新 Store 狀態
 */
export function setupSyncStateListeners() {
  // 監聽全域同步狀態變更事件
  eventBus.subscribe(
    SyncEvent.GLOBAL_SYNC_STATUS_CHANGED,
    (data: SyncGlobalStatusEventData) => {
      const { pendingItemsCount, failedItemsCount, conflictItemsCount } = data;
      const store = useSyncStore.getState();

      if (pendingItemsCount !== undefined) {
        store.updatePendingCount(pendingItemsCount);
      }

      if (failedItemsCount !== undefined) {
        store.updateFailedCount(failedItemsCount);
      }

      if (conflictItemsCount !== undefined) {
        store.updateConflictCount(conflictItemsCount);
      }
    }
  );

  // 監聽網路狀態變更
  window.addEventListener("online", () => {
    useSyncStore.getState().setOnlineStatus(true);
  });

  window.addEventListener("offline", () => {
    useSyncStore.getState().setOnlineStatus(false);
  });
}

// 自動設置事件監聽器
setupSyncStateListeners();
