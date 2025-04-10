import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useEffect } from "react";
import { setupRelationHandlers } from "./events/relationHandler";
import { useCategoryStore } from "./store";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>test</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  /**
   * 初始化資料變更監聽機制
   * 包括設置事件監聽器和資料關聯處理器
   */
  useEffect(() => {
    console.debug("[Root] 初始化資料變更監聽與反應機制");

    // 設置分類資料的事件監聽
    const cleanupCategoryEvents = useCategoryStore
      .getState()
      .setupEventListeners();

    // 設置資料關聯處理器，處理不同資料類型間的依賴關係
    const cleanupRelationHandlers = setupRelationHandlers();

    // 組件卸載時清理所有事件訂閱
    return () => {
      console.debug("[Root] 清理資料變更監聽與反應機制");
      cleanupCategoryEvents();
      cleanupRelationHandlers();
    };
  }, []);

  return <Outlet />;
}
