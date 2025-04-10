import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import { useEffect } from "react";
import { setupRelationHandlers } from "./events/relationHandler";
import { useCategoryStore } from "./store";

export default function App() {
  /**
   * 初始化資料變更監聽機制
   * 包括設置事件監聽器和資料關聯處理器
   */
  useEffect(() => {
    console.debug("[App] 初始化資料變更監聽與反應機制");

    // 設置分類資料的事件監聽
    const cleanupCategoryEvents = useCategoryStore
      .getState()
      .setupEventListeners();

    // 設置資料關聯處理器，處理不同資料類型間的依賴關係
    const cleanupRelationHandlers = setupRelationHandlers();

    // 組件卸載時清理所有事件訂閱
    return () => {
      console.debug("[App] 清理資料變更監聽與反應機制");
      cleanupCategoryEvents();
      cleanupRelationHandlers();
    };
  }, []);

  return (
    <Routes>
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}
