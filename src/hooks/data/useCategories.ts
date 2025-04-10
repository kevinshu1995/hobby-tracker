import { useCallback, useEffect, useState } from "react";
import { categoryService } from "../../services";
import { Category } from "../../types";

/**
 * 分類資料操作Hook
 * @returns 分類資料及操作方法
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取所有分類資料
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await categoryService.getSortedByCreatedAt();
      setCategories(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("取得分類資料失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 搜尋分類
   * @param keyword 搜尋關鍵字
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const searchCategories = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await categoryService.searchByName(keyword);
      setCategories(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("搜尋分類失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 新增分類
   * @param category 不包含id、timestamps的分類資料
   * @returns 新增的分類ID
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const addCategory = useCallback(
    async (categoryData: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
      setIsLoading(true);
      setError(null);

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
        await fetchCategories(); // 重新取得列表
        return newCategory.id;
      } catch (err) {
        setError((err as Error).message);
        console.error("新增分類失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCategories]
  );

  /**
   * 更新分類
   * @param id 分類ID
   * @param data 要更新的部分分類資料
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>) => {
      setIsLoading(true);
      setError(null);

      try {
        await categoryService.update(id, {
          ...data,
          updatedAt: new Date(),
        });
        await fetchCategories(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`更新分類 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCategories]
  );

  /**
   * 安全刪除分類（檢查關聯資料）
   * @param id 分類ID
   * @returns 刪除結果
   * @side-effect 可能更新狀態 (categories, isLoading, error)
   */
  const deleteCategory = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await categoryService.safeDelete(id);
        if (result.success) {
          await fetchCategories(); // 重新取得列表
        }
        return result;
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除分類 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCategories]
  );

  /**
   * 刪除分類及其關聯資料
   * @param id 分類ID
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const deleteWithRelated = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await categoryService.deleteWithRelated(id);
        await fetchCategories(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除分類 ${id} 及關聯資料失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCategories]
  );

  /**
   * 批次更新分類
   * @param updatedCategories 更新的分類陣列
   * @side-effect 更新狀態 (categories, isLoading, error)
   */
  const bulkUpdateCategories = useCallback(
    async (updatedCategories: Category[]) => {
      setIsLoading(true);
      setError(null);

      try {
        await categoryService.bulkUpdateWithTransaction(updatedCategories);
        await fetchCategories(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error("批次更新分類失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCategories]
  );

  // 初始載入資料
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    searchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteWithRelated,
    bulkUpdateCategories,
  };
}
