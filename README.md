# プリマネ（Print Manager）

学校から配布されるプリントを、写真1枚でAIが読み取り・分類する保護者向け管理アプリです。

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロント / API | Next.js 16 (App Router) |
| ホスティング | Vercel |
| データベース | Supabase (PostgreSQL) |
| AI 解析 | Google Gemini API |

## 主な機能

- **提出物（Todo）** … 締切・提出物の管理
- **行事（Event）** … 日時・保護者の持ち物
- **お便り（Info）** … 概要・ピン留め
- **スキャン** … プリント画像を Gemini が解析し、フォームに自動入力
- **リマインダー** … 締切・行事が近い項目を通知

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
# または npm install
```

### 2. 環境変数

`env.example` を `.env.local` にコピーして値を設定します。

```bash
cp env.example .env.local
```

**ローカルだけ試す場合** … Supabase / Gemini を未設定でも、モックデータとモックAIで動作します。

### 3. Supabase

1. [Supabase](https://supabase.com) でプロジェクトを作成
2. SQL Editor で `supabase/schema.sql` を実行
3. Settings → API から URL と `service_role` キーを `.env.local` に設定

### 4. Gemini API

1. [Google AI Studio](https://aistudio.google.com/apikey) で API キーを取得
2. `GEMINI_API_KEY` に設定

### 5. 開発サーバー

```bash
pnpm dev
```

http://localhost:3000 で開きます。

## Vercel へのデプロイ

1. リポジトリを GitHub にプッシュ
2. [Vercel](https://vercel.com) でインポート
3. Environment Variables に `env.example` と同じ変数を登録（`SUPABASE_SERVICE_ROLE_KEY` と `GEMINI_API_KEY` は **Production** のみ推奨）
4. Deploy

`@vercel/analytics` は本番ビルド時に自動で有効になります。

## API 一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/children` | お子さん一覧 |
| GET | `/api/printouts` | プリント一覧 |
| POST | `/api/printouts` | プリント登録 |
| PATCH | `/api/printouts/[id]` | 完了 / ピン留め更新 |
| POST | `/api/scan/analyze` | 画像を Gemini で解析 |

## プロジェクト構成

```
app/
  api/          # Route Handlers（Supabase / Gemini）
  page.tsx      # ダッシュボード
components/     # UI（参照デザイン準拠）
lib/
  gemini.ts     # Gemini Vision 解析
  supabase/     # Supabase サーバークライアント
supabase/
  schema.sql    # DB スキーマ + シード
```

## ライセンス

Private / ご家庭利用想定
