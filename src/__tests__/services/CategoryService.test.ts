import { categoryService } from "../../services/CategoryService";
import { db } from "../../db/db";
import { Category } from "../../types";

// 模擬 db 模組
jest.mock("../../db/db", () => {
  const mockDb = {
    categories: {
      toArray: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
    },
    hobbies: {
      where: jest.fn(),
    },
    goals: {
      where: jest.fn(),
    },
    progress: {
      where: jest.fn(),
    },
    transaction: jest.fn(),
  };
  return { db: mockDb };
});

describe("CategoryService", () => {
  const mockCategories = [
    {
      id: "cat1",
      name: "運動",
      color: "#FF0000",
      icon: "trophy",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    {
      id: "cat2",
      name: "學習",
      color: "#00FF00",
      icon: "book",
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date("2025-01-15"),
    },
  ] as Category[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基本 CRUD 操作", () => {
    test("getAll 方法應該正確調用並返回分類列表", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue(mockCategories);
      (db.categories.toArray as jest.Mock).mockImplementation(toArrayMock);

      // 執行
      const result = await categoryService.getAll();

      // 驗證
      expect(db.categories.toArray).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
      expect(result.length).toBe(2);
    });

    test("getById 方法應該正確調用並返回單一分類", async () => {
      // 準備
      (db.categories.get as jest.Mock).mockResolvedValue(mockCategories[0]);

      // 執行
      const result = await categoryService.getById("cat1");

      // 驗證
      expect(db.categories.get).toHaveBeenCalledWith("cat1");
      expect(result).toEqual(mockCategories[0]);
    });
  });

  describe("排序與搜尋功能", () => {
    test("getSortedByCreatedAt 方法應該正確排序分類", async () => {
      // 準備
      const orderByMock = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCategories),
      });
      (db.categories.orderBy as jest.Mock).mockImplementation(orderByMock);

      // 執行
      const result = await categoryService.getSortedByCreatedAt();

      // 驗證
      expect(db.categories.orderBy).toHaveBeenCalledWith("createdAt");
      expect(result).toEqual(mockCategories);
    });

    test("searchByName 方法應該正確使用過濾器搜尋分類", async () => {
      // 準備
      const filterMock = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([mockCategories[0]]),
      });
      (db.categories.filter as jest.Mock) = filterMock;

      // 執行
      const result = await categoryService.searchByName("運動");

      // 驗證
      expect(filterMock).toHaveBeenCalled();
      expect(result).toEqual([mockCategories[0]]);
    });
  });

  describe("關聯檢查與安全刪除", () => {
    test("hasRelatedHobbies 方法應該正確檢查關聯興趣項目", async () => {
      // 準備
      const countMock = jest.fn().mockResolvedValue(2);
      const equalsMock = jest.fn().mockReturnValue({ count: countMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.hobbies.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await categoryService.hasRelatedHobbies("cat1");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("categoryId");
      expect(equalsMock).toHaveBeenCalledWith("cat1");
      expect(countMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("safeDelete 方法應返回警告訊息當分類有關聯項目時", async () => {
      // 準備 - 模擬有關聯項目
      jest.spyOn(categoryService, "hasRelatedHobbies").mockResolvedValue(true);

      // 執行
      const result = await categoryService.safeDelete("cat1");

      // 驗證
      expect(categoryService.hasRelatedHobbies).toHaveBeenCalledWith("cat1");
      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "刪除此分類將同時刪除所有相關聯的興趣項目"
      );
      expect(result.confirmAction).toBe("deleteWithRelated");
    });

    test("safeDelete 方法應直接刪除分類當沒有關聯項目時", async () => {
      // 準備 - 模擬沒有關聯項目
      jest.spyOn(categoryService, "hasRelatedHobbies").mockResolvedValue(false);
      jest.spyOn(categoryService, "delete").mockResolvedValue();

      // 執行
      const result = await categoryService.safeDelete("cat1");

      // 驗證
      expect(categoryService.hasRelatedHobbies).toHaveBeenCalledWith("cat1");
      expect(categoryService.delete).toHaveBeenCalledWith("cat1");
      expect(result.success).toBe(true);
    });
  });

  describe("複雜操作測試", () => {
    test("deleteWithRelated 方法應使用事務刪除所有關聯資料", async () => {
      // 準備
      // 模擬事務執行回呼函數
      (db.transaction as jest.Mock).mockImplementation(
        (mode, tables, callback) => callback()
      );

      // 模擬查詢鏈 - 相關興趣項目
      const hobbies = [{ id: "h1" }, { id: "h2" }];
      const hobbiesToArrayMock = jest.fn().mockResolvedValue(hobbies);
      const hobbiesEqualsMock = jest
        .fn()
        .mockReturnValue({ toArray: hobbiesToArrayMock });
      const hobbiesWhereMock = jest
        .fn()
        .mockReturnValue({ equals: hobbiesEqualsMock });
      (db.hobbies.where as jest.Mock).mockImplementation(hobbiesWhereMock);

      // 模擬查詢鏈 - 相關目標
      const goals = [{ id: "g1" }, { id: "g2" }];
      const goalsToArrayMock = jest.fn().mockResolvedValue(goals);
      const goalsEqualsMock = jest
        .fn()
        .mockReturnValue({ toArray: goalsToArrayMock });
      const goalsWhereMock = jest
        .fn()
        .mockReturnValue({ equals: goalsEqualsMock });
      (db.goals.where as jest.Mock).mockImplementation(goalsWhereMock);

      // 模擬查詢鏈 - 刪除操作
      const deleteHobbiesMock = jest.fn().mockResolvedValue(undefined);
      const deleteGoalsMock = jest.fn().mockResolvedValue(undefined);
      const deleteProgressMock = jest.fn().mockResolvedValue(undefined);
      const deleteCategoryMock = jest.fn().mockResolvedValue(undefined);

      // 模擬進度記錄刪除
      const progressEqualsMock = jest
        .fn()
        .mockReturnValue({ delete: deleteProgressMock });
      const progressWhereMock = jest
        .fn()
        .mockReturnValue({ equals: progressEqualsMock });
      (db.progress.where as jest.Mock).mockImplementation(progressWhereMock);

      // 重新模擬其他刪除操作
      hobbiesEqualsMock.mockReturnValue({
        delete: deleteHobbiesMock,
        toArray: hobbiesToArrayMock,
      });
      goalsEqualsMock.mockReturnValue({
        delete: deleteGoalsMock,
        toArray: goalsToArrayMock,
      });
      (db.categories.delete as jest.Mock).mockImplementation(
        deleteCategoryMock
      );

      // 執行
      await categoryService.deleteWithRelated("cat1");

      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        [db.categories, db.hobbies, db.goals, db.progress],
        expect.any(Function)
      );

      // 驗證是否查詢了相關項目
      expect(hobbiesWhereMock).toHaveBeenCalledWith("categoryId");
      expect(hobbiesEqualsMock).toHaveBeenCalledWith("cat1");

      // 驗證是否進行了刪除操作
      expect(deleteHobbiesMock).toHaveBeenCalled();
      expect(deleteCategoryMock).toHaveBeenCalledWith("cat1");
    });

    test("bulkCreateWithTransaction 方法應該使用事務批次創建分類", async () => {
      // 準備
      const categories = [
        { name: "新分類1", color: "#0000FF", icon: "star" },
        { name: "新分類2", color: "#FF00FF", icon: "heart" },
      ];

      // 模擬 crypto.randomUUID
      const originalRandomUUID = global.crypto.randomUUID;
      global.crypto.randomUUID = jest
        .fn()
        .mockReturnValueOnce("new-id-1")
        .mockReturnValueOnce("new-id-2");

      // 模擬事務執行回呼函數
      (db.transaction as jest.Mock).mockImplementation(
        (mode, tables, callback) => callback()
      );

      // 模擬 add 操作
      (db.categories.add as jest.Mock).mockResolvedValue(undefined);

      // 執行
      const result = await categoryService.bulkCreateWithTransaction(
        categories as Omit<Category, "id">[]
      );
      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        db.categories,
        expect.any(Function)
      );

      // 驗證是否執行了 add 操作
      expect(db.categories.add).toHaveBeenCalledTimes(2);
      expect(db.categories.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-id-1",
          name: "新分類1",
        })
      );

      // 驗證返回的 ID 陣列
      expect(result).toEqual(["new-id-1", "new-id-2"]);

      // 還原 randomUUID
      global.crypto.randomUUID = originalRandomUUID;
    });
  });
});
