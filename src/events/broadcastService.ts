import { eventBus } from "./eventBus";
import { DataEvent, DataEventPayload } from "./dataEvents";

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
      const payload = event.data as DataEventPayload<unknown>;
      // 將收到的消息轉發到本地事件總線
      eventBus.publish(payload.type, payload.data);
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
