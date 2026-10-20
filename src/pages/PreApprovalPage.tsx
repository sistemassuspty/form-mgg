import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Loader2, Send } from 'lucide-react';
import { SiteHeader, MGG_LOGO, MGG_SITE } from '@/components/SiteHeader';
import { FieldInput } from '@/components/FieldInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { jet, SUBMIT_WORKFLOW_ID } from '@/lib/jet';
import {
  STEPS,
  buildSubmission,
  initialValues,
  isFieldVisible,
  isSectionVisible,
  validateStep,
  type FieldKey,
  type FormValues,
} from '@/lib/applicationSchema';

const DRAFT_KEY = 'mgg-preaprobacion-draft-v1';
/** Files and signature are too large for a draft; everything else is restored after a reload. */
const NOT_IN_DRAFT: FieldKey[] = ['licencia_fotos', 'firma'];

function loadDraft(): FormValues {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...initialValues(), ...(JSON.parse(raw) as FormValues) };
  } catch {
    /* storage unavailable */
  }
  return initialValues();
}

function saveDraft(values: FormValues) {
  try {
    const copy = { ...values };
    for (const k of NOT_IN_DRAFT) delete copy[k];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(copy));
  } catch {
    /* storage unavailable */
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* storage unavailable */
  }
}

export default function PreApprovalPage() {
  const [values, setValues] = useState<FormValues>(loadDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [done, setDone] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  useEffect(() => {
    const t = window.setTimeout(() => saveDraft(values), 400);
    return () => window.clearTimeout(t);
  }, [values]);

  const setValue = (key: FieldKey, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const errorCount = useMemo(() => Object.values(errors).filter(Boolean).length, [errors]);

  const scrollToFirstError = (errs: Partial<Record<FieldKey, string>>) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, canvas')?.focus({ preventScroll: true });
    });
  };

  const goTo = (index: number) => {
    setStepIndex(index);
    setErrors({});
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const next = () => {
    const errs = validateStep(step, values);
    setErrors(errs);
    if (Object.keys(errs).length) return scrollToFirstError(errs);
    goTo(stepIndex + 1);
  };

  const submit = async () => {
    // Re-validate every step; jump to the first one with a problem.
    for (let i = 0; i < STEPS.length; i++) {
      const errs = validateStep(STEPS[i], values);
      if (Object.keys(errs).length) {
        if (i !== stepIndex) setStepIndex(i);
        setErrors(errs);
        return scrollToFirstError(errs);
      }
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const response = await jet.workflow(SUBMIT_WORKFLOW_ID).execute({ data: buildSubmission(values) });
      if (!response.success) throw new Error(typeof response.error === 'string' ? response.error : 'workflow_error');
      clearDraft();
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      console.error('Submit failed', e);
      setSubmitError('No pudimos enviar su solicitud. Revise su conexión e intente de nuevo. Si el problema continúa, llámenos al 397-9424.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <ThankYou />;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10" ref={topRef}>
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Formulario de Pre-Aprobación de Vehículo</h1>
          <p className="text-muted-foreground">
            Por favor responda todas las preguntas de manera honesta y completa. Los campos con <span className="text-destructive">*</span> son
            obligatorios.
          </p>
        </div>

        <StepIndicator current={stepIndex} onSelect={(i) => i < stepIndex && goTo(i)} />

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) void submit();
            else next();
          }}
          className="mt-6 space-y-5"
        >
          {step.sections.map((section) =>
            isSectionVisible(section, values) ? (
              <Card key={section.id} className="p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) =>
                    isFieldVisible(section, field, values) ? (
                      <FieldInput
                        key={field.key}
                        field={field}
                        values={values}
                        error={errors[field.key]}
                        onChange={(v) => setValue(field.key, v)}
                      />
                    ) : null,
                  )}
                </div>
              </Card>
            ) : null,
          )}

          {errorCount > 0 && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorCount === 1 ? 'Hay 1 campo por corregir.' : `Hay ${errorCount} campos por corregir.`}
            </p>
          )}
          {submitError && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            {stepIndex > 0 ? (
              <Button type="button" variant="outline" size="lg" onClick={() => goTo(stepIndex - 1)} disabled={submitting}>
                <ArrowLeft /> Atrás
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="lg" disabled={submitting}>
              {isLast ? (
                submitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send /> Enviar solicitud
                  </>
                )
              ) : (
                <>
                  Seguir <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function StepIndicator({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Progreso">
      <p className="mb-2 text-sm text-muted-foreground">
        Paso {current + 1} de {STEPS.length}: <span className="font-medium text-foreground">{STEPS[current].title}</span>
      </p>
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              disabled={i >= current}
              aria-current={i === current ? 'step' : undefined}
              className="group w-full text-left disabled:cursor-default"
            >
              <span className={cn('block h-1.5 rounded-full', i <= current ? 'bg-primary' : 'bg-border')} />
              <span
                className={cn(
                  'mt-1.5 hidden text-xs sm:block',
                  i === current ? 'font-medium text-foreground' : 'text-muted-foreground',
                  i < current && 'group-hover:text-foreground group-hover:underline',
                )}
              >
                {s.short}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ThankYou() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-12">
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <CheckCircle2 className="size-12 text-[hsl(var(--success))]" />
          <h1 className="text-2xl font-semibold">¡Gracias por completar tu solicitud!</h1>
          <p className="text-muted-foreground">
            Nuestro equipo ya está revisando tu información y muy pronto uno de nuestros asesores se pondrá en contacto contigo para guiarte en
            los siguientes pasos.
          </p>
          <Button asChild size="lg" variant="outline">
            <a href={MGG_SITE} target="_blank" rel="noreferrer">
              <img src={MGG_LOGO} alt="" className="size-5 rounded" /> MGG PANAMÁ OFICIAL <ExternalLink />
            </a>
          </Button>
        </Card>
      </main>
    </div>
  );
}
