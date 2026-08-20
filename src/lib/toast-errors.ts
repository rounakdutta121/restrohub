import { toast } from "sonner";

/** Show API errors without billing/upgrade prompts. */
export function toastApiError(message: string | undefined | null, fallback = "Something went wrong") {
  toast.error(message || fallback);
}
