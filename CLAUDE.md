# CLAUDE.md

## プロジェクト概要

React + TypeScript + Vite で作る家計簿WebアプリケーションのSPA（Single Page Application）フロントエンド。
バックエンドAPIと完全分離し、モダンなWeb開発のベストプラクティスに従った実装。

## 技術スタック

- **フロントエンド**: React 18 / TypeScript / Vite
- **状態管理**: React Hooks (useState, useContext等)
- **API通信**: Fetch API / Axios（後で追加予定）
- **ルーティング**: React Router（後で追加予定）
- **スタイリング**: CSS Modules / Tailwind CSS（後で追加予定）
- **デプロイ**: Vercel / Netlify（無料）

## バックエンドAPI

このプロジェクトは **フロントエンドのみ** で、バックエンドは別リポジトリ：
- リポジトリ: `household-App-API`
- 技術: Go + Gin + GORM + SQLite
- 認証: JWT（予定）

## プロジェクト構造（予定）

```
household-App-Frontend/
├── src/
│   ├── components/      # 再利用可能なコンポーネント
│   │   ├── Layout/      # レイアウトコンポーネント
│   │   ├── TransactionList/
│   │   └── CategoryChart/
│   ├── pages/           # ページコンポーネント
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── Categories.tsx
│   ├── api/             # API通信ロジック
│   │   └── client.ts    # APIクライアント
│   ├── hooks/           # カスタムフック
│   │   └── useTransactions.ts
│   ├── types/           # TypeScript型定義
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── CLAUDE.md            # このファイル
```

## API エンドポイント（バックエンド）

```
GET    /api/v1/transactions          # 一覧
POST   /api/v1/transactions          # 新規作成
GET    /api/v1/transactions/:id      # 詳細
PUT    /api/v1/transactions/:id      # 更新
DELETE /api/v1/transactions/:id      # 削除

GET    /api/v1/categories            # カテゴリ一覧
POST   /api/v1/categories            # カテゴリ追加

GET    /api/v1/summary/monthly       # 月次集計
GET    /api/v1/summary/category      # カテゴリ別集計
GET    /api/v1/summary/yearly        # 年次集計

GET    /api/v1/export/csv            # CSV出力
```

## 設計方針

1. **モダンなSPA構成**: React + TypeScriptで型安全な実装
2. **API First**: バックエンドAPIと完全分離、将来的にスマホアプリ対応も可能
3. **セキュリティ重視**: XSS/CSRF対策、JWT認証
4. **パフォーマンス**: コード分割、遅延ロード、メモ化
5. **保守性**: コンポーネント設計、型定義、テスト

## 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# http://localhost:5173 にアクセス
```

### ビルド

```bash
# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

## デプロイ

### Vercel（推奨）

```bash
# Vercelにデプロイ
npm install -g vercel
vercel
```

### Netlify

```bash
# Netlifyにデプロイ
npm install -g netlify-cli
netlify deploy
```

## 環境変数

`.env` ファイルを作成してバックエンドAPIのURLを設定：

```
VITE_API_URL=http://localhost:8080
```

本番環境では、Vercel/Netlifyの環境変数設定で `VITE_API_URL` を設定。

## TODO

- [ ] React Routerの導入
- [ ] API通信ロジックの実装
- [ ] 状態管理の実装（Context API or Zustand）
- [ ] 認証機能（JWT）
- [ ] ダッシュボードUI実装
- [ ] 収支一覧UI実装
- [ ] カテゴリ管理UI実装
- [ ] レスポンシブデザイン
- [ ] ダークモード対応
- [ ] テスト実装（Vitest + React Testing Library）

## ライセンス

MIT
