
<!--
Sync Impact Report

Version change: 1.0.0 -> 1.1.0
Modified principles:
  - "IV. 使用技術スタック & スタイル" -> "IV. 技術選定とコーディングスタイル" (Python必須の記述を撤回)
  - 表現の緩和: 技術スタックを要件に合った選定に変更
Added sections:
  - 技術選定ポリシー: 要件に沿った選定を必須化
Removed sections:
  - 明示的に Python を必須とする一文
Templates requiring updates:
  - .specify/templates/tasks-template.md: ⚠ pending (テスト関連サンプルの注記/削除を推奨)
  - .specify/templates/spec-template.md: ⚠ pending (テックスタック欄やテスト文言の確認を推奨)
  - .specify/templates/plan-template.md: ⚠ pending (Constitution Check の言及をアップデート推奨)
  - .specify/templates/checklist-template.md: ✅ aligned
  - .specify/templates/agent-file-template.md: ✅ aligned
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Ratification date not found in repo; please provide the original adoption date.
  - TODO(OLD_VERSION): If this is an amendment, provide prior version tag/number for accurate delta.
-->

# kongetsu Constitution

## Core Principles

### I. クリーンコード（保守性の高いコード記述）
読みやすく、保守しやすいコードを最優先とする。具体的には:

- 小さく単一責務の関数／クラスを用いること。  
- 明確で説明的な識別子（変数名・関数名）を使うこと。  
- 必要に応じたドキュメンテーションと型注釈を付与すること。  
- 冗長な最適化や早すぎる抽象化は避け、シンプルさを保つこと。

上記は保守性と理解コスト低減のためMUSTとする。

### II. シンプルなUX（ユーザー体験）
ユーザー体験は最小の認知負荷を目標とする。デフォルトを賢く選び、明確なエラーメッセージと最小限の設定で動作することをMUSTとする。ドキュメントとCLI/インターフェースは直感的であることをSHOULDとする。

### III. テストコードの実装は不要
本プロジェクトでは以下のテストコードをリポジトリに含めないことを明確に定める:

- 単体テスト（Unit Tests）  
- 結合テスト（Integration Tests）  
- E2Eテスト（End-to-End Tests）

これらのテストは外部CIやQAパイプライン側で実行/管理される運用方針のため、コードベース内にテストコードを追加しないことをMUST NOTとする。テストの代替として、明確な使用方法と例、入力/出力仕様をドキュメントで提供すること。

### IV. 技術選定とコーディングスタイル

- 技術選定: 各プロジェクトの要件（性能、運用コスト、チームスキル、エコシステム、保守性）に基づき、最適な技術スタックを選定することをMUSTとする。
	- 選定時には理由（選定根拠）をドキュメント化し、スペックに明示すること（例: なぜ Python か、なぜ Go かなど）。

- コーディングスタイル: 選定した言語の標準的なスタイルガイドに従うこと（例: Python なら PEP8）。プロジェクトには適切なリンタ／フォーマッタを導入し、CIでスタイルチェックを行うことを推奨する。

上記は一貫性とコントリビューション容易性を確保するための必須方針である。

### V. 可観測性とバージョニング（簡潔）
ログ・メッセージは読みやすく構造化することを推奨する。バージョニングはセマンティックバージョンを採用する（破壊的変更はMAJOR増分）。本憲法の大幅方針変更（例: テスト方針の削除）はMAJORバージョン上げを伴う。

## 追加制約

- 機密情報はリポジトリに平文で置かないこと。  
- デプロイや運用の手順は `specs/` 内または運用ドキュメントに明示すること。

## 開発ワークフロー

プルリクエストには次を含めることを必須とする:

- 変更の目的と影響（互換性の有無）  
- 実装の簡潔な説明と必要な操作手順  

CI の必須ゲートは以下とする（テスト実行は含まない）:

- スタイルチェック（PEP8 準拠のリンティング）  
- 型チェック（導入している場合）  
- セキュリティスキャン（可能な範囲で）

レビュワー承認は最低1名を必須とする。

### ブランチ戦略

- `main` ブランチは常にデプロイ可能な状態を維持すること。直接コミットは禁止とし、必ず Pull Request 経由で変更を取り込むこと。  
- 機能開発は `feature/` プレフィックス付きブランチ（例: `feature/add-login`）で実施する。  
- リリースや緊急修正は `release/`、`hotfix/` ブランチ戦略に従って管理すること。運用手順は運用ドキュメントに明示する。

### PR のレビュー要件

Pull Request は以下を満たすことをレビュー前提条件とする:

- Python のフォーマット（PEP8 準拠）が実行済みであること（自動フォーマッタ/リンタの出力を含めることを推奨）。  
- PR 本文に「変更の目的」と「影響範囲（互換性や破壊的変更の有無）」が明確に記載されていること。  
- （テストに関する記載がある場合）外部 CI で実行されるテストがあるなら、該当テストはすべて成功していることを示すこと。

これらが満たされない PR はレビューの進行を保留し、必要な修正を要請すること。

## Governance

改訂手順:

1. 改訂はPull Requestで提案すること。  
2. 変更が破壊的であれば影響範囲と移行手順を明示すること。  
3. 破壊的変更はコアメンバーの過半数承認を必要とする。  

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-02-07

