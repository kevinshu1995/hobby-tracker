import { useCallback, useState } from "react";
import { progressService } from "../../services";
import { Progress } from "../../types";

/**
 * 進度記錄資料操作Hook
 * @returns 進度記錄資料及操作方法
 */
export function useProgress() {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取所有進度記錄資料 (依記錄日期排序)
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchProgress = useCallback(
    async (
      options: {
        limit?: number;
        offset?: number;
        orderBy?: "asc" | "desc";
      } = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await progressService.getSortedByRecordedAt(options);
        setProgress(data);
      } catch (err) {
        setError((err as Error).message);
        console.error("取得進度記錄失敗:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 獲取指定目標的進度記錄資料
   * @param goalId 目標ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchProgressByGoal = useCallback(async (goalId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await progressService.getByGoalId(goalId);
      setProgress(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得目標 ${goalId} 的進度記錄失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 獲取指定日期範圍的進度記錄資料
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchProgressByDateRange = useCallback(
    async (
      startDate: Date,
      endDate: Date,
      options: {
        limit?: number;
        offset?: number;
        orderBy?: "asc" | "desc";
      } = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await progressService.getByDateRange(
          startDate,
          endDate,
          options
        );
        setProgress(data);
      } catch (err) {
        setError((err as Error).message);
        console.error(
          `取得從 ${startDate.toLocaleDateString()} 到 ${endDate.toLocaleDateString()} 的進度記錄失敗:`,
          err
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 獲取指定日期的進度記錄資料
   * @param date 日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchProgressByDate = useCallback(
    async (
      date: Date,
      options: {
        limit?: number;
        offset?: number;
        orderBy?: "asc" | "desc";
      } = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await progressService.getByDate(date, options);
        setProgress(data);
      } catch (err) {
        setError((err as Error).message);
        console.error(`取得 ${date.toLocaleDateString()} 的進度記錄失敗:`, err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 獲取指定目標和日期的進度記錄資料
   * @param goalId 目標ID
   * @param date 日期
   * @param options 選項（分頁、排序方向）
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchProgressByGoalAndDate = useCallback(
    async (
      goalId: string,
      date: Date,
      options: {
        limit?: number;
        offset?: number;
        orderBy?: "asc" | "desc";
      } = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await progressService.getByGoalAndDate(
          goalId,
          date,
          options
        );
        setProgress(data);
      } catch (err) {
        setError((err as Error).message);
        console.error(
          `取得目標 ${goalId} 在 ${date.toLocaleDateString()} 的進度記錄失敗:`,
          err
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 新增進度記錄
   * @param progressData 不包含id、timestamps的進度記錄資料
   * @returns 新增的進度記錄ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const addProgress = useCallback(
    async (progressData: Omit<Progress, "id" | "createdAt" | "updatedAt">) => {
      setIsLoading(true);
      setError(null);

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
        await fetchProgressByGoal(newProgress.goalId); // 重新取得該目標的進度列表
        return newProgress.id;
      } catch (err) {
        setError((err as Error).message);
        console.error("新增進度記錄失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProgressByGoal]
  );

  /**
   * 更新進度記錄
   * @param id 進度記錄ID
   * @param data 要更新的部分進度記錄資料
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const updateProgress = useCallback(
    async (id: string, data: Partial<Progress>) => {
      setIsLoading(true);
      setError(null);

      try {
        // 取得原始記錄以獲取goalId
        const original = await progressService.getById(id);
        if (!original) {
          throw new Error(`找不到ID為 ${id} 的進度記錄`);
        }

        await progressService.update(id, {
          ...data,
          updatedAt: new Date(),
        });

        await fetchProgressByGoal(original.goalId); // 重新取得該目標的進度列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`更新進度記錄 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProgressByGoal]
  );

  /**
   * 刪除進度記錄
   * @param id 進度記錄ID
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const deleteProgress = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // 取得原始記錄以獲取goalId
        const original = await progressService.getById(id);
        if (!original) {
          throw new Error(`找不到ID為 ${id} 的進度記錄`);
        }

        await progressService.delete(id);
        await fetchProgressByGoal(original.goalId); // 重新取得該目標的進度列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除進度記錄 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProgressByGoal]
  );

  /**
   * 批次新增進度記錄
   * @param recordsData 不包含id、timestamps的進度記錄資料陣列
   * @returns 新增的進度記錄ID陣列
   * @side-effect 更新狀態 (isLoading, error)
   */
  const bulkAddProgress = useCallback(
    async (recordsData: Omit<Progress, "id" | "createdAt" | "updatedAt">[]) => {
      setIsLoading(true);
      setError(null);

      try {
        // 生成完整物件（添加ID和時間戳）
        const now = new Date();
        const completeRecords = recordsData.map((record) => ({
          ...record,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        })) as Progress[];

        return await progressService.bulkAddWithTransaction(completeRecords);
      } catch (err) {
        setError((err as Error).message);
        console.error("批次新增進度記錄失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * 批次更新進度記錄
   * @param updatedRecords 更新的進度記錄陣列
   * @side-effect 更新狀態 (isLoading, error)
   */
  const bulkUpdateProgress = useCallback(async (updatedRecords: Progress[]) => {
    setIsLoading(true);
    setError(null);

    try {
      await progressService.bulkUpdateWithTransaction(updatedRecords);
    } catch (err) {
      setError((err as Error).message);
      console.error("批次更新進度記錄失敗:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 計算目標在指定時間範圍內的累計進度
   * @param goalId 目標ID
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @returns 累計進度值
   */
  const calculateTotalProgress = useCallback(
    async (goalId: string, startDate: Date, endDate: Date) => {
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
    []
  );

  /**
   * 獲取目標的最近進度記錄
   * @param goalId 目標ID
   * @param limit 記錄數量限制
   * @side-effect 更新狀態 (progress, isLoading, error)
   */
  const fetchLatestProgress = useCallback(async (goalId: string, limit = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await progressService.getLatestRecords(goalId, limit);
      setProgress(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得目標 ${goalId} 的最近進度記錄失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    progress,
    isLoading,
    error,
    fetchProgress,
    fetchProgressByGoal,
    fetchProgressByDateRange,
    fetchProgressByDate,
    fetchProgressByGoalAndDate,
    fetchLatestProgress,
    addProgress,
    updateProgress,
    deleteProgress,
    bulkAddProgress,
    bulkUpdateProgress,
    calculateTotalProgress,
  };
}
