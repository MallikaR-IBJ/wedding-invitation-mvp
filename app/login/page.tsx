import Link from "next/link";
import { signIn } from "@/app/actions";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, notice } = await searchParams;
  return <main className="auth-page"><Link href="/" className="back-link">← トップへ戻る</Link><section className="auth-card"><p className="eyebrow">INVITATION STUDIO</p><h1>ログインして編集する</h1>{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice">{notice}</p>}<form action={signIn}><label>メールアドレス<input name="email" type="email" autoComplete="email" required /></label><label>パスワード<input name="password" type="password" autoComplete="current-password" required /></label><button>ログイン</button></form></section></main>;
}
