export const NOTIFICATIONS_REFRESH_EVENT = 'fems-notifications-changed';

export function refreshNotifications() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }
}
