"use client";

import { useEffect, useState } from "react";

type Invitation = { groomName: string; brideName: string; eventAt: string; venueName: string; venueAddress: string; mapUrl: string | null; message: string; media: { storagePath: string }[]; schedule: { id: string; startsAt: string; title: string; detail: string | null }[] };
const defaults = ["/img/hero-1_sp.webp", "/img/hero-2.webp", "/img/hero-3.webp"];
const storageUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/invitation-media/${path.split("/").map(encodeURIComponent).join("/")}`;

export function InvitationView({ invitation }: { invitation: Invitation }) {
  const heroes = invitation.media.length ? invitation.media.map((media) => storageUrl(media.storagePath)) : defaults;
  const [active, setActive] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setActive((value) => (value + 1) % heroes.length), 5000); return () => window.clearInterval(timer); }, [heroes.length]);
  const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Tokyo" }).format(new Date(invitation.eventAt));
  return <main className="invitation"><section className="hero">{heroes.map((url, index) => <div key={url} className="hero-image" style={{ opacity: index === active ? 1 : 0, backgroundImage: `linear-gradient(rgba(21, 15, 12, .32), rgba(21, 15, 12, .48)), url('${url}')` }} />)}<div className="hero-content"><p>WEDDING INVITATION</p><h1>{invitation.groomName}<span>&</span>{invitation.brideName}</h1><time>{date}</time></div></section><section className="intro content"><p className="eyebrow">OUR CELEBRATION</p><h2>結婚式のご案内</h2><p>{invitation.message}</p></section><section className="content split"><div><p className="eyebrow">LOCATION</p><h2>{invitation.venueName}</h2><p>{invitation.venueAddress}</p>{invitation.mapUrl && <a className="text-link" href={invitation.mapUrl} target="_blank" rel="noreferrer">Google マップで開く →</a>}</div><div><p className="eyebrow">SCHEDULE</p><ol className="schedule-list">{invitation.schedule.map((item) => <li key={item.id}><time>{item.startsAt}</time><span><strong>{item.title}</strong>{item.detail && <small>{item.detail}</small>}</span></li>)}</ol></div></section><footer>{invitation.groomName} & {invitation.brideName}</footer></main>;
}
