export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-base-700 bg-base-900/50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-base-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-base-500">{hint}</p>}
    </div>
  )
}
