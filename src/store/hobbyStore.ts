import { create } from "zustand";
import { hobbyService } from "../services";
import { Hobby } from "../types";

/**
 * 興趣項目狀態管理介面
 */
interface HobbyState {
  // 狀態
  hobbies: Hobby[];
  isLoading: boolean;
  error: string | null;

  // 動作
  fetchHobbies: () => Promise<void>;
  fetchHobbiesByCategory: (categoryId: string) => Promise<void>;
  searchHobbies: (keyword: string) => Promise<void>;
  addHobby: (
    hobby: Omit<Hobby, "id" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateHobby: (id: string, data: Partial<Hobby>) => Promise<void>;
  deleteHobby: (
    id: string
  ) => Promise<{ success: boolean; message?: string; confirmAction?: string }>;
  deleteWithRelated: (id: string) => Promise<void>;
  bulkUpdateHobbies: (hobbies: Hobby[]) => Promise<void>;
}

/**
 * 興趣項目狀態管理 Store
 */
export const useHobbyStore = create<HobbyState>((set, get) => ({
  // 初始狀態
  hobbies: [],
  isLoading: false,
  error: null,

  /**
   * 獲取所有興趣項目資料
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  fetchHobbies: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await hobbyService.getSortedByCreatedAt();
      set({ hobbies: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("取得興趣項目資料失敗:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 獲取指定分類的興趣項目資料
   * @param categoryId 分類ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  fetchHobbiesByCategory: async (categoryId: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await hobbyService.getByCategoryId(categoryId);
      set({ hobbies: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`取得分類 ${categoryId} 的興趣項目資料失敗:`, err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 搜尋興趣項目
   * @param keyword 搜尋關鍵字
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  searchHobbies: async (keyword: string) => {
    set({ isLoading: true, error: null });

    try {
      const data = await hobbyService.searchByName(keyword);
      set({ hobbies: data });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("搜尋興趣項目失敗:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 新增興趣項目
   * @param hobbyData 不包含id、timestamps的興趣項目資料
   * @returns 新增的興趣項目ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  addHobby: async (
    hobbyData: Omit<Hobby, "id" | "createdAt" | "updatedAt">
  ) => {
    set({ isLoading: true, error: null });

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

      // 更新狀態
      const { hobbies } = get();
      set({ hobbies: [...hobbies, newHobby] });

      return newHobby.id;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("新增興趣項目失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 更新興趣項目
   * @param id 興趣項目ID
   * @param data 要更新的部分興趣項目資料
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  updateHobby: async (id: string, data: Partial<Hobby>) => {
    set({ isLoading: true, error: null });

    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await hobbyService.update(id, updateData);

      // 更新狀態
      const { hobbies } = get();
      set({
        hobbies: hobbies.map((hobby) =>
          hobby.id === id ? { ...hobby, ...updateData } : hobby
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`更新興趣項目 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 安全刪除興趣項目（檢查關聯資料）
   * @param id 興趣項目ID
   * @returns 刪除結果
   * @side-effect 可能更新狀態 (hobbies, isLoading, error)
   */
  deleteHobby: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await hobbyService.safeDelete(id);

      // 如果刪除成功，從狀態中移除該興趣項目
      if (result.success) {
        const { hobbies } = get();
        set({
          hobbies: hobbies.filter((hobby) => hobby.id !== id),
        });
      }

      return result;
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`刪除興趣項目 ${id} 失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 刪除興趣項目及其關聯資料
   * @param id 興趣項目ID
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  deleteWithRelated: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await hobbyService.deleteWithRelated(id);

      // 從狀態中移除該興趣項目
      const { hobbies } = get();
      set({
        hobbies: hobbies.filter((hobby) => hobby.id !== id),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error(`刪除興趣項目 ${id} 及關聯資料失敗:`, err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 批次更新興趣項目
   * @param updatedHobbies 更新的興趣項目陣列
   * @side-effect 更新狀態 (hobbies, isLoading, error)
   */
  bulkUpdateHobbies: async (updatedHobbies: Hobby[]) => {
    set({ isLoading: true, error: null });

    try {
      await hobbyService.bulkUpdateWithTransaction(updatedHobbies);

      // 更新狀態
      const { hobbies } = get();
      const updatedHobbiesMap = new Map(updatedHobbies.map((h) => [h.id, h]));

      set({
        hobbies: hobbies.map((hobby) =>
          updatedHobbiesMap.has(hobby.id)
            ? updatedHobbiesMap.get(hobby.id)!
            : hobby
        ),
      });
    } catch (err) {
      set({ error: (err as Error).message });
      console.error("批次更新興趣項目失敗:", err);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },
}));
