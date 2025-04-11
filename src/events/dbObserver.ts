import { eventBus } from "./eventBus";
import { DataEvent, DataEventPayload } from "./dataEvents";
import { broadcastService } from "./broadcastService";
import { EventData } from "../types/EventTypes";

/**
 * 類型保護函數，檢查對象是否為 DataEventPayload 類型
 * @param payload 要檢查的數據
 * @returns 是否為 DataEventPayload 類型
 */
function isDataEventPayload<T>(
  payload: unknown
): payload is DataEventPayload<T> {
  return (
    payload !== null &&
    typeof payload === "object" &&
    "type" in payload &&
    "timestamp" in payload
  );
}

/**
 * 資料庫變更觀察者類別
 * 負責監測資料庫操作並發送相應的事件通知
 */
export class DbChangeObserver {
  /**
   * 通知資料變更
   * @param event 事件類型
   * @param data 事件資料
   */
  notifyChange<T extends Record<string, unknown>>(
    event: DataEvent,
    data?: T
  ): void {
    // 創建事件資料
    const payload: DataEventPayload<T> = {
      type: event,
      data,
      timestamp: Date.now(),
      source: "local",
    };

    // 在本地發布事件
    console.debug(`[DbObserver] 資料變更通知: ${event}`, data);
    eventBus.publish(event, payload as EventData<typeof event>);

    // 向其他頁面廣播變更
    broadcastService.broadcast(event, data);

    // 同時觸發通用的資料庫變更事件
    eventBus.publish(DataEvent.DATABASE_CHANGED, {
      specificEvent: event,
      data,
    });
  }

  /**
   * 監聽特定類型的資料變更
   * @param event 事件類型
   * @param callback 事件處理函數
   * @returns 取消訂閱的函數
   */
  onDataChange<T>(event: DataEvent, callback: (data?: T) => void): () => void {
    return eventBus.subscribe(event, (payload: EventData<typeof event>) => {
      // 從 payload 中取出數據，如果是 DataEventPayload 格式則取出 data 屬性
      const data = isDataEventPayload<T>(payload)
        ? payload.data
        : (payload as T);
      callback(data);
    });
  }
}

/**
 * 匯出資料庫變更觀察者單例實例
 */
export const dbObserver = new DbChangeObserver();
