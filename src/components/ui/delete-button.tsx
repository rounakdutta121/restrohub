"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export function DeleteButton({
  label = "Delete",
  confirmTitle = "Confirm delete",
  confirmMessage = "Are you sure you want to delete this?",
  onDelete,
  size = "sm",
  variant = "ghost",
  className = "",
}: {
  label?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  onDelete: () => Promise<void | boolean>;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      const ok = await onDelete();
      if (ok === false) {
        toast.error("Could not delete");
        return;
      }
      setOpen(false);
    } catch {
      toast.error("Could not delete");
    } finally {
      setBusy(false);
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={busy}
        className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${className}`}
        onClick={handleClick}
      >
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={confirmMessage}
        confirmLabel={label}
        onConfirm={handleConfirm}
        loading={busy}
      />
    </>
  );
}

export async function apiDelete(url: string, body?: object) {
  const res = await fetch(url, {
    method: "DELETE",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast.error(data.error || "Delete failed");
    return false;
  }
  return true;
}
