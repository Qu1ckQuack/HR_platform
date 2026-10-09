export type FormInputProps = {
  label: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  readOnlyBackground?: boolean;
  type?: "text" | "email" | "date" | "number";
  placeholder?: string;
  inputMode?: "text" | "numeric" | "email" | "tel" | "decimal";
  min?: string;
  step?: string;
  onChange?: (value: string) => void;
};

export function FormInput({
  label,
  value,
  required = false,
  readOnly = false,
  readOnlyBackground = true,
  type = "text",
  placeholder,
  inputMode,
  min,
  step,
  onChange,
}: FormInputProps) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <input
        required={required}
        readOnly={readOnly}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        step={step}
        onChange={(event) => onChange?.(event.target.value)}
        className={`mt-1 min-h-11 w-full rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-[#2867b4] ${readOnly && readOnlyBackground ? "read-only:bg-slate-100" : ""}`}
      />
    </label>
  );
}

