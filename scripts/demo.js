import { EventBus } from '../src/Core/EventBus.js';
import { QuotationState, resetLineSeq } from '../src/Core/QuotationState.js';
import { QuotationScenario } from '../src/Scenarios/Quotation.js';
import { createSeededStore } from '../tests/helpers/store_factory.js';

import { AdvanceStep } from '../src/Events/quotation/AdvanceStep.js';
import { AddItem } from '../src/Events/quotation/basket/AddItem.js';
import { ChangePax } from '../src/Events/quotation/basket/ChangePax.js';
import { Recalculate } from '../src/Events/quotation/basket/Recalculate.js';

const CYAN = '\x1b[36m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m';
const BOLD = '\x1b[1m', RESET = '\x1b[0m';

const store = createSeededStore();

function fmt(n) { return `$${n.toLocaleString('es-CL')}` }

function createBus(pax, clienteId, cotizacionId) {
  resetLineSeq();
  const scenario = new QuotationScenario();
  const state = new QuotationState({ paxGlobal: pax, fechaEvento: '2025-06-15', duracionDias: 1, clienteId, cotizacionId });
  return new EventBus(scenario, state, store);
}

function printState(bus, label) {
  const state = bus.state;
  console.log(`\n${BOLD}${CYAN}── ${label} ──${RESET}`);
  console.log(`${DIM}Pax: ${state.paxGlobal} | Lines: ${state.lineas.length}${RESET}\n`);

  if (state.lineas.length) {
    const nameW = 42, srcW = 8;
    console.log(`  ${DIM}${'Item'.padEnd(nameW)} ${'Src'.padEnd(srcW)} ${'Pax'.padStart(5)} ${'Qty'.padStart(5)} ${'Dur'.padStart(5)}  ${'Neto Base'.padStart(12)} ${'Ajustado'.padStart(12)} ${'Final'.padStart(12)}${RESET}`);
    console.log(`  ${DIM}${'─'.repeat(nameW + srcW + 5 + 5 + 5 + 12 * 3 + 10)}${RESET}`);

    for (const l of state.lineas) {
      const item = store.findById('ITEM_CATALOGO', 'ID_Item', l.ID_Item);
      const name = (item?.Nombre || l.ID_Item).slice(0, nameW - 1).padEnd(nameW);
      const src = (l._source || '').padEnd(srcW);
      const pax = String(l._pax || '-').padStart(5);
      const qty = String(l._cantidad || '-').padStart(5);
      const dur = String(l._duracionMin || '-').padStart(5);
      const neto = fmt(l._netoBase || 0).padStart(12);
      const adj = l._netoAjustado != null ? fmt(l._netoAjustado).padStart(12) : ''.padStart(12);
      const fin = l._netoFinal != null ? fmt(l._netoFinal).padStart(12) : ''.padStart(12);

      const hasAdj = l._ajustes?.length > 0;
      const color = hasAdj ? YELLOW : '';
      console.log(`  ${color}${name} ${src} ${pax} ${qty} ${dur}  ${neto} ${adj} ${fin}${hasAdj ? RESET : ''}`);

      if (hasAdj) {
        for (const a of l._ajustes) {
          console.log(`  ${YELLOW}  ↳ ${a.ruleId}: ${a.description} (${fmt(a.delta)})${RESET}`);
        }
      }
    }
  }

  if (state.totals.subtotal) {
    console.log();
    console.log(`  ${'Subtotal:'.padStart(20)} ${BOLD}${fmt(state.totals.subtotal)}${RESET}`);
    for (const t of state.totals.taxes || []) {
      console.log(`  ${(t.name + ':').padStart(20)} ${fmt(t.amount)}`);
    }
    console.log(`  ${'TOTAL:'.padStart(20)} ${BOLD}${GREEN}${fmt(state.totals.total)}${RESET}`);
  }
}

// ═══════════════════════════════════════════════
console.log(`${BOLD}${GREEN}╔══════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${GREEN}║   SF Lodge Pricing Engine — Demo (v4 Events) ║${RESET}`);
console.log(`${BOLD}${GREEN}╚══════════════════════════════════════════════╝${RESET}`);

// ── Scenario 1: Corporate ──
console.log(`\n${BOLD}━━━ SCENARIO 1: Corporate Seminar ━━━${RESET}`);

const corp = createBus(25, 'CLI_CORP', 'COT_CORP');
await corp.dispatch(new AdvanceStep({ _bus: corp })); // init → basket

await corp.dispatch(new AddItem({ itemId: 'ITEM_CHINOOK' }));
printState(corp, 'After: Salon Chinook');

await corp.dispatch(new AddItem({ itemId: 'ITEM_COFFEE_BASIC' }));
await corp.dispatch(new AddItem({ itemId: 'ITEM_ALMUERZO' }));
await corp.dispatch(new Recalculate());
printState(corp, 'After: + Coffee + Almuerzo (with taxes)');

await corp.dispatch(new ChangePax({ paxGlobal: 50 }));
printState(corp, 'After: Pax changed 25 → 50');

// ── Scenario 2: Wedding ──
console.log(`\n\n${BOLD}━━━ SCENARIO 2: Wedding (80 pax, overtime) ━━━${RESET}`);

const wed = createBus(80, 'CLI_WEDDING', 'COT_WED');
await wed.dispatch(new AdvanceStep({ _bus: wed })); // init → basket

await wed.dispatch(new AddItem({ itemId: 'ITEM_CHINOOK', overrides: { Override_Duracion_Min: 600 } }));
await wed.dispatch(new AddItem({ itemId: 'PACK_COFFEE_COMPLETO' }));
await wed.dispatch(new AddItem({ itemId: 'ITEM_DJ_LARGE' }));
await wed.dispatch(new AddItem({ itemId: 'ITEM_TICKET_CERVEZA' }));
await wed.dispatch(new AddItem({ itemId: 'ITEM_CAMINATA' }));
await wed.dispatch(new Recalculate());
printState(wed, 'Full wedding quote');

console.log(`\n${DIM}Event history: ${wed.getHistory().length} entries${RESET}`);
console.log();
