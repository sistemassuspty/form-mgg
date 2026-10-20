# Jet Admin setup — Formulario de Pre-Aprobación

The code expects these pieces in the Jet project. Names must match exactly.

## 1. Table `jet_database` / `preapproval_applications`

Create these columns (all **nullable**; validation happens in the form and the workflow):

| Column | Type | Notes |
|---|---|---|
| `id` | auto id | primary key |
| `status` | text | `new`, `in_review`, `approved`, `rejected` — default `new` |
| `submitted_at` | datetime | set by the workflow |
| `admin_notes` | long text | internal notes from the admin panel |
| `auto_marca`, `auto_modelo` | text | vehicle of interest |
| `licencia_fotos` | long text | JSON array of file URLs |
| `nombre`, `apellidos` | text | |
| `fecha_nacimiento` | date | |
| `edad` | number | computed from the birth date |
| `telefono_celular`, `telefono_fijo` | text | `####-####` / `###-####` |
| `email` | text | |
| `nacionalidad`, `cedula` | text | |
| `estado_civil` | text | Soltero(a) · Casado(a) · Unido(a) · Divorciado(a) · Viudo(a) |
| `conyuge_nombre`, `conyuge_apellidos`, `conyuge_cedula`, `conyuge_nacionalidad`, `conyuge_celular`, `conyuge_email`, `conyuge_trabaja`, `conyuge_lugar_trabajo`, `conyuge_cargo`, `conyuge_tel_trabajo` | text | |
| `conyuge_edad` | number | |
| `conyuge_sueldo` | decimal | |
| `conyuge_fecha_ingreso` | date | |
| `dependientes_cantidad` | number | |
| `dependientes_edades` | text | |
| `familiares` | long text | JSON array `{nombre, parentesco, direccion, telefono}` |
| `vivienda_propia`, `dir_calle`, `dir_casa`, `dir_urbanizacion`, `provincia`, `distrito`, `corregimiento` | text | |
| `punto_referencia` | long text | |
| `tiene_vehiculo`, `vehiculo_marca`, `vehiculo_modelo` | text | |
| `vehiculo_ano` | number | |
| `ultimo_estudio`, `actualmente_estudia`, `instituto` | text | |
| `actualmente_trabaja`, `tipo_trabajo`, `taxi_tipo`, `taxi_empresa`, `plataforma_nombre`, `independiente_asalariado`, `ocupacion_independiente`, `asalariado_empresa` | text | |
| `fecha_inicio`, `asalariado_fecha_inicio` | date | |
| `plataforma_viajes`, `plataforma_puntos` | number | |
| `sueldo` | decimal | |
| `ant1_empresa`, `ant1_cargo`, `ant2_empresa`, `ant2_cargo` | text | |
| `ant1_sueldo`, `ant2_sueldo` | decimal | |
| `ant1_fecha_ingreso`, `ant1_fecha_salida`, `ant2_fecha_ingreso`, `ant2_fecha_salida` | date | |
| `firma` | long text | URL of the signature PNG |
| `declaracion` | boolean | applicant accepted the declaration |

## 2. Storage

The workflow uploads the licence photos and the signature to Jet storage
`STORAGE_RESOURCE` / `STORAGE_NAME` (top of the workflow file — default `jet_database` / `jet_storage`).
Change those two constants to your storage. If the upload fails, the file is saved inline in the
column as a data URL so nothing is lost, but storage keeps the table light.

## 3. Submit workflow `0616530a-6174-4026-a4fa-ef3f36c515f1`

Code: `backend/workflows/0616530a-6174-4026-a4fa-ef3f36c515f1/index.ts`.

- The public page posts the answers to `workflows/<id>/run` with **no login**, so the workflow must be
  runnable publicly (anonymous) and run with service permissions.
- It returns `{ success: true, result: { id, submitted_at } }` or `{ success: false, error }`.
- **Check the handler signature** against the file Jet generated originally (it wasn't in the repo).
  If it differs, keep Jet's wrapper and call `handle(req)` from it.

### Emails (add as steps after the code step in the Jet workflow editor)

1. **Notification** → `administracion1@mggpanama.com`, Reply-To = `email`, subject
   `Nueva solicitud de pre-aprobación — {nombre} {apellidos}`, body with the answers and a link to `/admin`.
2. **Auto-reply** → `{email}`, from name `MGG PANAMÁ`, Reply-To `ventasmggpanama@gmail.com`, subject
   `Hemos recibido tu solicitud 🚖 MGG Panamá`, body:
   > Gracias por completar tu solicitud con MGG Panamá 🙌. Nuestro equipo ya está revisando tu información
   > y muy pronto uno de nuestros asesores se pondrá en contacto contigo para guiarte en los siguientes
   > pasos. Te invitamos a visitar nuestra página web 👉 https://www.mggpanama.com/

## 4. Admin access

`/admin` signs in with `jet.auth.loginViaEmailPassword`. Invite the reviewers as users in Jet Admin and give
them read/update permission on `preapproval_applications`. The public form never reads the table.
