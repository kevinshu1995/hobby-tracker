import { create } from "zustand";
import { progressService } from "../services";
import { Progress } from "../types";

/**
 * 進度記錄狀態管理介面
 */
interface ProgressState {
  // 狀態
  progress: Progress[];
  isLoading: boolean;
  error: string | null;

  // 動作
  fetchProgress: (options?: {
    limit?: number;
    offset?: number;
    orderBy?: "asc" | "desc";
  }) => Promise<void>;
  fetchProgressByGoal: (goalId: string) => Promise<void>;
  fetchProgressByDateRange: (
    startDate: Date,
    endDate: Date,
    options?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ) => Promise<void>;
  fetchProgressByDate: (
    date: Date,
    options?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ) => Promise<void>;
  fetchProgressByGoalAndDate: (
    goalId: string,
    date: Date,
    options?: { limit?: number; offset?: number; orderBy?: "asc" | "desc" }
  ) => Promise<void>;
  fetchLatestProgress: (goalId: string, limit?: number) => Promise<void>;
  addProgress: (
    progressData: Omit<Progress, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateProgress: (id: string, data: Partial<Progress>) => Promise<void>;
  deleteProgress: (id: string) => Promise<void>;
  bulkAddProgress: (
    progressData: Omit<Progress, "id" | "createdAt" | "updatedAt">[]
  ) => Promise<string[]>;
  bulkUpdateProgress: (updatedProgress: Progress[]) => Promise<void>;
  calculateTotalProgress: (
    goalId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<number>;
}

/**
 * 進度記錄狀態管理 Store
 */
export const useProgressStore = create<ProgressState>((set, get) => ({
  // 初始狀態
  progress: [],
  isLoading: false,
  error: null,

  /**
   * 獲取所有進度記錄資料 (依記錄日期排序)
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchProgress: async (options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getSortedByRecordedAt(options);
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("取得進度記錄失敗:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定目標的進度記錄資料
   * @param goalId 目標ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchProgressByGoal: async (goalId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getByGoalId(goalId);
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得目標 ${goalId} 的進度記錄失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定日期範圍的進度記錄資料
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchProgressByDateRange: async (
    startDate: Date,
    endDate: Date,
    options = {}
  ) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getByDateRange(
        startDate,
        endDate,
        options
      );
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(
        `取得從 ${startDate.toLocaleDateString()} 到 ${endDate.toLocaleDateString()} 的進度記錄失敗:`,
        err
      );
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定日期的進度記錄資料
   * @param date 日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchProgressByDate: async (date: Date, options = {}) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getByDate(date, options);
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得 ${date.toLocaleDateString()} 的進度記錄失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定目標和日期的進度記錄資料
   * @param goalId 目標ID
   * @param date 日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchProgressByGoalAndDate: async (
    goalId: string,
    date: Date,
    options = {}
  ) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getByGoalAndDate(
        goalId,
        date,
        options
      );
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(
        `取得目標 ${goalId} 在 ${date.toLocaleDateString()} 的進度記錄失敗:`,
        err
      );
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取目標的最近進度記錄
   * @param goalId 目標ID
   * @param limit 記錄數量限制
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  fetchLatestProgress: async (goalId: string, limit = 1) => {
    set({ isLoading: true, error: null });

    try {
      const data = await progressService.getLatestRecords(goalId, limit);
      set({ progress: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得目標 ${goalId} 的最近進度記錄失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 新增進度記錄
   * @param progressData 不包含id、timestamps的進度記錄資料
   * @returns 新增的進度記錄ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  addProgress: async (
    progressData: Omit<Progress, "id" | "createdAt" | "updatedAt">
  ) => {
    set({ isLoading: true, error: null });

    try {
      // 生成完整物件（添加ID和時間戳）
      const now = new Date();
      const newProgress: Progress = {
        ...progressData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await progressService.add(newProgress);

      // 更新狀態
      const { progress } = get();
      set({ progress: [...progress, newProgress] });

      return newProgress.id;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("新增進度記錄失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 更新進度記錄
   * @param id 進度記錄ID
   * @param data 要更新的部分進度記錄資料
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  updateProgress: async (id: string, data: Partial<Progress>) => {
    set({ isLoading: true, error: null });

    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await progressService.update(id, updateData);

      // 更新狀態
      const { progress } = get();
      set({
        progress: progress.map((record) =>
          record.id === id ? { ...record, ...updateData } : record
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`更新進度記錄 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 刪除進度記錄
   * @param id 進度記錄ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  deleteProgress: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await progressService.delete(id);

      // 從狀態中移除該進度記錄
      const { progress } = get();
      set({
        progress: progress.filter((record) => record.id !== id),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`刪除進度記錄 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 批次新增進度記錄
   * @param recordsData 不包含id、timestamps的進度記錄資料陣列
   * @returns 新增的進度記錄ID陣列
   * @side-effect 更新狀態 (isLoading, error)
   */
  bulkAddProgress: async (
    recordsData: Omit<Progress, "id" | "createdAt" | "updatedAt">[]
  ) => {
    set({ isLoading: true, error: null });

    try {
      // 生成完整物件（添加ID和時間戳）
      const now = new Date();
      const completeRecords = recordsData.map((record) => ({
        ...record,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      })) as Progress[];

      const ids = await progressService.bulkAddWithTransaction(completeRecords);

      // 更新狀態
      const { progress } = get();
      set({
        progress: [...progress, ...completeRecords],
      });

      return ids;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("批次新增進度記錄失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 批次更新進度記錄
   * @param updatedRecords 更新的進度記錄陣列
   * @side-effect 更新狀態 (isLoading, error)
   */
  bulkUpdateProgress: async (updatedRecords: Progress[]) => {
    set({ isLoading: true, error: null });

    try {
      await progressService.bulkUpdateWithTransaction(updatedRecords);

      // 更新狀態
      const { progress } = get();
      const updatedRecordsMap = new Map(updatedRecords.map((r) => [r.id, r]));

      set({
        progress: progress.map((record) =>
          updatedRecordsMap.has(record.id)
            ? updatedRecordsMap.get(record.id)!
            : record
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("批次更新進度記錄失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 計算目標在指定時間範圍內的累計進度
   * @param goalId 目標ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 累計進度值
   */
  calculateTotalProgress: async (
    goalId: string,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      return await progressService.calculateTotalProgress(
        goalId,
        startDate,
        endDate
      );
    } catch (err) {
      console.error(`計算目標 ${goalId} 的累計進度失敗:`, err);
      return 0;
    }
  },
}));
