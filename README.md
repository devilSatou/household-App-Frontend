# 家計簿アプリ - フロントエンド

React + TypeScript + Vite で構築された家計簿WebアプリケーションのSPAフロントエンド。

## 技術スタック

- **フレームワーク**: React 18 / TypeScript
- **ビルドツール**: Vite
- **スタイリング**: CSS（Tailwind CSS 導入予定）
- **デプロイ**: Vercel

## クイックスタート

### 開発環境

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# http://localhost:5173 にアクセス
```

### 本番ビルド

```bash
# ビルド
npm run build

# プレビュー
npm run preview
```

## プロジェクト構造

```
household-App-Frontend/
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   ├── pages/           # ページコンポーネント
│   ├── api/             # API通信ロジック
│   ├── hooks/           # カスタムフック
│   ├── types/           # TypeScript型定義
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── CLAUDE.md
```

## 機能（予定）

### ダッシュボード
- 月次収支サマリー（収入・支出・残高）
- カテゴリ別支出グラフ
- 年間推移グラフ
- 最近の取引一覧

### 収支一覧
- 取引の一覧表示（ページネーション対応）
- フィルター機能（種別、期間）
- 取引の追加・編集・削除
- CSV出力

### カテゴリ管理
- 収入/支出カテゴリの一覧表示
- 新規カテゴリの追加

## 環境変数

`.env` ファイルを作成：

```
VITE_API_URL=http://localhost:8080
```

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│   ブラウザ      │────▶│      API        │
│   (React SPA)   │     │  (Go/Gin:8080)  │
│                 │◀────│                 │
└─────────────────┘     └─────────────────┘
        │
        ▼
  ┌───────────┐
  │  Vercel   │
  │  (静的)   │
  └───────────┘
```

- **React SPA**: クライアントサイドレンダリング
- **JWT認証**: バックエンドAPIで認証、トークンをlocalStorageで管理
- **API通信**: Fetch API / Axios

## 移行履歴

- **2025年**: Go + HTMX版からReact + TypeScript版に移行
  - 理由: Vercelへの静的デプロイのため、フロントを完全SPA化

## ライセンス

MIT
