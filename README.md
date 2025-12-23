# 家計簿アプリ - フロントエンド

Go + Gin + HTMX + Alpine.js + Bootstrap 5 で構築された家計簿Webアプリケーションのフロントエンド。

## 技術スタック

- **サーバー**: Go 1.21+ / Gin
- **UI**: HTMX / Alpine.js / Bootstrap 5 / Chart.js（すべてCDN経由）
- **インフラ**: Docker / Docker Compose / DevContainer

## クイックスタート

### 開発環境（Docker Compose）

```bash
# 開発モードで起動（API + Frontend）
docker compose --profile dev up

# フロントエンド: http://localhost:3000
# API: http://localhost:8080
```

### ローカル実行

```bash
# 依存関係のインストール
go mod download

# APIサーバーを別ターミナルで起動しておく
# cd ../household-App-API && go run .

# フロントエンド起動
go run .

# http://localhost:3000 にアクセス
```

### 本番ビルド

```bash
# Dockerイメージのビルド
docker compose build

# 起動
docker compose up -d
```

## プロジェクト構造

```
household-App-Frontend/
├── main.go                 # エントリーポイント（サーバー + APIプロキシ）
├── go.mod / go.sum         # Go依存管理
├── Dockerfile              # コンテナ定義
├── docker-compose.yml      # 開発・本番環境設定
├── .devcontainer/          # VS Code DevContainer設定
├── templates/
│   ├── index.html          # メインHTML（SPA的構成）
│   └── pages/
│       ├── dashboard.html  # ダッシュボード
│       ├── transactions.html # 収支一覧
│       └── categories.html # カテゴリ管理
└── static/
    ├── css/
    │   └── style.css       # カスタムスタイル
    └── js/
        └── app.js          # Alpine.jsアプリケーション
```

## 機能

### ダッシュボード
- 月次収支サマリー（収入・支出・残高）
- 今月の収支グラフ（ドーナツチャート）
- カテゴリ別支出グラフ（パイチャート）
- 年間推移グラフ（棒グラフ）
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

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| GIN_MODE | Ginの動作モード | debug |
| PORT | サーバーポート | 3000 |
| API_URL | バックエンドAPIのURL | http://localhost:8080 |

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   ブラウザ      │────▶│  フロントエンド  │────▶│      API        │
│   (HTMX/Alpine) │     │  (Go/Gin:3000)  │     │  (Go/Gin:8080)  │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌───────────┐
                        │  静的     │
                        │ ファイル  │
                        │ (CDN)    │
                        └───────────┘
```

- **HTMX**: サーバーサイドレンダリングによる部分更新
- **Alpine.js**: クライアントサイドの軽量インタラクション
- **APIプロキシ**: フロントエンドサーバーがAPIリクエストを中継

## 開発

### テンプレート関数

| 関数 | 説明 |
|------|------|
| `formatNumber` | 数値を3桁区切りでフォーマット |
| `formatDate` | 日付をYYYY/MM/DD形式でフォーマット |
| `toJSON` | オブジェクトをJSON文字列に変換 |

### HTMXイベント

| イベント | 説明 |
|----------|------|
| `transactionsUpdated` | 取引が追加/更新/削除された時に発火 |
| `categoriesUpdated` | カテゴリが追加された時に発火 |

## ライセンス

MIT
