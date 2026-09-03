import Link from "next/link";
import { redirect } from "next/navigation";
import { createOwner, deleteInvitation, removeOwner, resetOwnerPassword, signOut } from "@/app/actions";
import { DeleteInvitationButton } from "@/app/admin/delete-invitation-button";
import { InvitationForm } from "@/app/admin/invitation-form";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const user = await currentUser();
  if (!user) return <main className="auth-page"><section className="auth-card"><h1>招待状の管理画面</h1><p>ログインすると、招待状の作成と編集ができます。</p><Link className="button" href="/login">ログイン</Link></section></main>;
  if (!user.isAdmin) {
    const invitation = await prisma.invitation.findFirst({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, select: { slug: true } });
    if (invitation) redirect(`/admin/invite/${invitation.slug}`);
  }
  const { error, notice } = await searchParams;
  const [invitations, owners] = await Promise.all([
    prisma.invitation.findMany({ where: user.isAdmin ? {} : { ownerId: user.id }, orderBy: { updatedAt: "desc" } }),
    user.isAdmin ? prisma.owner.findMany({ orderBy: { email: "asc" } }) : Promise.resolve([]),
  ]);
  const ownerEmails = new Map(owners.map((owner) => [owner.userId, owner.email]));
  return <main className="admin-page"><header><div><p className="eyebrow">INVITATION STUDIO</p><h1>{user.isAdmin ? "ユーザー管理画面" : "あなたの招待状"}</h1></div><form action={signOut}><button className="quiet">ログアウト</button></form></header>{error && <p className="error" role="alert">{error}</p>}{notice && <p className="notice">{notice}</p>}{user.isAdmin && <><section className="editor-card"><h2>オーナーを追加</h2><form action={createOwner} className="editor-form"><label>メールアドレス<input name="email" type="email" autoComplete="off" required /></label><label>初期パスワード<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><button>オーナーを追加</button></form></section><section className="editor-card"><h2>オーナー一覧</h2><div className="owner-list">{owners.map((owner) => <article key={owner.id}><strong>{owner.email}</strong><form action={resetOwnerPassword.bind(null, owner.id)} className="owner-actions"><input name="password" type="password" minLength={8} autoComplete="new-password" placeholder="新しいパスワード" required /><button className="secondary">パスワードを再設定</button></form><form action={removeOwner.bind(null, owner.id)}><button className="quiet">削除</button></form></article>)}{!owners.length && <p>オーナーはまだ登録されていません。</p>}</div></section></>}<section className="editor-card"><h2>{user.isAdmin ? "招待状一覧" : "あなたの招待状"}</h2><section className="invitation-list">{invitations.map((invite) => <article key={invite.id}><Link href={`/admin/invite/${invite.slug}`}><strong>{invite.groomName} & {invite.brideName}</strong><span>/invite/{invite.slug} · オーナー: {ownerEmails.get(invite.ownerId) ?? (user.isAdmin ? "削除済み" : user.email)} · {invite.isPublished ? "公開中" : "下書き"}</span></Link><DeleteInvitationButton action={deleteInvitation.bind(null, invite.id)} /></article>)}{!invitations.length && <p>招待状はまだありません。</p>}</section></section>{user.isAdmin && <section className="editor-card"><h2>招待状を作成</h2><InvitationForm owners={owners} /></section>}</main>;
}
