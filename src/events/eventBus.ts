import { EventData, EventName } from "../types/EventTypes";

/**
 * 事件回呼函數型別定義 - 使用泛型實現型別安全
 */
export type EventCallback<T extends EventName = string> = (
  data: EventData<T>
) => void;

/**
 * 事件總線類別
 * 實現簡單的發佈/訂閱模式，用於在應用程式不同部分之間傳遞事件通知
 */
class EventBus {
  /**
   * 事件映射表，key 為事件名稱，value 為對應的回呼函數陣列
   * @private
   */
  private events: Map<string, Array<EventCallback<EventName>>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * 訂閱事件
   * @param event 事件名稱
   * @param callback 事件處理回呼函數
   * @returns 取消訂閱的函數
   */
  subscribe<T extends EventName>(
    event: T,
    callback: EventCallback<T>
  ): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    // 將回呼加入對應事件陣列
    const callbackList = this.events.get(event)!;
    // 這裡需要型別轉換，因為我們知道 callback 處理的是 T 型別的事件
    callbackList.push(callback as EventCallback<EventName>);

    // 返回取消訂閱的函數
    return () => {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback as EventCallback<EventName>);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 發布事件
   * @param event 事件名稱
   * @param data 傳遞給事件處理函數的資料
   */
  publish<T extends EventName>(event: T, data: EventData<T>): void {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event)!;
      for (const callback of callbacks) {
        try {
          // 此處需要型別轉換以確保型別安全性
          (callback as EventCallback<T>)(data);
        } catch (error) {
          console.error(`事件處理錯誤(${event}):`, error);
        }
      }
    }
  }

  /**
   * 清除特定事件的所有訂閱
   * @param event 事件名稱
   */
  clear(event: string): void {
    if (this.events.has(event)) {
      this.events.delete(event);
    }
  }

  /**
   * 清除所有事件訂閱
   */
  clearAll(): void {
    this.events.clear();
  }
}

/**
 * 匯出單例事件總線實例
 */
export const eventBus = new EventBus();
