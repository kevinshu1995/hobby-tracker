import "fake-indexeddb/auto";
import "@testing-library/jest-dom";

// 重設全局狀態
beforeEach(() => {
  // 清空 IndexedDB
  // 使用 deleteDatabase 方法來清空而不是重新賦值
  indexedDB.deleteDatabase("hobby-tracker-test");
});

// 模擬 crypto.randomUUID
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substring(2, 9),
  },
});
