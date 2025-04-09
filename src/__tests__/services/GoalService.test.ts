import { goalService } from "../../services/GoalService";
import { db } from "../../db/db";
import { Goal, GoalType, GoalPeriod } from "../../types";

// 模擬 db 模組
jest.mock("../../db/db", () => {
  const mockDb = {
    goals: {
      toArray: jest.fn(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
    },
    progress: {
      where: jest.fn(),
    },
    transaction: jest.fn(),
  };
  return { db: mockDb };
});

describe("GoalService", () => {
  const mockGoals = [
    {
      id: "goal1",
      hobbyId: "hobby1",
      type: "count" as GoalType,
      period: "daily" as GoalPeriod,
      targetValue: 5,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
    {
      id: "goal2",
      hobbyId: "hobby1",
      type: "quantity" as GoalType,
      period: "weekly" as GoalPeriod,
      targetValue: 10,
      targetUnit: "km",
      createdAt: new Date("2025-01-15"),
      updatedAt: new Date("2025-01-15"),
    },
    {
      id: "goal3",
      hobbyId: "hobby2",
      type: "composite" as GoalType,
      period: "monthly" as GoalPeriod,
      targetValue: 8,
      timeRequirement: 30,
      createdAt: new Date("2025-01-20"),
      updatedAt: new Date("2025-01-20"),
    },
  ] as Goal[];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("基本 CRUD 操作", () => {
    test("getAll 方法應該正確調用並返回目標列表", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue(mockGoals);
      (db.goals.toArray as jest.Mock).mockImplementation(toArrayMock);

      // 執行
      const result = await goalService.getAll();

      // 驗證
      expect(db.goals.toArray).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGoals);
      expect(result.length).toBe(3);
    });

    test("getById 方法應該正確調用並返回單一目標", async () => {
      // 準備
      (db.goals.get as jest.Mock).mockResolvedValue(mockGoals[0]);

      // 執行
      const result = await goalService.getById("goal1");

      // 驗證
      expect(db.goals.get).toHaveBeenCalledWith("goal1");
      expect(result).toEqual(mockGoals[0]);
    });
  });

  describe("查詢功能", () => {
    test("getByHobbyId 方法應該正確查詢特定興趣的目標", async () => {
      // 準備
      const toArrayMock = jest
        .fn()
        .mockResolvedValue([mockGoals[0], mockGoals[1]]);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.goals.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.getByHobbyId("hobby1");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("hobbyId");
      expect(equalsMock).toHaveBeenCalledWith("hobby1");
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("goal1");
      expect(result[1].id).toBe("goal2");
    });

    test("getByType 方法應該正確查詢特定類型的目標", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue([mockGoals[0]]);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.goals.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.getByType("count");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("type");
      expect(equalsMock).toHaveBeenCalledWith("count");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("goal1");
    });

    test("getByPeriod 方法應該正確查詢特定週期的目標", async () => {
      // 準備
      const toArrayMock = jest.fn().mockResolvedValue([mockGoals[1]]);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.goals.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.getByPeriod("weekly");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("period");
      expect(equalsMock).toHaveBeenCalledWith("weekly");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("goal2");
    });

    test("getSortedByCreatedAt 方法應該正確排序目標", async () => {
      // 準備
      const orderByMock = jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockGoals),
      });
      (db.goals.orderBy as jest.Mock).mockImplementation(orderByMock);

      // 執行
      const result = await goalService.getSortedByCreatedAt();

      // 驗證
      expect(db.goals.orderBy).toHaveBeenCalledWith("createdAt");
      expect(result).toEqual(mockGoals);
    });
  });

  describe("關聯檢查與安全刪除", () => {
    test("hasRelatedProgress 方法應該正確檢查關聯進度記錄", async () => {
      // 準備
      const countMock = jest.fn().mockResolvedValue(5);
      const equalsMock = jest.fn().mockReturnValue({ count: countMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.hasRelatedProgress("goal1");

      // 驗證
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");
      expect(countMock).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("safeDelete 方法應返回警告訊息當目標有關聯進度記錄時", async () => {
      // 準備 - 模擬有關聯進度記錄
      jest.spyOn(goalService, "hasRelatedProgress").mockResolvedValue(true);

      // 執行
      const result = await goalService.safeDelete("goal1");

      // 驗證
      expect(goalService.hasRelatedProgress).toHaveBeenCalledWith("goal1");
      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "刪除此目標將同時刪除所有相關的進度記錄"
      );
      expect(result.confirmAction).toBe("deleteWithRelated");
    });

    test("safeDelete 方法應直接刪除目標當沒有關聯進度記錄時", async () => {
      // 準備 - 模擬沒有關聯進度記錄
      jest.spyOn(goalService, "hasRelatedProgress").mockResolvedValue(false);
      jest.spyOn(goalService, "delete").mockResolvedValue();

      // 執行
      const result = await goalService.safeDelete("goal1");

      // 驗證
      expect(goalService.hasRelatedProgress).toHaveBeenCalledWith("goal1");
      expect(goalService.delete).toHaveBeenCalledWith("goal1");
      expect(result.success).toBe(true);
    });
  });

  describe("複雜操作測試", () => {
    test("deleteWithRelated 方法應使用事務刪除目標及其所有進度記錄", async () => {
      // 準備
      // 模擬事務執行回呼函數
      (db.transaction as jest.Mock).mockImplementation(
        (mode, tables, callback) => callback()
      );

      // 模擬刪除操作
      const deleteProgressMock = jest.fn().mockResolvedValue(undefined);
      const deleteGoalMock = jest.fn().mockResolvedValue(undefined);

      // 模擬進度記錄刪除
      const equalsMock = jest
        .fn()
        .mockReturnValue({ delete: deleteProgressMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 模擬目標刪除
      (db.goals.delete as jest.Mock).mockImplementation(deleteGoalMock);

      // 執行
      await goalService.deleteWithRelated("goal1");

      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        [db.goals, db.progress],
        expect.any(Function)
      );

      // 驗證是否刪除了相關進度記錄
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");
      expect(deleteProgressMock).toHaveBeenCalled();

      // 驗證是否刪除了目標本身
      expect(deleteGoalMock).toHaveBeenCalledWith("goal1");
    });

    test("bulkUpdateWithTransaction 方法應該使用事務批次更新目標", async () => {
      // 準備
      const goals = [
        { ...mockGoals[0], targetValue: 10 },
        { ...mockGoals[1], targetValue: 20 },
      ];

      // 模擬事務執行回呼函數
      (db.transaction as jest.Mock).mockImplementation(
        (mode, tables, callback) => callback()
      );

      // 模擬更新操作
      (db.goals.update as jest.Mock).mockResolvedValue(1);

      // 執行
      await goalService.bulkUpdateWithTransaction(goals);

      // 驗證
      // 驗證是否使用事務
      expect(db.transaction).toHaveBeenCalledWith(
        "rw",
        db.goals,
        expect.any(Function)
      );

      // 驗證是否執行了更新操作
      expect(db.goals.update).toHaveBeenCalledTimes(2);
      expect(db.goals.update).toHaveBeenCalledWith("goal1", goals[0]);
      expect(db.goals.update).toHaveBeenCalledWith("goal2", goals[1]);
    });
  });

  describe("目標完成度計算與快取", () => {
    beforeEach(() => {
      // 清除目標完成度快取
      goalService.clearCompletionCache();
    });

    test("calculateCompletion 應正確計算次數型目標的完成度", async () => {
      // 準備 - 模擬目標和進度記錄
      (db.goals.get as jest.Mock).mockResolvedValue({
        id: "goal1",
        type: "count",
        targetValue: 5,
      });

      const progressRecords = [
        { goalId: "goal1", value: 1 },
        { goalId: "goal1", value: 2 },
      ];

      const toArrayMock = jest.fn().mockResolvedValue(progressRecords);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.calculateCompletion("goal1");

      // 驗證
      expect(db.goals.get).toHaveBeenCalledWith("goal1");
      expect(whereMock).toHaveBeenCalledWith("goalId");
      expect(equalsMock).toHaveBeenCalledWith("goal1");

      // 1 + 2 = 3, 目標是 5, 所以完成度是 3/5 = 0.6
      expect(result).toBe(0.6);
    });

    test("calculateCompletion 應正確計算量化型目標的完成度", async () => {
      // 準備 - 模擬目標和進度記錄
      (db.goals.get as jest.Mock).mockResolvedValue({
        id: "goal2",
        type: "quantity",
        targetValue: 10,
      });

      const progressRecords = [
        { goalId: "goal2", value: 3.5 },
        { goalId: "goal2", value: 4.5 },
      ];

      const toArrayMock = jest.fn().mockResolvedValue(progressRecords);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.calculateCompletion("goal2");

      // 驗證
      expect(db.goals.get).toHaveBeenCalledWith("goal2");

      // 3.5 + 4.5 = 8, 目標是 10, 所以完成度是 8/10 = 0.8
      expect(result).toBe(0.8);
    });

    test("calculateCompletion 應正確計算複合型目標的完成度", async () => {
      // 準備 - 模擬目標和進度記錄
      (db.goals.get as jest.Mock).mockResolvedValue({
        id: "goal3",
        type: "composite",
        targetValue: 4, // 目標次數
        timeRequirement: 30, // 每次至少 30 分鐘
      });

      const progressRecords = [
        { goalId: "goal3", value: 1, duration: 35 }, // 超過時間要求
        { goalId: "goal3", value: 1, duration: 30 }, // 剛好達到時間要求
        { goalId: "goal3", value: 1, duration: 15 }, // 未達到時間要求
      ];

      const toArrayMock = jest.fn().mockResolvedValue(progressRecords);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行
      const result = await goalService.calculateCompletion("goal3");

      // 驗證
      expect(db.goals.get).toHaveBeenCalledWith("goal3");

      // 次數完成度: 3/4 = 0.75
      // 時間完成度: (35 + 30 + 15) / 30 = 80/30 = 2.67 (超過 1)
      // 取較小值 0.75
      expect(result).toBe(0.75);
    });

    test("calculateCompletion 應使用快取並在第二次呼叫時不重新計算", async () => {
      // 準備 - 模擬目標和進度記錄
      (db.goals.get as jest.Mock).mockResolvedValue({
        id: "goal1",
        type: "count",
        targetValue: 5,
      });

      const progressRecords = [{ goalId: "goal1", value: 3 }];

      const toArrayMock = jest.fn().mockResolvedValue(progressRecords);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 第一次執行（應執行計算）
      await goalService.calculateCompletion("goal1");

      // 重置模擬函數計數
      jest.clearAllMocks();

      // 第二次執行（應使用快取）
      const result = await goalService.calculateCompletion("goal1");

      // 驗證不應呼叫資料庫操作
      expect(db.goals.get).not.toHaveBeenCalled();
      expect(db.progress.where).not.toHaveBeenCalled();

      // 應返回正確的完成度
      expect(result).toBe(0.6);
    });

    test("clearCompletionCache 應正確清除所有快取", async () => {
      // 準備 - 模擬目標和進度記錄
      (db.goals.get as jest.Mock).mockResolvedValue({
        id: "goal1",
        type: "count",
        targetValue: 5,
      });

      const progressRecords = [{ goalId: "goal1", value: 3 }];

      const toArrayMock = jest.fn().mockResolvedValue(progressRecords);
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 第一次執行（應執行計算）
      await goalService.calculateCompletion("goal1");

      // 清除快取
      goalService.clearCompletionCache();

      // 重置模擬函數計數
      jest.clearAllMocks();

      // 再次執行（應重新計算）
      await goalService.calculateCompletion("goal1");

      // 驗證應再次呼叫資料庫操作
      expect(db.goals.get).toHaveBeenCalled();
      expect(db.progress.where).toHaveBeenCalled();
    });

    test("clearCompletionCache 使用 goalId 參數時只清除特定目標的快取", async () => {
      // 準備 - 模擬兩個目標和進度記錄
      (db.goals.get as jest.Mock).mockImplementation((id) => {
        if (id === "goal1") {
          return Promise.resolve({
            id: "goal1",
            type: "count",
            targetValue: 5,
          });
        } else {
          return Promise.resolve({
            id: "goal2",
            type: "count",
            targetValue: 10,
          });
        }
      });

      const toArrayMock = jest
        .fn()
        .mockImplementation(() => Promise.resolve([{ value: 3 }]));
      const equalsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
      const whereMock = jest.fn().mockReturnValue({ equals: equalsMock });
      (db.progress.where as jest.Mock).mockImplementation(whereMock);

      // 執行兩個目標的計算（填充快取）
      await goalService.calculateCompletion("goal1");
      await goalService.calculateCompletion("goal2");

      // 重置模擬函數計數
      jest.clearAllMocks();

      // 只清除 goal1 的快取
      goalService.clearCompletionCache("goal1");

      // 再次執行兩個目標的計算
      await goalService.calculateCompletion("goal1"); // 應重新計算
      await goalService.calculateCompletion("goal2"); // 應使用快取

      // 驗證 goal1 重新計算，goal2 使用快取
      expect(db.goals.get).toHaveBeenCalledWith("goal1");
      expect(db.goals.get).not.toHaveBeenCalledWith("goal2");
    });
  });
});
