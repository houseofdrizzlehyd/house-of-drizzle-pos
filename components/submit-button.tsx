"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className = "",
}: {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex items-center justify-center gap-2 transition disabled:opacity-70 ${className}`}
    >
      {pending && <LoaderCircle size={18} className="animate-spin" />}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
