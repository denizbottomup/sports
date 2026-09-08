export const localZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
export function formatDate(date, withTime = false, zone = localZone()) {
  if (!date || !Number.isFinite(Date.parse(date))) return 'Tarih belirtilmemiş';
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: zone }).format(new Date(date));
}
export const formatHour = (date, zone = localZone()) => new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: zone }).format(new Date(date));
