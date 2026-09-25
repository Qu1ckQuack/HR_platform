export function InfoSection({
  title,
  items,
}: {
  title: string;
  items: string[][];
}) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 font-bold text-slate-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
