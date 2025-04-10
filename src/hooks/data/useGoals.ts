import { useCallback, useEffect, useState } from "react";
import { goalService } from "../../services";
import { Goal, GoalPeriod, GoalType } from "../../types";

/**
 * 目標資料操作Hook
 * @returns 目標資料及操作方法
 */
export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completionRates, setCompletionRates] = useState<
    Record<string, number>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取所有目標資料
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await goalService.getSortedByCreatedAt();
      setGoals(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("取得目標資料失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 獲取指定興趣的目標資料
   * @param hobbyId 興趣項目ID
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const fetchGoalsByHobby = useCallback(async (hobbyId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await goalService.getByHobbyId(hobbyId);
      setGoals(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得興趣 ${hobbyId} 的目標資料失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 獲取指定類型的目標資料
   * @param type 目標類型
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const fetchGoalsByType = useCallback(async (type: GoalType) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await goalService.getByType(type);
      setGoals(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得類型 ${type} 的目標資料失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 獲取指定週期的目標資料
   * @param period 目標週期
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const fetchGoalsByPeriod = useCallback(async (period: GoalPeriod) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await goalService.getByPeriod(period);
      setGoals(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得週期 ${period} 的目標資料失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 新增目標
   * @param goal 不包含id、timestamps的目標資料
   * @returns 新增的目標ID
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const addGoal = useCallback(
    async (goalData: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
      setIsLoading(true);
      setError(null);

      try {
        // 生成完整物件（添加ID和時間戳）
        const now = new Date();
        const newGoal: Goal = {
          ...goalData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await goalService.add(newGoal);
        await fetchGoals(); // 重新取得列表
        return newGoal.id;
      } catch (err) {
        setError((err as Error).message);
        console.error("新增目標失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGoals]
  );

  /**
   * 更新目標
   * @param id 目標ID
   * @param data 要更新的部分目標資料
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const updateGoal = useCallback(
    async (id: string, data: Partial<Goal>) => {
      setIsLoading(true);
      setError(null);

      try {
        await goalService.update(id, {
          ...data,
          updatedAt: new Date(),
        });

        // 清除計算快取
        goalService.clearCompletionCache(id);

        await fetchGoals(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`更新目標 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGoals]
  );

  /**
   * 安全刪除目標（檢查關聯資料）
   * @param id 目標ID
   * @returns 刪除結果
   * @side-effect 可能更新狀態 (goals, isLoading, error)
   */
  const deleteGoal = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await goalService.safeDelete(id);
        if (result.success) {
          await fetchGoals(); // 重新取得列表
        }
        return result;
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除目標 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGoals]
  );

  /**
   * 刪除目標及其關聯資料
   * @param id 目標ID
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const deleteWithRelated = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await goalService.deleteWithRelated(id);
        await fetchGoals(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除目標 ${id} 及關聯資料失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGoals]
  );

  /**
   * 批次更新目標
   * @param updatedGoals 更新的目標陣列
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  const bulkUpdateGoals = useCallback(
    async (updatedGoals: Goal[]) => {
      setIsLoading(true);
      setError(null);

      try {
        await goalService.bulkUpdateWithTransaction(updatedGoals);
        await fetchGoals(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error("批次更新目標失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchGoals]
  );

  /**
   * 計算目標完成度
   * @param goalId 目標ID
   * @side-effect 更新狀態 (completionRates)
   */
  const calculateCompletion = useCallback(async (goalId: string) => {
    try {
      const completion = await goalService.calculateCompletion(goalId);
      setCompletionRates((prev) => ({
        ...prev,
        [goalId]: completion,
      }));
      return completion;
    } catch (err) {
      console.error(`計算目標 ${goalId} 完成度失敗:`, err);
      return 0;
    }
  }, []);

  /**
   * 計算所有目標完成度
   * @side-effect 更新狀態 (completionRates, isLoading, error)
   */
  const calculateAllCompletions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const rates: Record<string, number> = {};
      for (const goal of goals) {
        rates[goal.id] = await goalService.calculateCompletion(goal.id);
      }
      setCompletionRates(rates);
    } catch (err) {
      setError((err as Error).message);
      console.error("計算目標完成度失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, [goals]);

  // 初始載入資料
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // 載入資料後計算完成度
  useEffect(() => {
    if (goals.length > 0) {
      calculateAllCompletions();
    }
  }, [goals, calculateAllCompletions]);

  return {
    goals,
    completionRates,
    isLoading,
    error,
    fetchGoals,
    fetchGoalsByHobby,
    fetchGoalsByType,
    fetchGoalsByPeriod,
    addGoal,
    updateGoal,
    deleteGoal,
    deleteWithRelated,
    bulkUpdateGoals,
    calculateCompletion,
    calculateAllCompletions,
  };
}
