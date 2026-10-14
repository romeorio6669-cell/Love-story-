export function createGoogleCalendarUrl(
  title: string,
  details: string,
  location: string,
  startDateIso: string
): string {
  try {
    const start = new Date(startDateIso);
    if (isNaN(start.getTime())) return '';
    // End 4 hours later by default
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

    const formatTime = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: details,
      location: location,
      dates: `${formatTime(start)}/${formatTime(end)}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch {
    return '';
  }
}
