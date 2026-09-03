"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions";

const suggestedSlug = (groomName: string, brideName: string) => `${groomName}-${brideName}`
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export function InvitationForm({ owners }: { owners: { id: string; email: string }[] }) {
  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const updateNames = (groom: string, bride: string) => {
    setGroomName(groom);
    setBrideName(bride);
    if (!slugEdited) setSlug(suggestedSlug(groom, bride));
  };

  return <form action={createInvitation} className="editor-form"><label>新郎のお名前<input name="groomName" required maxLength={80} value={groomName} onChange={(event) => updateNames(event.target.value, brideName)} /></label><label>新婦のお名前<input name="brideName" required maxLength={80} value={brideName} onChange={(event) => updateNames(groomName, event.target.value)} /></label><label>オーナー<select name="ownerId" required defaultValue=""><option value="" disabled>オーナーを選択</option>{owners.map((owner) => <option value={owner.id} key={owner.id}>{owner.email}</option>)}</select></label><label>URLスラッグ<input name="slug" required pattern="[A-Za-z0-9-]+" placeholder="taro-and-hanako" value={slug} onChange={(event) => { setSlugEdited(true); setSlug(event.target.value); }} /></label><label>日時<input name="eventAt" type="datetime-local" required /></label><label>会場（任意）<input name="venueName" /></label><label>住所（任意）<input name="venueAddress" /></label><button disabled={!owners.length}>下書きを作成</button></form>;
}
