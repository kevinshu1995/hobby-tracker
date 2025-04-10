import { create } from "zustand";
import { goalService } from "../services";
import { Goal, GoalPeriod, GoalType } from "../types";

/**
 * 目標狀態管理介面
 */
interface GoalState {
  // 狀態
  goals: Goal[];
  completionRates: Record<string, number>;
  isLoading: boolean;
  error: string | null;

  // 動作
  fetchGoals: () => Promise<void>;
  fetchGoalsByHobby: (hobbyId: string) => Promise<void>;
  fetchGoalsByType: (type: GoalType) => Promise<void>;
  fetchGoalsByPeriod: (period: GoalPeriod) => Promise<void>;
  addGoal: (
    goal: Omit<Goal, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (
    id: string
  ) => Promise<{ success: boolean; message?: string; confirmAction?: string }>;
  deleteWithRelated: (id: string) => Promise<void>;
  bulkUpdateGoals: (goals: Goal[]) => Promise<void>;
  calculateCompletion: (goalId: string) => Promise<number>;
  calculateAllCompletions: () => Promise<void>;
  clearCompletionCache: (goalId?: string) => void;
}

/**
 * 目標狀態管理 Store
 */
export const useGoalStore = create<GoalState>((set, get) => ({
  // 初始狀態
  goals: [],
  completionRates: {},
  isLoading: false,
  error: null,

  /**
   * 獲取所有目標資料
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  fetchGoals: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await goalService.getSortedByCreatedAt();
      set({ goals: data });

      // 在載入資料後，觸發計算完成度
      const { calculateAllCompletions } = get();
      setTimeout(() => calculateAllCompletions(), 0); // 非同步執行避免阻塞UI
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("取得目標資料失敗:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定興趣的目標資料
   * @param hobbyId 興趣項目ID
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  fetchGoalsByHobby: async (hobbyId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await goalService.getByHobbyId(hobbyId);
      set({ goals: data });

      // 在載入資料後，觸發計算完成度
      const { calculateAllCompletions } = get();
      setTimeout(() => calculateAllCompletions(), 0);
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得興趣 ${hobbyId} 的目標資料失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定類型的目標資料
   * @param type 目標類型
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  fetchGoalsByType: async (type: GoalType) => {
    set({ isLoading: true, error: null });

    try {
      const data = await goalService.getByType(type);
      set({ goals: data });

      // 在載入資料後，觸發計算完成度
      const { calculateAllCompletions } = get();
      setTimeout(() => calculateAllCompletions(), 0);
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得類型 ${type} 的目標資料失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定週期的目標資料
   * @param period 目標週期
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  fetchGoalsByPeriod: async (period: GoalPeriod) => {
    set({ isLoading: true, error: null });

    try {
      const data = await goalService.getByPeriod(period);
      set({ goals: data });

      // 在載入資料後，觸發計算完成度
      const { calculateAllCompletions } = get();
      setTimeout(() => calculateAllCompletions(), 0);
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得週期 ${period} 的目標資料失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 新增目標
   * @param goalData 不包含id、timestamps的目標資料
   * @returns 新增的目標ID
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  addGoal: async (goalData: Omit<Goal, "id" | "createdAt" | "updatedAt">) => {
    set({ isLoading: true, error: null });

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

      // 更新狀態
      const { goals } = get();
      set({ goals: [...goals, newGoal] });

      return newGoal.id;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("新增目標失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 更新目標
   * @param id 目標ID
   * @param data 要更新的部分目標資料
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  updateGoal: async (id: string, data: Partial<Goal>) => {
    set({ isLoading: true, error: null });

    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await goalService.update(id, updateData);

      // 清除計算快取
      goalService.clearCompletionCache(id);

      // 更新狀態
      const { goals, calculateCompletion } = get();
      set({
        goals: goals.map((goal) =>
          goal.id === id ? { ...goal, ...updateData } : goal
        ),
      });

      // 重新計算完成度
      setTimeout(() => calculateCompletion(id), 0);
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`更新目標 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 安全刪除目標（檢查關聯資料）
   * @param id 目標ID
   * @returns 刪除結果
   * @side-effect 可能更新狀態 (goals, completionRates, isLoading, error)
   */
  deleteGoal: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await goalService.safeDelete(id);

      // 如果刪除成功，從狀態中移除該目標及其完成度
      if (result.success) {
        const { goals, completionRates } = get();
        const newCompletionRates = { ...completionRates };
        delete newCompletionRates[id];

        set({
          goals: goals.filter((goal) => goal.id !== id),
          completionRates: newCompletionRates,
        });
      }

      return result;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`刪除目標 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 刪除目標及其關聯資料
   * @param id 目標ID
   * @side-effect 更新狀態 (goals, completionRates, isLoading, error)
   */
  deleteWithRelated: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await goalService.deleteWithRelated(id);

      // 從狀態中移除該目標及其完成度
      const { goals, completionRates } = get();
      const newCompletionRates = { ...completionRates };
      delete newCompletionRates[id];

      set({
        goals: goals.filter((goal) => goal.id !== id),
        completionRates: newCompletionRates,
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`刪除目標 ${id} 及關聯資料失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 批次更新目標
   * @param updatedGoals 更新的目標陣列
   * @side-effect 更新狀態 (goals, isLoading, error)
   */
  bulkUpdateGoals: async (updatedGoals: Goal[]) => {
    set({ isLoading: true, error: null });

    try {
      await goalService.bulkUpdateWithTransaction(updatedGoals);

      // 更新狀態
      const { goals } = get();
      const updatedGoalsMap = new Map(updatedGoals.map((g) => [g.id, g]));

      set({
        goals: goals.map((goal) =>
          updatedGoalsMap.has(goal.id) ? updatedGoalsMap.get(goal.id)! : goal
        ),
      });

      // 清除這些目標的完成度快取並重新計算
      updatedGoals.forEach((goal) => {
        goalService.clearCompletionCache(goal.id);
      });

      // 重新計算所有目標的完成度
      const { calculateAllCompletions } = get();
      setTimeout(() => calculateAllCompletions(), 0);
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("批次更新目標失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 計算目標完成度
   * @param goalId 目標ID
   * @returns 完成度（0-1之間的數值）
   * @side-effect 更新狀態 (completionRates)
   */
  calculateCompletion: async (goalId: string) => {
    try {
      const completion = await goalService.calculateCompletion(goalId);

      // 更新完成度狀態
      set((state) => ({
        completionRates: {
          ...state.completionRates,
          [goalId]: completion,
        },
      }));

      return completion;
    } catch (err) {
      console.error(`計算目標 ${goalId} 完成度失敗:`, err);
      return 0;
    }
  },

  /**
   * 計算所有目標完成度
   * @side-effect 更新狀態 (completionRates, isLoading, error)
   */
  calculateAllCompletions: async () => {
    const { goals } = get();
    if (goals.length === 0) return;

    try {
      const rates: Record<string, number> = {};

      // 非同步計算所有目標的完成度
      await Promise.all(
        goals.map(async (goal) => {
          const completion = await goalService.calculateCompletion(goal.id);
          rates[goal.id] = completion;
        })
      );

      // 更新所有完成度
      set({ completionRates: rates });
    } catch (err) {
      console.error("計算目標完成度失敗:", err);
    }
  },

  /**
   * 清除目標完成度快取
   * @param goalId 目標ID，若未提供則清除所有快取
   */
  clearCompletionCache: (goalId?: string) => {
    goalService.clearCompletionCache(goalId);

    // 如果提供了特定ID，只清除該ID的完成度快取
    if (goalId) {
      set((state) => {
        const newCompletionRates = { ...state.completionRates };
        delete newCompletionRates[goalId];
        return { completionRates: newCompletionRates };
      });
    } else {
      // 否則清除所有完成度快取
      set({ completionRates: {} });
    }
  },
}));
