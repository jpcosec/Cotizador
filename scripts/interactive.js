import readline from 'node:readline';
import { EventBus } from '../mock/Core/EventBus.js';
import { QuotationState, resetLineSeq } from '../mock/Core/QuotationState.js';
import { QuotationScenario } from '../mock/Scenarios/Quotation.js';
import { createSeededStore } from '../tests/helpers/store_factory.js';

import { AdvanceStep } from '../mock/Events/quotation/AdvanceStep.js';
import { AddItem } from '../mock/Events/quotation/basket/AddItem.js';
import { ChangePax } from '../mock/Events/quotation/basket/ChangePax.js';
import { Recalculate } from '../mock/Events/quotation/basket/Recalculate.js';

// ── Colors ──
const C = { bold: '\x1b[1m', dim: '\x1b[2m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', magenta: '\x1b[35m', reset: '\x1b[0m' };
const b = s => `${C.bold}${s}${C.reset}`;
const d = s => `${C.dim}${s}${C.reset}`;
const fmt = n => `$${n.toLocaleString('es-CL')}`;

// ── State ──
const store = createSeededStore();
let bus = null;

// ── Table printer ──
function printTable(rows, cols) {
  if (!rows.length) return console.log(d('  (empty)'));
  const widths = cols.map(c => Math.max(c.label.length, ...rows.map(r => String(c.get(r)).length)));
  const header = cols.map((c, i) => c.label.padEnd(widths[i])).join('  ');
  console.log(`  ${C.dim}${header}${C.reset}`);
  console.log(`  ${C.dim}${widths.map(w => '─'.repeat(w)).join('──')}${C.reset}`);
  for (const r of rows) {
    const line = cols.map((c, i) => String(c.get(r)).padEnd(widths[i])).join('  ');
    console.log(`  ${line}`);
  }
}

// ── Commands ──
const commands = {
  help() {
    console.log(`
${b('Commands:')}
  ${C.cyan}tables${C.reset}                   List all tables
  ${C.cyan}show <TABLE>${C.reset}             Show all rows in a table
  ${C.cyan}describe <TABLE>${C.reset}         Show column names for a table
  ${C.cyan}find <TABLE> <field>=<val>${C.reset}  Filter rows

${b('Quotation:')}
  ${C.cyan}new <pax>${C.reset}                Create new quotation
  ${C.cyan}items${C.reset}                    Browse items by category
  ${C.cyan}add <ITEM_ID>${C.reset}            Add item to cart
  ${C.cyan}add <ITEM_ID> pax=N${C.reset}      Add with pax override
  ${C.cyan}add <ITEM_ID> dur=N${C.reset}      Add with duration override (min)
  ${C.cyan}add <ITEM_ID> qty=N${C.reset}      Add with quantity override
  ${C.cyan}pax <N>${C.reset}                  Change pax and recalculate
  ${C.cyan}cart${C.reset}                     Show current quotation
  ${C.cyan}history${C.reset}                  Show event history
  ${C.cyan}clear${C.reset}                    Clear quotation

  ${C.cyan}quit${C.reset}                     Exit
`);
  },

  tables() {
    console.log(b('\nTables:'));
    for (const name of ['CLIENTES', 'CATEGORIAS', 'PERFILES_PRECIO', 'ITEM_CATALOGO', 'COMPOSICION_KIT', 'REGLAS_NEGOCIO']) {
      const count = store.all(name).length;
      console.log(`  ${C.cyan}${name.padEnd(22)}${C.reset} ${d(`(${count} rows)`)}`);
    }
    console.log();
  },

  show(args) {
    const table = args[0]?.toUpperCase();
    if (!table) return console.log(d('  Usage: show <TABLE>'));
    const rows = store.all(table);
    if (!rows.length) return console.log(d(`  Table "${table}" is empty or doesn't exist.`));
    const keys = Object.keys(rows[0]);
    printTable(rows, keys.map(k => ({ label: k, get: r => summarize(r[k]) })));
    console.log(d(`\n  ${rows.length} rows\n`));
  },

  describe(args) {
    const table = args[0]?.toUpperCase();
    if (!table) return console.log(d('  Usage: describe <TABLE>'));
    const rows = store.all(table);
    if (!rows.length) return console.log(d(`  Table "${table}" is empty or doesn't exist.`));
    console.log(b(`\n  ${table} columns:`));
    for (const k of Object.keys(rows[0])) {
      const sample = summarize(rows[0][k]);
      console.log(`  ${C.cyan}${k.padEnd(30)}${C.reset} ${d(`e.g. ${sample}`)}`);
    }
    console.log();
  },

  find(args) {
    const table = args[0]?.toUpperCase();
    const filterStr = args.slice(1).join(' ');
    if (!table || !filterStr) return console.log(d('  Usage: find <TABLE> field=value'));
    const filters = {};
    for (const part of filterStr.split(/\s+/)) {
      const [k, v] = part.split('=');
      if (k && v !== undefined) filters[k] = isNaN(v) ? v : Number(v);
    }
    const rows = store.findAll(table, filters);
    if (!rows.length) return console.log(d('  No matches.'));
    const keys = Object.keys(rows[0]);
    printTable(rows, keys.map(k => ({ label: k, get: r => summarize(r[k]) })));
    console.log(d(`\n  ${rows.length} matches\n`));
  },

  items() {
    console.log(b('\nItems by category:\n'));
    for (const cat of store.all('CATEGORIAS')) {
      const catItems = store.findByFK('ITEM_CATALOGO', 'ID_Categoria', cat.ID_Categoria).filter(i => i.Activo);
      console.log(`${C.magenta}${cat.Nombre}${C.reset} ${d(`(${cat.ID_Categoria})`)}`);
      const dims = [cat.Def_Requiere_Pax && 'Pax', cat.Def_Requiere_Cant && 'Qty', cat.Def_Requiere_Tiempo && 'Tiempo'].filter(Boolean);
      if (dims.length) console.log(d(`  Dims: ${dims.join(', ')}`));
      for (const item of catItems) {
        const perfil = item.ID_Perfil_Precio_Override
          ? store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', item.ID_Perfil_Precio_Override)
          : store.findById('PERFILES_PRECIO', 'ID_Perfil_Precio', cat.ID_Perfil_Precio_Default);
        const price = perfil ? priceHint(perfil) : d('(pack)');
        console.log(`  ${C.cyan}${item.ID_Item.padEnd(24)}${C.reset} ${item.Nombre.padEnd(40)} ${price}`);
      }
      console.log();
    }
  },

  async new(args) {
    const pax = parseInt(args[0]) || 50;
    resetLineSeq();
    const scenario = new QuotationScenario();
    const state = new QuotationState({ paxGlobal: pax, fechaEvento: '2025-06-15', duracionDias: 1, clienteId: 'CLI_CORP' });
    bus = new EventBus(scenario, state, store);
    await bus.dispatch(new AdvanceStep({ _bus: bus })); // init → basket
    console.log(`${C.green}✓ New quotation created (${pax} pax) — step: basket${C.reset}\n`);
  },

  async add(args) {
    if (!bus) return console.log(`${C.red}No quotation. Use: new <pax>${C.reset}`);
    const itemId = args[0];
    if (!itemId) return console.log(d('  Usage: add <ITEM_ID> [pax=N] [dur=N] [qty=N]'));
    const item = store.findById('ITEM_CATALOGO', 'ID_Item', itemId);
    if (!item) return console.log(`${C.red}Item "${itemId}" not found. Use 'items' to browse.${C.reset}`);

    const overrides = {};
    for (const arg of args.slice(1)) {
      const [k, v] = arg.split('=');
      if (k === 'pax') overrides.Override_Pax = Number(v);
      if (k === 'dur') overrides.Override_Duracion_Min = Number(v);
      if (k === 'qty') overrides.Override_Cantidad = Number(v);
    }

    const result = await bus.dispatch(new AddItem({ itemId, overrides }));
    if (result.errors.length) return console.log(`${C.red}Error: ${result.errors[0].message}${C.reset}`);
    await bus.dispatch(new Recalculate());
    console.log(`${C.green}✓ Added: ${item.Nombre}${C.reset}`);
    commands.cart();
  },

  async pax(args) {
    if (!bus) return console.log(`${C.red}No quotation. Use: new <pax>${C.reset}`);
    const newPax = parseInt(args[0]);
    if (!newPax) return console.log(d('  Usage: pax <N>'));
    const result = await bus.dispatch(new ChangePax({ paxGlobal: newPax }));
    if (result.errors.length) return console.log(`${C.red}Error: ${result.errors[0].message}${C.reset}`);
    console.log(`${C.green}✓ Pax updated to ${newPax}${C.reset}`);
    commands.cart();
  },

  cart() {
    if (!bus) return console.log(`${C.red}No quotation. Use: new <pax>${C.reset}`);
    const state = bus.state;
    console.log(`\n${b(`${C.cyan}── Quotation ${state.cotizacion.ID_Cotizacion} ──`)}`);
    console.log(d(`Pax: ${state.paxGlobal} | ${state.lineas.length} lines | Step: ${bus.scenario.currentStep.name}\n`));

    if (!state.lineas.length) return console.log(d('  Cart is empty. Use: add <ITEM_ID>\n'));

    printTable(state.lineas, [
      { label: 'Item', get: l => (store.findById('ITEM_CATALOGO', 'ID_Item', l.ID_Item)?.Nombre || l.ID_Item).slice(0, 36) },
      { label: 'Src', get: l => l._source || '' },
      { label: 'Pax', get: l => l._pax || '-' },
      { label: 'Qty', get: l => l._cantidad || '-' },
      { label: 'Dur', get: l => l._duracionMin || '-' },
      { label: 'Neto Base', get: l => fmt(l._netoBase || 0) },
      { label: 'Ajustado', get: l => l._netoAjustado != null ? fmt(l._netoAjustado) : '' },
      { label: 'Final', get: l => l._netoFinal != null ? fmt(l._netoFinal) : '' },
    ]);

    for (const l of state.lineas) {
      if (l._ajustes?.length) {
        const name = store.findById('ITEM_CATALOGO', 'ID_Item', l.ID_Item)?.Nombre || l.ID_Item;
        for (const a of l._ajustes) {
          console.log(`  ${C.yellow}↳ ${name}: ${a.ruleId} ${a.description} (${fmt(a.delta)})${C.reset}`);
        }
      }
    }

    console.log();
    console.log(`  ${'Subtotal:'.padStart(14)} ${b(fmt(state.totals.subtotal))}`);
    for (const t of state.totals.taxes || []) {
      console.log(`  ${(t.name + ':').padStart(14)} ${fmt(t.amount)}`);
    }
    console.log(`  ${'TOTAL:'.padStart(14)} ${b(`${C.green}${fmt(state.totals.total)}`)}`);
    console.log();
  },

  history() {
    if (!bus) return console.log(`${C.red}No quotation. Use: new <pax>${C.reset}`);
    const entries = bus.getHistory();
    console.log(b(`\nEvent history (${entries.length} entries):\n`));
    for (const e of entries) {
      console.log(`  ${C.cyan}${e.event.padEnd(20)}${C.reset} ${d(e.timestamp)}`);
    }
    console.log();
  },

  clear() {
    bus = null;
    console.log(`${C.green}✓ Quotation cleared${C.reset}\n`);
  },
};

// ── Helpers ──
function summarize(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 40);
  return String(v).slice(0, 40);
}

function priceHint(p) {
  const parts = [];
  if (p.Costo_Base_Fijo) parts.push(`base ${fmt(p.Costo_Base_Fijo)}`);
  if (p.Costo_Unitario_Pax) parts.push(`${fmt(p.Costo_Unitario_Pax)}/pax`);
  if (p.Costo_Unitario_Tiempo) parts.push(`${fmt(p.Costo_Unitario_Tiempo)}/min`);
  if (p.Costo_Unitario_Item) parts.push(`${fmt(p.Costo_Unitario_Item)}/unit`);
  return parts.length ? d(parts.join(' + ')) : d('$0');
}

// ── REPL ──
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: `${C.green}lodge>${C.reset} ` });

console.log(`${b(`${C.green}SF Lodge Pricing — Interactive Mode (v4 Events)`)}`);
console.log(d('Type "help" for commands, "items" to browse catalog\n'));

rl.prompt();
rl.on('line', async input => {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  if (!cmd) { rl.prompt(); return; }
  if (cmd === 'quit' || cmd === 'exit') { console.log('Bye!'); process.exit(0); }

  const fn = commands[cmd];
  if (fn) await fn(args);
  else console.log(`${C.red}Unknown command: ${cmd}. Type "help".${C.reset}`);

  rl.prompt();
});
