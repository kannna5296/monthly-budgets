
<!--
Sync Impact Report

Version change: 0.1.0 -> 1.0.0
Modified principles:
	- "III. テストファースト" -> "III. テストコードの実装は不要"
	- "I. ライブラリ優先" / "II. CLI" 等は置換し、プロジェクト方針に合わせて再定義
Added sections:
	- 技術スタック: Python, PEP8
Removed sections:
	- 明示的なテスト要求（削除）
Templates requiring updates:
	- .specify/templates/tasks-template.md: ⚠ pending (サンプルテストタスクが多数記載されているため修正推奨)
	- .specify/templates/spec-template.md: ⚠ pending (仕様テンプレートのテスト関連文言を確認/修正してください)
	- .specify/templates/plan-template.md: ⚠ pending (Constitution Check がテスト前提なら調整が必要)
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

### IV. 使用技術スタック & スタイル
- 使用技術スタック: Python（プロジェクト全体でPythonを採用）
- コーディングスタイル: PEP8 に従うこと（リンタ/フォーマッタの導入を推奨）

上記は一貫性とコントリビューション容易性のためMUSTとする。

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

## Governance

改訂手順:

1. 改訂はPull Requestで提案すること。  
2. 変更が破壊的であれば影響範囲と移行手順を明示すること。  
3. 破壊的変更はコアメンバーの過半数承認を必要とする。  

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-02-07

