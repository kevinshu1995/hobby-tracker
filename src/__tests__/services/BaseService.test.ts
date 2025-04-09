import { BaseService } from "../../services/BaseService";
import { Table } from "dexie";

// 模擬 Dexie Table 物件
const mockTable = {
  toArray: jest.fn(),
  get: jest.fn(),
  add: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  bulkAdd: jest.fn(),
  bulkPut: jest.fn(),
  bulkDelete: jest.fn(),
} as unknown as jest.Mocked<Table<TestItem, string>>;

// 測試用資料介面
interface TestItem {
  id: string;
  name: string;
}

// 繼承 BaseService 創建測試服務
class TestService extends BaseService<TestItem, string> {
  constructor() {
    super(mockTable);
  }
}

describe("BaseService", () => {
  let service: TestService;

  beforeEach(() => {
    service = new TestService();
    jest.clearAllMocks();
  });

  describe("基本 CRUD 操作", () => {
    test("getAll 方法應該正確調用 table.toArray", async () => {
      // 準備
      const mockItems = [
        { id: "1", name: "測試項目 1" },
        { id: "2", name: "測試項目 2" },
      ];
      (mockTable.toArray as jest.Mock).mockResolvedValue(mockItems);

      // 執行
      const result = await service.getAll();

      // 驗證
      expect(mockTable.toArray).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockItems);
      expect(result.length).toBe(2);
    });

    test("getById 方法應該正確調用 table.get", async () => {
      // 準備
      const mockItem = { id: "1", name: "測試項目" };
      (mockTable.get as jest.Mock).mockResolvedValue(mockItem);

      // 執行
      const result = await service.getById("1");

      // 驗證
      expect(mockTable.get).toHaveBeenCalledWith("1");
      expect(result).toEqual(mockItem);
    });

    test("add 方法應該正確調用 table.add", async () => {
      // 準備
      const newItem = { id: "3", name: "新項目" };
      (mockTable.add as jest.Mock).mockResolvedValue("3");

      // 執行
      const result = await service.add(newItem);

      // 驗證
      expect(mockTable.add).toHaveBeenCalledWith(newItem);
      expect(result).toBe("3");
    });

    test("update 方法應該正確調用 table.update", async () => {
      // 準備
      const changes = { name: "已更新項目" };
      (mockTable.update as jest.Mock).mockResolvedValue(1); // 表示更新了 1 筆記錄

      // 執行
      const result = await service.update("1", changes);

      // 驗證
      expect(mockTable.update).toHaveBeenCalledWith("1", changes);
      expect(result).toBe("1");
    });

    test("delete 方法應該正確調用 table.delete", async () => {
      // 準備
      (mockTable.delete as jest.Mock).mockResolvedValue(undefined);

      // 執行
      await service.delete("1");

      // 驗證
      expect(mockTable.delete).toHaveBeenCalledWith("1");
    });
  });

  describe("批次操作", () => {
    test("bulkAdd 方法應該正確調用 table.bulkAdd", async () => {
      // 準備
      const items = [
        { id: "4", name: "批次項目 1" },
        { id: "5", name: "批次項目 2" },
      ];
      (mockTable.bulkAdd as jest.Mock).mockResolvedValue(["4", "5"]);

      // 執行
      const result = await service.bulkAdd(items);

      // 驗證
      expect(mockTable.bulkAdd).toHaveBeenCalledWith(items, { allKeys: true });
      expect(result).toEqual(["4", "5"]);
    });

    test("bulkPut 方法應該正確調用 table.bulkPut", async () => {
      // 準備
      const items = [
        { id: "1", name: "更新項目 1" },
        { id: "2", name: "更新項目 2" },
      ];
      (mockTable.bulkPut as jest.Mock).mockResolvedValue(undefined);

      // 執行
      await service.bulkPut(items);

      // 驗證
      expect(mockTable.bulkPut).toHaveBeenCalledWith(items);
    });

    test("bulkDelete 方法應該正確調用 table.bulkDelete", async () => {
      // 準備
      const ids = ["1", "2"];
      (mockTable.bulkDelete as jest.Mock).mockResolvedValue(undefined);

      // 執行
      await service.bulkDelete(ids);

      // 驗證
      expect(mockTable.bulkDelete).toHaveBeenCalledWith(ids);
    });
  });

  describe("錯誤處理", () => {
    test("executeDbOperation 應正確處理並封裝錯誤", async () => {
      // 準備
      (mockTable.get as jest.Mock).mockRejectedValue(new Error("資料庫錯誤"));

      // 執行並驗證
      await expect(service.getById("1")).rejects.toThrow(
        "取得 ID 為 1 的記錄失敗: 資料庫錯誤"
      );

      // 驗證是否有呼叫過 get 方法
      expect(mockTable.get).toHaveBeenCalledWith("1");
    });

    test("當 add 方法失敗時應拋出封裝錯誤", async () => {
      // 準備
      (mockTable.add as jest.Mock).mockRejectedValue(new Error("重複鍵值"));

      // 執行並驗證
      await expect(service.add({ id: "1", name: "測試" })).rejects.toThrow(
        "新增記錄失敗: 重複鍵值"
      );
    });
  });
});
