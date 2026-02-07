# 月次家計予算 — タスク一覧 (最新)

作成日: 2026-02-07

このファイルは `specs/monthly-budget/spec.md`、`specs/monthly-budget/plan.md`、`specs/monthly-budget/implementation.md` の最新内容に基づき、実装タスクを実行順・依存順に整理したものです。各タスクは小さく、検証可能な受け入れ基準を持たせています。

## 前提・方針（再掲）
- MVP は Next.js + TypeScript、永続化は MVP 期間中は `data/budgets.json` を用いる。カテゴリは別ファイルに分離しない（budgets.json 内に含める）。
- UI 要件: テーブル形式のカテゴリ編集、行追加／削除、補正列追加／削除、保存済み年月ボタン（例: 「2026年2月」）は保存データがある年月のみ表示、押下で当該年月をロードして編集可能にする。

---

## フェーズ 0 — 型とストレージ基盤 (依存: なし)

- T010 types: 型定義を追加
  - 内容: `types/budget.ts` を作成し、MonthlyBudget、Category、Adjustment 等の TypeScript 型を定義する。
  - 理由: フロント/バックで同一の契約を共有し、実装ミスを減らす。
  - 受け入れ基準: `types/budget.ts` が存在し、`pages/api/budgets.ts` と `pages/index.tsx` の一部でインポートして型注釈が使えること。

- T011 storage: ストレージヘルパを実装
  - 内容: `lib/storage.ts` を作成し、`readBudgets()` と `writeBudgets()`、`findByYearMonth(year,month)`、`upsertBudget(budget)` の小さな API を提供する。
  - 理由: 直接ファイル読み書きを分散させず、将来 DB へ差し替えやすくする。
  - 受け入れ基準: `lib/storage.ts` の関数が動作し、`data/budgets.json` を作成／読み書きできること（簡単なスモークテスト付き）。

---

## フェーズ 1 — API 安定化 (依存: T010, T011)

- T020 API: GET 一覧と GET by year/month の明確化
  - 内容: `pages/api/budgets.ts` を整理し、`GET /api/budgets` は全件配列、`GET /api/budgets?year=YYYY&month=M` は当該1件を返す動作を確実にする（404 は該当なし）。
  - 受け入れ基準: GET 全件と GET by year/month の両方が動作し、スモーク curl で確認可能。

- T021 API: POST upsert の堅牢化
  - 内容: 受信 payload を `types` に合わせて検証（サーバ側スキーマチェック、数値変換）、`lib/storage.upsertBudget` を使って upsert を行う。
  - 受け入れ基準: 同一 year/month の再 POST で updatedAt が更新されること。数値フィールドに文字列が入っても検証または変換されること。

- T022 API 自動テスト（オプションだが推奨）
  - 内容: `tests/api/budgets.test.ts`（jest + supertest）で upsert と GET by year/month の最小テストを作成する。
  - 受け入れ基準: テストがローカルで実行でき、成功すること。

---

## フェーズ 2 — フロント実装 (依存: T010, T011, T020, T021)

- T030 UI: 保存済み年月ボタン一覧の実装
  - 内容: `pages/index.tsx`（または専用コンポーネント）で、サーバから保存済みの年月リストを取得し、各年月に対して「YYYY年M月」のラベルつきボタンを生成する。ボタンはその年月にデータが存在する場合のみ表示する。
  - 備考: サーバに `GET /api/budgets`（全件）を投げ、ユニークな year/month を抽出する実装で十分。将来は軽量 API を用意しても良い。
  - 受け入れ基準: 保存済み年月のボタンが表示され、例: `2026年2月` を押すと当該データがフォームへロードされる（編集可能）。保存されていない年月はボタン自体が存在しない。

- T031 UI: Load（ボタン押下）→ フォームに反映する処理の実装
  - 内容: ボタン押下で `GET /api/budgets?year=YYYY&month=M` を呼び、レスポンスを受けてフォーム状態を置き換える（既存行/補正列含む）。編集後に Save で POST できること。
  - 受け入れ基準: Load→編集→Save の一連がブラウザで行え、保存後は API のデータが更新される。

- T032 UI: 年月新規作成のフロー整理
  - 内容: 保存済み年月ボタンでない新規作成は別UI（年/月入力 + 新規作成ボタン）で行う。空フォームから始める UX を用意する。
  - 受け入れ基準: 新規作成フローで年と月を指定し保存できること。

- T033 UX: 保存ボタンの無効化と即時バリデーション
  - 内容: 全体の検証状態に基づき Save ボタンを disabled にする。個別セルの即時エラー表示を追加。
  - 受け入れ基準: フロントでベースや補正に非数値がある場合 Save が無効になり、該当セルにエラー表示が出ること。

---

## フェーズ 3 — テストとドキュメント (依存: フェーズ 1/2 の完了)

- T040 Integration test: Load→編集→Save の E2E
  - 内容: 小さな統合テストを作成し、API とフロントの主要フロー（Load ボタンによるロード、編集、保存）が動くことを検証する（軽量な Puppeteer / Playwright / Cypress のいずれか／もしくは jest+jsdom を利用した単純なフロー確認）。
  - 受け入れ基準: テストがローカルで緑になること。

- T041 ドキュメント: README と API 使用例を追加
  - 内容: `specs/monthly-budget/implementation.md` または README に API の使い方（GET 全件、GET by year/month、POST upsert）と dev 手順を追記する。
  - 受け入れ基準: README に手順が書かれており、第三者が手順で環境を立てられること。

---

## 小タスク（任意・改善案）

- T050 Migration helper: 既存 `data/budgets.json` の整合チェックスクリプト
  - 用途: 古いレコードに year/month が無い場合の検出と手動移行支援。

- T051 Storybook: 主要フォームコンポーネントの Story を1つ追加

---

## 優先順（短期おすすめ）
1. T010, T011（型とストレージ） — これが他のタスクの基盤になります。  
2. T021（API upsert の堅牢化）と T020（GET 整備）  
3. T030, T031（保存済み年月ボタンと Load ロジック）  
4. T033（保存ボタン無効化・即時バリデーション）  
5. T040（Load→編集→Save の統合テスト）

---

ファイル: `specs/monthly-budget/tasks.md`

作成者: 自動生成（speckit.tasks）