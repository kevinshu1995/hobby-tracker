# Hobby Tracker 環境建置指南

## 1. 專案初始化

### 1.1 建立 React + TypeScript + Vite 專案

使用 Vite 建立 React + TypeScript 專案框架：

```bash
# 安裝最新版本的 Node.js (建議 v18 或更新版本)
# 使用 Vite 建立新專案
npm create vite@latest hobby-tracker -- --template react-ts
cd hobby-tracker
npm install
```

### 1.2 版本控制設定

初始化 Git 儲存庫並建立 .gitignore 檔案：

```bash
git init
```

確保 .gitignore 包含以下內容：

```
# 依賴目錄
node_modules
.pnp
.pnp.js

# 建置輸出
dist
build
dist-ssr
*.local

# 環境變數檔案
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 日誌
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# 編輯器目錄和檔案
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

## 2. 安裝核心依賴套件

### 2.1 UI 框架與元件

安裝 Tailwind CSS 與相關依賴：

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

安裝 UI 元件庫：

```bash
npm install @headlessui/react
```

安裝圖標庫：

```bash
npm install react-icons
```

### 2.2 前端狀態管理與資料處理

安裝狀態管理庫：

```bash
npm install zustand immer
```

安裝資料處理工具：

```bash
npm install zod react-hook-form @hookform/resolvers
```

### 2.3 路由與導航

安裝路由庫：

```bash
npm install react-router-dom
```

### 2.4 PWA 支援

安裝 PWA 相關工具：

```bash
npm install -D vite-plugin-pwa workbox-window workbox-core
```

### 2.5 本地儲存與離線功能

安裝 IndexedDB 工具：

```bash
npm install dexie dexie-react-hooks
```

### 2.6 後端整合

安裝 Supabase 客戶端：

```bash
npm install @supabase/supabase-js
```

### 2.7 圖表與視覺化

安裝圖表庫：

```bash
npm install recharts
```

安裝日曆元件：

```bash
npm install react-big-calendar date-fns
npm install -D @types/react-big-calendar
```

### 2.8 國際化支援

安裝國際化工具：

```bash
npm install i18next react-i18next
```

## 3. 設定專案配置

### 3.1 Tailwind CSS 設定

編輯 tailwind.config.js 以包含專案檔案並設定主題：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f5f7ff",
                    100: "#ebf0fe",
                    200: "#d8e0fd",
                    300: "#bbc9fc",
                    400: "#9aa7f9",
                    500: "#7a82f4",
                    600: "#6360e9",
                    700: "#514ad0",
                    800: "#433ea9",
                    900: "#3a3986",
                    950: "#232150",
                },
            },
            fontFamily: {
                sans: ["Inter var", "sans-serif"],
            },
        },
    },
    darkMode: "class",
    plugins: [],
};
```

在 src/index.css 加入 Tailwind 基礎樣式：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
    html {
        -webkit-tap-highlight-color: transparent;
    }
}

@layer components {
    .btn {
        @apply px-4 py-2 rounded-lg font-medium transition-colors;
    }

    .btn-primary {
        @apply bg-primary-600 text-white hover:bg-primary-700;
    }

    .btn-secondary {
        @apply bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600;
    }

    .input {
        @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white;
    }
}
```

### 3.2 PWA 設定

建立 PWA 配置檔：

```javascript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            injectRegister: "auto",
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp}"],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "gstatic-fonts-cache",
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // <== 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                ],
            },
            manifest: {
                name: "Hobby Tracker",
                short_name: "HobbyTracker",
                description: "追蹤並管理你的興趣活動",
                theme_color: "#6360e9",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                icons: [
                    {
                        src: "/icons/icon-72x72.png",
                        sizes: "72x72",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-96x96.png",
                        sizes: "96x96",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-128x128.png",
                        sizes: "128x128",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-144x144.png",
                        sizes: "144x144",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-152x152.png",
                        sizes: "152x152",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-384x384.png",
                        sizes: "384x384",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
        }),
    ],
});
```

### 3.3 環境變數設定

創建環境變數檔案：

```
# .env.example
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3.4 TypeScript 設定

更新 tsconfig.json 以增強型別檢查：

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["src"],
    "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 4. 專案結構設定

### 4.1 目錄結構

建立以下目錄結構：

```
src/
├── assets/          # 靜態資源如圖標、圖片等
├── components/      # 共用元件
│   ├── layout/      # 布局相關元件
│   ├── ui/          # UI 元件
│   └── features/    # 功能相關元件
├── contexts/        # React 上下文
├── hooks/           # 自定義 Hooks
├── lib/             # 工具函數和第三方庫配置
│   ├── api.ts       # API 封裝
│   ├── supabase.ts  # Supabase 客戶端配置
│   └── db.ts        # IndexedDB 配置
├── pages/           # 頁面元件
├── routes/          # 路由配置
├── services/        # 服務層
│   ├── auth.ts      # 認證服務
│   ├── storage.ts   # 儲存服務
│   └── sync.ts      # 同步服務
├── store/           # 狀態管理
├── types/           # TypeScript 型別定義
├── utils/           # 通用工具函數
├── i18n/            # 國際化資源
├── App.tsx          # 根元件
├── main.tsx         # 入口文件
└── index.css        # 全局樣式
```

### 4.2 建立基礎元件

創建基礎 UI 元件如按鈕、輸入框、卡片等：

```tsx
// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
    isLoading?: boolean;
}

export const Button = ({ variant = "primary", size = "md", children, isLoading = false, className, disabled, ...props }: ButtonProps) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantStyles = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-500",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-800 focus:ring-gray-500",
        ghost: "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus:ring-gray-500",
    };

    const sizeStyles = {
        sm: "text-sm px-3 py-1.5",
        md: "text-base px-4 py-2",
        lg: "text-lg px-5 py-2.5",
    };

    const loadingStyles = isLoading ? "opacity-80 cursor-not-allowed" : "";
    const disabledStyles = disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "";

    return (
        <button className={twMerge(baseStyles, variantStyles[variant], sizeStyles[size], loadingStyles, disabledStyles, className)} disabled={disabled || isLoading} {...props}>
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};
```

## 5. Supabase 後端設置

### 5.1 創建 Supabase 項目

1. 註冊 [Supabase](https://supabase.com/) 並創建新項目
2. 獲取專案 URL 和匿名密鑰 (anon key)
3. 創建 .env 文件並填入資訊：
    ```
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key
    ```

### 5.2 資料庫設定

設定以下資料表：

1. **users** - 用戶資料

    ```sql
    create table public.users (
      id uuid references auth.users not null primary key,
      email text not null,
      name text,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null,
      avatar_url text
    );

    -- 設定 RLS 策略
    alter table public.users enable row level security;
    create policy "用戶可以查看自己的資料" on public.users
      for select using (auth.uid() = id);
    create policy "用戶可以更新自己的資料" on public.users
      for update using (auth.uid() = id);
    ```

2. **categories** - 興趣分類

    ```sql
    create table public.categories (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      name text not null,
      color text not null,
      icon text not null,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- 設定 RLS 策略
    alter table public.categories enable row level security;
    create policy "用戶可以查看自己的分類" on public.categories
      for select using (auth.uid() = user_id);
    create policy "用戶可以管理自己的分類" on public.categories
      for all using (auth.uid() = user_id);
    ```

3. **hobbies** - 興趣項目

    ```sql
    create table public.hobbies (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      category_id uuid references public.categories not null,
      name text not null,
      description text,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- 設定 RLS 策略
    alter table public.hobbies enable row level security;
    create policy "用戶可以查看自己的興趣" on public.hobbies
      for select using (auth.uid() = user_id);
    create policy "用戶可以管理自己的興趣" on public.hobbies
      for all using (auth.uid() = user_id);
    ```

4. **goals** - 目標設定

    ```sql
    create type goal_type as enum ('count', 'quantity', 'composite');
    create type goal_period as enum ('daily', 'weekly', 'monthly', 'custom');

    create table public.goals (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      hobby_id uuid references public.hobbies not null,
      type goal_type not null,
      period goal_period not null,
      target_value float not null,
      target_unit text,
      custom_period jsonb,
      time_requirement int, -- 分鐘為單位，用於複合型目標
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- 設定 RLS 策略
    alter table public.goals enable row level security;
    create policy "用戶可以查看自己的目標" on public.goals
      for select using (auth.uid() = user_id);
    create policy "用戶可以管理自己的目標" on public.goals
      for all using (auth.uid() = user_id);
    ```

5. **progress** - 進度記錄

    ```sql
    create table public.progress (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      goal_id uuid references public.goals not null,
      recorded_at timestamp with time zone not null,
      value float not null,
      duration int, -- 分鐘為單位，用於複合型目標
      notes text,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- 設定 RLS 策略
    alter table public.progress enable row level security;
    create policy "用戶可以查看自己的進度" on public.progress
      for select using (auth.uid() = user_id);
    create policy "用戶可以管理自己的進度" on public.progress
      for all using (auth.uid() = user_id);
    ```

6. **achievements** - 成就系統

    ```sql
    create table public.achievements (
      id uuid default gen_random_uuid() primary key,
      name text not null,
      description text not null,
      icon text not null,
      condition_type text not null, -- 例如 'streak', 'count', 'composite'
      condition_value jsonb not null, -- 存儲條件詳情
      created_at timestamp with time zone default now() not null
    );

    create table public.user_achievements (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      achievement_id uuid references public.achievements not null,
      unlocked_at timestamp with time zone default now() not null,
      unique (user_id, achievement_id)
    );

    -- 設定 RLS 策略
    alter table public.achievements enable row level security;
    create policy "任何人都可以查看成就列表" on public.achievements
      for select using (true);

    alter table public.user_achievements enable row level security;
    create policy "用戶可以查看自己的解鎖成就" on public.user_achievements
      for select using (auth.uid() = user_id);
    create policy "系統可以為用戶解鎖成就" on public.user_achievements
      for insert with check (auth.uid() = user_id);
    ```

7. **notifications** - 提醒設定

    ```sql
    create table public.notifications (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      goal_id uuid references public.goals not null,
      time_of_day time not null,
      days_of_week text[], -- 例如 ['monday', 'wednesday', 'friday']
      is_enabled boolean default true,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- 設定 RLS 策略
    alter table public.notifications enable row level security;
    create policy "用戶可以管理自己的通知設定" on public.notifications
      for all using (auth.uid() = user_id);
    ```

8. **push_subscriptions** - 推送訂閲

    ```sql
    create table public.push_subscriptions (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references public.users not null,
      subscription jsonb not null, -- Web Push 訂閱對象
      created_at timestamp with time zone default now() not null,
      unique (user_id, subscription)
    );

    -- 設定 RLS 策略
    alter table public.push_subscriptions enable row level security;
    create policy "用戶可以管理自己的推送訂閱" on public.push_subscriptions
      for all using (auth.uid() = user_id);
    ```

## 6. 本地開發環境設定

### 6.1 啟動腳本

在 package.json 中更新腳本：

```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "preview": "vite preview",
        "test": "vitest",
        "test:ui": "vitest --ui",
        "test:coverage": "vitest run --coverage"
    }
}
```

### 6.2 設定開發工具

設定 VS Code 推薦擴展：

```json
// .vscode/extensions.json
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "streetsidesoftware.code-spell-checker"
    ]
}
```

設定 VS Code 工作區：

```json
// .vscode/settings.json
{
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "typescript.tsdk": "node_modules/typescript/lib",
    "tailwindCSS.includeLanguages": {
        "typescript": "javascript",
        "typescriptreact": "javascript"
    },
    "editor.quickSuggestions": {
        "strings": true
    }
}
```

### 6.3 設定 ESLint 和 Prettier

安裝 ESLint 和 Prettier：

```bash
npm install -D eslint eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier eslint-config-prettier eslint-plugin-prettier
```

配置 ESLint：

```js
// .eslintrc.js
module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: "module",
    },
    plugins: ["react", "@typescript-eslint", "prettier"],
    rules: {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "prettier/prettier": "error",
    },
    settings: {
        react: {
            version: "detect",
        },
    },
};
```

配置 Prettier：

```json
// .prettierrc
{
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 2,
    "semi": true
}
```

## 7. 測試環境設定

安裝測試依賴：

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

配置 Vitest：

```js
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
        css: true,
    },
});
```

設置測試環境：

```ts
// src/test/setup.ts
import "@testing-library/jest-dom";

// 模擬 matchMedia
window.matchMedia =
    window.matchMedia ||
    function () {
        return {
            matches: false,
            addListener: function () {},
            removeListener: function () {},
        };
    };

// 模擬 IntersectionObserver
class IntersectionObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: IntersectionObserver,
});
```

## 8. 部署環境設定

### 8.1 設定 Vercel 部署

創建 vercel.json 設定檔：

```json
// vercel.json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
    "headers": [
        {
            "source": "/(.*).(js|css|json|svg|png|jpg|jpeg|gif|webp)",
            "headers": [
                {
                    "key": "Cache-Control",
                    "value": "public, max-age=31536000, immutable"
                }
            ]
        },
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "X-Content-Type-Options",
                    "value": "nosniff"
                },
                {
                    "key": "X-Frame-Options",
                    "value": "DENY"
                },
                {
                    "key": "X-XSS-Protection",
                    "value": "1; mode=block"
                }
            ]
        }
    ]
}
```

### 8.2 GitHub Actions 工作流程

設定 CI/CD 工作流程：

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

jobs:
    test:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"
                  cache: "npm"

            - name: Install dependencies
              run: npm ci

            - name: Run lints
              run: npm run lint

            - name: Run tests
              run: npm run test:coverage

    deploy:
        needs: test
        runs-on: ubuntu-latest
        if: github.ref == 'refs/heads/main'

        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"
                  cache: "npm"

            - name: Install dependencies
              run: npm ci

            - name: Build
              run: npm run build

            - name: Deploy to Vercel
              uses: amondnet/vercel-action@v20
              with:
                  vercel-token: ${{ secrets.VERCEL_TOKEN }}
                  vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
                  vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
                  vercel-args: "--prod"
```

## 總結

此環境建置指南提供了完整的 Hobby Tracker 應用程式開發環境設定步驟。通過遵循上述步驟，你將建立一個現代化的 React + TypeScript 開發環境，整合 PWA 功能、離線支持和 Supabase 後端。該設定包括所有必要的工具和配置，以支援專案的開發、測試和部署。

請根據實際需求調整配置並確保在開始開發前完成所有環境設定，這將為開發團隊提供一致的工作環境並確保符合專案的技術需求。

