import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/* Recessed soft-3D field: sits IN the surface (inset shadows), brightens on focus. */
const fieldBase =
  "w-full rounded-xl bg-cx-bg px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-cx-inset transition-shadow focus:bg-[#F2F4F9] focus:outline-none focus:ring-2 focus:ring-cx-purple/25";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...rest} />;
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[96px] resize-y", className)} {...rest} />;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-slate-500">{children}</label>
  );
}
