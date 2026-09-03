"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, currentAdmin, currentUser, setSession } from "@/lib/auth";
import { defaultMediaPaths, mediaBucket } from "@/lib/media";
import { prisma } from "@/lib/prisma";
import { isScheduleIcon } from "@/lib/schedule-icons";

const text = (value: FormDataEntryValue | null, max = 500) => String(value ?? "").trim().slice(0, max);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const imageExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const palettes = new Set(["champagne", "sakura", "forest", "lavender", "navy", "terracotta", "dusty-blue", "bordeaux"]);
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
  const isAdmin = await prisma.admin.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!isAdmin && !await prisma.owner.findUnique({ where: { userId: session.user.id }, select: { id: true } })) redirect(`/login?${new URLSearchParams({ error: "メールアドレスまたはパスワードが正しくありません" })}`);
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
  if (!email || password.length < 8 || await prisma.admin.findUnique({ where: { email }, select: { id: true } })) redirect(adminPath("error", "有効なメールアドレスと8文字以上のパスワードを入力してください"));
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
        schedule: { create: [{ startsAt: "11:00", title: "挙式", icon: "rings", sortOrder: 1 }, { startsAt: "13:00", title: "披露宴", icon: "toast", sortOrder: 2 }] },
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
  const invitation = await prisma.invitation.findFirst({ where: user.isAdmin ? { slug } : { slug, ownerId: user.id }, include: { media: true } });
  if (!invitation) redirect("/admin");
  const eventAt = new Date(`${text(formData.get("eventAt"), 30)}:00+09:00`);
  if (Number.isNaN(eventAt.valueOf())) redirect(invitePath(slug, "error", "正しい日時を入力してください"));
  const palette = text(formData.get("palette"), 30);
  if (!palettes.has(palette)) redirect(invitePath(slug, "error", "テーマカラーを選択してください"));
  const sections = ["hero", "sp", "groom", "bride"] as const;
  type Section = typeof sections[number];
  const kindBySection = { hero: "HERO", sp: "SP", groom: "GROOM", bride: "BRIDE" } as const;
  const files = Object.fromEntries(sections.map((section) => [section, formData.getAll(`${section}Images`).filter((value): value is File => value instanceof File && value.size > 0)])) as Record<Section, File[]>;
  const allImages = Object.values(files).flat();
  if (allImages.some((image) => !imageExtensions[image.type]) || allImages.reduce((total, image) => total + image.size, 0) > 8 * 1024 * 1024) redirect(invitePath(slug, "error", "JPEG、PNG、WebP、AVIF画像を合計8MBまでアップロードできます"));
  const existingPaths = new Set(invitation.media.map((media) => media.storagePath));
  const resolvePath = (value: FormDataEntryValue | null, section: Section) => {
    const token = text(value, 300);
    if (!token) return undefined;
    if (token.startsWith(`new:${section}:`)) {
      const index = Number(token.slice(`new:${section}:`.length));
      return Number.isInteger(index) && index >= 0 && index < files[section].length ? index : null;
    }
    if (token.startsWith("stored:")) {
      const path = token.slice(7);
      return existingPaths.has(path) || defaultMediaPaths.has(path) ? path : null;
    }
    return null;
  };
  const values = Object.fromEntries(sections.map((section) => [section, formData.getAll(`${section}Paths`).map((value) => resolvePath(value, section))])) as Record<Section, (string | number | null | undefined)[]>;
  if (Object.values(values).flat().some((value) => value === null)) redirect(invitePath(slug, "error", "選択した画像を確認してください"));
  if (sections.some((section) => new Set(values[section]).size !== values[section].length)) redirect(invitePath(slug, "error", "同じ画像を複数回選択することはできません"));
  if (!values.hero.length || !values.sp.length || values.hero.length > 5 || values.sp.length > 5 || values.groom.length > 1 || values.bride.length > 1) redirect(invitePath(slug, "error", "ヒーロー画像とSP画像は1〜5枚、新郎・新婦画像は各1枚まで選択できます"));
  let uploadedPaths: Record<Section, string[]>;
  try {
    uploadedPaths = Object.fromEntries(await Promise.all(sections.map(async (section) => [section, await Promise.all(files[section].map(async (image) => {
      const path = `${invitation.slug}/${section}/${crypto.randomUUID()}.${imageExtensions[image.type]}`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${mediaBucket}/${path}`, {
        method: "POST",
        headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": image.type, "x-upsert": "false" },
        body: image,
      });
      if (!response.ok) throw new Error("Image upload failed");
      return path;
    }))]))) as Record<Section, string[]>;
  } catch {
    redirect(invitePath(slug, "error", "画像をアップロードできませんでした"));
  }
  const selectedPaths = Object.fromEntries(sections.map((section) => [section, values[section].map((value) => typeof value === "number" ? uploadedPaths[section][value] : value).filter((path): path is string => Boolean(path))])) as Record<Section, string[]>;
  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        groomName: text(formData.get("groomName"), 80), brideName: text(formData.get("brideName"), 80), eventAt,
        groomMessage: text(formData.get("groomMessage"), 500), brideMessage: text(formData.get("brideMessage"), 500),
        venueName: text(formData.get("venueName"), 120), venueAddress: text(formData.get("venueAddress"), 300),
        mapUrl: text(formData.get("mapUrl"), 1000) || null, message: text(formData.get("message"), 2000), palette,
      },
    }),
    prisma.invitationMedia.deleteMany({ where: { invitationId: invitation.id } }),
    ...sections.flatMap((section) => selectedPaths[section].length ? [prisma.invitationMedia.createMany({ data: selectedPaths[section].map((storagePath, sortOrder) => ({ invitationId: invitation.id, kind: kindBySection[section], storagePath, alt: section === "groom" ? invitation.groomName : section === "bride" ? invitation.brideName : `${invitation.groomName} and ${invitation.brideName}`, sortOrder })) })] : []),
  ]);
  const retainedPaths = new Set(Object.values(selectedPaths).flat());
  const deletionCandidates = [...existingPaths].filter((path) => !defaultMediaPaths.has(path) && !retainedPaths.has(path));
  const referencedPaths = new Set(deletionCandidates.length ? (await prisma.invitationMedia.findMany({ where: { storagePath: { in: deletionCandidates } }, select: { storagePath: true } })).map(({ storagePath }) => storagePath) : []);
  const deletedPaths = deletionCandidates.filter((path) => !referencedPaths.has(path));
  const deletionResponse = deletedPaths.length ? await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${mediaBucket}`, {
    method: "DELETE",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: deletedPaths }),
  }) : null;
  revalidatePath(`/invite/${slug}`);
  redirect(invitePath(slug, "notice", deletionResponse && !deletionResponse.ok ? "保存しましたが、削除した画像ファイルをストレージから消去できませんでした" : "保存しました"));
}

export async function toggleInvitationVisibility(slug: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const invitation = await prisma.invitation.findFirst({ where: user.isAdmin ? { slug } : { slug, ownerId: user.id }, select: { id: true, isPublished: true } });
  if (!invitation) redirect("/admin");
  const isPublished = !invitation.isPublished;
  await prisma.invitation.update({ where: { id: invitation.id }, data: { isPublished } });
  revalidatePath(`/invite/${slug}`);
  revalidatePath("/admin");
  redirect(invitePath(slug, "notice", isPublished ? "招待状の表示を開始しました" : "招待状の表示を停止しました"));
}

export async function deleteInvitation(invitationId: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const invitation = await prisma.invitation.findFirst({ where: user.isAdmin ? { id: invitationId } : { id: invitationId, ownerId: user.id }, include: { media: true } });
  if (!invitation) redirect(adminPath("error", "招待状が見つかりません"));
  const storagePaths = invitation.media.map(({ storagePath }) => storagePath).filter((path) => !defaultMediaPaths.has(path));
  await prisma.invitation.delete({ where: { id: invitation.id } });
  const referencedPaths = new Set(storagePaths.length ? (await prisma.invitationMedia.findMany({ where: { storagePath: { in: storagePaths } }, select: { storagePath: true } })).map(({ storagePath }) => storagePath) : []);
  const deletedPaths = storagePaths.filter((path) => !referencedPaths.has(path));
  const response = deletedPaths.length ? await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${mediaBucket}`, {
    method: "DELETE",
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: deletedPaths }),
  }) : null;
  revalidatePath("/admin");
  revalidatePath(`/invite/${invitation.slug}`);
  redirect(adminPath(response && !response.ok ? "error" : "notice", response && !response.ok ? "招待状は削除しましたが、画像ファイルをストレージから削除できませんでした" : "招待状を削除しました"));
}

export async function addScheduleItem(slug: string, formData: FormData) {
  const { invitation } = await import("@/lib/invitations").then((module) => module.editableInvitation(slug));
  const startsAt = text(formData.get("startsAt"), 10);
  const title = text(formData.get("title"), 100);
  const icon = text(formData.get("icon"), 30);
  if (!startsAt || !title || !isScheduleIcon(icon)) redirect(invitePath(slug, "error", "時間、項目名、アイコンを入力してください"));
  const last = await prisma.scheduleItem.aggregate({ where: { invitationId: invitation.id }, _max: { sortOrder: true } });
  await prisma.scheduleItem.create({ data: { invitationId: invitation.id, startsAt, title, detail: text(formData.get("detail"), 300) || null, icon, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  revalidatePath(`/invite/${slug}`);
  redirect(invitePath(slug, "notice", "スケジュールを追加しました"));
}
