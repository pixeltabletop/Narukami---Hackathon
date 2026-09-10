import type { ChenState } from "./useChen";

const sections: { title: string; lead: string; items: [string, string][] }[] = [
  {
    title: "Resumen",
    lead: "La foto del período: cuánto se gastó de verdad, contra qué se compara y qué todavía puede cambiar.",
    items: [
      [
        "Gasto neto contabilizado",
        "Compras y comisiones menos devoluciones y reversos. No incluye pagos de tarjeta ni traslados entre tus cuentas.",
      ],
      [
        "Período anterior comparable",
        "El mismo tramo de días del mes anterior. Comparar un mes completo contra nueve días daría un aumento falso.",
      ],
      [
        "Pendiente de contabilizar",
        "Compras autorizadas que el comercio todavía no cobró en firme. El banco retiene el dinero, pero el importe final puede cambiar, así que no entra al gasto.",
      ],
      [
        "No es gasto",
        "Traslados a tus propias cuentas y retiros de efectivo. Salieron de la cuenta pero siguen siendo tu dinero, así que se muestran aparte.",
      ],
    ],
  },
  {
    title: "Movimientos",
    lead: "Una sola bandeja con todo, y filtros para mirar una cosa a la vez.",
    items: [
      [
        "Filtro por producto",
        "Tarjeta de crédito, cuenta corriente o cuenta de ahorros. El pago de tarjeta aparece en la cuenta y no vuelve a contarse como consumo.",
      ],
      [
        "Filtro por categoría",
        "Se escribe además de elegirse: teclea las primeras letras y la lista se reduce.",
      ],
      [
        "Corregir una categoría",
        "Solo sobre movimientos de tarjeta. La corrección se guarda para ese comercio y solo para este cliente.",
      ],
      [
        "Filas atenuadas",
        "Abonos, anulados y traslados. Siguen visibles porque el dinero se movió, pero no suman al gasto del período.",
      ],
    ],
  },
  {
    title: "Recurrentes",
    lead: "Cargos que aparecen mes tras mes en fechas parecidas.",
    items: [
      [
        "Posible cargo recurrente",
        "Dos períodos no confirman una suscripción. Por eso se llama posible: es una señal para que la revises, no una conclusión.",
      ],
      [
        "Cambio de importe",
        "Cuando el cargo de este mes no coincide con el anterior, se muestran los dos para que veas la diferencia.",
      ],
    ],
  },
  {
    title: "Organiza",
    lead: "Cuánto te queda realmente hasta el próximo ingreso, con los supuestos a la vista.",
    items: [
      [
        "Margen disponible",
        "Saldo menos pendientes, menos compromisos que salen de la cuenta, menos gasto variable, menos reserva.",
      ],
      [
        "Compromisos",
        "Desmarca los que no esperas pagar en este tramo y el margen se recalcula. Cada uno muestra su naturaleza y su cuota.",
      ],
      [
        "Descuentos de planilla",
        "No reducen tu saldo de hoy porque el empleador los retiene antes de pagarte. Reducen el próximo ingreso, y ahí se muestra por cuánto llegaría.",
      ],
      [
        "Gasto variable y reserva",
        "Ambos admiten cero o campo vacío. Déjalos en cero si prefieres no apartar nada y llevar más a ahorro.",
      ],
      [
        "El próximo ingreso no se suma",
        "Hasta que no se recibe, no cuenta. Un plan que gasta dinero que aún no llegó no sirve para decidir hoy.",
      ],
    ],
  },
  {
    title: "Proyección",
    lead: "La pregunta directa: ¿llegas al próximo pago, o te quedas corto antes?",
    items: [
      [
        "Cómo cobras",
        "Se reconoce si cobras mensual, quincenal o irregular a partir de tus ingresos anteriores, con el nivel de confianza a la vista.",
      ],
      [
        "Ingresos irregulares",
        "Cuando no hay fecha fija, el ingreso se reparte por día en lugar de apostar a un día concreto, y se dice explícitamente.",
      ],
      [
        "Día a día",
        "Cada día aplica los cobros previstos, los compromisos, los gastos recurrentes en su fecha habitual y el gasto variable repartido parejo.",
      ],
      [
        "Punto más bajo",
        "El día en que la cuenta queda más ajustada. Si cae bajo cero, el veredicto cambia a rojo y dice cuánto falta.",
      ],
      [
        "Autonomía sin cobrar",
        "Cuántos días aguanta lo que ya está en la cuenta si no entra ningún cobro más. Para un ingreso irregular es la pregunta que de verdad importa.",
      ],
      [
        "Proyectar hasta",
        "Cambia la fecha para ver si el saldo aguanta hasta donde te importa: el próximo pago, el fin de mes o cualquier día del tramo.",
      ],
    ],
  },
  {
    title: "Escenarios",
    lead: "Cuánto podrías separar sin quedarte sin margen.",
    items: [
      [
        "Conservador, sugerido y ambicioso",
        "Tres montos de ahorro con el dinero que quedaría disponible en cada caso.",
      ],
      [
        "De dónde sale la sugerencia",
        "La mitad de tu capacidad histórica, y nunca más que el margen disponible de este tramo.",
      ],
    ],
  },
  {
    title: "Asistente",
    lead: "Preguntas en lenguaje natural, respondidas en este equipo.",
    items: [
      [
        "Qué hace el modelo",
        "Clasifica tu pregunta y elige entre una y tres evidencias. No calcula importes, no redacta libre y no ejecuta consultas.",
      ],
      [
        "Quién arma la respuesta",
        "La aplicación, con los importes ya calculados. Por eso cada cifra se puede abrir hasta sus movimientos.",
      ],
      [
        "Sin nube",
        "Si el modelo local no está disponible, el asistente lo dice y no responde. No existe un respaldo en internet.",
      ],
    ],
  },
];

export const GuidePanel = ({ state }: { state: ChenState }) => {
  const { setTab } = state;
  return (
    <div className="guide-stack">
      <section className="panel guide-intro">
        <span className="eyebrow">CÓMO SE USA</span>
        <h2>Guía de Chen</h2>
        <p className="muted">
          Cada número de esta aplicación se puede rastrear hasta los movimientos
          que lo producen. Esta guía explica qué hace cada sección, qué entra en
          cada cálculo y, sobre todo, qué queda fuera a propósito.
        </p>
        <div className="guide-jump">
          {sections.map((section) => (
            <button key={section.title} onClick={() => setTab(section.title)}>
              Ir a {section.title} ↗
            </button>
          ))}
        </div>
      </section>
      {sections.map((section) => (
        <section className="panel guide-section" key={section.title}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">{section.title.toUpperCase()}</span>
              <h2>{section.lead}</h2>
            </div>
          </div>
          <dl>
            {section.items.map(([term, text]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <section className="panel guide-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LÍMITES</span>
            <h2>Lo que esta aplicación no hace</h2>
          </div>
        </div>
        <dl>
          <div>
            <dt>No mueve dinero</dt>
            <dd>
              No transfiere, no paga y no contrata. Solo lee movimientos y
              explica.
            </dd>
          </div>
          <div>
            <dt>No da consejo financiero</dt>
            <dd>
              Muestra tus propios números y sus supuestos. La decisión es tuya.
            </dd>
          </div>
          <div>
            <dt>No usa datos reales</dt>
            <dd>
              Todos los clientes y movimientos de esta demostración son
              sintéticos. No hay conexión con cuentas de ninguna entidad.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
