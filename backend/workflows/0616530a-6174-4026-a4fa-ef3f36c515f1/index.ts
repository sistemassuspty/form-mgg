/**
 * Submit workflow for the public pre-approval form.
 *
 * Called from the browser with:
 *   jet.workflow('0616530a-6174-4026-a4fa-ef3f36c515f1').execute({ data: { ...answers } })
 *
 * Runs with service permissions, so the public page never touches the collection directly.
 * It whitelists the fields, re-checks the essentials, uploads the licence photos and the
 * signature to Jet storage, and creates the record in jet_database / preapproval_applications.
 *
 * NOTE: keep the exported handler signature the same as the one Jet Admin generated for this
 * workflow. If Jet's original file used a different signature, paste the body of `handle()` into it.
 */
import { Jet } from '@jet-admin/jet-sdk';

const RESOURCE = 'jet_database';
const COLLECTION = 'preapproval_applications';
/** Jet storage used for uploaded files. Change to the storage name in your Jet project. */
const STORAGE_RESOURCE = 'jet_database';
const STORAGE_NAME = 'jet_storage';

/** Must match FIELD_KEYS in src/lib/applicationSchema.ts. */
const FIELD_KEYS = [
  'auto_marca', 'auto_modelo',
  'licencia_fotos', 'nombre', 'apellidos', 'fecha_nacimiento', 'edad', 'telefono_celular', 'telefono_fijo',
  'email', 'nacionalidad', 'cedula', 'estado_civil',
  'conyuge_nombre', 'conyuge_apellidos', 'conyuge_edad', 'conyuge_cedula', 'conyuge_nacionalidad',
  'conyuge_celular', 'conyuge_trabaja', 'conyuge_email', 'conyuge_lugar_trabajo', 'conyuge_cargo',
  'conyuge_sueldo', 'conyuge_fecha_ingreso', 'conyuge_tel_trabajo',
  'dependientes_cantidad', 'dependientes_edades', 'familiares',
  'vivienda_propia', 'dir_calle', 'dir_casa', 'dir_urbanizacion', 'provincia', 'distrito', 'corregimiento',
  'punto_referencia',
  'tiene_vehiculo', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano',
  'ultimo_estudio', 'actualmente_estudia', 'instituto',
  'actualmente_trabaja', 'tipo_trabajo', 'taxi_tipo', 'taxi_empresa', 'fecha_inicio', 'plataforma_nombre',
  'plataforma_viajes', 'plataforma_puntos', 'independiente_asalariado', 'ocupacion_independiente',
  'asalariado_empresa', 'asalariado_fecha_inicio', 'sueldo',
  'ant1_empresa', 'ant1_cargo', 'ant1_sueldo', 'ant1_fecha_ingreso', 'ant1_fecha_salida',
  'ant2_empresa', 'ant2_cargo', 'ant2_sueldo', 'ant2_fecha_ingreso', 'ant2_fecha_salida',
  'firma', 'declaracion',
] as const;

const REQUIRED = [
  'auto_marca', 'auto_modelo', 'licencia_fotos', 'nombre', 'apellidos', 'fecha_nacimiento',
  'telefono_celular', 'email', 'nacionalidad', 'estado_civil', 'firma',
] as const;

const NUMBER_FIELDS = new Set(['edad', 'conyuge_edad', 'dependientes_cantidad', 'vehiculo_ano', 'plataforma_viajes', 'plataforma_puntos']);
const MONEY_FIELDS = new Set(['conyuge_sueldo', 'sueldo', 'ant1_sueldo', 'ant2_sueldo']);
const MAX_TEXT = 500;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface IncomingFile {
  name?: string;
  type?: string;
  dataUrl?: string;
}

type Request = { headers: unknown; body?: unknown; data?: unknown };

class InputError extends Error {}

function readInput(req: Request): Record<string, unknown> {
  const body = (req.body ?? req.data ?? {}) as Record<string, unknown>;
  const data = (body.data ?? body) as Record<string, unknown>;
  if (!data || typeof data !== 'object') throw new InputError('invalid_payload');
  return data;
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; type: string } {
  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new InputError('invalid_file');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_FILE_BYTES) throw new InputError('file_too_large');
  if (!/^image\/(jpeg|png|webp|heic|heif)$|^application\/pdf$/.test(match[1])) throw new InputError('file_type_not_allowed');
  return { blob: new Blob([bytes], { type: match[1] }), type: match[1] };
}

async function storeFile(jet: Jet, folder: string, fileName: string, dataUrl: string): Promise<string> {
  const { blob } = dataUrlToBlob(dataUrl);
  try {
    const res = await jet.storage(STORAGE_RESOURCE, STORAGE_NAME).uploadFile({ path: folder, fileName, file: blob });
    return res.result.url;
  } catch (e) {
    // Storage not configured: keep the file inline so nothing is lost. Configure storage to avoid this.
    console.error('Storage upload failed, storing inline', e);
    return dataUrl;
  }
}

function clean(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (NUMBER_FIELDS.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : undefined;
  }
  if (MONEY_FIELDS.has(key)) {
    const n = Number(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
  }
  if (key === 'declaracion') return value === true;
  if (typeof value === 'string') return value.trim().slice(0, MAX_TEXT) || undefined;
  return undefined;
}

export async function handle(req: Request) {
  const input = readInput(req);

  for (const key of REQUIRED) {
    const v = input[key];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) throw new InputError(`missing_${key}`);
  }
  if (input.declaracion !== true) throw new InputError('missing_declaracion');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(input.email))) throw new InputError('invalid_email');

  const jet = Jet.fromServiceRequest(req);
  const submittedAt = new Date().toISOString();
  const folder = `preaprobacion/${submittedAt.slice(0, 10)}/${Date.now()}`;
  const record: Record<string, unknown> = {};

  for (const key of FIELD_KEYS) {
    const value = input[key];
    if (value === undefined) continue;

    if (key === 'licencia_fotos') {
      const files = (Array.isArray(value) ? value : []).slice(0, 4) as IncomingFile[];
      const urls: string[] = [];
      for (const [i, f] of files.entries()) {
        if (!f?.dataUrl) continue;
        const ext = f.type === 'application/pdf' ? 'pdf' : 'jpg';
        urls.push(await storeFile(jet, folder, `licencia-${i + 1}.${ext}`, f.dataUrl));
      }
      if (!urls.length) throw new InputError('missing_licencia_fotos');
      record.licencia_fotos = JSON.stringify(urls);
    } else if (key === 'firma') {
      record.firma = await storeFile(jet, folder, 'firma.png', String(value));
    } else if (key === 'familiares') {
      const rows = (Array.isArray(value) ? value : []).slice(0, 3).map((r: Record<string, unknown>) => ({
        nombre: String(r?.nombre ?? '').slice(0, 120),
        parentesco: String(r?.parentesco ?? '').slice(0, 60),
        direccion: String(r?.direccion ?? '').slice(0, 200),
        telefono: String(r?.telefono ?? '').slice(0, 20),
      }));
      record.familiares = JSON.stringify(rows);
    } else {
      const v = clean(key, value);
      if (v !== undefined) record[key] = v;
    }
  }

  record.status = 'new';
  record.submitted_at = submittedAt;

  const created = await jet.collection(RESOURCE, COLLECTION).create({ data: record });
  return { id: created.data.id, submitted_at: submittedAt };
}

export default async function handler(req: Request) {
  try {
    const result = await handle(req);
    return { success: true, result };
  } catch (e) {
    if (e instanceof InputError) return { success: false, error: e.message };
    console.error(e);
    return { success: false, error: 'server_error' };
  }
}
