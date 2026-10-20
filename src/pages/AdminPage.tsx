import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Loader2, LogOut, RefreshCw, Search } from 'lucide-react';
import { QueryLookup } from '@jet-admin/jet-sdk';
import { LoginCard } from '@/components/LoginCard';
import { ApplicationDialog } from '@/components/ApplicationDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, inputClass } from '@/components/ui/input';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { applications, jet } from '@/lib/jet';
import {
  STATUS_OPTIONS,
  formatDate,
  fullName,
  statusLabel,
  toApplication,
  vehicleOfInterest,
  type Application,
  type ApplicationStatus,
} from '@/lib/applications';

const PER_PAGE = 25;

const STATUS_TONE: Record<ApplicationStatus, BadgeTone> = {
  new: 'info',
  in_review: 'warning',
  approved: 'success',
  rejected: 'danger',
};

type AuthState = 'checking' | 'out' | 'in';

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>('checking');

  useEffect(() => {
    jet.auth
      .isAuthenticated()
      .then((r) => setAuth(r.authenticated ? 'in' : 'out'))
      .catch(() => setAuth('out'));
  }, []);

  if (auth === 'checking')
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (auth === 'out')
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-4">
        <LoginCard onLoggedIn={() => setAuth('in')} />
      </div>
    );

  return (
    <ApplicationsPanel
      onLogout={async () => {
        await jet.auth.logout().catch(() => undefined);
        setAuth('out');
      }}
    />
  );
}

function ApplicationsPanel({ onLogout }: { onLogout: () => void }) {
  const [rows, setRows] = useState<Application[]>([]);
  const [count, setCount] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<Application | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await applications().list({
        pagination: { page, perPage: PER_PAGE },
        orderBy: { field: 'submitted_at', desc: true },
        search: query || undefined,
        filters: status ? [{ field: 'status', lookup: QueryLookup.Exact, value: status }] : undefined,
      });
      setRows(res.results.map((r) => toApplication(r.data)));
      setCount(res.count);
      setHasMore(Boolean(res.hasMore ?? (res.count !== undefined && page * PER_PAGE < res.count)));
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = useMemo(() => (count !== undefined ? Math.max(1, Math.ceil(count / PER_PAGE)) : undefined), [count]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Solicitudes de pre-aprobación</h1>
            <p className="text-sm text-muted-foreground">{count !== undefined ? `${count} en total` : ' '}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut /> Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar"
              placeholder="Buscar por nombre, cédula, teléfono o correo"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar por estado"
            className={`${inputClass} sm:w-48`}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ApplicationStatus | '');
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button variant="outline" onClick={() => void load()} disabled={loading} aria-label="Actualizar">
            <RefreshCw className={loading ? 'animate-spin' : ''} /> <span className="sm:hidden">Actualizar</span>
          </Button>
        </div>

        {error ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void load()}>Reintentar</Button>
          </Card>
        ) : !loading && rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="font-medium">{query || status ? 'Ninguna solicitud coincide con la búsqueda' : 'Aún no hay solicitudes'}</p>
            <p className="text-sm text-muted-foreground">
              {query || status ? 'Pruebe con otro término o quite el filtro de estado.' : 'Las solicitudes enviadas desde el formulario público aparecerán aquí.'}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {/* Table on wide screens */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Solicitante</th>
                    <th className="px-4 py-3 font-medium">Auto de interés</th>
                    <th className="px-4 py-3 font-medium">Trabajo</th>
                    <th className="px-4 py-3 font-medium">Teléfono</th>
                    <th className="px-4 py-3 font-medium">Recibida</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id} className="cursor-pointer border-b last:border-0 hover:bg-accent/60" onClick={() => setSelected(a)}>
                      <td className="px-4 py-3">
                        <button type="button" className="text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>
                          {fullName(a)}
                        </button>
                        <div className="text-xs text-muted-foreground">{String(a.data.cedula ?? a.data.email ?? '')}</div>
                      </td>
                      <td className="px-4 py-3">{vehicleOfInterest(a)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{String(a.data.tipo_trabajo ?? (a.data.actualmente_trabaja === 'NO' ? 'No trabaja' : '—'))}</td>
                      <td className="px-4 py-3 tabular-nums">{String(a.data.telefono_celular ?? '—')}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(a.submittedAt)}</td>
                      <td className="px-4 py-3"><Badge tone={STATUS_TONE[a.status]}>{statusLabel(a.status)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Cards on phones */}
            <ul className="divide-y md:hidden">
              {rows.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => setSelected(a)} className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-accent/60">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{fullName(a)}</span>
                      <span className="block text-sm text-muted-foreground">{vehicleOfInterest(a)} · {formatDate(a.submittedAt)}</span>
                    </span>
                    <Badge tone={STATUS_TONE[a.status]}>{statusLabel(a.status)}</Badge>
                  </button>
                </li>
              ))}
            </ul>
            {loading && rows.length === 0 && (
              <div className="grid place-items-center p-10"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
            )}
          </Card>
        )}

        {(page > 1 || hasMore) && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1 || loading}>
              <ChevronLeft /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {page}{totalPages ? ` de ${totalPages}` : ''}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!hasMore || loading}>
              Siguiente <ChevronRight />
            </Button>
          </div>
        )}
      </main>

      <ApplicationDialog
        key={selected?.id ?? 'none'}
        application={selected}
        onClose={() => setSelected(null)}
        onSaved={(updated) => {
          setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          setSelected(updated);
        }}
      />
    </div>
  );
}
