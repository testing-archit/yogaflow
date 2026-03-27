export function getAdminEmails(): string[] {
  const raw = (import.meta as any)?.env?.VITE_ADMIN_EMAILS;
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  const configured = getAdminEmails();
  const defaults = ['admin@yogaflow.com', 'support@yogaflow.com'];
  return [...defaults, ...configured].includes(normalized);
}

