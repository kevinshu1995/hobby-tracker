import { useCallback, useEffect, useState } from "react";
import { hobbyService } from "../../services";
import { Hobby } from "../../types";

/**
 * 興趣項目資料操作Hook
 * @returns 興趣項目資料及操作方法
 */
export function useHobbies() {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 獲取所有興趣項目資料
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const fetchHobbies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await hobbyService.getSortedByCreatedAt();
      setHobbies(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("取得興趣項目資料失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 獲取指定分類的興趣項目資料
   * @param categoryId 分類ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const fetchHobbiesByCategory = useCallback(async (categoryId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await hobbyService.getByCategoryId(categoryId);
      setHobbies(data);
    } catch (err) {
      setError((err as Error).message);
      console.error(`取得分類 ${categoryId} 的興趣項目資料失敗:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 搜尋興趣項目
   * @param keyword 搜尋關鍵字
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const searchHobbies = useCallback(async (keyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await hobbyService.searchByName(keyword);
      setHobbies(data);
    } catch (err) {
      setError((err as Error).message);
      console.error("搜尋興趣項目失敗:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 新增興趣項目
   * @param hobby 不包含id、timestamps的興趣項目資料
   * @returns 新增的興趣項目ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const addHobby = useCallback(
    async (hobbyData: Omit<Hobby, "id" | "createdAt" | "updatedAt">) => {
      setIsLoading(true);
      setError(null);

      try {
        // 生成完整物件（添加ID和時間戳）
        const now = new Date();
        const newHobby: Hobby = {
          ...hobbyData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };

        await hobbyService.add(newHobby);
        await fetchHobbies(); // 重新取得列表
        return newHobby.id;
      } catch (err) {
        setError((err as Error).message);
        console.error("新增興趣項目失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHobbies]
  );

  /**
   * 更新興趣項目
   * @param id 興趣項目ID
   * @param data 要更新的部分興趣項目資料
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const updateHobby = useCallback(
    async (id: string, data: Partial<Hobby>) => {
      setIsLoading(true);
      setError(null);

      try {
        await hobbyService.update(id, {
          ...data,
          updatedAt: new Date(),
        });
        await fetchHobbies(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`更新興趣項目 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHobbies]
  );

  /**
   * 安全刪除興趣項目（檢查關聯資料）
   * @param id 興趣項目ID
   * @returns 刪除結果
   * @side-effect 可能更新狀態 (hobbies, isLoading, error)
   */
  const deleteHobby = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await hobbyService.safeDelete(id);
        if (result.success) {
          await fetchHobbies(); // 重新取得列表
        }
        return result;
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除興趣項目 ${id} 失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHobbies]
  );

  /**
   * 刪除興趣項目及其關聯資料
   * @param id 興趣項目ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const deleteWithRelated = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await hobbyService.deleteWithRelated(id);
        await fetchHobbies(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error(`刪除興趣項目 ${id} 及關聯資料失敗:`, err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHobbies]
  );

  /**
   * 批次更新興趣項目
   * @param updatedHobbies 更新的興趣項目陣列
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  const bulkUpdateHobbies = useCallback(
    async (updatedHobbies: Hobby[]) => {
      setIsLoading(true);
      setError(null);

      try {
        await hobbyService.bulkUpdateWithTransaction(updatedHobbies);
        await fetchHobbies(); // 重新取得列表
      } catch (err) {
        setError((err as Error).message);
        console.error("批次更新興趣項目失敗:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHobbies]
  );

  // 初始載入資料
  useEffect(() => {
    fetchHobbies();
  }, [fetchHobbies]);

  return {
    hobbies,
    isLoading,
    error,
    fetchHobbies,
    fetchHobbiesByCategory,
    searchHobbies,
    addHobby,
    updateHobby,
    deleteHobby,
    deleteWithRelated,
    bulkUpdateHobbies,
  };
}
