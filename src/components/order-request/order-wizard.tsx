import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, InfoIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useId, useReducer, useRef, useState } from "react";

import { Button } from "#/components/ck/button";
import { Eyebrow, Price } from "#/components/ck/primitives";
import { StepIndicator } from "#/components/ck/step-indicator";
import { formatPrice } from "#/lib/format";
import { useI18n } from "#/lib/i18n";
import { roundEstimate } from "#/lib/order-request/estimate";
import { isBookableDate } from "#/lib/order-request/schedule";
import type { OrderRequestResult } from "#/lib/order-request/schema";
import { $submitOrderRequest } from "#/lib/server/orders";
import { site } from "#/lib/site";
import { cn } from "#/lib/utils";

import { saveConfirmation } from "./confirmation";
import {
  emptyState,
  estimateFor,
  firstInvalidStep,
  hasPrefill,
  leadHoursFor,
  type OrderRequestOptions,
  type Prefill,
  prefilledState,
  reducer,
  type StepErrors,
  type StepKey,
  stepsFor,
  toPayload,
  validateStep,
  type WizardState,
  wizardStateSchema,
} from "./state";
import {
  CakeStep,
  ContactStep,
  DecorStep,
  DessertStep,
  EventStep,
  KindStep,
  ScheduleStep,
} from "./steps";
import { itemLines, OrderSummary } from "./summary";
import { usePhotoAttachments } from "./use-photo-attachments";

const DRAFT_KEY = "ck-order-draft-v1";

/** Entwurf aus sessionStorage (ohne Fotos). Veraltete Termine werden verworfen. */
function readDraft(options: OrderRequestOptions): WizardState | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = wizardStateSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const draft = parsed.data;
    const kind = draft.kind ?? "cake";
    if (draft.date && !isBookableDate(draft.date, kind, leadHoursFor(draft, options), new Date())) {
      return { ...draft, date: null, time: null };
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ohne Speicher gibt es auch keinen Entwurf
  }
}

/** Fokus auf das erste Bedienelement eines Feldes (Felder tragen `data-field`). */
function focusField(field: string) {
  const root = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(field)}"]`);
  const target = root?.querySelector<HTMLElement>(
    "input:not([type=hidden]):not([disabled]), select, textarea, button",
  );
  (target ?? root)?.focus();
}

export function OrderWizard({
  options,
  prefill,
  step,
  hasPrefillParams,
  onNavigate,
  onSuccess,
}: {
  options: OrderRequestOptions;
  prefill: Prefill;
  step: StepKey | undefined;
  hasPrefillParams: boolean;
  onNavigate: (step: StepKey, mode: "push" | "replace") => void;
  onSuccess: (orderNo: string) => void;
}) {
  const { t, locale } = useI18n();
  const f = t.orderForm;
  const queryClient = useQueryClient();

  const [initial] = useState(() => {
    if (hasPrefill(prefill)) return { state: prefilledState(prefill, options), restored: false };
    const draft = readDraft(options);
    return draft ? { state: draft, restored: true } : { state: emptyState(), restored: false };
  });
  const [state, dispatch] = useReducer(reducer, initial.state);
  const [meta] = useState(() => ({ submissionId: crypto.randomUUID(), startedAt: Date.now() }));
  const [website, setWebsite] = useState("");
  const [attempted, setAttempted] = useState<Partial<Record<StepKey, boolean>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const photos = usePhotoAttachments();

  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const wizardRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Schritt aus der URL, aber nie über die erste offene Pflichtangabe hinaus.
  const now = new Date();
  const steps = stepsFor(state.kind);
  const firstInvalid = firstInvalidStep(state, options, now);
  const maxIndex = firstInvalid === -1 ? steps.length - 1 : firstInvalid;
  const requestedIndex = step ? steps.indexOf(step) : -1;
  const currentIndex = Math.min(
    requestedIndex === -1 ? (state.kind ? 1 : 0) : requestedIndex,
    maxIndex,
  );
  const currentStep = steps[currentIndex] ?? "anlass";
  const isLast = currentIndex === steps.length - 1;

  const stepErrors = validateStep(currentStep, state, options, now);
  const shownErrors: StepErrors = attempted[currentStep] ? stepErrors : {};
  const shownErrorFields = Object.keys(shownErrors);
  const estimate = estimateFor(state, options);

  // URL nachziehen (Schritt korrigiert, Vorbelegung aus dem Link entfernt).
  useEffect(() => {
    if (step !== currentStep || hasPrefillParams) onNavigate(currentStep, "replace");
  }, [step, currentStep, hasPrefillParams, onNavigate]);

  // Entwurf sichern, damit ein Neuladen nichts verliert (Fotos ausgenommen).
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch {
      // privater Modus: dann eben ohne Entwurf
    }
  }, [state]);

  // Beim Schrittwechsel: Überschrift fokussieren und den Wizard ins Bild holen.
  const shownStep = useRef(currentStep);
  useEffect(() => {
    if (shownStep.current === currentStep) return;
    shownStep.current = currentStep;
    headingRef.current?.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    wizardRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [currentStep]);

  function showStepErrors(key: StepKey, errors: StepErrors) {
    setAttempted((current) => ({ ...current, [key]: true }));
    const fields = Object.keys(errors);
    if (key !== currentStep) {
      onNavigate(key, "push");
      return;
    }
    setTimeout(() => {
      if (fields.length > 1) summaryRef.current?.focus();
      else if (fields[0]) focusField(fields[0]);
    }, 0);
  }

  function goNext() {
    setServerError(null);
    const errors = validateStep(currentStep, state, options, new Date());
    if (Object.keys(errors).length > 0) {
      showStepErrors(currentStep, errors);
      return;
    }
    const nextStep = steps[currentIndex + 1];
    if (nextStep) onNavigate(nextStep, "push");
  }

  function goBack() {
    const previous = steps[currentIndex - 1];
    if (previous) onNavigate(previous, "push");
  }

  function startOver() {
    clearDraft();
    for (const photo of photos.photos) photos.remove(photo.id);
    setAttempted({});
    setServerError(null);
    dispatch({ type: "reset" });
    onNavigate("anlass", "push");
  }

  const photoStep: StepKey = state.kind === "event" ? "feier" : "dekor";
  const dateStep: StepKey = state.kind === "event" ? "feier" : "termin";

  function stepForField(field: string | undefined): StepKey {
    if (!field) return currentStep;
    if (field === "desiredDate") return dateStep;
    if (["desiredTime", "fulfilment", "street", "zip", "city"].includes(field)) return "termin";
    if (field.startsWith("items")) return state.kind === "dessert" ? "desserts" : "torte";
    if (field === "eventType" || field === "guestCount") return "feier";
    if (field.startsWith("decor")) return photoStep;
    return "kontakt";
  }

  function handleFailure(result: Extract<OrderRequestResult, { ok: false }>) {
    const s = f.serverErrors;
    let target: StepKey = currentStep;
    let message: string = s.generic;
    switch (result.code) {
      case "VALIDATION":
        target = stepForField(result.field);
        break;
      case "SLOT_DATE":
        target = dateStep;
        message = s.date;
        dispatch({ type: "patch", patch: { time: null } });
        break;
      case "SLOT_TIME":
        target = "termin";
        message = s.time;
        dispatch({ type: "patch", patch: { time: null } });
        break;
      case "FILLING_UNAVAILABLE":
      case "PRODUCT_UNAVAILABLE":
        target = state.kind === "dessert" ? "desserts" : "torte";
        message = s.unavailable;
        void queryClient.invalidateQueries({ queryKey: ["order-request-options"] });
        break;
      case "INVALID_IMAGE":
        target = photoStep;
        message = s.image((result.index ?? 0) + 1);
        break;
      case "TOO_MANY_FILES":
        target = photoStep;
        message = f.photos.errors.count(site.shop.upload.maxFiles);
        break;
      case "RATE_LIMITED":
        message = s.rateLimited;
        break;
    }
    setServerError(message);
    if (steps.includes(target) && target !== currentStep) onNavigate(target, "push");
  }

  const mutation = useMutation({
    mutationFn: (formData: FormData) => $submitOrderRequest({ data: formData }),
    onSuccess: (result, _formData) => {
      if (!result.ok) {
        handleFailure(result);
        return;
      }
      saveConfirmation(result.orderNo, {
        kind: state.kind ?? "cake",
        date: state.date ?? "",
        time: state.kind === "event" ? null : state.time,
        fulfilment: state.kind === "event" ? null : state.fulfilment,
        lines: { de: itemLines(state, options, "de"), ru: itemLines(state, options, "ru") },
        estimateCents: estimate?.complete ? roundEstimate(estimate.totalCents) : null,
        photoCount: photos.photos.length,
      });
      clearDraft();
      onSuccess(result.orderNo);
    },
    onError: (error) => {
      setServerError(error instanceof TypeError ? f.serverErrors.network : f.serverErrors.generic);
    },
  });

  function submit() {
    setServerError(null);
    const checkedAt = new Date();
    for (const key of steps) {
      const errors = validateStep(key, state, options, checkedAt);
      if (Object.keys(errors).length > 0) {
        showStepErrors(key, errors);
        return;
      }
    }
    const payload = toPayload(state, { ...meta, locale, website });
    if (!payload) return;
    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));
    for (const photo of photos.photos) formData.append("photos", photo.file, photo.file.name);
    mutation.mutate(formData);
  }

  const stepTitles: Record<StepKey, string> = {
    anlass: f.kind.legend,
    torte: f.cake.title,
    desserts: f.dessert.title,
    feier: f.event.title,
    dekor: f.decor.title,
    termin: f.schedule.title,
    kontakt: f.contact.title,
  };

  const stepProps = { state, dispatch, options, errors: shownErrors, now };
  const stepContent = {
    anlass: <KindStep {...stepProps} />,
    torte: <CakeStep {...stepProps} />,
    desserts: <DessertStep {...stepProps} />,
    feier: <EventStep {...stepProps} photos={photos} />,
    dekor: <DecorStep {...stepProps} photos={photos} />,
    termin: <ScheduleStep {...stepProps} />,
    kontakt: <ContactStep {...stepProps} website={website} onWebsiteChange={setWebsite} />,
  }[currentStep];

  return (
    <div ref={wizardRef} className="scroll-mt-24">
      <StepIndicator
        steps={steps.map((key) => ({ key, label: f.steps[key] }))}
        current={currentIndex}
        onSelect={(index) => {
          const target = steps[index];
          if (target) onNavigate(target, "push");
        }}
        label={f.progressLabel}
        stepOf={f.stepOf}
      />

      {initial.restored && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-sunken px-4 py-3 text-ink-muted ck-body-sm">
          <span className="flex items-start gap-3">
            <InfoIcon
              aria-hidden
              strokeWidth={1.5}
              className="mt-0.5 size-4 shrink-0 text-rosegold-600"
            />
            {f.draft.restored} {f.photos.lostAfterRestore}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcwIcon strokeWidth={1.5} />}
            onClick={startOver}
          >
            {f.actions.startOver}
          </Button>
        </div>
      )}

      <div className="mt-8 grid items-start gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        <form
          noValidate
          aria-busy={mutation.isPending}
          onSubmit={(event) => {
            event.preventDefault();
            if (isLast) submit();
            else goNext();
          }}
        >
          <section aria-labelledby={headingId} className="ck-rise">
            <Eyebrow as="p">{f.stepOf(currentIndex + 1, steps.length)}</Eyebrow>
            <h2
              id={headingId}
              ref={headingRef}
              tabIndex={-1}
              className="mt-2 ck-heading text-ink outline-none"
            >
              {stepTitles[currentStep]}
            </h2>

            {serverError && (
              <div
                role="alert"
                className="mt-6 border-l-2 border-error bg-error-bg px-4 py-3 text-ink ck-body-sm"
              >
                {serverError}
              </div>
            )}

            {shownErrorFields.length > 1 && (
              <div
                ref={summaryRef}
                role="alert"
                tabIndex={-1}
                className="mt-6 border-l-2 border-error bg-error-bg px-4 py-3 outline-none ck-body-sm"
              >
                <p className="font-medium text-ink">{f.errorSummary(shownErrorFields.length)}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {shownErrorFields.map((field) => {
                    const key = shownErrors[field];
                    return (
                      key && (
                        <li key={field}>
                          <button
                            type="button"
                            onClick={() => focusField(field)}
                            className="border-b border-error/40 text-left text-ink"
                          >
                            {f.errors[key]}
                          </button>
                        </li>
                      )
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="mt-8">{stepContent}</div>

            {isLast && (
              <div className="mt-10 flex flex-col gap-3">
                <OrderSummary
                  state={state}
                  options={options}
                  photoCount={photos.photos.length}
                  className="lg:hidden"
                />
                {state.kind !== "event" && (
                  <p className="text-ink-muted ck-body-sm">{f.summary.payment}</p>
                )}
                <p className="text-ink-muted ck-body-sm">
                  {f.summary.legalBefore}
                  <Link
                    to="/agb"
                    target="_blank"
                    className="border-b border-hairline-accent text-brand"
                  >
                    {f.summary.legalLink}
                  </Link>
                  {f.summary.legalAfter}
                </p>
              </div>
            )}

            {!isLast && estimate?.complete && (
              <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-hairline pt-4 lg:hidden">
                <span className="ck-label text-ink-muted">{f.summary.estimate}</span>
                <Price className="text-xl">
                  {f.summary.estimateValue(formatPrice(roundEstimate(estimate.totalCents), locale))}
                </Price>
              </div>
            )}

            <div
              className={cn(
                "mt-10 flex items-center gap-4 border-t border-hairline pt-6",
                currentIndex > 0 ? "justify-between" : "justify-end",
              )}
            >
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  icon={<ArrowLeftIcon strokeWidth={1.5} />}
                  onClick={goBack}
                  disabled={mutation.isPending}
                >
                  {f.actions.back}
                </Button>
              )}
              <Button type="submit" size="lg" disabled={mutation.isPending || photos.busy}>
                {isLast
                  ? mutation.isPending
                    ? f.actions.submitting
                    : f.actions.submit
                  : f.actions.next}
              </Button>
            </div>
          </section>
        </form>

        <OrderSummary
          state={state}
          options={options}
          photoCount={photos.photos.length}
          className="hidden lg:sticky lg:top-24 lg:block"
        />
      </div>
    </div>
  );
}
