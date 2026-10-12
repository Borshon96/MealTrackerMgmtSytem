export function FormMessage({
  result,
}: {
  result: { ok: true; message?: string } | { ok: false; error: string } | null;
}) {
  if (!result) return null;
  if (result.ok) {
    if (!("message" in result) || !result.message) {
      return <p className="text-sm text-emerald-700">Saved successfully.</p>;
    }
    return <p className="text-sm text-emerald-700">{result.message}</p>;
  }
  return <p className="text-sm text-destructive">{result.error}</p>;
}
