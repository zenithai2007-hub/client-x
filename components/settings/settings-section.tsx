"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/** Uniform settings section card. */
export function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  id,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24">
      <Card className="p-4 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cx-purpleLight text-cx-purpleDark">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-5">{children}</div>
      </Card>
    </div>
  );
}

/** One labelled row: label + description on the left, control on the right. */
export function SettingRow({
  label,
  description,
  control,
}: {
  label: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export const selectCls =
  "h-10 rounded-xl border border-slate-200/70 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-cx-purple focus:outline-none";
