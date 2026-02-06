# kongetsu — 月次家計予算（MVP: Next.js + TypeScript）

このブランチは Next.js + TypeScript を用いた最小実装スキャフォールドです。

開発メモ:

- 起動: `npm install` の後 `npm run dev`（Node.js が必要）
- API: `POST /api/budgets` に JSON ペイロードを送ると `data/budgets.json` に保存されます（ローカル開発用の簡易実装）
- UI: `pages/index.tsx` に簡易フォームを用意しています。カテゴリは JSON 配列で入力するデモ仕様です。

注意: このリポジトリは最小の雛形です。実運用ではデータ永続化、セキュリティ、認証、入力検証を強化してください。
