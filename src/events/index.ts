/**
 * 事件系統模組集中匯出
 * 提供統一的匯入點，便於在應用程式中使用事件相關功能
 */

// 匯出事件總線
export { eventBus } from "./eventBus";

// 匯出事件類型定義
export { DataEvent, type DataEventPayload } from "./dataEvents";

// 匯出資料庫觀察者
export { dbObserver } from "./dbObserver";

// 匯出廣播服務
export { broadcastService } from "./broadcastService";

// 匯出關聯處理器設置函數
export { setupRelationHandlers } from "./relationHandler";
