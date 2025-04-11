import { eventBus } from "./eventBus";
import { DataEvent, DataEventPayload } from "./dataEvents";
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
    "timestamp" in payload &&
    (payload as DataEventPayload<T>).type in DataEvent
  );
}

/**
 * 廣播服務類別
 * 使用 BroadcastChannel API 在不同標籤頁之間同步資料變更事件
 */
export class BroadcastService {
  /**
   * 廣播頻道實例
   * @private
   */
  private channel: BroadcastChannel;

  /**
   * @param channelName 廣播頻道名稱
   */
  constructor(channelName: string = "hobby-tracker-sync") {
    // 建立廣播頻道
    this.channel = new BroadcastChannel(channelName);

    // 監聽來自其他頁面的消息
    this.channel.onmessage = (event) => {
      // 使用類型保護檢查數據格式
      if (isDataEventPayload(event.data)) {
        const payload = event.data;
        // 將收到的消息轉發到本地事件總線
        eventBus.publish(
          payload.type,
          payload.data as EventData<typeof payload.type>
        );
      } else {
        console.warn("[BroadcastService] 收到無效的事件數據格式", event.data);
      }
    };
  }

  /**
   * 向其他頁面廣播事件
   * @param type 事件類型
   * @param data 事件數據
   */
  broadcast<T>(type: DataEvent, data?: T): void {
    const payload: DataEventPayload<T> = {
      type,
      data,
      timestamp: Date.now(),
      source: "local",
    };

    this.channel.postMessage(payload);
  }

  /**
   * 關閉廣播頻道
   * 當組件卸載或應用程式關閉時應調用此方法清理資源
   */
  close(): void {
    this.channel.close();
  }
}

/**
 * 匯出廣播服務單例實例
 */
export const broadcastService = new BroadcastService();
