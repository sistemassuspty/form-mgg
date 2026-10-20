import { ALL_FIELDS, STEPS, type FieldDef, type Relative } from './applicationSchema';

export const STATUS_OPTIONS = [
  { value: 'new', label: 'Nueva' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobada' },
  { value: 'rejected', label: 'Rechazada' },
] as const;

export type ApplicationStatus = (typeof STATUS_OPTIONS)[number]['value'];

export function statusLabel(status: unknown) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? 'Nueva';
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  notes: string;
  data: Record<string, unknown>;
}

export function toApplication(record: Record<string, unknown>): Application {
  const status = STATUS_OPTIONS.some((s) => s.value === record.status) ? (record.status as ApplicationStatus) : 'new';
  return {
    id: String(record.id ?? ''),
    status,
    submittedAt: typeof record.submitted_at === 'string' ? record.submitted_at : null,
    notes: typeof record.admin_notes === 'string' ? record.admin_notes : '',
    data: record,
  };
}

export function fullName(a: Application) {
  return [a.data.nombre, a.data.apellidos].filter(Boolean).join(' ') || 'Sin nombre';
}

export function vehicleOfInterest(a: Application) {
  return [a.data.auto_marca, a.data.auto_modelo].filter(Boolean).join(' ') || '—';
}

export function formatMoney(value: unknown) {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  if (!Number.isFinite(n) || String(value ?? '').trim() === '') return '—';
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(n);
}

export function formatDate(value: unknown, withTime = false) {
  if (typeof value !== 'string' || !value) return '—';
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-PA', withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(d);
}

/** Stored JSON columns may come back as strings. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function relativesOf(a: Application): Relative[] {
  return parseJson<Relative[]>(a.data.familiares, []);
}

export function fileUrlsOf(a: Application): string[] {
  const v = parseJson<unknown>(a.data.licencia_fotos, []);
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : String((x as { url?: string }).url ?? ''))).filter(Boolean);
  return typeof v === 'string' && v ? [v] : [];
}

export function displayValue(field: FieldDef, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  switch (field.type) {
    case 'money':
      return formatMoney(value);
    case 'date':
      return formatDate(value);
    case 'consent':
      return value === true || value === 'true' ? 'Sí' : 'No';
    default:
      return String(value);
  }
}

/** Sections with their fields, for the detail view. */
export const DETAIL_SECTIONS = STEPS.flatMap((s) => s.sections).map((section) => ({
  id: section.id,
  title: section.title,
  fields: section.fields.filter((f) => !['files', 'signature', 'relatives'].includes(f.type)),
}));

export const SEARCHABLE_KEYS = ALL_FIELDS.filter((f) => ['text', 'email', 'phone'].includes(f.type)).map((f) => f.key);
