import { useEffect } from "react";
import {
  useCategoryStore,
  useHobbyStore,
  useGoalStore,
  useProgressStore,
} from "../../store";

/**
 * 整合所有資料存儲並處理初始加載的 Hook
 * 用於在元件中方便地獲取所有必要的資料和狀態
 */
export function useCombinedStore() {
  // 獲取各個 store 的狀態和方法
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    fetchCategories,
  } = useCategoryStore();

  const {
    hobbies,
    isLoading: hobbiesLoading,
    error: hobbiesError,
    fetchHobbies,
    fetchHobbiesByCategory,
  } = useHobbyStore();

  const {
    goals,
    completionRates,
    isLoading: goalsLoading,
    error: goalsError,
    fetchGoals,
    fetchGoalsByHobby,
    calculateAllCompletions,
  } = useGoalStore();

  const {
    progress,
    isLoading: progressLoading,
    error: progressError,
    fetchProgress,
  } = useProgressStore();

  // 合併載入狀態和錯誤狀態
  const isLoading =
    categoriesLoading || hobbiesLoading || goalsLoading || progressLoading;
  const error = categoriesError || hobbiesError || goalsError || progressError;

  // 初始載入所有資料
  useEffect(() => {
    // 依序載入資料（因資料之間有關聯性，所以非同步執行可能會導致資料不一致）
    const loadData = async () => {
      await fetchCategories();
      await fetchHobbies();
      await fetchGoals();
      await fetchProgress({ limit: 10, orderBy: "desc" }); // 只獲取最近10筆進度記錄
    };

    loadData();

    // 元件卸載時不需要清理這些資料，因為它們可以在全局共享
  }, [fetchCategories, fetchHobbies, fetchGoals, fetchProgress]);

  // 根據選定的分類篩選興趣項目
  const filterHobbiesByCategory = async (categoryId: string | null) => {
    if (categoryId) {
      await fetchHobbiesByCategory(categoryId);
    } else {
      await fetchHobbies();
    }
  };

  // 根據選定的興趣項目篩選目標
  const filterGoalsByHobby = async (hobbyId: string | null) => {
    if (hobbyId) {
      await fetchGoalsByHobby(hobbyId);
    } else {
      await fetchGoals();
    }
  };

  return {
    // 資料
    categories,
    hobbies,
    goals,
    progress,
    completionRates,

    // 狀態
    isLoading,
    error,

    // 篩選方法
    filterHobbiesByCategory,
    filterGoalsByHobby,

    // 直接暴露各個 store 以方便存取原始方法
    categoryStore: useCategoryStore,
    hobbyStore: useHobbyStore,
    goalStore: useGoalStore,
    progressStore: useProgressStore,
  };
}
