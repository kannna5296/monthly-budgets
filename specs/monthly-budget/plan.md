# Implementation Plan: 月次家計予算策定アプリ

**Branch**: `feature/monthly-budget` | **Date**: 2026-02-07 | **Spec**: `specs/monthly-budget/spec.md`

## Summary

MVP はカテゴリ管理（固定/変動）、月次予算作成（収入・貯金目標→配分）、補正予算の追加、履歴保存に焦点を当てる。UI はまず CLI または最小限の Web UI (Flask) を検討する。

## Technical Context


Language/Version: 選定は要件に基づく（推奨: Python 3.10+ / FastAPI for backend）  
Primary Dependencies: 選定スタックに依存（例: SQLite, ORM, 小規模Webフレームワーク等）  
Storage: SQLite または JSON ファイル（MVPはSQLite推奨）  
Testing: 本プロジェクト方針ではリポジトリ内にテストコードを含めない（外部CIにて管理）  
Target Platform: Desktop / Small-hosted Web  
Performance Goals: 単一ユーザ・ローカル利用を想定、レスポンスは即時

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
