"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { defaultHeroPaths, storageUrl } from "@/lib/media";

type Section = "hero" | "sp" | "groom" | "bride";
type Media = { storagePath: string; kind: "UPLOAD" | "HERO" | "SP" | "GROOM" | "BRIDE" };
type ImageItem = { id: string; url: string; path?: string; file?: File };
type Props = {
  invitation: { groomName: string; brideName: string; eventAt: string; venueName: string; venueAddress: string; mapUrl: string | null; message: string; palette: string; isPublished: boolean; media: Media[] };
  action: (formData: FormData) => void;
};

const sectionKind = { hero: "HERO", sp: "SP", groom: "GROOM", bride: "BRIDE" } as const;
const palettes = [
  { value: "champagne", label: "シャンパン", colors: ["#fcfaf5", "#98723c", "#352f27"] },
  { value: "sakura", label: "桜", colors: ["#fff9fa", "#b66579", "#50343b"] },
  { value: "forest", label: "フォレスト", colors: ["#f7faf7", "#446b5b", "#243b32"] },
  { value: "lavender", label: "ラベンダー", colors: ["#fbf9fd", "#80658d", "#3f3545"] },
  { value: "navy", label: "ネイビー", colors: ["#f7f8fb", "#3f5879", "#222e40"] },
  { value: "terracotta", label: "テラコッタ", colors: ["#fff9f5", "#b05f45", "#4d3028"] },
  { value: "dusty-blue", label: "ダスティブルー", colors: ["#f8fbfb", "#62818a", "#2e4247"] },
  { value: "bordeaux", label: "ボルドー", colors: ["#fcf8f9", "#86485b", "#422630"] },
] as const;
const localDate = (value: string) => new Date(value).toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" }).slice(0, 16);
const storedItem = (path: string): ImageItem => ({ id: `stored:${path}`, path, url: storageUrl(path) });

function initialItems(media: Media[], section: Section) {
  const stored = media.filter(({ kind }) => kind === sectionKind[section]).map(({ storagePath }) => storedItem(storagePath));
  if (stored.length) return stored;
  if (section === "hero" || section === "sp") return defaultHeroPaths.map(storedItem);
  return [{ id: `fallback:${section}`, url: `/img/${section}.webp` }];
}

function ImageSection({ section, title, description, initial, multiple = false, sortable = false }: { section: Section; title: string; description: string; initial: ImageItem[]; multiple?: boolean; sortable?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef(new Set<string>());
  const dragIndex = useRef<number | null>(null);
  const [items, setItems] = useState(initial);

  useEffect(() => () => objectUrls.current.forEach(URL.revokeObjectURL), []);
  useEffect(() => {
    const data = new DataTransfer();
    items.forEach(({ file }) => { if (file) data.items.add(file); });
    if (inputRef.current) inputRef.current.files = data.files;
  }, [items]);

  const addFiles = (selected: File[]) => {
    const accepted = multiple ? selected.slice(0, Math.max(0, 5 - items.length)) : selected.slice(-1);
    if (!accepted.length) return;
    const additions = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      objectUrls.current.add(url);
      return { id: crypto.randomUUID(), file, url };
    });
    if (multiple) setItems((current) => [...current, ...additions]);
    else {
      items.forEach(({ file, url }) => { if (file) { URL.revokeObjectURL(url); objectUrls.current.delete(url); } });
      setItems(additions);
    }
  };

  const remove = (index: number) => setItems((current) => {
    if (current.length === 1) return current;
    const removed = current[index];
    if (removed.file) { URL.revokeObjectURL(removed.url); objectUrls.current.delete(removed.url); }
    return current.filter((_, itemIndex) => itemIndex !== index);
  });
  const move = (from: number, to: number) => setItems((current) => {
    if (to < 0 || to >= current.length || from === to) return current;
    const next = [...current];
    next.splice(to, 0, next.splice(from, 1)[0]);
    return next;
  });

  const fileItems = items.filter(({ file }) => file);

  return <section className="media-section full">
    <header><div><h2>{title}</h2><p>{description}</p></div><span>{items.length}{multiple ? " / 5" : ""}</span></header>
    <div className="upload-drop" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(Array.from(event.dataTransfer.files)); }}>
      <input ref={inputRef} name={`${section}Images`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={(event) => addFiles(Array.from(event.target.files ?? []))} />
      <span>ここへ画像をドロップ</span><button type="button" className="secondary" onClick={() => inputRef.current?.click()}>画像を選ぶ</button>
    </div>
    <div className={`section-image-grid${sortable ? " is-sortable" : ""}`} role="list">
      {items.map((item, index) => {
        const newIndex = fileItems.indexOf(item);
        const value = item.path ? `stored:${item.path}` : item.file ? `new:${section}:${newIndex}` : "";
        return <article className="section-image-card" draggable={sortable} key={item.id} role="listitem" onDragStart={() => { dragIndex.current = index; }} onDragOver={(event) => { if (sortable) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (dragIndex.current !== null) move(dragIndex.current, index); dragIndex.current = null; }}>
          {value && <input type="hidden" name={`${section}Paths`} value={value} />}
          <Image src={item.url} alt={`${title} ${index + 1}`} fill sizes="(max-width: 520px) 100vw, 220px" unoptimized />
          <div className="section-image-actions">
            {sortable && <><button type="button" className="quiet" onClick={() => move(index, index - 1)} disabled={index === 0} aria-label={`${title} ${index + 1}を前へ`}>←</button><button type="button" className="quiet" onClick={() => move(index, index + 1)} disabled={index === items.length - 1} aria-label={`${title} ${index + 1}を後へ`}>→</button></>}
            <button type="button" className="delete-image" onClick={() => remove(index)} disabled={items.length === 1}>削除</button>
          </div>
        </article>;
      })}
    </div>
  </section>;
}

export function InvitationEditor({ invitation, action }: Props) {
  return <form action={action} className="editor-form">
    <label>新郎のお名前<input name="groomName" defaultValue={invitation.groomName} required /></label>
    <label>新婦のお名前<input name="brideName" defaultValue={invitation.brideName} required /></label>
    <label>日時（日本時間）<input name="eventAt" type="datetime-local" defaultValue={localDate(invitation.eventAt)} required /></label>
    <label>会場<input name="venueName" defaultValue={invitation.venueName} required /></label>
    <label>住所<input name="venueAddress" defaultValue={invitation.venueAddress} /></label>
    <label>Google Maps URL<input name="mapUrl" type="url" defaultValue={invitation.mapUrl ?? ""} /></label>
    <label className="full">メッセージ<textarea name="message" rows={4} defaultValue={invitation.message} /></label>
    <fieldset className="palette-picker full">
      <legend>招待状のテーマカラー</legend>
      <p>おふたりらしい色合いをお選びください。</p>
      <div className="palette-grid">{palettes.map((palette) => <label className="palette-option" key={palette.value}>
        <input name="palette" type="radio" value={palette.value} defaultChecked={invitation.palette === palette.value} required />
        <span className="palette-swatches" aria-hidden="true">{palette.colors.map((color) => <i style={{ background: color }} key={color} />)}</span>
        <span>{palette.label}</span>
      </label>)}</div>
    </fieldset>
    <ImageSection section="hero" title="ヒーロー画像（PC）" description="ドラッグ、または矢印ボタンで表示順を変更できます。" initial={initialItems(invitation.media, "hero")} multiple sortable />
    <ImageSection section="sp" title="ヒーロー画像（スマートフォン）" description="スマートフォンで表示する順番に並べてください。" initial={initialItems(invitation.media, "sp")} multiple sortable />
    <ImageSection section="groom" title="新郎画像" description="新しい画像を選ぶと現在の画像を置き換えます。" initial={initialItems(invitation.media, "groom")} />
    <ImageSection section="bride" title="新婦画像" description="新しい画像を選ぶと現在の画像を置き換えます。" initial={initialItems(invitation.media, "bride")} />
    <label className="check full"><input name="isPublished" type="checkbox" defaultChecked={invitation.isPublished} /> この招待状を公開する</label>
    <button>変更を保存</button>
  </form>;
}
