import { progressService } from "../../services/ProgressService";
import { db } from "../../db/db";
import { Progress } from "../../types";

// 模擬 db 模組
jest.mock("../../db/db", () => {
  const mockDb = {
    progress: {
      toArray: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
    },
    transaction: jest.fn(),
  };
  return { db: mockDb };
});

describe("ProgressService", () => {
  const mockProgress = [
    {
      id: "prog1",
      goalId: "goal1",
      value: 2,
      recordedAt: new Date("2025-04-01T10:00:00"),
      createdAt: new Date("2025-04-01T10:00:00"),
      updatedAt: new Date("2025-04-01T10:00:00"),
    },
    {
      id: "prog2",
      goalId: "goal1",
      value: 3,
      recordedAt: new Date("2025-04-02T11:00:00"),
      createdAt: new Date("2025-04-02T11:00:00"),
      updatedAt: new Date("2025-04-02T11:00:00"),
    },
    {
      id: "prog3",
      goalId: "goal2",
      value: 5,
      recordedAt: new Date("2025-04-02T14:00:00"),
      createdAt: new Date("2025-04-02T14:00:00"),
      updatedAt: new Date("2025-04-02T14:00:00"),
    },
  ] as Progress[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基本 CRUD 操作", () => {
    test("getAll 方法應該正確調用並返回進度記錄列表", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue(mockProgress);
      (db.progress.toArray as jest.Mock).mockImplementation(toArrayMock);

      // 執行
      const result = await progressService.getAll();

      // 驗證
      expect(db.progress.toArray).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProgress);
      expect(result.length).toBe(3);
    });

    test("getById 方法應該正確調用並返回單一進度記錄", async () => {
      // 準備
      (db.progress.get as jest.Mock).mockResolvedValue(mockProgress[0]);

      // 執行
      const result = await progressService.getById("prog1");

      // 驗證
      expect(db.progress.get).toHaveBeenCalledWith("prog1");
      expect(result).toEqual(mockProgress[0]);
    });
  });

  describe("目標相關查詢", () => {
    test("getByGoalId 方法應該正確查詢特定目標的進度記錄", async () => {
      // 準備
      const toArrayMock = jest
        .fn()
        .mockResolvedValue([mockProgress[0], mockProgress[1]]);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await progressService.getByGoalId("goal1");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");
      expect(result).toHaveLength(2);
    });
  });

  describe("日期相關查詢", () => {
    test("getByDateRange 方法應該正確查詢日期範圍內的進度記錄", async () => {
      // 準備
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-02");

      const toArrayMock = jest.fn().mockResolvedValue(mockProgress);
      const betweenMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ between: betweenMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await progressService.getByDateRange(startDate, endDate);

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("recordedAt");
      expect(betweenMock).toHaveBeenCalledWith(startDate, endDate, true, true);
      expect(result).toEqual(mockProgress);
    });

    test("getByDateRange 方法應該支援分頁和排序", async () => {
      // 準備
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-02");

      // 模擬排序和分頁鏈式調用
      const toArrayMock = jest.fn().mockResolvedValue([mockProgress[0]]);
      const limitMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const offsetMock = jest.fn().mockReturnValue({ limit: limitMock });
      const reverseMock = jest.fn().mockReturnValue({ offset: offsetMock });
      const betweenMock = jest.fn().mockReturnValue({ reverse: reverseMock });
      const whereMock = jest.fn().mockReturnValue({ between: betweenMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行 - 使用分頁和降序排序
      const result = await progressService.getByDateRange(startDate, endDate, {
        limit: 1,
        offset: 1,
        orderBy: "desc",
      });

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("recordedAt");
      expect(betweenMock).toHaveBeenCalledWith(startDate, endDate, true, true);
      expect(reverseMock).toHaveBeenCalled();
      expect(offsetMock).toHaveBeenCalledWith(1);
      expect(limitMock).toHaveBeenCalledWith(1);
      expect(result).toEqual([mockProgress[0]]);
    });

    test("getByDate 方法應該正確調用 getByDateRange", async () => {
      // 準備
      const date = new Date("2025-04-01");

      // 模擬 getByDateRange 方法
      const getByDateRangeSpy = jest
        .spyOn(progressService, "getByDateRange")
        .mockResolvedValue([mockProgress[0]]);

      // 執行
      const result = await progressService.getByDate(date);

      // 驗證
      // 檢查是否用正確的日期範圍（當天的開始與結束）呼叫 getByDateRange
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      expect(getByDateRangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ getTime: expect.any(Function) }),
        expect.objectContaining({ getTime: expect.any(Function) }),
        {}
      );
      expect(result).toEqual([mockProgress[0]]);

      // 恢復原始方法
      getByDateRangeSpy.mockRestore();
    });
  });

  describe("複合查詢", () => {
    test("getByGoalAndDateRange 方法應該正確查詢特定目標和日期範圍的進度記錄", async () => {
      // 準備
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-02");

      const toArrayMock = jest
        .fn()
        .mockResolvedValue([mockProgress[0], mockProgress[1]]);
      const betweenMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ between: betweenMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await progressService.getByGoalAndDateRange(
        "goal1",
        startDate,
        endDate
      );

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("[goalId+recordedAt]");
      expect(betweenMock).toHaveBeenCalledWith(
        ["goal1", startDate],
        ["goal1", endDate],
        true,
        true
      );
      expect(result).toEqual([mockProgress[0], mockProgress[1]]);
    });

    test("getByGoalAndDate 方法應該正確調用 getByGoalAndDateRange", async () => {
      // 準備
      const date = new Date("2025-04-01");

      // 模擬 getByGoalAndDateRange 方法
      const getByGoalAndDateRangeSpy = jest
        .spyOn(progressService, "getByGoalAndDateRange")
        .mockResolvedValue([mockProgress[0]]);

      // 執行
      const result = await progressService.getByGoalAndDate("goal1", date);

      // 驗證方法是否用正確的參數被調用
      expect(getByGoalAndDateRangeSpy).toHaveBeenCalledWith(
        "goal1",
        expect.objectContaining({ getTime: expect.any(Function) }),
        expect.objectContaining({ getTime: expect.any(Function) }),
        {}
      );
      expect(result).toEqual([mockProgress[0]]);

      // 恢復原始方法
      getByGoalAndDateRangeSpy.mockRestore();
    });
  });

  describe("排序查詢", () => {
    test("getSortedByCreatedAt 方法應該正確排序並支援分頁", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue(mockProgress);
      const limitMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const offsetMock = jest.fn().mockReturnValue({ limit: limitMock });
      const reverseMock = jest.fn().mockReturnValue({ offset: offsetMock });
      const orderByMock = jest.fn().mockReturnValue({ reverse: reverseMock });
      (db.progress.orderBy as jest.Mock).mockImplementation(orderByMock);

      // 執行 - 使用分頁和降序排序
      const result = await progressService.getSortedByCreatedAt({
        limit: 2,
        offset: 1,
        orderBy: "desc",
      });

      // 驗證
      expect(orderByMock).toHaveBeenCalledWith("createdAt");
      expect(reverseMock).toHaveBeenCalled();
      expect(offsetMock).toHaveBeenCalledWith(1);
      expect(limitMock).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockProgress);
    });

    test("getSortedByRecordedAt 方法應該正確排序並支援分頁", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue(mockProgress);
      const limitMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const orderByMock = jest.fn().mockReturnValue({ limit: limitMock });
      (db.progress.orderBy as jest.Mock).mockImplementation(orderByMock);

      // 執行 - 只使用限制數量
      const result = await progressService.getSortedByRecordedAt({
        limit: 2,
      });

      // 驗證
      expect(orderByMock).toHaveBeenCalledWith("recordedAt");
      expect(limitMock).toHaveBeenCalledWith(2);
      expect(result).toEqual(mockProgress);
    });
  });

  describe("計算功能", () => {
    test("calculateTotalProgress 方法應該正確計算目標總進度", async () => {
      // 準備 - 測試資料與模擬 getByGoalAndDateRange 方法
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-02");

      // 模擬進度記錄的值之和為 5
      const mockProgressRecords = [{ value: 2 }, { value: 3 }];

      jest
        .spyOn(progressService, "getByGoalAndDateRange")
        .mockResolvedValue(mockProgressRecords as Progress[]);

      // 執行
      const result = await progressService.calculateTotalProgress(
        "goal1",
        startDate,
        endDate
      );

      // 驗證
      expect(progressService.getByGoalAndDateRange).toHaveBeenCalledWith(
        "goal1",
        startDate,
        endDate
      );
      expect(result).toBe(5);
    });
  });

  describe("批次操作與事務", () => {
    test("bulkAddWithTransaction 方法應該使用事務批次新增記錄", async () => {
      // 準備
      const newRecords = [
        { goalId: "goal1", value: 3, recordedAt: new Date() },
        { goalId: "goal1", value: 4, recordedAt: new Date() },
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
      (db.progress.add as jest.Mock).mockResolvedValue(undefined);

      // 執行
      const result = await progressService.bulkAddWithTransaction(
        newRecords as Progress[]
      );

      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        db.progress,
        expect.any(Function)
      );

      // 驗證是否執行了 add 操作
      expect(db.progress.add).toHaveBeenCalledTimes(2);

      // 驗證是否添加了 id, createdAt, updatedAt
      expect(db.progress.add).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "new-id-1",
          goalId: "goal1",
          value: 3,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );

      // 驗證返回的 ID 陣列
      expect(result).toEqual(["new-id-1", "new-id-2"]);

      // 還原 randomUUID
      global.crypto.randomUUID = originalRandomUUID;
    });

    test("bulkUpdateWithTransaction 方法應該使用事務批次更新記錄", async () => {
      // 準備
      const updatedRecords = [
        { ...mockProgress[0], value: 5 },
        { ...mockProgress[1], value: 6 },
      ];

      // 模擬事務執行回呼函數
      (db.transaction as jest.Mock).mockImplementation(
        (mode, tables, callback) => callback()
      );

      // 模擬更新操作
      (db.progress.update as jest.Mock).mockResolvedValue(1);

      // 執行
      await progressService.bulkUpdateWithTransaction(updatedRecords);

      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        db.progress,
        expect.any(Function)
      );

      // 驗證是否執行了更新操作
      expect(db.progress.update).toHaveBeenCalledTimes(2);

      // 驗證是否更新了 updatedAt
      expect(db.progress.update).toHaveBeenCalledWith(
        "prog1",
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe("獲取最新記錄", () => {
    test("getLatestRecords 方法應該返回目標的最新記錄", async () => {
      // 準備
      const mockRecords = [mockProgress[1], mockProgress[0]]; // 按日期降序

      const equalsMock = jest.fn().mockReturnValue({
        reverse: jest.fn().mockReturnValue({
          sortBy: jest.fn().mockResolvedValue(mockRecords),
        }),
      });

      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行 - 獲取最新的 1 筆記錄
      const result = await progressService.getLatestRecords("goal1");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");
      expect(result).toEqual([mockProgress[1]]);
    });

    test("getLatestRecords 方法應該支援限制筆數", async () => {
      // 準備
      const mockRecords = [mockProgress[1], mockProgress[0]]; // 按日期降序

      const equalsMock = jest.fn().mockReturnValue({
        reverse: jest.fn().mockReturnValue({
          sortBy: jest.fn().mockResolvedValue(mockRecords),
        }),
      });

      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行 - 獲取最新的 2 筆記錄
      const result = await progressService.getLatestRecords("goal1", 2);

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");
      expect(result).toEqual(mockRecords);
    });
  });
});
