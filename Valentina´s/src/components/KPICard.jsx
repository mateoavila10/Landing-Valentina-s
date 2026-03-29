export default function KPICard({ title, value, subtitle }) {
  const toMoney = (n) =>
    Number.isFinite(Number(n))
      ? Number(n).toLocaleString("es-AR", { style: "currency", currency: "ARS" })
      : "-";

  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{toMoney(value)}</div>
      {subtitle ? <div className="kpi-sub">{subtitle}</div> : null}
    </div>
  );
}
