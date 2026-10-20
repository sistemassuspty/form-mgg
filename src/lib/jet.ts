import { Jet } from '@jet-admin/jet-sdk';

/** Jet client. Project/environment come from the VITE_JET_* variables Jet Admin injects. */
export const jet = new Jet({ env: import.meta.env as unknown as Record<string, string> });

export const RESOURCE = 'jet_database';
export const COLLECTION = 'preapproval_applications';

/** Public submissions go through this workflow (service permissions). Never write to the collection from the public form. */
export const SUBMIT_WORKFLOW_ID = '0616530a-6174-4026-a4fa-ef3f36c515f1';

export const applications = () => jet.collection(RESOURCE, COLLECTION);
