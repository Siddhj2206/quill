const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function TimeAgo({ date }: { date: string }) {
  const value = new Date(date);
  const seconds = Math.round((value.getTime() - Date.now()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  let label: string;
  if (Math.abs(seconds) < 60) label = formatter.format(seconds, "second");
  else if (Math.abs(minutes) < 60) label = formatter.format(minutes, "minute");
  else if (Math.abs(hours) < 24) label = formatter.format(hours, "hour");
  else label = formatter.format(days, "day");

  return (
    <time dateTime={value.toISOString()} title={value.toLocaleString()} suppressHydrationWarning>
      {label}
    </time>
  );
}
