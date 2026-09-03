# Invitation Studio

公開用の招待状は `https://your-domain.com/invite/[slug]` を使用します。ワイルドカードのカスタムドメインがなくても、Vercel 上で公開できます。`/admin` でログインし、下書きの作成・編集・公開を行います。

## Supabase の設定

1. Authentication でメール認証を有効にし、Site URL を Vercel のドメインに設定します。管理者アカウントは Supabase で作成してください。
2. `.env` と Vercel に `DATABASE_URL` を追加します。Supabase の **Connect → ORMs → Prisma** から Prisma 用のプーラーURLをコピーしてください。ブラウザ用のキーはデータベースURLではありません。
3. `invitation-media` という公開 Storage バケットを作成します。初期ヒーロー画像は `defaults/` に配置し、招待状ごとの画像は編集画面からアップロードします。
4. `DATABASE_URL` と `DIRECT_URL` の設定後に `npx prisma migrate deploy` を実行します。

初期ヒーロー画像は公開バケットからすべての招待状に提供されます。PC用・スマートフォン用・新郎・新婦の画像は、それぞれ編集画面で変更できます。
