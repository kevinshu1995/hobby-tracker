## **Hobby Tracker 開發文件**

### **1. 需求概述**

Hobby Tracker 是一個基於 PWA 的網頁平台，旨在幫助使用者追蹤並管理自己的興趣活動。使用者可以自訂目標（次數或量）、記錄完成進度、查看日曆模式下的完成情況，並透過通知提醒自己完成目標。平台支援多語言（繁體中文與英文）、離線模式、多設備同步，以及社群分享功能。

---

### **2. 功能需求**

#### **核心功能**

-   **興趣分類與管理**：
    -   使用者可以自訂分類，每個分類有自己的圖示與顏色。
    -   使用者可以自由新增、編輯或刪除興趣項目，每個興趣項目只能隸屬於一個分類。
    -   興趣項目本身不需要選擇顏色，將繼承其所屬分類的顏色。
-   **目標設定**：
    -   次數目標：每日、每週、每月或自定義（例如：每週 3 次）。
    -   量化目標：以量為單位（例如：每天喝水 2 公升）。
    -   複合目標：同時需要滿足次數與時間的複合條件（例如：每週 5 次，每次 30 分鐘）。
    -   使用者可以針對每一項已新增的目標調整各項設定。
-   **進度記錄**：
    -   使用者可以記錄完成情況，並查看目標達成比例。
    -   每次記錄可設定完成日期或時間、該次進度的內容（例如完成幾次）。
    -   使用者可以通過日曆檢視模式查看所有的進度記錄。
-   **提醒功能**：使用者可自訂每個目標的通知時間。
-   **視覺化進度**：
    -   圖表顯示：提供日、週、月的進度折線圖或圓餅圖。
    -   日曆檢視模式：切換日、週、月檢視完成情況。
-   **社群分享**：
    -   分享進度到社群媒體（Facebook、Twitter 等）。
    -   自動截取畫面，展示實際使用效果。

#### **擴展功能**

-   **成就系統**：根據完成情況解鎖成就，例如「連續完成 7 天」、「月度達成率超過 90%」等。
-   **目標外觀自訂**：為每個目標分類選擇顏色與內建 icon。

#### **技術支持**

-   離線模式：支援離線時記錄數據，並在恢復網路後同步到雲端。
-   多語言支持：英文與繁體中文。
-   帳號系統：
    -   支援 Google SSO、Email 登入及匿名登入。
    -   多設備同步。

#### **使用者使用流程**

-   **首次進入流程**：

    -   選擇登入方式（Email、Google 或匿名）
    -   引導設定若干初始目標
    -   進入主畫面，開始使用

-   **設定目標流程**：

    -   點選「新增目標」按鈕
    -   選擇目標所屬分類（或創建新分類）
    -   設定目標類型（次數、量化或複合型）
    -   填寫目標詳細資訊
    -   儲存並返回主頁

-   **進度紀錄流程**：

    -   進入目標紀錄頁
    -   查看該週或該日目標列表
    -   選擇一個目標來新增紀錄或編輯既有紀錄
    -   設定完成日期、時間和進度內容
    -   完成並回到主頁

-   **主頁功能**：

    -   日曆檢視顯示當日、週、月進行中的目標（可切換檢視模式）
    -   依據當前選擇的日期顯示當日、當周、當月的目標列表（目標不重複顯示）
    -   直觀展示目標完成進度和統計資訊

-   **設定頁功能**：
    -   應用程式設定（主題、通知等）
    -   帳號設定（個人資料、登出）
    -   目標分類管理
    -   資料備份與匯出選項

---

### **3. 技術架構**

#### **前端**

-   框架：React + TypeScript
-   PWA 支援：
    -   使用 Workbox 實現 Service Worker，支援離線模式與快取策略。
-   圖表庫：選擇 `Chart.js` 或 `Recharts` 用於進度視覺化。
-   UI 框架：Tailwind CSS（極簡風格設計）。

#### **後端**

-   技術棧：
    -   Node.js + Express
    -   Serverless 架構（透過 AWS Lambda 或 Vercel Functions 部署 API）。
-   資料庫：
    -   本地儲存：IndexedDB，用於離線數據記錄。
    -   雲端儲存：Supabase（提供用戶認證、實時數據同步）。

#### **通知系統**

-   使用 Web Push API 實現通知功能。

---

### **4. 系統設計**

#### **資料模型**

| 模型名稱    | 欄位                      | 描述               |
| ----------- | ------------------------- | ------------------ |
| User        | id, email, name           | 使用者基本資料     |
| Hobby       | id, name, color, icon     | 興趣項目           |
| Goal        | id, type, value, period   | 每個興趣的目標設定 |
| Progress    | id, hobby_id, date, value | 完成進度記錄       |
| Achievement | id, name, description     | 成就系統           |

#### **API 設計**

| 功能     | Method | Endpoint          | 描述                   |
| -------- | ------ | ----------------- | ---------------------- |
| 新增興趣 | POST   | /api/hobbies      | 新增興趣項目           |
| 設定目標 | POST   | /api/goals        | 為興趣設定目標         |
| 記錄進度 | POST   | /api/progress     | 記錄完成情況           |
| 查詢進度 | GET    | /api/progress     | 根據日、週、月查詢進度 |
| 成就查詢 | GET    | /api/achievements | 查詢使用者已解鎖的成就 |

---

### **5. UI/UX 設計**

#### 主頁面

-   顯示所有興趣項目及其當前達成率。
-   提供快速新增進度的按鈕。

#### 詳細檢視

-   日曆模式切換（日、週、月）。
-   圖表顯示完成比例。

#### 設定頁

-   新增/編輯興趣項目。
-   設定提醒時間。

---

### **6. 開發流程**

#### 第一階段

1. 基本功能開發：
    - 興趣管理
    - 設定目標
    - 離線模式

#### 第二階段

2. 視覺化與通知：
    - 圖表與日曆檢視
    - Web Push 通知

#### 第三階段

3. 擴展功能：
    - 社群分享
    - 成就系統

---

# Hobby Tracker 系統開發深度規劃報告

## 核心功能與技術架構整合分析

### 前端架構設計

採用 React 18 與 TypeScript 4.9 建構組件化前端架構，透過 **Vite 4** 建置工具實現快速開發環境。UI 層面整合 **Tailwind CSS 3.3** 實現原子化樣式設計，搭配 **Headless UI** 組件庫構建無障礙交互元素。PWA 核心功能透過 **Workbox 6** 實現 Service Worker 動態預緩存策略，針對 `/index.html`、`/app-shell` 等關鍵資源採用 **Stale-While-Revalidate** 策略，確保離線可用性同時保持內容更新[5]。

資料視覺化模組選用 **Recharts 2.8** 實現自適應圖表系統，針對不同設備尺寸動態調整圖表呈現方式。日曆檢視功能整合 **react-big-calendar 1.6** 組件，支援自訂事件渲染與視圖切換邏輯，並透過 **date-fns 3.6** 進行時區與國際化日期處理[8]。

### 後端服務設計

基於 **Express 5.0** 構建 RESTful API，採用 **Serverless Framework 4.0** 部署至 AWS Lambda 環境。身份驗證系統整合 **Supabase Auth 2.38** 實現多模式登入流程，包含：

-   Google OAuth 2.0 聯合登入
-   Email/Password 傳統驗證
-   匿名會話管理（透過短期 JWT 實現）

資料同步機制採用 **Supabase Realtime** 的 PostgreSQL 變更監聽功能，當本地 IndexedDB 檢測到網路連線時，自動觸發 **Optimistic UI Update** 與後端資料校驗流程[3][6]。

### 離線優先資料策略

建立雙層資料持久化架構：

1. **本地儲存層**：使用 **IndexedDB 3.0** 搭配 **Dexie.js 4.0** 構建結構化離線資料庫，設計自動化 schema 遷移機制與事務衝突解決策略
2. **雲端同步層**：透過 **Supabase JS Client 3.0** 建立實時同步通道，實現以下同步策略：
    - 網路連線時：雙向增量同步（每 15 秒批次處理）
    - 離線時：本地操作隊列化（採用 **Redux-offline** 模式）
    - 衝突解決：採用 **Last-Write-Win** 策略配合操作時間戳記[2][8]

```typescript
// 離線同步核心邏輯範例
const syncHandler = async () => {
    const localChanges = await dexieDB.transaction("rw", dexieDB.progress, async () => {
        return dexieDB.progress.where("synced").equals(0).toArray();
    });

    if (localChanges.length > 0) {
        try {
            const { error } = await supabase.from("progress").upsert(localChanges);
            if (!error) {
                await dexieDB.progress
                    .where("id")
                    .anyOf(localChanges.map(p => p.id))
                    .modify({ synced: 1 });
            }
        } catch (e) {
            console.error("Sync failed:", e);
        }
    }
};
```

### 通知系統實作

整合 **Web Push API** 實現跨平台提醒功能，服務端採用 **web-push 5.0** 庫生成 VAPID 金鑰對。前端實現推送訂閱流程：

1. 透過 **Service Worker** 註冊推送管理器
2. 使用 **Notification API** 請求用戶權限
3. 將訂閱物件儲存至 Supabase 的 `push_subscriptions` 表[7]

```javascript
// 服務端推送實例
const webpush = require("web-push");
webpush.setVapidDetails("mailto:admin@hobbytracker.app", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

// 推送觸發邏輯
const triggerNotification = async (userId, payload) => {
    const { data } = await supabase.from("push_subscriptions").select("subscription").eq("user_id", userId);

    data.forEach(sub => {
        webpush.sendNotification(JSON.parse(sub.subscription), JSON.stringify(payload)).catch(err => console.error("Push failed:", err));
    });
};
```

## 進階功能模組設計

### 目標管理系統

設計可擴展的目標規則引擎，支援以下條件類型：

1. **頻率型目標**：採用 cron 表達式解析庫實現自定義週期
2. **數值型目標**：整合單位轉換系統（公制/英制自動換算）
3. **複合型目標**：透過邏輯運算子組合多條件（AND/OR）

```typescript
interface GoalCondition {
    type: "frequency" | "quantity" | "composite";
    config: FrequencyConfig | QuantityConfig | CompositeConfig;
}

interface FrequencyConfig {
    pattern: string; // cron syntax
    timezone: string;
}

interface QuantityConfig {
    unit: "liter" | "kilometer" | "count";
    target: number;
    accumulation: "daily" | "weekly" | "custom";
}
```

### 成就系統實現

採用事件驅動架構設計成就解鎖機制：

1. 定義 **AchievementRule** 事件監聽器
2. 建立 **Event Bus** 收集用戶行為事件
3. 實時計算成就達成狀態

成就類型包括：

-   **連續達成成就**：採用滑動窗口算法計算連續天數
-   **統計型成就**：基於時間範圍的累計值計算
-   **組合成就**：多條件關聯達成

```typescript
// 成就評估引擎範例
class AchievementEngine {
    constructor(private eventBus: EventBus) {
        this.eventBus.subscribe("progress_updated", this.checkAchievements);
    }

    private checkAchievements = async (event: ProgressEvent) => {
        const userAchievements = await supabase.from("user_achievements").select("*").eq("user_id", event.userId);

        const rules = await this.loadAchievementRules();

        rules.forEach(rule => {
            if (!userAchievements.some(ua => ua.achievement_id === rule.id)) {
                if (this.evaluateRule(rule, event)) {
                    this.unlockAchievement(event.userId, rule.id);
                }
            }
        });
    };
}
```

## 效能優化策略

### 前端渲染優化

1. 採用 **React Virtualized** 實現長列表虛擬滾動
2. 針對圖表元件實施 **Web Worker** 離線計算
3. 使用 **React Query 4.0** 管理伺服器狀態緩存
4. 實現 **SWR** 策略進行背景資料刷新

### 資料同步優化

設計差異化同步策略：

-   **關鍵資料**（如目標設定）：即時同步（<500ms）
-   **非關鍵資料**（如歷史紀錄）：批次同步（每 15 分鐘）
-   **大體量資料**（如成就記錄）：夜間離峰同步

### 安全防護機制

1. 實作 **CSP 3.0** 政策限制資源載入
2. 啟用 **Subresource Integrity** 驗證靜態資源
3. 針對 IndexedDB 實施 **加密儲存**（Web Crypto API）
4. 部署 **Rate Limiting** 防止 API 濫用

## 測試策略規劃

### 自動化測試架構

1. **單元測試**：Jest 29 + Testing Library
2. **整合測試**：Cypress 12 + Percy 視覺回歸測試
3. **效能測試**：Lighthouse CI 持續監控
4. **離線模擬測試**：使用 **Playwright** 模擬網路狀態

### 監控告警系統

1. 前端錯誤追蹤：Sentry 7
2. 效能監控：Google Core Web Vitals
3. 業務指標監控：自定義 Supabase 儀表板
4. 異常檢測：設定自定義閾值告警

## 部署與維運方案

### 持續交付管道

1. **預發環境**：Vercel Preview Deployments
2. **生產環境**：AWS Lambda + CloudFront
3. **資料庫遷移**：SupaBase Migration CLI
4. **配置管理**：透過 GitHub Actions 實現藍綠部署

### 監控儀表板

1. **前端效能**：Real User Monitoring (RUM)
2. **API 健康狀態**：AWS CloudWatch 綜合監控
3. **用戶行為分析**：PostHog 事件追蹤
4. **錯誤追蹤**：Sentry 問題分組與優先級排序

本規劃報告已完整涵蓋系統架構、核心模組、擴展機制與維運策略，建議採用分階段交付方式逐步實現各項功能。技術選型充分考慮現代 Web 標準與最佳實踐，確保系統具備高可用性、可維護性與擴展性[4][6][8]。後續實施時需特別注意 PWA 的離線體驗優化與跨平台相容性測試，建議建立完整的端到端測試套件以保障核心流程穩定性。

Sources
[1] 如何製作迷你 GPS 追蹤器：全面指南 - Crate Club https://crateclub.com/zh-hant/blogs/%E8%A3%9D%E5%82%99%E6%B8%85%E5%96%AE/how-to-make-a-mini-gps-tracker-a-comprehensive-guide
[2] PWA 离线存储策略：IndexedDB 与 Cache API 原创 - CSDN 博客 https://blog.csdn.net/A1215383843/article/details/139484099
[3] Supabase Realtime：实时数据同步的开源解决方案 - CSDN 博客 https://blog.csdn.net/gitblog_00088/article/details/144124177
[4] Serverless Express，让你轻松部署 Express 应用到云端 - CSDN 博客 https://blog.csdn.net/gitblog_00082/article/details/139516361
[5] React PWA with TypeScript using CRA or Vite - Sparky's blog https://davidschinteie.hashnode.dev/react-pwa-with-typescript-using-cra-or-vite
[6] 商業思維學院的學習成就制度與升級、徽章攻略 https://bizthinking.com.tw/2021/03/30/learning-awards/
[7] [Service Worker]使用.Net Core 快速實作瀏覽器推播(Push ... https://www.lucysdad.com/Article/Service%20Worker/%E4%BD%BF%E7%94%A8.Net%20Core%E5%BF%AB%E9%80%9F%E5%AF%A6%E4%BD%9C%E7%80%8F%E8%A6%BD%E5%99%A8%E6%8E%A8%E6%92%AD(Push%20Notifications)%E5%8A%9F%E8%83%BD
[8] 追蹤器平台的歷史軌跡與數據統計功能介紹 https://nyc2012mf.com.tw/news-104.html
[9] PWA - IndexDB Implement - 叡揚資訊 https://www.gss.com.tw/blog/pwa-1-1
[10] 实时监听 PostgreSQL 数据库变更：Supabase 的解决方案 - 易源易彩 https://www.yicaiai.com/news/article/66b612fe4ddd79f11a001540
[11] 如何使用 Serverless Framework 將 Express 部署到 AWS Lambda https://tech.havocfuture.tw/blog/serverless-framework-with-aws
[12] Transforming Your React App into a PWA: A Comprehensive Guide https://dev.to/pettiboy/transforming-your-react-app-into-a-pwa-a-comprehensive-guide-59hk
[13] Achievement 成就系統| 從 0 到 1，打造自己的遊戲後端服務 - 簡介 https://terryhuanghd.gitbook.io/build-game-services/you-xi-fu-wu/achievement-cheng-jiu-xi-tong
[14] Progressive Web App 網站推播通知: 原理解密前後端實作說明 https://linyencheng.github.io/2021/09/26/progressive-web-application/pwa-push-notificatoin-introduction/
[15] 我想重拾高效生活：測試 9 款最佳習慣追蹤應用程式 - 品科技 https://www.pintech.com.tw/tw/column/676/boost-efficient-life-habits-apps
[16] 離線資料 | web.dev https://web.dev/learn/pwa/offline-data
[17] 使用 Supabase 的 Realtime + Storage 非常方便呢原创 - CSDN 博客 https://blog.csdn.net/ddrfan/article/details/139045706
[18] 【Serverless 應用案例賞析筆記】01. Serverless 架構與 Apache ... https://hackmd.io/@CynthiaChuang/Serverless-Use-Cases-Study-Notes-01
[19] Making a Progressive Web App - Create React App https://create-react-app.dev/docs/making-a-progressive-web-app/
[20] 第十五章，再進一小步，應該不難吧？ - iT 邦幫忙- iThome https://ithelp.ithome.com.tw/m/articles/10331955

---

# Hobby Tracker 功能優先順序清單

根據您的開發文件和新增的需求，我已將功能按重要性和開發順序整理如下：

## P0：基礎核心功能（MVP）

| 優先級 | 功能類別   | 具體功能     | 說明                                             |
| ------ | ---------- | ------------ | ------------------------------------------------ |
| P0-1   | 使用者認證 | 基礎登入系統 | 支援至少一種登入方式（如 Email）和用戶資料管理   |
| P0-2   | 興趣管理   | 興趣分類系統 | 支援分類新增/編輯/刪除，每個分類可設定顏色和圖示 |
| P0-3   | 興趣管理   | 興趣項目管理 | 在分類下新增/編輯/刪除興趣項目                   |
| P0-4   | 目標設定   | 基本目標設定 | 支援次數和量化兩種基本目標類型的設定             |
| P0-5   | 進度記錄   | 基本進度紀錄 | 可記錄完成情況和目標達成比例                     |
| P0-6   | UI 實作    | 主頁面       | 實現基本主頁面布局顯示目標和進度                 |
| P0-7   | 離線功能   | 本地資料存儲 | 使用 IndexedDB 實現基本離線資料儲存              |

## P1：關鍵體驗功能

| 優先級 | 功能類別 | 具體功能       | 說明                                               |
| ------ | -------- | -------------- | -------------------------------------------------- |
| P1-1   | 用戶體驗 | 使用者流程優化 | 完整實現使用者流程（首次進入、目標設定、進度記錄） |
| P1-2   | 目標功能 | 復合型目標     | 支援同時需要滿足次數與時間的複合條件目標           |
| P1-3   | 目標管理 | 目標調整功能   | 使用者可針對已新增的目標調整各項設定               |
| P1-4   | 視覺化   | 日曆檢視模式   | 支援日/週/月三種檢視模式顯示目標和進度             |
| P1-5   | 資料同步 | 基礎雲端同步   | 實現本地資料與雲端的基本同步功能                   |
| P1-6   | 認證擴展 | 多種登入方式   | 增加 Google SSO 和匿名登入選項                     |
| P1-7   | 進度記錄 | 進階記錄功能   | 支援自訂完成日期/時間與進度內容                    |

## P2：增強功能

| 優先級 | 功能類別   | 具體功能     | 說明                               |
| ------ | ---------- | ------------ | ---------------------------------- |
| P2-1   | 視覺化     | 圖表顯示     | 提供日/週/月的進度折線圖或圓餅圖   |
| P2-2   | 提醒功能   | 通知系統     | 使用 Web Push API 實現自訂通知提醒 |
| P2-3   | 多設備支援 | 完整資料同步 | 優化多設備使用的資料同步與衝突解決 |
| P2-4   | 離線體驗   | 完整離線支援 | 離線使用體驗優化與網路恢復同步處理 |
| P2-5   | 多語言     | 語言支援     | 實現英文與繁體中文雙語支援         |
| P2-6   | 設定頁面   | 應用設定     | 完整的應用程式和帳號設定頁面       |

## P3：差異化功能

| 優先級 | 功能類別 | 具體功能     | 說明                         |
| ------ | -------- | ------------ | ---------------------------- |
| P3-1   | 社群分享 | 進度分享     | 分享進度到社群媒體功能       |
| P3-2   | 社群分享 | 自動截圖     | 智能生成分享用圖片展示       |
| P3-3   | 成就系統 | 成就解鎖     | 根據完成情況解鎖成就徽章     |
| P3-4   | 數據分析 | 使用者洞察   | 提供使用者行為模式分析與建議 |
| P3-5   | 安全性   | 資料加密     | 敏感資料的本地和傳輸加密     |
| P3-6   | 效能優化 | 進階渲染優化 | 長列表虛擬滾動與資料緩存策略 |

## 使用者使用流程

### 首次進入流程

1. 歡迎畫面和介紹
2. 選擇登入方式（Email、Google 或匿名）
3. 首次設定向導
    - 引導用戶建立第一個分類
    - 在分類下設定首個興趣目標
    - 簡易教學如何記錄進度
4. 進入主畫面

### 目標設定流程

1. 主頁點擊「新增目標」按鈕
2. 選擇目標所屬分類（或建立新分類）
3. 設定目標基本資訊（名稱、描述）
4. 選擇目標類型
    - 次數目標（每日/週/月或自定義）
    - 量化目標（設定單位和數量）
    - 復合型目標（同時設定次數和時間要求）
5. 設定提醒時間（可選）
6. 儲存並返回主頁

### 進度記錄流程

1. 主頁選擇目標或從日曆檢視點選目標
2. 進入目標詳情頁
3. 點擊「新增記錄」按鈕
4. 填寫進度表單
    - 選擇完成日期/時間
    - 輸入本次完成數量/次數
    - 新增備註（可選）
5. 儲存記錄並顯示更新後的完成進度
6. 返回主頁

### 主頁功能

-   頂部：日期/週/月份導航條
-   中間：日曆視圖（可切換日/週/月檢視模式）
-   下方：當前選定日期/週/月的目標列表
-   快速操作：浮動按鈕提供快速新增目標/記錄功能
-   過濾選項：按分類篩選顯示的目標

### 設定頁功能

-   帳號管理：個人資料、登入方式、登出
-   應用設定：語言切換、主題、通知設定
-   資料管理：備份/還原、資料清理
-   目標管理：分類整理、目標批量操作
-   關於/幫助：使用說明、版本資訊

這份優先順序表和使用流程將幫助開發團隊清楚了解實作順序，並確保核心功能先被完成，為用戶提供良好的基本體驗後再逐步增強。

