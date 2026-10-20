import { useState } from 'react';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { inputClass } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { applications } from '@/lib/jet';
import {
  DETAIL_SECTIONS,
  STATUS_OPTIONS,
  displayValue,
  fileUrlsOf,
  formatDate,
  fullName,
  relativesOf,
  type Application,
  type ApplicationStatus,
} from '@/lib/applications';

interface Props {
  application: Application | null;
  onClose: () => void;
  onSaved: (a: Application) => void;
}

export function ApplicationDialog({ application, onClose, onSaved }: Props) {
  // Mounted with key={application.id}, so state starts from the selected record.
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? 'new');
  const [notes, setNotes] = useState(application?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  if (!application) return null;
  const a = application;
  const files = fileUrlsOf(a);
  const relatives = relativesOf(a);
  const signature = typeof a.data.firma === 'string' ? a.data.firma : '';
  const dirty = status !== a.status || notes !== a.notes;

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await applications().update({ primaryKey: a.id, data: { status, admin_notes: notes }, fields: ['status', 'admin_notes'] });
      onSaved({ ...a, status, notes, data: { ...a.data, status, admin_notes: notes } });
    } catch (e) {
      console.error(e);
      setError('No se pudo guardar. Intente de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <div className="border-b p-4 pr-12 sm:p-6 sm:pr-14">
          <DialogTitle className="text-lg font-semibold">{fullName(a)}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Recibida {formatDate(a.submittedAt, true)}</DialogDescription>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          <section className="grid gap-3 rounded-md border bg-muted/40 p-4 sm:grid-cols-[200px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <select id="status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas internas</Label>
              <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible solo para el equipo" />
            </div>
            {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button onClick={save} disabled={!dirty || saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />} Guardar cambios
              </Button>
            </div>
          </section>

          {files.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Licencia de conducir</h3>
              <div className="flex flex-wrap gap-3">
                {files.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-md border">
                    {/\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf') ? (
                      <span className="flex h-28 w-40 items-center justify-center gap-1 text-sm text-primary">PDF {i + 1} <ExternalLink className="size-3.5" /></span>
                    ) : (
                      <img src={url} alt={`Licencia ${i + 1}`} className="h-28 w-40 object-cover transition-opacity group-hover:opacity-80" />
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {DETAIL_SECTIONS.map((section) => {
            const rows = section.fields.filter((f) => a.data[f.key] !== undefined && a.data[f.key] !== null && a.data[f.key] !== '');
            if (!rows.length) return null;
            return (
              <section key={section.id}>
                <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {rows.map((f) => (
                    <div key={f.key} className="min-w-0">
                      <dt className="text-muted-foreground">{f.label}</dt>
                      <dd className="break-words">{displayValue(f, a.data[f.key])}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}

          {relatives.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Familiares que no viven con el solicitante</h3>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      {['Nombre', 'Parentesco', 'Dirección', 'Teléfono'].map((h) => (
                        <th key={h} className="px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {relatives.map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{r.nombre || '—'}</td>
                        <td className="px-3 py-2">{r.parentesco || '—'}</td>
                        <td className="px-3 py-2">{r.direccion || '—'}</td>
                        <td className="px-3 py-2 tabular-nums">{r.telefono || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {signature && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Firma</h3>
              <img src={signature} alt="Firma del solicitante" className={cn('h-28 rounded-md border bg-white p-2')} />
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
