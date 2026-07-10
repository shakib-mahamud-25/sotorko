"use client";

import * as React from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/report/location-picker";
import { CategorySelector } from "@/components/report/category-selector";
import { SeveritySelector } from "@/components/report/severity-selector";
import { PhotoUploader } from "@/components/report/photo-uploader";
import { EditCodeReveal } from "@/components/report/edit-code-reveal";
import { reportFormSchema, type ReportFormValues } from "@/lib/validation/report";
import type { Report } from "@/types";

type SubmitState =
  | { status: "form" }
  | { status: "success"; editCode: string; reportId: string };

export function ReportForm() {
  const queryClient = useQueryClient();
  const [submitState, setSubmitState] = React.useState<SubmitState>({ status: "form" });
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      categories: [],
      severity: undefined,
      incidentDate: today,
      incidentTime: "",
      description: "",
      photos: [],
      website: "",
    },
  });

  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  const location = latitude && longitude ? { lat: latitude, lng: longitude } : null;
  const categories = useWatch({ control, name: "categories" }) ?? [];
  const severity = useWatch({ control, name: "severity" });
  const description = useWatch({ control, name: "description" }) ?? "";

  async function onSubmit(values: ReportFormValues) {
    setSubmitError(null);
    try {
      // Photo upload to storage is out of scope for this scaffold —
      // see PROJECT_CONTEXT.md. Files are already EXIF-stripped and
      // compressed client-side by this point (PhotoUploader), ready
      // to hand to a real upload step once Supabase Storage exists.
      const { photos: _photos, ...payload } = values;
      void _photos;

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      const data: { report: Report; editCode: string } = await res.json();
      setSubmitState({ status: "success", editCode: data.editCode, reportId: data.report.id });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report submitted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(message);
      toast.error(message);
    }
  }

  if (submitState.status === "success") {
    return (
      <EditCodeReveal editCode={submitState.editCode} reportId={submitState.reportId} />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Honeypot — hidden from real users via CSS, not display:none
          (some bots skip display:none fields) */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website">Leave this field blank</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Anonymous & Private</span>
          </div>
          <CardTitle className="text-2xl">Report an Incident</CardTitle>
          <CardDescription>
            No account required. Your exact location is never shown publicly —
            reports are displayed with a randomized offset to protect your
            privacy.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Location */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Label id="location-label">Where did this happen? *</Label>
          <div aria-labelledby="location-label">
            <LocationPicker
              value={location}
              onChange={(point) => {
                setValue("latitude", point.lat, { shouldValidate: true });
                setValue("longitude", point.lng, { shouldValidate: true });
              }}
            />
          </div>
          {(errors.latitude || errors.longitude) && (
            <p role="alert" className="text-xs text-destructive">
              Please mark a location on the map.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Category */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Label id="category-label">What happened? *</Label>
          <div aria-labelledby="category-label">
            <CategorySelector
              value={categories}
              onChange={(cats) => setValue("categories", cats, { shouldValidate: true })}
            />
          </div>
          {errors.categories && (
            <p role="alert" className="text-xs text-destructive">
              {errors.categories.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Severity */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Label id="severity-label">How severe was it? *</Label>
          <div aria-labelledby="severity-label">
            <SeveritySelector
              value={severity ?? null}
              onChange={(sev) => setValue("severity", sev, { shouldValidate: true })}
            />
          </div>
          {errors.severity && (
            <p role="alert" className="text-xs text-destructive">
              Please select a severity level.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Date & time */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="incidentDate">Date *</Label>
            <Input
              id="incidentDate"
              type="date"
              max={today}
              {...register("incidentDate")}
            />
            {errors.incidentDate && (
              <p role="alert" className="text-xs text-destructive">
                {errors.incidentDate.message}
              </p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="incidentTime">Time (optional)</Label>
            <Input id="incidentTime" type="time" {...register("incidentTime")} />
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardContent className="flex flex-col gap-1.5 p-5">
          <Label htmlFor="description">Short description (optional)</Label>
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <Textarea
                id="description"
                placeholder="Anything else that would help other women understand what to watch for here…"
                maxLength={1000}
                {...field}
              />
            )}
          />
          <div className="flex justify-between">
            {errors.description ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted-foreground">{description.length}/1000</span>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardContent className="p-5">
          <Controller
            control={control}
            name="photos"
            render={({ field }) => (
              <PhotoUploader value={field.value ?? []} onChange={field.onChange} />
            )}
          />
        </CardContent>
      </Card>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          "Submit Report"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By submitting, you confirm this report reflects your genuine experience.
        You&rsquo;ll receive a private code afterward to edit or delete it later.
      </p>
    </form>
  );
}
