import { useState } from 'react';
import { FileText, Loader2, Paperclip, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SignaturePad } from '@/components/SignaturePad';
import { cn } from '@/lib/utils';
import { inputClass } from '@/components/ui/input';
import { ageFrom, formatPhone, type FieldDef, type FormValues, type Relative } from '@/lib/applicationSchema';
import { MAX_FILES, formatBytes, pickFiles, type PickedFile } from '@/lib/files';

interface Props {
  field: FieldDef;
  values: FormValues;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
}

export function FieldInput({ field, values, error, onChange, onBlur }: Props) {
  const id = `f-${field.key}`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const value = values[field.key];
  const describedBy = [field.help ? helpId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined;
  const common = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, onBlur };
  const isGroup = field.type === 'radio' || field.type === 'relatives' || field.type === 'files';

  if (field.type === 'consent') {
    return (
      <div className="space-y-1.5" data-field={field.key}>
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 text-sm leading-snug">
          <input
            {...common}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[hsl(var(--primary))]"
          />
          <span>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </span>
        </label>
        {error && <p id={errorId} className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn('space-y-1.5', field.width !== 'half' && 'sm:col-span-2')} data-field={field.key}>
      {isGroup ? (
        <p id={`${id}-label`} className="text-sm font-medium leading-snug">
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </p>
      ) : (
        <Label htmlFor={id}>
          {field.label}
          {field.required && <span className="text-destructive"> *</span>}
        </Label>
      )}

      {renderControl()}

      {field.help && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {field.help}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );

  function renderControl() {
    const str = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
    switch (field.type) {
      case 'textarea':
        return <Textarea {...common} value={str} rows={3} onChange={(e) => onChange(e.target.value)} />;
      case 'select':
        return (
          <select {...common} value={str} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, !str && 'text-muted-foreground')}>
            <option value="">Seleccione…</option>
            {field.options?.map((o) => (
              <option key={o} value={o} className="text-foreground">
                {o}
              </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="flex flex-wrap gap-2">
            {field.options?.map((o) => {
              const checked = value === o;
              return (
                <label
                  key={o}
                  className={cn(
                    'inline-flex min-w-20 cursor-pointer items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:bg-accent',
                    error && !checked && 'border-destructive',
                  )}
                >
                  <input type="radio" name={id} value={o} checked={checked} onChange={() => onChange(o)} className="sr-only" />
                  {o}
                </label>
              );
            })}
          </div>
        );
      case 'phone':
        return (
          <Input
            {...common}
            type="tel"
            inputMode="numeric"
            autoComplete={field.key === 'telefono_celular' ? 'tel-national' : 'off'}
            placeholder={field.placeholder}
            value={str}
            onChange={(e) => onChange(formatPhone(e.target.value, field.allowLandline))}
          />
        );
      case 'email':
        return <Input {...common} type="email" autoComplete="email" inputMode="email" placeholder={field.placeholder} value={str} onChange={(e) => onChange(e.target.value)} />;
      case 'number':
        if (field.readOnly) {
          const computed = field.key === 'edad' ? ageFrom(values.fecha_nacimiento) : str;
          return <Input {...common} readOnly tabIndex={-1} value={computed === '' ? '' : String(computed)} placeholder="—" className="bg-muted" />;
        }
        return (
          <Input
            {...common}
            inputMode="numeric"
            placeholder={field.placeholder}
            value={str}
            onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        );
      case 'money':
        return (
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">B/.</span>
            <Input
              {...common}
              inputMode="decimal"
              placeholder="0.00"
              className="pl-10"
              value={str}
              onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
            />
          </div>
        );
      case 'date':
        return <Input {...common} type="date" max={new Date().toISOString().slice(0, 10)} value={str} onChange={(e) => onChange(e.target.value)} />;
      case 'files':
        return <FilesControl id={id} value={(value as PickedFile[]) ?? []} onChange={onChange} invalid={Boolean(error)} />;
      case 'signature':
        return <SignaturePad id={id} value={typeof value === 'string' ? value : undefined} onChange={onChange} invalid={Boolean(error)} />;
      case 'relatives':
        return <RelativesControl id={id} value={(value as Relative[]) ?? []} onChange={onChange} />;
      default:
        return (
          <Input
            {...common}
            autoComplete={field.key === 'nombre' ? 'given-name' : field.key === 'apellidos' ? 'family-name' : 'off'}
            placeholder={field.placeholder}
            value={str}
            onChange={(e) => onChange(e.target.value)}
          />
        );
    }
  }
}

function FilesControl({ id, value, onChange, invalid }: { id: string; value: PickedFile[]; onChange: (v: unknown) => void; invalid: boolean }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string>();

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setProblem(undefined);
    const room = MAX_FILES - value.length;
    const { files, error } = await pickFiles(Array.from(list).slice(0, room));
    if (list.length > room) setProblem(`Máximo ${MAX_FILES} archivos.`);
    if (error) setProblem(error);
    onChange([...value, ...files]);
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {value.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-md border bg-card p-2">
              {f.type.startsWith('image/') ? (
                <img src={f.dataUrl} alt="" className="size-12 shrink-0 rounded object-cover" />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded bg-muted">
                  <FileText className="size-5 text-muted-foreground" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{f.name}</span>
                <span className="text-xs text-muted-foreground">{formatBytes(f.size)}</span>
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label={`Quitar ${f.name}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
                <X />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {value.length < MAX_FILES && (
        <label
          htmlFor={id}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-card px-4 py-6 text-center text-sm hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            invalid ? 'border-destructive' : 'border-input',
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <Paperclip className="size-5 text-muted-foreground" />}
          <span className="font-medium">{value.length ? 'Agregar otra foto' : 'Tomar foto o elegir archivo'}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG o PDF</span>
          <input id={id} type="file" accept="image/*,application/pdf" multiple className="sr-only" disabled={busy} onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
        </label>
      )}
      {problem && <p className="text-sm text-destructive">{problem}</p>}
    </div>
  );
}

const RELATIVE_COLUMNS: { key: keyof Relative; label: string; placeholder?: string }[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'parentesco', label: 'Parentesco', placeholder: 'Ej.: Madre' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'telefono', label: 'Tel / Cel', placeholder: '6000-0000' },
];

function RelativesControl({ id, value, onChange }: { id: string; value: Relative[]; onChange: (v: unknown) => void }) {
  const update = (row: number, key: keyof Relative, v: string) =>
    onChange(value.map((r, i) => (i === row ? { ...r, [key]: key === 'telefono' ? formatPhone(v, true) : v } : r)));

  return (
    <div className="space-y-3" aria-labelledby={`${id}-label`} role="group">
      {value.map((row, i) => (
        <fieldset key={i} className="rounded-md border bg-card p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">Familiar {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {RELATIVE_COLUMNS.map((c) => (
              <div key={c.key} className="space-y-1">
                <Label htmlFor={`${id}-${i}-${c.key}`} className="text-xs text-muted-foreground">
                  {c.label}
                </Label>
                <Input
                  id={`${id}-${i}-${c.key}`}
                  value={row[c.key]}
                  placeholder={c.placeholder}
                  inputMode={c.key === 'telefono' ? 'numeric' : undefined}
                  onChange={(e) => update(i, c.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
