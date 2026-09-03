"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/app/icons";
import { defaultHeroPaths, storageUrl } from "@/lib/media";
import { isScheduleIcon, scheduleIcons } from "@/lib/schedule-icons";

type Invitation = {
  groomName: string;
  brideName: string;
  eventAt: string;
  venueName: string;
  venueAddress: string;
  mapUrl: string | null;
  message: string;
  palette: string;
  media: { kind: string; storagePath: string; alt: string }[];
  schedule: { id: string; startsAt: string; title: string; detail: string | null; icon: string | null }[];
};

const imageUrl = (media: Invitation["media"][number] | undefined, fallback: string) => media ? storageUrl(media.storagePath) : fallback;

function calendarValue(date: Date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${values.year}${values.month}${values.day}T${values.hour}${values.minute}${values.second}`;
}

export function InvitationView({ invitation }: { invitation: Invitation }) {
  const heroMedia = invitation.media.filter(({ kind }) => kind === "HERO");
  const spMedia = invitation.media.filter(({ kind }) => kind === "SP");
  const defaultHeroes = defaultHeroPaths.map((path) => ({ src: storageUrl(path), alt: `${invitation.groomName}と${invitation.brideName}のウェディングフォト` }));
  const heroes = heroMedia.length ? heroMedia.map(({ storagePath, alt }) => ({ src: storageUrl(storagePath), alt })) : defaultHeroes;
  const spHeroes = spMedia.length ? spMedia.map(({ storagePath, alt }) => ({ src: storageUrl(storagePath), alt })) : defaultHeroes;
  const groomImage = imageUrl(invitation.media.find(({ kind }) => kind === "GROOM"), "/img/groom.webp");
  const brideImage = imageUrl(invitation.media.find(({ kind }) => kind === "BRIDE"), "/img/bride.webp");
  const eventAt = new Date(invitation.eventAt);
  const eventEnd = new Date(eventAt.getTime() + 6 * 60 * 60 * 1000);
  const dateParts = Object.fromEntries(new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(eventAt).map(({ type, value }) => [type, value]));
  const eventTime = new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "numeric", minute: "2-digit" }).format(eventAt);
  const mapQuery = [invitation.venueName, invitation.venueAddress].filter(Boolean).join(" ");
  const mapUrl = invitation.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;
  const calendarUrl = `https://calendar.google.com/calendar/render?${new URLSearchParams({ action: "TEMPLATE", text: `${invitation.groomName} & ${invitation.brideName} 結婚式`, dates: `${calendarValue(eventAt)}/${calendarValue(eventEnd)}`, ctz: "Asia/Tokyo", details: "結婚式のご招待", location: mapQuery })}`;
  const [opening, setOpening] = useState(false);
  const [finishingOpening, setFinishingOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeSpSlide, setActiveSpSlide] = useState(0);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const openingVideo = useRef<HTMLVideoElement>(null);
  const envelopeSound = useRef<HTMLAudioElement>(null);
  const backgroundMusic = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden";
    window.scrollTo(0, 0);
    return () => { document.body.style.overflow = ""; };
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const timer = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % heroes.length);
      setActiveSpSlide((slide) => (slide + 1) % spHeroes.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [opened, heroes.length, spHeroes.length]);

  const finishOpening = () => {
    openingVideo.current?.pause();
    if (envelopeSound.current) { envelopeSound.current.pause(); envelopeSound.current.currentTime = 0; }
    const music = backgroundMusic.current;
    if (music) { music.currentTime = 0; music.volume = 0.3; music.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false)); }
    setOpened(true);
  };

  const beginOpening = () => {
    setOpening(true);
    if (envelopeSound.current) { envelopeSound.current.volume = 0.12; envelopeSound.current.play().catch(() => undefined); }
    if (backgroundMusic.current) { backgroundMusic.current.volume = 0; backgroundMusic.current.play().catch(() => undefined); }
    if (openingVideo.current) { openingVideo.current.playbackRate = 1.5; openingVideo.current.play().catch(finishOpening); }
  };

  const cueOpeningFade = () => {
    const video = openingVideo.current;
    if (!video || finishingOpening || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (video.duration - video.currentTime <= 2.8) { video.playbackRate = 1; setFinishingOpening(true); }
  };

  const toggleMusic = () => {
    const music = backgroundMusic.current;
    if (!music) return;
    if (music.paused) music.play().then(() => setMusicPlaying(true)).catch(() => undefined);
    else { music.pause(); setMusicPlaying(false); }
  };

  return (
    <main className={`invite palette-${invitation.palette}`}>
      <audio ref={envelopeSound} src="/img/envelope.mp3" preload="auto" />
      <audio ref={backgroundMusic} src="/img/background.mp3" preload="auto" loop />

      {!opened && <div className={`opening-gate${finishingOpening ? " is-finishing" : ""}`}>
        <video ref={openingVideo} className="opening-video" muted playsInline preload="auto" onTimeUpdate={cueOpeningFade} onEnded={finishOpening}>
          <source media="(max-width: 767px)" src="/img/portrait-champagne.mp4" type="video/mp4" />
          <source src="/img/landscape-champagne.mp4" type="video/mp4" />
          お使いのブラウザは動画を再生できません。
        </video>
        {!opening
          ? <button className="opening-trigger" type="button" onClick={beginOpening}><span>{invitation.groomName} & {invitation.brideName}</span><small>タップして開く</small></button>
          : <button className="opening-skip" type="button" onClick={finishOpening}>スキップ</button>}
      </div>}

      {opened && finishingOpening && <div className="opening-wash-out" aria-hidden="true" onAnimationEnd={() => setFinishingOpening(false)} />}
      {opened && <button className={`music-toggle${musicPlaying ? " is-playing" : ""}`} type="button" onClick={toggleMusic} aria-label={musicPlaying ? "音楽を一時停止" : "音楽を再生"}><Icon name={musicPlaying ? "pause" : "music"} /></button>}

      <section className="invite-hero" id="home">
        <div className="hero-slider hero-slider-pc">{heroes.map(({ src, alt }, index) => <div className="hero-slide-layer" role="img" aria-label={alt} style={{ opacity: activeSlide === index ? 1 : 0, backgroundImage: `url('${src}')`, animation: activeSlide === index ? "hero-zoom 4s ease-out forwards" : "none" }} key={src} />)}</div>
        <div className="hero-slider hero-slider-sp">{spHeroes.map(({ src, alt }, index) => <div className="hero-slide-layer" role="img" aria-label={alt} style={{ opacity: activeSpSlide === index ? 1 : 0, backgroundImage: `url('${src}')`, animation: activeSpSlide === index ? "hero-zoom 4s ease-out forwards" : "none" }} key={src} />)}</div>
        <div className="hero-shade" />
        <div className="hero-copy"><p className="section-label on-dark">日程のお知らせ</p><h1>{invitation.groomName}&<br />{invitation.brideName}</h1><div className="hero-date"><span>{dateParts.month}月</span><strong>{dateParts.day}</strong><span>{dateParts.year}年</span></div><a className="scroll-cue" href="#couple"><span>下へスクロール</span><Icon name="chevron-down" /></a></div>
        <div className="slider-dots slider-dots-pc" aria-label="ウェディングフォト">{heroes.map(({ src }, index) => <button className={activeSlide === index ? "active" : ""} key={src} type="button" aria-label={`スライド ${index + 1} を表示`} aria-current={activeSlide === index ? "true" : undefined} onClick={() => setActiveSlide(index)} />)}</div>
        <div className="slider-dots slider-dots-sp" aria-label="スマートフォン用ウェディングフォト">{spHeroes.map(({ src }, index) => <button className={activeSpSlide === index ? "active" : ""} key={src} type="button" aria-label={`スライド ${index + 1} を表示`} aria-current={activeSpSlide === index ? "true" : undefined} onClick={() => setActiveSpSlide(index)} />)}</div>
      </section>

      <section className="couple-section page-section" id="couple">
        <div className="couple-grid">
          <article className="person-card" style={{ backgroundImage: `url('${groomImage}')` }}><div className="person-shade" /><div className="person-copy"><h2>{invitation.groomName}</h2><span>新郎</span><p>この特別な日を、大切な皆様とともに迎えられることを心より嬉しく思います。素敵な一日にしましょう。</p></div></article>
          <article className="person-card" style={{ backgroundImage: `url('${brideImage}')` }}><div className="person-shade" /><div className="person-copy"><h2>{invitation.brideName}</h2><span>新婦</span><p>温かいご祝福の中で、新しい門出を迎えられることを幸せに思います。どうぞよろしくお願いいたします。</p></div></article>
        </div>
        <div className="marriage-note"><div className="heart"><Icon name="heart" /></div><p className="section-label">私たちは</p><h2 className="section-title">結婚します</h2><p>{invitation.message}</p><em>— {invitation.groomName} & {invitation.brideName} —</em></div>
      </section>

      <section className="location-section page-section" id="location">
        <div className="section-heading"><p className="section-label">会場のご案内</p><h2 className="section-title">アクセス</h2></div>
        <div className="location-card"><div className="location-pin"><Icon name="pin" /></div><h3>{invitation.venueName}</h3><p>{invitation.venueAddress}</p><span className="time-chip"><Icon name="clock" />{eventTime} 開始</span>{mapQuery && <div className="map-frame"><iframe src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="結婚式会場の地図" /></div>}<div className="location-actions"><a className="primary-button" href={mapUrl} target="_blank" rel="noreferrer"><Icon name="pin" />地図で開く<Icon name="external-link" /></a><a className="secondary-button" href={calendarUrl} target="_blank" rel="noreferrer"><Icon name="calendar" />カレンダーに追加</a></div></div>
      </section>

      <section className="timeline-section page-section"><div className="section-heading"><p className="section-label">お式の流れ</p><h2 className="section-title">タイムライン</h2></div><div className="timeline-scroll"><ol>{invitation.schedule.map(({ id, startsAt, title, detail, icon }, index) => { const iconName = isScheduleIcon(icon ?? "") ? icon : scheduleIcons[index % scheduleIcons.length].value; return <li key={id}><time>{startsAt}</time><span className="timeline-icon"><svg className="schedule-icon" viewBox="0 0 24 24" aria-hidden="true"><use href={`/icons/schedule/${iconName}.svg#icon`} /></svg></span><h3>{title}</h3>{detail && <p>{detail}</p>}</li>; })}</ol></div></section>

      <footer className="invite-footer"><h3>{invitation.groomName} & {invitation.brideName}</h3><p>{dateParts.year}年{dateParts.month}月{dateParts.day}日</p><p>ご連絡はお二人までお願いいたします</p><small>© {dateParts.year} {invitation.groomName.toUpperCase()} & {invitation.brideName.toUpperCase()}</small></footer>
    </main>
  );
}
