# Invitation Studio

公開用の招待状は `https://your-domain.com/invite/[slug]` を使用します。ワイルドカードのカスタムドメインがなくても、Vercel 上で公開できます。`/admin` でログインし、下書きの作成・編集・公開を行います。

## Supabase の設定

1. Authentication でメール認証を有効にし、Site URL を Vercel のドメインに設定します。管理者アカウントは Supabase で作成してください。
2. `.env` と Vercel に `DATABASE_URL` を追加します。Supabase の **Connect → ORMs → Prisma** から Prisma 用のプーラーURLをコピーしてください。ブラウザ用のキーはデータベースURLではありません。
3. `invitation-media` という公開 Storage バケットを作成します。`taro-hanako/hero-1.webp` のようなパスにヒーロー画像をアップロードし、編集画面へ1行ずつその Storage パスを入力します。
4. `DATABASE_URL` と `DIRECT_URL` の設定後に `npx prisma migrate deploy` を実行します。

`public/img` に入っているヒーロー画像が初期状態では使われるため、Storage への画像アップロードは必須ではありません。
