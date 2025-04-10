import { create } from "zustand";
import { categoryService } from "../services";
import { Category } from "../types";
import { DataEvent } from "../events/dataEvents";
import { eventBus } from "../events/eventBus";

/**
 * 分類狀態管理介面
 */
interface CategoryState {
  // 狀態
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  // 動作
  fetchCategories: () => Promise<void>;
  searchCategories: (keyword: string) => Promise<void>;
  addCategory: (
    category: Omit<Category, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (
    id: string
  ) => Promise<{ success: boolean; message?: string; confirmAction?: string }>;
  deleteWithRelated: (id: string) => Promise<void>;
  bulkUpdateCategories: (categories: Category[]) => Promise<void>;

  // 事件處理
  setupEventListeners: () => () => void;
  cleanup: () => void;
}

/**
 * 分類狀態管理 Store
 */
export const useCategoryStore = create<CategoryState>((set, get) => {
  // 存儲事件訂閱的取消函數
  let unsubscriptions: Array<() => void> = [];

  return {
    // 初始狀態
    categories: [],
    isLoading: false,
    error: null,

    /**
     * 設置資料變更事件監聽器
     * @returns 清理函數，用於取消訂閱
     */
    setupEventListeners: () => {
      console.debug("[CategoryStore] 設置資料變更事件監聽器");
      // 清除可能的現有訂閱
      get().cleanup();

      // 監聽分類資料變更事件，自動更新 store
      const unsubscribeFunctions: Array<() => void> = [];

      // 當有新增分類時更新狀態
      const unsubAdd = eventBus.subscribe(
        DataEvent.CATEGORY_ADDED,
        (category) => {
          console.debug("[CategoryStore] 收到新增分類事件", category);
          if (category) {
            // 如果是批量新增
            if (category.bulkAdd && Array.isArray(category.categories)) {
              const { categories } = get();
              set({
                categories: [...categories, ...category.categories],
              });
            }
            // 單一新增且非來自本 store 的操作
            else if (category.id) {
              const { categories } = get();
              // 檢查是否已經存在，避免重複新增
              if (!categories.some((c) => c.id === category.id)) {
                set({ categories: [...categories, category] });
              }
            }
          }
        }
      );
      unsubscribeFunctions.push(unsubAdd);

      // 當有更新分類時更新狀態
      const unsubUpdate = eventBus.subscribe(
        DataEvent.CATEGORY_UPDATED,
        (data) => {
          console.debug("[CategoryStore] 收到更新分類事件", data);
          if (data && data.id) {
            const { categories } = get();
            set({
              categories: categories.map((category) =>
                category.id === data.id ? { ...category, ...data } : category
              ),
            });
          }
        }
      );
      unsubscribeFunctions.push(unsubUpdate);

      // 當有刪除分類時更新狀態
      const unsubDelete = eventBus.subscribe(
        DataEvent.CATEGORY_DELETED,
        (categoryId) => {
          console.debug("[CategoryStore] 收到刪除分類事件", categoryId);
          if (categoryId) {
            const { categories } = get();
            set({
              categories: categories.filter(
                (category) => category.id !== categoryId
              ),
            });
          }
        }
      );
      unsubscribeFunctions.push(unsubDelete);

      // 當收到通用的分類變更事件時，重新獲取所有分類資料
      const unsubChange = eventBus.subscribe(DataEvent.CATEGORY_CHANGED, () => {
        console.debug("[CategoryStore] 收到分類變更事件，重新獲取所有分類");
        get().fetchCategories();
      });
      unsubscribeFunctions.push(unsubChange);

      // 儲存取消訂閱函數
      unsubscriptions = unsubscribeFunctions;

      // 返回清理函數
      return () => {
        console.debug("[CategoryStore] 清理資料變更事件監聽器");
        unsubscribeFunctions.forEach((unsub) => unsub());
      };
    },

    /**
     * 清理事件訂閱
     */
    cleanup: () => {
      console.debug("[CategoryStore] 清理所有事件訂閱");
      unsubscriptions.forEach((unsub) => unsub());
      unsubscriptions = [];
    },

    /**
     * 獲取所有分類資料
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    fetchCategories: async () => {
      set({ isLoading: true, error: null });

      try {
        const data = await categoryService.getSortedByCreatedAt();
        set({ categories: data });
      } catch (err) {
        set({ error: (err as Error).message });
        console.error("取得分類資料失敗:", err);
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 搜尋分類
     * @param keyword 搜尋關鍵字
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    searchCategories: async (keyword: string) => {
      set({ isLoading: true, error: null });

      try {
        const data = await categoryService.searchByName(keyword);
        set({ categories: data });
      } catch (err) {
        set({ error: (err as Error).message });
        console.error("搜尋分類失敗:", err);
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 新增分類
     * @param categoryData 不包含id、timestamps的分類資料
     * @returns 新增的分類ID
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    addCategory: async (
      categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">
    ) => {
      set({ isLoading: true, error: null });

      try {
        // 生成完整物件（添加ID和時間戳）
        const now = new Date();
        const newCategory: Category = {
          ...categoryData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await categoryService.add(newCategory);
        // 注意：不再需要手動更新 store，因為會從服務層發出事件來更新

        return newCategory.id;
      } catch (err) {
        set({ error: (err as Error).message });
        console.error("新增分類失敗:", err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 更新分類
     * @param id 分類ID
     * @param data 要更新的部分分類資料
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    updateCategory: async (id: string, data: Partial<Category>) => {
      set({ isLoading: true, error: null });

      try {
        const updateData = {
          ...data,
          updatedAt: new Date(),
        };

        await categoryService.update(id, updateData);
        // 注意：不再需要手動更新 store，因為會從服務層發出事件來更新
      } catch (err) {
        set({ error: (err as Error).message });
        console.error(`更新分類 ${id} 失敗:`, err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 安全刪除分類（檢查關聯資料）
     * @param id 分類ID
     * @returns 刪除結果
     * @side-effect 可能更新狀態 (categories, isLoading, error)
     */
    deleteCategory: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        const result = await categoryService.safeDelete(id);
        // 注意：不再需要手動更新 store，因為會從服務層發出事件來更新

        return result;
      } catch (err) {
        set({ error: (err as Error).message });
        console.error(`刪除分類 ${id} 失敗:`, err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 刪除分類及其關聯資料
     * @param id 分類ID
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    deleteWithRelated: async (id: string) => {
      set({ isLoading: true, error: null });

      try {
        await categoryService.deleteWithRelated(id);
        // 注意：不再需要手動更新 store，因為會從服務層發出事件來更新
      } catch (err) {
        set({ error: (err as Error).message });
        console.error(`刪除分類 ${id} 及關聯資料失敗:`, err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },

    /**
     * 批次更新分類
     * @param updatedCategories 更新的分類陣列
     * @side-effect 更新狀態 (categories, isLoading, error)
     */
    bulkUpdateCategories: async (updatedCategories: Category[]) => {
      set({ isLoading: true, error: null });

      try {
        await categoryService.bulkUpdateWithTransaction(updatedCategories);
        // 注意：不再需要手動更新 store，因為會從服務層發出事件來更新
      } catch (err) {
        set({ error: (err as Error).message });
        console.error("批次更新分類失敗:", err);
        throw err;
      } finally {
        set({ isLoading: false });
      }
    },
  };
});
