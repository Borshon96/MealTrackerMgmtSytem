"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { closePeriodAction } from "@/actions/billing-actions";
import { Button } from "@/components/ui/button";

export function ClosePeriodButton({ periodId }: { periodId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Close this billing period? It cannot be regenerated afterwards.")) return;
        startTransition(async () => {
          await closePeriodAction(periodId);
          router.refresh();
        });
      }}
    >
      {pending ? "Closing..." : "Close period"}
    </Button>
  );
}
