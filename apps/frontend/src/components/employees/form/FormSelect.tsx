export type FormSelectProps = {
  label: string;
  value: string;
  options: (string | { value: string; label: string })[];
  required?: boolean;
  emptyLabel?: string;
  className?: string;
  onChange: (value: string) => void;
};

export function FormSelect({
  label,
  value,
  options,
  required = false,
  emptyLabel = "เลือกข้อมูล",
  className = "",
  onChange,
}: FormSelectProps) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${className}`}>
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:border-[#2867b4] cursor-pointer hover:cursor-pointer"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => {
          const normalized =
            typeof option === "string"
              ? { value: option, label: option }
              : option;
          return (
            <option key={normalized.value} value={normalized.value}>
              {normalized.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

