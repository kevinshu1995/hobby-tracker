# Hobby Tracker 專案結構規劃

## 資料模型設計

根據需求文件中的描述，我們需要設計以下核心資料模型：

### 使用者 (User)

```typescript
export interface User {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
}

export interface UserPreferences {
    language: "zh-TW" | "en";
    theme: "light" | "dark" | "system";
    notificationsEnabled: boolean;
}
```

### 興趣分類 (Category)

```typescript
export interface Category {
    id: string;
    userId: string;
    name: string;
    color: string; // 十六進制顏色代碼
    icon: string; // 圖示識別符
    createdAt: Date;
    updatedAt: Date;
}
```

### 興趣項目 (Hobby)

```typescript
export interface Hobby {
    id: string;
    userId: string;
    categoryId: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
```

### 目標 (Goal)

```typescript
export type GoalType = "count" | "quantity" | "composite";
export type GoalPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface Goal {
    id: string;
    userId: string;
    hobbyId: string;
    type: GoalType;
    period: GoalPeriod;
    targetValue: number;
    targetUnit?: string;
    customPeriod?: CustomPeriodConfig;
    timeRequirement?: number; // 分鐘，僅用於複合型目標
    createdAt: Date;
    updatedAt: Date;
}

export interface CustomPeriodConfig {
    frequency: number; // 頻率數量
    unit: "day" | "week" | "month"; // 單位
}
```

### 進度記錄 (Progress)

```typescript
export interface Progress {
    id: string;
    userId: string;
    goalId: string;
    recordedAt: Date;
    value: number;
    duration?: number; // 分鐘，僅用於複合型目標
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
```

### 成就 (Achievement)

```typescript
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    conditionType: "streak" | "count" | "composite";
    conditionValue: AchievementCondition;
    createdAt: Date;
}

export interface AchievementCondition {
    // 取決於 conditionType 的不同內容
    // 例如，'streak' 可能有 daysRequired: number
    [key: string]: any;
}

export interface UserAchievement {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: Date;
}
```

### 提醒通知 (Notification)

```typescript
export interface Notification {
    id: string;
    userId: string;
    goalId: string;
    timeOfDay: string; // 格式 "HH:MM"
    daysOfWeek: string[]; // ['monday', 'tuesday', ...]
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PushSubscription {
    id: string;
    userId: string;
    subscription: object; // Web Push API 訂閱物件
    createdAt: Date;
}
```

## 元件結構設計

使用功能模組化的方式組織元件，確保代碼的可維護性和可擴展性：

### 基礎 UI 元件 (components/ui)

-   Button.tsx - 按鈕元件
-   Input.tsx - 輸入框元件
-   Select.tsx - 下拉選擇元件
-   Checkbox.tsx - 復選框元件
-   Modal.tsx - 模態對話框
-   Toast.tsx - 輕提示元件
-   Card.tsx - 卡片元件
-   Tabs.tsx - 標籤頁
-   DatePicker.tsx - 日期選擇器
-   TimePicker.tsx - 時間選擇器
-   Badge.tsx - 徽章元件
-   Avatar.tsx - 頭像元件
-   ColorPicker.tsx - 顏色選擇器
-   IconPicker.tsx - 圖示選擇器

### 佈局元件 (components/layout)

-   AppLayout.tsx - 應用主佈局
-   AuthLayout.tsx - 認證頁面佈局
-   Header.tsx - 頂部導航欄
-   Footer.tsx - 底部信息欄
-   Sidebar.tsx - 側邊欄
-   PageContainer.tsx - 頁面容器

### 功能元件 (components/features)

#### 認證相關 (components/features/auth)

-   LoginForm.tsx - 登入表單
-   RegisterForm.tsx - 註冊表單
-   ResetPasswordForm.tsx - 密碼重設表單
-   SocialLoginButtons.tsx - 社交登入按鈕
-   UserProfile.tsx - 用戶資料顯示與編輯

#### 分類管理 (components/features/categories)

-   CategoryList.tsx - 分類列表
-   CategoryForm.tsx - 分類創建/編輯表單
-   CategoryCard.tsx - 分類卡片
-   CategorySelector.tsx - 分類選擇器

#### 興趣管理 (components/features/hobbies)

-   HobbyList.tsx - 興趣列表
-   HobbyForm.tsx - 興趣創建/編輯表單
-   HobbyCard.tsx - 興趣卡片
-   HobbyDetail.tsx - 興趣詳情

#### 目標管理 (components/features/goals)

-   GoalList.tsx - 目標列表
-   GoalForm.tsx - 目標創建/編輯表單
-   GoalCard.tsx - 目標卡片
-   GoalDetail.tsx - 目標詳情
-   GoalProgress.tsx - 目標進度顯示

#### 進度記錄 (components/features/progress)

-   ProgressForm.tsx - 進度記錄表單
-   ProgressList.tsx - 進度記錄列表
-   ProgressChart.tsx - 進度圖表
-   QuickRecordButton.tsx - 快速記錄按鈕

#### 日曆檢視 (components/features/calendar)

-   CalendarView.tsx - 日曆視圖
-   DayView.tsx - 日視圖
-   WeekView.tsx - 週視圖
-   MonthView.tsx - 月視圖
-   CalendarEvent.tsx - 日曆事件顯示

#### 成就系統 (components/features/achievements)

-   AchievementList.tsx - 成就列表
-   AchievementCard.tsx - 成就卡片
-   AchievementDetail.tsx - 成就詳情
-   UnlockNotification.tsx - 成就解鎖通知

#### 通知提醒 (components/features/notifications)

-   NotificationForm.tsx - 提醒設定表單
-   NotificationList.tsx - 提醒列表
-   PushPermissionPrompt.tsx - 推送權限請求提示

#### 社群分享 (components/features/sharing)

-   ShareButton.tsx - 分享按鈕
-   ShareModal.tsx - 分享選項模態框
-   ShareCard.tsx - 分享卡片預覽
-   ShareOptions.tsx - 分享選項設定

### 頁面元件 (pages)

-   HomePage.tsx - 首頁
-   AuthPage.tsx - 認證頁面
-   DashboardPage.tsx - 儀表板頁面
-   CategoryPage.tsx - 分類管理頁面
-   HobbyPage.tsx - 興趣管理頁面
-   GoalPage.tsx - 目標管理頁面
-   CalendarPage.tsx - 日曆檢視頁面
-   ProgressPage.tsx - 進度詳情頁面
-   AchievementPage.tsx - 成就頁面
-   SettingsPage.tsx - 設定頁面
-   NotFoundPage.tsx - 404 頁面

## Hooks 設計

自定義 Hooks 用於處理常見的邏輯和狀態管理：

### 認證相關 (hooks/auth)

-   useAuth.ts - 處理認證相關邏輯
-   useUser.ts - 獲取與管理用戶資料

### 資料相關 (hooks/data)

-   useCategories.ts - 獲取與管理分類資料
-   useHobbies.ts - 獲取與管理興趣資料
-   useGoals.ts - 獲取與管理目標資料
-   useProgress.ts - 獲取與管理進度資料
-   useAchievements.ts - 獲取與管理成就資料

### 功能相關 (hooks/features)

-   useNotifications.ts - 處理通知相關邏輯
-   useCalendar.ts - 處理日曆檢視相關邏輯
-   useShare.ts - 處理分享功能相關邏輯
-   useOffline.ts - 處理離線狀態與同步邏輯
-   useTheme.ts - 處理主題切換相關邏輯
-   useLanguage.ts - 處理語言切換相關邏輯

### 通用 (hooks/common)

-   useLocalStorage.ts - 本地存儲操作封裝
-   useMediaQuery.ts - 響應式斷點檢測
-   useDebounce.ts - 防抖處理
-   useThrottle.ts - 節流處理
-   useClickOutside.ts - 點擊外部檢測
-   useForm.ts - 表單處理

## 狀態管理設計

使用 Zustand 進行全局狀態管理：

### 認證狀態 (store/authStore.ts)

```typescript
interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginAnonymously: () => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}
```

### 資料狀態 (store/dataStore.ts)

```typescript
interface DataState {
    categories: Category[];
    hobbies: Hobby[];
    goals: Goal[];
    isLoading: boolean;
    error: string | null;
    fetchCategories: () => Promise<void>;
    fetchHobbies: () => Promise<void>;
    fetchGoals: () => Promise<void>;
    addCategory: (category: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
    updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    // 類似的方法用於 hobbies 和 goals
}
```

### 進度狀態 (store/progressStore.ts)

```typescript
interface ProgressState {
    records: Record<string, Progress[]>; // goalId -> Progress[]
    isLoading: boolean;
    error: string | null;
    fetchProgressForGoal: (goalId: string) => Promise<void>;
    fetchProgressForDate: (date: Date) => Promise<void>;
    addProgress: (progress: Omit<Progress, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<string>;
    updateProgress: (id: string, data: Partial<Progress>) => Promise<void>;
    deleteProgress: (id: string) => Promise<void>;
}
```

### UI 狀態 (store/uiStore.ts)

```typescript
interface UIState {
    theme: "light" | "dark" | "system";
    language: "zh-TW" | "en";
    calendarView: "day" | "week" | "month";
    selectedDate: Date;
    setTheme: (theme: "light" | "dark" | "system") => void;
    setLanguage: (language: "zh-TW" | "en") => void;
    setCalendarView: (view: "day" | "week" | "month") => void;
    setSelectedDate: (date: Date) => void;
}
```

### 離線狀態 (store/offlineStore.ts)

```typescript
interface OfflineState {
    isOnline: boolean;
    pendingChanges: number;
    isSyncing: boolean;
    setOnlineStatus: (status: boolean) => void;
    syncChanges: () => Promise<void>;
    trackChange: () => void;
    completeChange: () => void;
}
```

## 路由設計

使用 React Router 實現前端路由：

```typescript
// routes/index.tsx
const routes = [
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { path: "", element: <HomePage /> },
            { path: "dashboard", element: <DashboardPage /> },
            { path: "categories", element: <CategoryPage /> },
            { path: "hobbies", element: <HobbyPage /> },
            { path: "hobbies/:hobbyId", element: <HobbyDetailPage /> },
            { path: "goals/new", element: <GoalFormPage /> },
            { path: "goals/:goalId", element: <GoalDetailPage /> },
            { path: "goals/:goalId/edit", element: <GoalFormPage /> },
            { path: "calendar", element: <CalendarPage /> },
            { path: "achievements", element: <AchievementPage /> },
            { path: "settings", element: <SettingsPage /> },
        ],
    },
    {
        path: "/auth",
        element: <AuthLayout />,
        children: [
            { path: "login", element: <LoginPage /> },
            { path: "register", element: <RegisterPage /> },
            { path: "reset-password", element: <ResetPasswordPage /> },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
];
```

## 服務層設計

服務層負責處理與外部 API 和本地存儲的交互：

### API 服務 (services/api)

-   authApi.ts - 認證相關 API 操作
-   categoryApi.ts - 分類相關 API 操作
-   hobbyApi.ts - 興趣相關 API 操作
-   goalApi.ts - 目標相關 API 操作
-   progressApi.ts - 進度相關 API 操作
-   achievementApi.ts - 成就相關 API 操作

### 本地存儲服務 (services/storage)

-   indexedDB.ts - IndexedDB 操作封裝
-   localStorageService.ts - localStorage 操作封裝

### 同步服務 (services/sync)

-   syncService.ts - 資料同步邏輯

### 通知服務 (services/notification)

-   pushService.ts - Web Push 相關操作

## 國際化設計

使用 i18next 實現多語言支持：

```typescript
// i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./locales/en.json";
import zhTWTranslation from "./locales/zh-TW.json";

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: enTranslation,
        },
        "zh-TW": {
            translation: zhTWTranslation,
        },
    },
    lng: "zh-TW",
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
```

## 型別定義整合

將所有型別定義整合到一個中央位置，以便在整個應用程式中使用：

```typescript
// types/index.ts
export * from "./auth";
export * from "./category";
export * from "./hobby";
export * from "./goal";
export * from "./progress";
export * from "./achievement";
export * from "./notification";
```

## 工具函數設計

常用工具函數：

### 日期處理 (utils/date.ts)

-   formatDate(date: Date, format: string): string
-   getStartOfDay(date: Date): Date
-   getStartOfWeek(date: Date): Date
-   getStartOfMonth(date: Date): Date
-   getDaysInMonth(date: Date): number[]
-   isToday(date: Date): boolean
-   isPast(date: Date): boolean
-   isFuture(date: Date): boolean

### 資料處理 (utils/data.ts)

-   groupBy<T>(array: T[], key: keyof T): Record<string, T[]>
-   sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[]
-   filterBy<T>(array: T[], predicate: (item: T) => boolean): T[]

### 驗證函數 (utils/validation.ts)

-   isValidEmail(email: string): boolean
-   isValidPassword(password: string): boolean
-   isValidName(name: string): boolean

### 單位轉換 (utils/units.ts)

-   convertUnits(value: number, fromUnit: string, toUnit: string): number

### 顏色處理 (utils/color.ts)

-   lightenColor(color: string, amount: number): string
-   darkenColor(color: string, amount: number): string
-   contrastColor(backgroundColor: string): 'white' | 'black'

## 總結

上述專案結構規劃全面覆蓋了 Hobby Tracker 應用的各個方面，包括資料模型設計、元件結構、狀態管理、路由設計和服務層設計。這種模組化的結構將使得開發過程更加有序，並且隨著專案的發展更容易進行擴展和維護。

在實際開發過程中，可以根據需求的變化和實際情況對這個結構進行調整，但這個基礎架構應該能夠支持所有需求文件中描述的功能。

