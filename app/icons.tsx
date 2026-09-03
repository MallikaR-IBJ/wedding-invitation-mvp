import type { SVGProps } from "react";

export type IconName = "calendar" | "chevron-down" | "clock" | "external-link" | "glass" | "heart" | "mail" | "music" | "pause" | "pin" | "sparkles" | "utensils" | "wave";

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  const paths = {
    calendar: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>,
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    "external-link": <><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5H6V6h5" /></>,
    glass: <><path d="M6 4h12l-1.2 6.2a4.9 4.9 0 0 1-9.6 0L6 4Z" /><path d="M12 15v5M8.5 20h7" /></>,
    heart: <path d="M20.8 5.9c-2.1-2.2-5.6-1.9-7.6.4L12 7.7l-1.2-1.4c-2-2.3-5.5-2.6-7.6-.4-2.3 2.4-2 6.3.4 8.5L12 22l8.4-7.6c2.4-2.2 2.7-6.1.4-8.5Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    music: <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>,
    pause: <><path d="M9 6v12M15 6v12" /></>,
    pin: <><path d="M20 10c0 5.5-8 11-8 11S4 15.5 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.6 1.4L21 15l-1.4.6L19 17l-.6-1.4L17 15l1.4-.6L19 13Z" /></>,
    utensils: <><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11" /><path d="M16 3v18M16 3c3 2 4 5 4 8h-4" /></>,
    wave: <><path d="M4 13c3-4 5-4 8 0s5 4 8 0" /><path d="M4 18c3-4 5-4 8 0s5 4 8 0M8 7l4-4 4 4" /></>,
  } satisfies Record<IconName, React.ReactNode>;

  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
