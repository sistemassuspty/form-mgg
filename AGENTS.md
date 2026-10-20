# Overview
Public Spanish-language vehicle pre-approval form (recreated from a Jotform) plus a login-protected admin panel to review applications.

# Stack
React + Vite + TypeScript, Tailwind, shadcn/ui, react-router-dom, date-fns (es locale), @jet-admin/jet-sdk.

# Structure
- src/pages/PreApprovalPage.tsx: public 4-step form at `/`.
- src/pages/AdminPage.tsx: login + applications table at `/admin`.
- src/lib/applicationSchema.ts: step/field config and validation (single source of truth for form fields).
- src/lib/applications.ts: record mapping, status options, money formatting.
- src/components: FieldInput, DatePickerField, LoginCard, ApplicationDialog, SiteHeader.

# Data
- Table: Jet Tables `jet_database` / `preapproval_applications` (status values: new, in_review, approved, rejected).
- Public submit goes through workflow `0616530a-6174-4026-a4fa-ef3f36c515f1` (backend/workflows/<id>/index.ts), which validates and creates the record with service permissions.
- Admin panel reads/updates the collection directly after `jet.auth.loginViaEmailPassword`; users are invited via Jet Admin.

# Conventions
- UI text in Spanish. Semantic color tokens, light/dark follows system preference (class toggled in main.tsx).
- To add a form field: add column in table, add to FieldKey/STEPS in applicationSchema.ts, and to workflow field lists.

# Gotchas
- Collection list/update require authentication; the public form must never call the collection directly.
