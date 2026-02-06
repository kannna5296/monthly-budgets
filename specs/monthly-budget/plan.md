# Implementation Plan: 月次家計予算策定アプリ

**Branch**: `feature/monthly-budget` | **Date**: 2026-02-07 | **Spec**: `specs/monthly-budget/spec.md`

## Summary

MVP はカテゴリ管理（固定/変動）、月次予算作成（収入・貯金目標→配分）、補正予算の追加、履歴保存に焦点を当てる。UI はまず CLI または最小限の Web UI (Flask) を検討する。

## Technical Context


Language/Version: Frontend: Next.js + TypeScript (推奨) for UI; Backend: Next.js API routes for MVP, option to migrate to FastAPI (Python) or Node.js service for production scale
Primary Dependencies: Next.js, React, TypeScript, React Query, Zustand, Storybook, UI library (Chakra UI / Tailwind)
Storage: MVP: local JSON or SQLite; Production: Postgres recommended
Testing: 本プロジェクト方針ではリポジトリ内にテストコードを含めない（外部CIにて管理）。ただしスタイル/linters は CI で必須。
Target Platform: Web (Vercel / Render / Railway)
Performance Goals: 単一ユーザ〜小チームの利用を想定、操作は即時レスポンス

## Technology Decisions (選定と理由)

1) Frontend framework — Next.js + TypeScript
  - 理由: コンポーネント駆動開発、豊富なエコシステム、SSR/SSG による初回表示の高速化、Vercel等への簡易デプロイ。TypeScript による型安全性で拡張時の安全性を確保できる。
  - 受け入れ基準: UI コンポーネントが Storybook で 1 つ以上実装され、ページルーティングとサンプルフォームが動作すること。

2) UI ライブラリ — Chakra UI または TailwindCSS (+ Headless UI)
  - 理由: Chakra はアクセシビリティ対応済みのコンポーネントがすぐ使え、開発速度が高い。Tailwind はカスタマイズ性に優れ、デザイン制御が細かくできる。プロジェクトのデザイン方針で選択。
  - 受け入れ基準: ベースとなるデザイントークン（色・間隔・フォント）が定義され、主要なフォームコンポーネントがスタイル適用されていること。

3) Component-driven development — Storybook
  - 理由: UI コンポーネントを独立して開発・レビュー・ドキュメント化することで、将来的な UI 拡張が容易になる。
  - 受け入れ基準: Storybook が起動し、少なくとも 2 つのコンポーネント（Input, Button 等）が表示されること。

4) State & Data fetching — React Query + Zustand
  - 理由: React Query はサーバー同期のキャッシュと再フェッチを自動化し、Zustand は軽量なローカルUI状態管理に向く。分離することで責務が明確になる。
  - 受け入れ基準: API 呼び出しで React Query が動作し、UI ローカル状態は Zustand で管理されることのサンプルがあること。

5) Backend for MVP — Next.js API routes (短期) → FastAPI/Node（長期オプション）
  - 理由: MVP は開発速度優先でフロントと同一リポジトリ内の API routes で十分。将来的なチームスキルやスケーリング要件があれば FastAPI（Python）や Node.js サービスへ切替可能。
  - 受け入れ基準: POST /api/budgets と GET /api/budgets が動作し、データが保存・参照できること。

6) Persistence — SQLite (MVP) → Postgres (本番)
  - 理由: SQLite は設定不要で開発/ローカルでの履歴保存に最適。マルチユーザ・可用性が必要になれば Postgres に移行。
  - 受け入れ基準: 初期スキーマが設計され、データの永続化が確認できること。

7) Dev tooling — ESLint, Prettier, Commit lint, CI (lint/build)
  - 理由: 一貫したコード品質とフォーマット。憲法方針としてテストはリポジトリに必ずしも含めないが、スタイルチェックはCIで必須。
  - 受け入れ基準: lint スクリプトが動作し、CI 設定（またはローカル手順）が README に記載されていること。

## Trade-offs / Migration notes

- 初期に Next.js API routes を使うと素早くプロトタイプが作れるが、API を独立させる場合はリファクタ（契約維持のため OpenAPI/JSON Schema を整備）が必要。  
- Chakra UI は迅速だが、デザインの自由度は Tailwind と比べやや制約がある。どちらを選ぶかはデザイナーの好みと将来のカスタマイズ頻度で決める。


## Constitution Check

GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.

このプロジェクトは既存憲法に従い、以下を満たす必要がある: クリーンコード、シンプルなUX、技術は要件に合わせて選定されること（選定理由をドキュメント化）。

## Project Structure (MVP)

```
src/
  app.py  # CLI or minimal Flask app entry
  models.py  # Entity definitions and persistence helpers
  services.py  # 配分ロジック、履歴保存
  storage/
    db.sqlite3

specs/monthly-budget/
  spec.md
  plan.md

```

## Phase 1: Setup

- T001 プロジェクト初期化、選定したスタックの環境準備と依存インストール（例: Pythonなら venv + pip、Nodeなら nvm + npm/yarn）  
- T002 データストレージ設計とスキーマ（Category, MonthlyBudget, MonthlyBudgetItem, Adjustment）作成（SQLite推奨）  
- T003 コーディングスタイル/フォーマッタの導入（選定言語に合わせて: 例 Python→black/flake8、JS→prettier/eslint）

## Phase 2: Core Implementation (MVP)

- T010 Category CRUD 実装  
- T011 月次予算作成フロー実装（収入・貯金目標→配分→補正）  
- T012 履歴保存と参照機能実装  
- T013 CLI または最小Web UI の作成

## Phase 3: Polish

- T020 UI/UX改善  
- T021 ドキュメント（クイックスタート、使用例）作成  
- T022 セキュリティチェック（機密情報取扱い）

## Complexity Tracking

現状の想定は単純だが、将来的に複数ユーザや同期、認証を追加する場合は設計変更が必要。
