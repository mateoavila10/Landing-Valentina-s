export default function KPICard({ title, value, subtitle }) {
  const toMoney = (n) =>
    Number.isFinite(Number(n))
      ? Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS" })
      : "-";

  const isBalance = title?.toLowerCase().includes("balance");
  const numVal = Number(value);
  const balanceClass = isBalance
    ? numVal >= 0
      ? "kpi-value--positive"
      : "kpi-value--negative"
    : "";

  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className={`kpi-value ${balanceClass}`}>{toMoney(value)}</div>
      {subtitle ? <div className="kpi-sub">{subtitle}</div> : null}
    </div>
  );
}
