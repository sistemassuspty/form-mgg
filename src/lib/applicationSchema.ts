/**
 * Single source of truth for the pre-approval form.
 * Recreated from the Jotform "Formulario de Pre-Aprobación de Vehículo" (ID 252665299967883).
 *
 * To add a field: add the column to the Jet table, add it here (FieldKey + STEPS),
 * and add it to FIELD_KEYS in the submit workflow.
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'money'
  | 'email'
  | 'phone'
  | 'date'
  | 'select'
  | 'radio'
  | 'textarea'
  | 'files'
  | 'signature'
  | 'relatives'
  | 'consent';

export type FormValues = Record<string, unknown>;

export interface FieldDef {
  key: FieldKey;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  help?: string;
  /** half = two per row on wide screens */
  width?: 'half' | 'full';
  /** letters and spaces only */
  lettersOnly?: boolean;
  /** phone: allow 7-digit landlines as well as 8-digit mobiles */
  allowLandline?: boolean;
  /** computed from other values and shown read-only */
  readOnly?: boolean;
  visibleIf?: (v: FormValues) => boolean;
}

export interface SectionDef {
  id: string;
  title: string;
  description?: string;
  visibleIf?: (v: FormValues) => boolean;
  fields: FieldDef[];
}

export interface StepDef {
  id: string;
  title: string;
  short: string;
  sections: SectionDef[];
}

export const FIELD_KEYS = [
  // Auto de interés
  'auto_marca', 'auto_modelo',
  // Solicitante
  'licencia_fotos', 'nombre', 'apellidos', 'fecha_nacimiento', 'edad', 'telefono_celular', 'telefono_fijo',
  'email', 'nacionalidad', 'cedula', 'estado_civil',
  // Cónyuge
  'conyuge_nombre', 'conyuge_apellidos', 'conyuge_edad', 'conyuge_cedula', 'conyuge_nacionalidad',
  'conyuge_celular', 'conyuge_trabaja', 'conyuge_email', 'conyuge_lugar_trabajo', 'conyuge_cargo',
  'conyuge_sueldo', 'conyuge_fecha_ingreso', 'conyuge_tel_trabajo',
  // Dependientes
  'dependientes_cantidad', 'dependientes_edades', 'familiares',
  // Vivienda
  'vivienda_propia', 'dir_calle', 'dir_casa', 'dir_urbanizacion', 'provincia', 'distrito', 'corregimiento',
  'punto_referencia',
  // Vehículo propio
  'tiene_vehiculo', 'vehiculo_marca', 'vehiculo_modelo', 'vehiculo_ano',
  // Estudios
  'ultimo_estudio', 'actualmente_estudia', 'instituto',
  // Trabajo
  'actualmente_trabaja', 'tipo_trabajo', 'taxi_tipo', 'taxi_empresa', 'fecha_inicio', 'plataforma_nombre',
  'plataforma_viajes', 'plataforma_puntos', 'independiente_asalariado', 'ocupacion_independiente',
  'asalariado_empresa', 'asalariado_fecha_inicio', 'sueldo',
  // Empleos anteriores
  'ant1_empresa', 'ant1_cargo', 'ant1_sueldo', 'ant1_fecha_ingreso', 'ant1_fecha_salida',
  'ant2_empresa', 'ant2_cargo', 'ant2_sueldo', 'ant2_fecha_ingreso', 'ant2_fecha_salida',
  // Cierre
  'firma', 'declaracion',
] as const;

export type FieldKey = (typeof FIELD_KEYS)[number];

/* ------------------------------------------------------------------ options */

export const SI_NO = ['SI', 'NO'] as const;

export const ESTADO_CIVIL = ['Soltero(a)', 'Casado(a)', 'Unido(a)', 'Divorciado(a)', 'Viudo(a)'] as const;

export const PROVINCIAS = ['PANAMÁ', 'PANAMÁ OESTE', 'PANAMÁ ESTE'] as const;

export const DISTRITOS = ['San Miguelito', 'Balboa', 'Chepo', 'Chimán', 'Panamá', 'Taboga'] as const;

export const CORREGIMIENTOS = [
  '24 de Diciembre', 'Alcalde Díaz', 'Amelia Denis de Icaza', 'Ancón', 'Arnulfo Arias', 'Belisario Frías',
  'Belisario Porras', 'Brujas', 'Caimitillo', 'Cañita', 'Chepillo', 'Chepo (Cabecera)', 'Chilibre',
  'Chimán (Cabecera)', 'Comarca Kuna de Madungandí', 'Curundú', 'El Llano', 'Ernesto Córdoba Campos',
  'Gonzalo Vásquez', 'Juan Díaz', 'La Esmeralda', 'La Guinea', 'Las Garzas', 'Las Mañanitas', 'Las Margaritas',
  'Mateo Iturralde (Cabecera)', 'Omar Torrijos', 'Otoque Occidente', 'Pásiga', 'Pedregal', 'Pedro González',
  'San Martín', 'San Miguel (Cabecera)', 'Santa Cruz de Chinina', 'Tocumen', 'Tortí', 'Unión Santeña',
  'Victoriano Lorenzo',
] as const;

export const NIVEL_ESTUDIO = ['Primaria', 'Premedia', 'Media', 'Superior'] as const;

export const TIPO_TRABAJO = {
  taxi: 'TAXI',
  plataforma: 'PLATAFORMA (UBER / INDRIVE / OTRO)',
  otro: 'OTRO TIPO DE EMPLEO',
} as const;

export const TAXI_TIPO = ['TAXI PROPIO', 'TAXI DE EMPRESA'] as const;

export const INDEP_ASAL = ['INDEPENDIENTE', 'ASALARIADO'] as const;

export const RELATIVE_ROWS = 3;

export interface Relative {
  nombre: string;
  parentesco: string;
  direccion: string;
  telefono: string;
}

/* ------------------------------------------------------- visibility rules */

const eq = (key: FieldKey, value: string) => (v: FormValues) => v[key] === value;

const isMarried = (v: FormValues) => v.estado_civil === 'Casado(a)' || v.estado_civil === 'Unido(a)';
const spouseWorks = (v: FormValues) => isMarried(v) && v.conyuge_trabaja === 'SI';
const works = eq('actualmente_trabaja', 'SI');
const tipo = (t: string) => (v: FormValues) => works(v) && v.tipo_trabajo === t;
const isTaxi = tipo(TIPO_TRABAJO.taxi);
const isPlatform = tipo(TIPO_TRABAJO.plataforma);
const isOther = tipo(TIPO_TRABAJO.otro);
const isIndependent = (v: FormValues) => isOther(v) && v.independiente_asalariado === 'INDEPENDIENTE';
const isSalaried = (v: FormValues) => isOther(v) && v.independiente_asalariado === 'ASALARIADO';

/** Previous job #1: shown when not working, for platform drivers and for salaried employees. */
export const showPreviousJob1 = (v: FormValues) =>
  v.actualmente_trabaja === 'NO' || isPlatform(v) || isSalaried(v);
/** Previous job #2 (optional): only when not currently working. */
export const showPreviousJob2 = eq('actualmente_trabaja', 'NO');

/* ------------------------------------------------------------------ steps */

export const STEPS: StepDef[] = [
  {
    id: 'solicitante',
    title: 'Datos del solicitante',
    short: 'Solicitante',
    sections: [
      {
        id: 'auto',
        title: 'Auto de interés',
        description: 'Indique el auto en el cual está interesado.',
        fields: [
          { key: 'auto_marca', label: 'Marca', type: 'text', required: true, width: 'half' },
          { key: 'auto_modelo', label: 'Modelo', type: 'text', required: true, width: 'half' },
        ],
      },
      {
        id: 'solicitante',
        title: 'Datos del solicitante',
        fields: [
          {
            key: 'licencia_fotos',
            label: 'Tome una foto de su licencia de conducir',
            type: 'files',
            required: true,
            help: 'Frente y reverso. Imágenes o PDF, máximo 10 MB por archivo.',
          },
          { key: 'nombre', label: 'Nombre', type: 'text', required: true, width: 'half' },
          { key: 'apellidos', label: 'Apellidos', type: 'text', required: true, width: 'half' },
          { key: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', required: true, width: 'half' },
          { key: 'edad', label: 'Edad', type: 'number', readOnly: true, width: 'half', help: 'Se calcula con su fecha de nacimiento.' },
          { key: 'telefono_celular', label: 'Teléfono celular', type: 'phone', required: true, width: 'half', placeholder: '6000-0000' },
          { key: 'telefono_fijo', label: 'Teléfono fijo', type: 'phone', allowLandline: true, width: 'half', placeholder: '000-0000' },
          { key: 'email', label: 'Correo electrónico', type: 'email', required: true, placeholder: 'ejemplo@gmail.com' },
          { key: 'nacionalidad', label: 'Nacionalidad', type: 'text', required: true, lettersOnly: true, width: 'half' },
          { key: 'cedula', label: 'Cédula', type: 'text', width: 'half', placeholder: 'X-XXX-XXXX' },
          { key: 'estado_civil', label: 'Estado civil', type: 'select', required: true, options: ESTADO_CIVIL },
        ],
      },
      {
        id: 'conyuge',
        title: 'Datos del cónyuge',
        visibleIf: isMarried,
        fields: [
          { key: 'conyuge_nombre', label: 'Nombre', type: 'text', required: true, width: 'half' },
          { key: 'conyuge_apellidos', label: 'Apellidos', type: 'text', required: true, width: 'half' },
          { key: 'conyuge_edad', label: 'Edad', type: 'number', required: true, width: 'half' },
          { key: 'conyuge_cedula', label: 'Cédula', type: 'text', required: true, width: 'half', placeholder: 'X-XXX-XXXX' },
          { key: 'conyuge_nacionalidad', label: 'Nacionalidad', type: 'text', required: true, lettersOnly: true, width: 'half' },
          { key: 'conyuge_celular', label: 'Teléfono celular', type: 'phone', required: true, width: 'half', placeholder: '6000-0000' },
          { key: 'conyuge_email', label: 'Correo electrónico', type: 'email', required: true, placeholder: 'ejemplo@gmail.com' },
          { key: 'conyuge_trabaja', label: '¿El cónyuge trabaja actualmente?', type: 'radio', required: true, options: SI_NO },
          { key: 'conyuge_lugar_trabajo', label: 'Nombre de lugar de trabajo', type: 'text', required: true, visibleIf: spouseWorks },
          { key: 'conyuge_cargo', label: 'Cargo', type: 'text', required: true, width: 'half', visibleIf: spouseWorks },
          { key: 'conyuge_sueldo', label: 'Sueldo', type: 'money', required: true, width: 'half', visibleIf: spouseWorks },
          { key: 'conyuge_fecha_ingreso', label: 'Fecha de ingreso', type: 'date', required: true, width: 'half', visibleIf: spouseWorks },
          { key: 'conyuge_tel_trabajo', label: 'Teléfono de trabajo', type: 'phone', allowLandline: true, width: 'half', visibleIf: spouseWorks },
        ],
      },
    ],
  },
  {
    id: 'hogar',
    title: 'Familia, vivienda y vehículo',
    short: 'Hogar',
    sections: [
      {
        id: 'dependientes',
        title: 'Dependientes',
        fields: [
          { key: 'dependientes_cantidad', label: 'Cantidad de dependientes', type: 'number', required: true, width: 'half', placeholder: '0' },
          {
            key: 'dependientes_edades',
            label: 'Edad(es)',
            type: 'text',
            width: 'half',
            placeholder: 'Ej.: 4, 9, 15',
            required: true,
            visibleIf: (v) => Number(v.dependientes_cantidad) > 0,
          },
          {
            key: 'familiares',
            label: 'Familiares que no vivan con usted',
            type: 'relatives',
            help: 'Al menos una referencia familiar. Complete nombre, parentesco y teléfono.',
            required: true,
          },
        ],
      },
      {
        id: 'vivienda',
        title: 'Vivienda',
        fields: [
          { key: 'vivienda_propia', label: '¿Cuenta con vivienda propia?', type: 'radio', required: true, options: SI_NO },
          { key: 'dir_calle', label: 'Avenida / Calle', type: 'text', required: true },
          { key: 'dir_casa', label: 'Casa / Edificio / N° / Apartamento / Piso', type: 'text', width: 'half' },
          { key: 'dir_urbanizacion', label: 'Urbanización / Barriada', type: 'text', required: true, width: 'half' },
          { key: 'provincia', label: 'Provincia', type: 'select', required: true, options: PROVINCIAS, width: 'half' },
          { key: 'distrito', label: 'Distrito', type: 'select', required: true, options: DISTRITOS, width: 'half' },
          { key: 'corregimiento', label: 'Corregimiento', type: 'select', required: true, options: CORREGIMIENTOS },
          { key: 'punto_referencia', label: 'Punto de referencia', type: 'textarea' },
        ],
      },
      {
        id: 'vehiculo',
        title: 'Descripción de vehículo',
        fields: [
          { key: 'tiene_vehiculo', label: '¿Tiene vehículo propio?', type: 'radio', required: true, options: SI_NO },
          { key: 'vehiculo_marca', label: 'Marca', type: 'text', width: 'half', visibleIf: eq('tiene_vehiculo', 'SI') },
          { key: 'vehiculo_modelo', label: 'Modelo', type: 'text', width: 'half', visibleIf: eq('tiene_vehiculo', 'SI') },
          { key: 'vehiculo_ano', label: 'Año', type: 'number', width: 'half', placeholder: 'Ej.: 2018', visibleIf: eq('tiene_vehiculo', 'SI') },
        ],
      },
    ],
  },
  {
    id: 'trabajo',
    title: 'Estudios y trabajo',
    short: 'Trabajo',
    sections: [
      {
        id: 'estudios',
        title: 'Nivel de instrucción',
        fields: [
          { key: 'ultimo_estudio', label: '¿Cuál fue su último año de estudio?', type: 'select', options: NIVEL_ESTUDIO },
          { key: 'actualmente_estudia', label: '¿Actualmente estudia?', type: 'radio', required: true, options: SI_NO },
          { key: 'instituto', label: 'Nombre de instituto en que estudia o estudió', type: 'text', required: true },
        ],
      },
      {
        id: 'laboral',
        title: 'Información laboral',
        fields: [
          { key: 'actualmente_trabaja', label: '¿Actualmente trabaja?', type: 'radio', required: true, options: SI_NO },
          {
            key: 'tipo_trabajo',
            label: 'Tipo de trabajo',
            type: 'select',
            required: true,
            options: [TIPO_TRABAJO.taxi, TIPO_TRABAJO.plataforma, TIPO_TRABAJO.otro],
            visibleIf: works,
          },
          { key: 'taxi_tipo', label: '¿Taxi propio o de empresa?', type: 'select', required: true, options: TAXI_TIPO, visibleIf: isTaxi },
          {
            key: 'taxi_empresa',
            label: 'Nombre de la empresa',
            type: 'text',
            required: true,
            visibleIf: (v) => isTaxi(v) && v.taxi_tipo === 'TAXI DE EMPRESA',
          },
          { key: 'plataforma_nombre', label: 'Nombre de la plataforma', type: 'text', required: true, visibleIf: isPlatform },
          {
            key: 'fecha_inicio',
            label: 'Fecha de inicio',
            type: 'date',
            required: true,
            visibleIf: (v) => isTaxi(v) || isPlatform(v),
          },
          { key: 'plataforma_viajes', label: 'Cantidad de viajes', type: 'number', width: 'half', visibleIf: isPlatform },
          { key: 'plataforma_puntos', label: 'Puntos', type: 'number', width: 'half', visibleIf: isPlatform },
          {
            key: 'independiente_asalariado',
            label: '¿Es usted independiente o asalariado?',
            type: 'select',
            required: true,
            options: INDEP_ASAL,
            visibleIf: isOther,
          },
          {
            key: 'ocupacion_independiente',
            label: 'Especifique su trabajo / ocupación',
            type: 'text',
            required: true,
            visibleIf: isIndependent,
          },
          { key: 'asalariado_empresa', label: 'Nombre de la empresa', type: 'text', required: true, visibleIf: isSalaried },
          { key: 'asalariado_fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true, width: 'half', visibleIf: isSalaried },
          { key: 'sueldo', label: '¿Cuál es su sueldo?', type: 'money', required: true, width: 'half', visibleIf: isSalaried },
        ],
      },
    ],
  },
  {
    id: 'cierre',
    title: 'Empleos anteriores y firma',
    short: 'Firma',
    sections: [
      {
        id: 'anterior1',
        title: 'Empleo anterior',
        visibleIf: showPreviousJob1,
        fields: [
          { key: 'ant1_empresa', label: 'Nombre de la empresa', type: 'text', required: true },
          { key: 'ant1_cargo', label: 'Cargo', type: 'text', required: true, width: 'half' },
          { key: 'ant1_sueldo', label: 'Sueldo', type: 'money', required: true, width: 'half' },
          { key: 'ant1_fecha_ingreso', label: 'Fecha de ingreso', type: 'date', required: true, width: 'half' },
          { key: 'ant1_fecha_salida', label: 'Fecha de salida', type: 'date', required: true, width: 'half' },
        ],
      },
      {
        id: 'anterior2',
        title: 'Empleo anterior (2)',
        description: 'Opcional.',
        visibleIf: showPreviousJob2,
        fields: [
          { key: 'ant2_empresa', label: 'Nombre de la empresa', type: 'text' },
          { key: 'ant2_cargo', label: 'Cargo', type: 'text', width: 'half' },
          { key: 'ant2_sueldo', label: 'Sueldo', type: 'money', width: 'half' },
          { key: 'ant2_fecha_ingreso', label: 'Fecha de ingreso', type: 'date', width: 'half' },
          { key: 'ant2_fecha_salida', label: 'Fecha de salida', type: 'date', width: 'half' },
        ],
      },
      {
        id: 'firma',
        title: 'Firma del solicitante',
        fields: [
          { key: 'firma', label: 'Firme aquí', type: 'signature', required: true, help: 'Use el dedo o el mouse.' },
          {
            key: 'declaracion',
            label: 'Declaro que la información suministrada es verdadera y autorizo a MGG Panamá a verificarla.',
            type: 'consent',
            required: true,
          },
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------------- helpers */

export const ALL_FIELDS: FieldDef[] = STEPS.flatMap((s) => s.sections.flatMap((sec) => sec.fields));

export function isSectionVisible(section: SectionDef, values: FormValues) {
  return section.visibleIf ? section.visibleIf(values) : true;
}

export function isFieldVisible(section: SectionDef, field: FieldDef, values: FormValues) {
  return isSectionVisible(section, values) && (field.visibleIf ? field.visibleIf(values) : true);
}

export function visibleFieldKeys(values: FormValues): Set<FieldKey> {
  const keys = new Set<FieldKey>();
  for (const step of STEPS)
    for (const section of step.sections)
      for (const field of section.fields) if (isFieldVisible(section, field, values)) keys.add(field.key);
  return keys;
}

export function emptyRelatives(): Relative[] {
  return Array.from({ length: RELATIVE_ROWS }, () => ({ nombre: '', parentesco: '', direccion: '', telefono: '' }));
}

export function initialValues(): FormValues {
  return { familiares: emptyRelatives(), licencia_fotos: [] };
}

/** Age in whole years from an ISO date (YYYY-MM-DD). */
export function ageFrom(iso: unknown): number | '' {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : '';
}

export function formatPhone(raw: string, allowLandline?: boolean): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (allowLandline && digits.length === 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

const isBlank = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

export function validateField(field: FieldDef, values: FormValues): string | null {
  const value = values[field.key];

  if (field.type === 'relatives') {
    const rows = (value as Relative[] | undefined) ?? [];
    const filled = rows.filter((r) => r.nombre.trim() || r.parentesco.trim() || r.telefono.trim() || r.direccion.trim());
    if (field.required && filled.length === 0) return 'Agregue al menos un familiar.';
    for (const r of filled) {
      if (!r.nombre.trim() || !r.parentesco.trim() || !r.telefono.trim())
        return 'Complete nombre, parentesco y teléfono en cada familiar que agregue.';
      if (r.telefono.replace(/\D/g, '').length < 7) return 'Revise el teléfono de los familiares.';
    }
    return null;
  }

  if (field.type === 'consent') return field.required && value !== true ? 'Debe aceptar para continuar.' : null;
  if (field.readOnly) return null;
  if (isBlank(value)) return field.required ? 'Este campo es obligatorio.' : null;

  const str = typeof value === 'string' ? value.trim() : String(value);
  switch (field.type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str) ? null : 'Introduzca un correo electrónico válido.';
    case 'phone': {
      const n = str.replace(/\D/g, '').length;
      if (n === 8 || (field.allowLandline && n === 7)) return null;
      return field.allowLandline ? 'Use 7 u 8 dígitos.' : 'Use 8 dígitos (####-####).';
    }
    case 'number':
      if (!/^\d+$/.test(str)) return 'Solo números enteros.';
      if (field.key === 'vehiculo_ano') {
        const y = Number(str);
        if (y < 1950 || y > new Date().getFullYear() + 1) return 'Año no válido.';
      }
      return null;
    case 'money':
      return /^\d+(\.\d{1,2})?$/.test(str.replace(/,/g, '')) ? null : 'Escriba un monto válido, ej.: 850.00';
    case 'date': {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return 'Fecha no válida.';
      const today = new Date().toISOString().slice(0, 10);
      if (str > today) return 'La fecha no puede ser futura.';
      if (field.key === 'fecha_nacimiento') {
        const age = ageFrom(str);
        if (age === '' || age < 18) return 'Debe ser mayor de 18 años.';
      }
      if (field.key.endsWith('_fecha_salida')) {
        const start = values[field.key.replace('_salida', '_ingreso') as FieldKey];
        if (typeof start === 'string' && start && str < start) return 'La salida debe ser posterior al ingreso.';
      }
      return null;
    }
    case 'text':
      if (field.lettersOnly && !/^[\p{L}\s.'-]+$/u.test(str)) return 'Solo letras.';
      return null;
    default:
      return null;
  }
}

/** Errors for the visible fields of one step. */
export function validateStep(step: StepDef, values: FormValues): Partial<Record<FieldKey, string>> {
  const errors: Partial<Record<FieldKey, string>> = {};
  for (const section of step.sections) {
    for (const field of section.fields) {
      if (!isFieldVisible(section, field, values)) continue;
      const error = validateField(field, values);
      if (error) errors[field.key] = error;
    }
  }
  return errors;
}

/** Only the visible, non-empty values — hidden answers are never submitted. */
export function buildSubmission(values: FormValues): Partial<Record<FieldKey, unknown>> {
  const visible = visibleFieldKeys(values);
  const out: Partial<Record<FieldKey, unknown>> = {};
  for (const key of FIELD_KEYS) {
    if (!visible.has(key)) continue;
    let value = values[key];
    if (key === 'edad') value = ageFrom(values.fecha_nacimiento);
    if (key === 'familiares') {
      value = ((value as Relative[]) ?? []).filter((r) => r.nombre.trim() || r.telefono.trim());
    }
    if (isBlank(value)) continue;
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}
