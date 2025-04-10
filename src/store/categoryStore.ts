import { create } from "zustand";
import { categoryService } from "../services";
import { Category } from "../types";

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
}

/**
 * 分類狀態管理 Store
 */
export const useCategoryStore = create<CategoryState>((set, get) => ({
  // 初始狀態
  categories: [],
  isLoading: false,
  error: null,

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

      // 更新狀態
      const { categories } = get();
      set({ categories: [...categories, newCategory] });

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

      // 更新狀態
      const { categories } = get();
      set({
        categories: categories.map((category) =>
          category.id === id ? { ...category, ...updateData } : category
        ),
      });
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

      // 如果刪除成功，從狀態中移除該分類
      if (result.success) {
        const { categories } = get();
        set({
          categories: categories.filter((category) => category.id !== id),
        });
      }

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

      // 從狀態中移除該分類
      const { categories } = get();
      set({
        categories: categories.filter((category) => category.id !== id),
      });
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

      // 更新狀態
      const { categories } = get();
      const updatedCategoriesMap = new Map(
        updatedCategories.map((cat) => [cat.id, cat])
      );

      set({
        categories: categories.map((category) =>
          updatedCategoriesMap.has(category.id)
            ? updatedCategoriesMap.get(category.id)!
            : category
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("批次更新分類失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
