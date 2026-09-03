"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminEmail, clearSession, currentAdmin, currentUser, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const text = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const imageExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const adminPath = (key: "error" | "notice", value: string) => `/admin?${new URLSearchParams({ [key]: value })}`;
const invitePath = (slug: string, key: "error" | "notice", value: string) => `/admin/invite/${slug}?${new URLSearchParams({ [key]: value })}`;

async function authRequest(path: string, body: Record<string, string>) {
  return fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function adminAuthRequest(path: string, method: "POST" | "PUT" | "DELETE", body?: Record<string, unknown>) {
  return fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function signIn(formData: FormData) {
  const email = text(formData.get("email"), 254);
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect(`/login?${new URLSearchParams({ error: "メールアドレスまたはパスワードが正しくありません" })}`);
  const response = await authRequest("token?grant_type=password", { email, password });
  if (!response.ok) redirect(`/login?${new URLSearchParams({ error: "メールアドレスまたはパスワードが正しくありません" })}`);
  const session = await response.json() as { access_token: string; expires_in: number; user: { id: string; email?: string } };
  if (session.user.email !== adminEmail && !await prisma.owner.findUnique({ where: { userId: session.user.id }, select: { id: true } })) redirect(`/login?${new URLSearchParams({ error: "メールアドレスまたはパスワードが正しくありません" })}`);
  await setSession(session.access_token, session.expires_in);
  redirect("/admin");
}

export async function signOut() {
  await clearSession();
  redirect("/");
}

export async function createOwner(formData: FormData) {
  if (!await currentAdmin()) redirect("/login");
  const email = text(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || email === adminEmail || password.length < 8) redirect(adminPath("error", "有効なメールアドレスと8文字以上のパスワードを入力してください"));
  const response = await adminAuthRequest("users", "POST", { email, password, email_confirm: true });
  if (!response.ok) redirect(adminPath("error", "オーナーを作成できませんでした。メールアドレスが重複している可能性があります"));
  const user = await response.json() as { id: string };
  try {
    await prisma.owner.create({ data: { userId: user.id, email } });
  } catch {
    await adminAuthRequest(`users/${user.id}`, "DELETE");
    redirect(adminPath("error", "オーナーを保存できませんでした"));
  }
  redirect(adminPath("notice", "オーナーを追加しました"));
}

export async function resetOwnerPassword(ownerId: string, formData: FormData) {
  if (!await currentAdmin()) redirect("/login");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect(adminPath("error", "パスワードは8文字以上で入力してください"));
  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) redirect(adminPath("error", "オーナーが見つかりません"));
  if (!(await adminAuthRequest(`users/${owner.userId}`, "PUT", { password })).ok) redirect(adminPath("error", "パスワードを更新できませんでした"));
  redirect(adminPath("notice", "オーナーのパスワードを更新しました"));
}

export async function removeOwner(ownerId: string) {
  if (!await currentAdmin()) redirect("/login");
  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) redirect(adminPath("error", "オーナーが見つかりません"));
  if (await prisma.invitation.count({ where: { ownerId: owner.userId } })) redirect(adminPath("error", "招待状を所有しているオーナーは削除できません"));
  if (!(await adminAuthRequest(`users/${owner.userId}`, "DELETE")).ok) redirect(adminPath("error", "オーナーを削除できませんでした"));
  await prisma.owner.delete({ where: { id: owner.id } });
  redirect(adminPath("notice", "オーナーを削除しました"));
}

export async function createInvitation(formData: FormData) {
  if (!await currentAdmin()) redirect("/login");
  const groomName = text(formData.get("groomName"), 80);
  const brideName = text(formData.get("brideName"), 80);
  const slug = slugify(text(formData.get("slug"), 60));
  const ownerId = text(formData.get("ownerId"), 100);
  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!groomName || !brideName || !slug || !owner) redirect(adminPath("error", "新郎新婦のお名前、URLスラッグ、オーナーを入力してください"));
  const eventAt = new Date(`${text(formData.get("eventAt"), 30)}:00+09:00`);
  if (Number.isNaN(eventAt.valueOf())) redirect(adminPath("error", "正しい日時を入力してください"));
  let invitation: { slug: string };
  try {
    invitation = await prisma.invitation.create({
      data: {
        slug, groomName, brideName, eventAt,
        venueName: text(formData.get("venueName"), 120) || "会場は後日ご案内します",
        venueAddress: text(formData.get("venueAddress"), 300),
        message: "私たちの特別な一日を、ぜひご一緒にお祝いください。",
        ownerId: owner.userId,
        members: { create: { userId: owner.userId, role: "OWNER" } },
        schedule: { create: [{ startsAt: "11:00", title: "挙式", sortOrder: 1 }, { startsAt: "13:00", title: "披露宴", sortOrder: 2 }] },
      },
    });
  } catch {
    redirect(adminPath("error", "このURLスラッグはすでに使われています"));
  }
  redirect(`/admin/invite/${invitation.slug}`);
}

export async function updateInvitation(slug: string, formData: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const invitation = await prisma.invitation.findFirst({ where: user.isAdmin ? { slug } : { slug, members: { some: { userId: user.id } } } });
  if (!invitation) redirect("/admin");
  const eventAt = new Date(`${text(formData.get("eventAt"), 30)}:00+09:00`);
  if (Number.isNaN(eventAt.valueOf())) redirect(invitePath(slug, "error", "正しい日時を入力してください"));
  const heroImages = formData.getAll("heroImages").filter((value): value is File => value instanceof File && value.size > 0);
  if (heroImages.some((image) => !imageExtensions[image.type]) || heroImages.reduce((total, image) => total + image.size, 0) > 8 * 1024 * 1024) redirect(invitePath(slug, "error", "JPEG、PNG、WebP、AVIF画像を合計8MBまでアップロードできます"));
  let uploadedPaths: string[];
  try {
    uploadedPaths = await Promise.all(heroImages.map(async (image) => {
      const path = `${invitation.slug}/${crypto.randomUUID()}.${imageExtensions[image.type]}`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/invitation-media/${path}`, {
        method: "POST",
        headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": image.type, "x-upsert": "false" },
        body: image,
      });
      if (!response.ok) throw new Error("Image upload failed");
      return path;
    }));
  } catch {
    redirect(invitePath(slug, "error", "画像をアップロードできませんでした"));
  }
  const heroPaths = [...text(formData.get("heroPaths"), 2000).split(/\r?\n/).map((path) => path.trim()).filter(Boolean), ...uploadedPaths];
  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        groomName: text(formData.get("groomName"), 80), brideName: text(formData.get("brideName"), 80), eventAt,
        venueName: text(formData.get("venueName"), 120), venueAddress: text(formData.get("venueAddress"), 300),
        mapUrl: text(formData.get("mapUrl"), 1000) || null, message: text(formData.get("message"), 2000),
        isPublished: formData.get("isPublished") === "on",
      },
    }),
    prisma.invitationMedia.deleteMany({ where: { invitationId: invitation.id, kind: "HERO" } }),
    ...(heroPaths.length ? [prisma.invitationMedia.createMany({ data: heroPaths.map((storagePath, sortOrder) => ({ invitationId: invitation.id, kind: "HERO", storagePath, alt: `${invitation.groomName} and ${invitation.brideName}`, sortOrder })) })] : []),
  ]);
  revalidatePath(`/invite/${slug}`);
  redirect(invitePath(slug, "notice", "保存しました"));
}

export async function addScheduleItem(slug: string, formData: FormData) {
  const { invitation } = await import("@/lib/invitations").then((module) => module.editableInvitation(slug));
  const startsAt = text(formData.get("startsAt"), 10);
  const title = text(formData.get("title"), 100);
  if (!startsAt || !title) redirect(invitePath(slug, "error", "時間と項目名を入力してください"));
  const last = await prisma.scheduleItem.aggregate({ where: { invitationId: invitation.id }, _max: { sortOrder: true } });
  await prisma.scheduleItem.create({ data: { invitationId: invitation.id, startsAt, title, detail: text(formData.get("detail"), 300) || null, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  revalidatePath(`/invite/${slug}`);
  redirect(invitePath(slug, "notice", "スケジュールを追加しました"));
}
