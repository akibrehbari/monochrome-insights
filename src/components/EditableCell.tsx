import { useEffect, useRef, useState } from "react";

type Props = {
  value: string | number;
  onChange: (v: string) => void;
  type?: "text" | "number";
  className?: string;
  prefix?: string;
};

export function EditableCell({ value, onChange, type = "text", className = "", prefix }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) onChange(draft);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
        }}
        className={`w-full bg-transparent border border-foreground/40 px-1.5 py-0.5 text-sm outline-none ${className}`}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`text-left w-full px-1.5 py-0.5 hover:bg-muted rounded-sm text-sm ${className}`}
    >
      {prefix}{type === "number" ? Number(value).toLocaleString() : (value || <span className="text-muted-foreground">—</span>)}
    </button>
  );
}