"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cancelMealAction } from "@/actions/meal-actions";
import { cn } from "@/lib/utils";

export function CancelMealButton({
  mealId,
  employeeName,
  className,
}: {
  mealId: string;
  employeeName: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      title="Cancel meal and credit employee account"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
        className
      )}
      onClick={() => {
        const ok = window.confirm(
          `Cancel ${employeeName}'s meal? The meal charge will be credited to their account.`
        );
        if (!ok) return;
        startTransition(async () => {
          const result = await cancelMealAction(mealId);
          if (result.ok) {
            toast.success(result.message ?? "Meal cancelled.");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        });
      }}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
