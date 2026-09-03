export const scheduleIcons = [
  { value: "rings", label: "結婚指輪" },
  { value: "toast", label: "乾杯" },
  { value: "dinner", label: "お食事" },
  { value: "cake", label: "ウェディングケーキ" },
  { value: "bouquet", label: "ブーケ" },
  { value: "camera", label: "記念撮影" },
  { value: "music", label: "音楽・余興" },
] as const;

export type ScheduleIconName = typeof scheduleIcons[number]["value"];

export const isScheduleIcon = (value: string): value is ScheduleIconName =>
  scheduleIcons.some((icon) => icon.value === value);
