import Link from "next/link";

export default function Home() {
  return <main className="landing"><p className="eyebrow">INVITATION STUDIO</p><h1>ふたりらしさが伝わる<br />ウェディング招待状。</h1><p><code>/invite/taro-and-hanako</code> のような確実なURLで、招待状を作成・公開できます。</p><Link className="button" href="/admin">招待状を作成する</Link></main>;
}
