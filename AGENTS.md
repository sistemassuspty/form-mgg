# Overview
Public Spanish-language vehicle pre-approval form for MGG Panamá (recreated from Jotform form 252665299967883) plus a login-protected admin panel to review applications.

# Stack
React + Vite + TypeScript, Tailwind, react-router-dom, lucide-react, radix (dialog, label, slot), @jet-admin/jet-sdk.

# Structure
- src/pages/PreApprovalPage.tsx: public 4-step form at `/` (Solicitante → Hogar → Trabajo → Firma). Draft autosaves to localStorage (except files/signature).
- src/pages/AdminPage.tsx: login + applications list (search, status filter, pagination) at `/admin`.
- src/lib/applicationSchema.ts: steps, sections, fields, options, visibility rules and validation — single source of truth.
- src/lib/applications.ts: record mapping, status options, money/date formatting, detail sections.
- src/lib/files.ts: licence photo picking + client-side compression (sent as data URLs).
- src/lib/jet.ts: Jet client, collection and workflow ids.
- src/components: FieldInput (all field types), SignaturePad, SiteHeader, LoginCard, ApplicationDialog, ui/*.
- backend/workflows/0616530a-…/index.ts: submit workflow (whitelist, checks, file upload, create record).
- docs/JET_SETUP.md: table columns, storage, workflow and email setup.

# Data
- Table: Jet Tables `jet_database` / `preapproval_applications` (status: new, in_review, approved, rejected; plus submitted_at, admin_notes).
- `familiares` and `licencia_fotos` are JSON strings; `firma` is a file URL.
- Public submit goes through workflow `0616530a-6174-4026-a4fa-ef3f36c515f1`, which validates and creates the record with service permissions.
- Admin panel reads/updates the collection directly after `jet.auth.loginViaEmailPassword`; users are invited via Jet Admin.

# Visibility rules (applicationSchema.ts)
- Spouse section: estado_civil is Casado(a) or Unido(a); spouse job fields only if conyuge_trabaja = SI.
- dependientes_edades: only if dependientes_cantidad > 0.
- Vehicle details: tiene_vehiculo = SI.
- tipo_trabajo: actualmente_trabaja = SI. TAXI → taxi_tipo (+ taxi_empresa if TAXI DE EMPRESA) + fecha_inicio. PLATAFORMA → plataforma_nombre, fecha_inicio, viajes, puntos. OTRO → independiente_asalariado → ocupacion (INDEPENDIENTE) or empresa/fecha/sueldo (ASALARIADO).
- Previous job 1: not working, PLATAFORMA, or ASALARIADO. Previous job 2 (optional): not working.
- Hidden fields are not validated and are dropped from the submission.

# Conventions
- UI text in Spanish. Semantic color tokens in index.css; light/dark follows system preference (class toggled in main.tsx).
- To add a form field: add the column in the table, add it to FIELD_KEYS and STEPS in applicationSchema.ts, and to FIELD_KEYS in the workflow.

# Gotchas
- Collection list/update require authentication; the public form must never call the collection directly.
- Radio groups have no element with id `f-<key>`; target `[data-field=<key>]` in tests.
