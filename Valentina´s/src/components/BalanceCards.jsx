import KPICard from "./KPICard";

function Row({ name, data }) {
  const d = data || { ingresos: 0, egresos: 0, balance: 0 };
  return (
    <div className="kpi-grid">
      <KPICard title={`${name} · Ingresos`} value={d.ingresos} />
      <KPICard title={`${name} · Egresos`} value={d.egresos} />
      <KPICard title={`${name} · Balance`} value={d.balance} />
    </div>
  );
}

/**
 * Props admitidas (cualquiera de estas variantes):
 * - { centro, tafi_viejo, total }
 * - { s1, s2, total }  // compatibilidad con tu código viejo
 */
export default function BalanceCards(props) {
  // compatibilidad y normalización
  const centro = props.centro ?? props.s1 ?? null;
  const tafi = props.tafi_viejo ?? props.s2 ?? null;
  const total = props.total ?? null;

  return (
    <div className="balance-section">
      <Row name="Centro" data={centro} />
      <Row name="Tafí Viejo" data={tafi} />
      <div className="balance-divider" />
      <Row name="TOTAL" data={total} />
    </div>
  );
}
