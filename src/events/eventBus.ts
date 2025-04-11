/**
 * 事件回呼函數型別定義
 */
type EventCallback = (...args: unknown[]) => void;

/**
 * 事件總線類別
 * 實現簡單的發佈/訂閱模式，用於在應用程式不同部分之間傳遞事件通知
 */
class EventBus {
  /**
   * 事件映射表，key 為事件名稱，value 為對應的回呼函數陣列
   * @private
   */
  private events: Map<string, EventCallback[]>;

  constructor() {
    this.events = new Map();
  }

  /**
   * 訂閱事件
   * @param event 事件名稱
   * @param callback 事件處理回呼函數
   * @returns 取消訂閱的函數
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    // 返回取消訂閱的函數
    return () => {
      const callbacks = this.events.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 發布事件
   * @param event 事件名稱
   * @param args 傳遞給事件處理函數的參數
   */
  publish(event: string, ...args: unknown[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`事件處理錯誤(${event}):`, error);
        }
      });
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
