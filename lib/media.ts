export const mediaBucket = "invitation-media";

export const defaultHeroPaths = [
  "defaults/hero-1_sp.webp",
  "defaults/hero-2.webp",
  "defaults/hero-3.webp",
];

export const defaultMediaPaths = new Set(defaultHeroPaths);

export const storageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${mediaBucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
