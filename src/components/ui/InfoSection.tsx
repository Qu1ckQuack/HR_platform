export function InfoSection({
  title,
  items,
  columns = 2,
}: {
  title: string;
  items: string[][];
  columns?: 2 | 3;
}) {
  const gridColumns = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-4 font-bold text-slate-900">{title}</h3>
      <div className={`grid gap-4 ${gridColumns}`}>
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="hide-scrollbar mt-1 max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap text-sm font-semibold">
              {value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
