export default function Stars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span className="text-amber-500" aria-label={`${value} out of 5`}>
      {"★".repeat(full)}
      <span className="text-slate-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}
