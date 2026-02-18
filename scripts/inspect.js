import { quotationMachineBlueprint } from '../src/Orchestration/quotationMachineBlueprint.js';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║     QUOTATION APPLICATION STATE MACHINE - VISUALIZATION    ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

const blueprint = quotationMachineBlueprint;

// Print states
console.log('📊 STATES:\n');
for (const [stateName, stateConfig] of Object.entries(blueprint.states)) {
  console.log(`  ▸ ${stateName}`);

  if (stateConfig.states) {
    // Hierarchical state - show substates
    for (const [substateName, substateConfig] of Object.entries(stateConfig.states)) {
      console.log(`      ├─ ${substateName}`);
      if (substateConfig.states) {
        for (const subsubstateName of Object.keys(substateConfig.states)) {
          console.log(`      │  ├─ ${subsubstateName}`);
        }
      }
      if (substateConfig.on) {
        for (const [event, transition] of Object.entries(substateConfig.on)) {
          const target = transition.target ? ` → ${transition.target}` : '';
          console.log(`      │  └─ ${event}${target}`);
        }
      }
    }
  }

  if (stateConfig.on) {
    for (const [event, transition] of Object.entries(stateConfig.on)) {
      const targetStr = transition.target ? ` → ${transition.target}` : '';
      const guardStr = transition.guard ? ` [guard: ${transition.guard}]` : '';
      console.log(`      • ${event}${guardStr}${targetStr}`);
      if (transition.actions && transition.actions.length > 0) {
        console.log(`        └─ actions: ${transition.actions.join(', ')}`);
      }
    }
  }
  console.log();
}

// Print context shape
console.log('📋 INITIAL CONTEXT:\n');
const context = blueprint.context;
console.log('  ' + JSON.stringify(context, null, 2).split('\n').join('\n  '));
console.log();

// Print flow
console.log('⚡ APPLICATION FLOW:\n');
console.log('  1. START AT "browse" (root hub)');
console.log('     ├─ VIEW_PREVIOUS_QUOTATIONS');
console.log('     ├─ START_NEW_QUOTATION → quotation.initialize');
console.log('     ├─ LOAD_QUOTATION → quotation.initialize');
console.log('     └─ MANAGE_DATABASE → database');
console.log();

console.log('  2. DATABASE (pause point)');
console.log('     ├─ ADD_CLIENT / ADD_CATALOG_ITEM / ADD_RULE / ADD_COMPOSITION');
console.log('     ├─ DONE_DATABASE_MANAGEMENT → browse');
console.log('     └─ RESUME_QUOTATION → quotation.basket [FULL RECALC]');
console.log();

console.log('  3. QUOTATION WORKFLOW');
console.log('     ├─ initialize (choose load/create)');
console.log('     │  ├─ loadingPrevious → basket');
console.log('     │  └─ creatingNew (ask client, pax, date, duration) → basket');
console.log('     │');
console.log('     ├─ basket (LEVEL 1 RECALCULATION - item-level)');
console.log('     │  ├─ ADD_ITEM');
console.log('     │  │  └─ Check rules → Expand compositions → Resolve defaults → Calc price → Update globals');
console.log('     │  ├─ UPDATE_ITEM');
console.log('     │  │  └─ Check compositions → Resolve defaults → Recalc price → Re-run rules → Update globals');
console.log('     │  ├─ REMOVE_ITEM');
console.log('     │  │  └─ Soft-delete → Update globals');
console.log('     │  ├─ PAUSE_TO_DATABASE → database');
console.log('     │  └─ ADVANCE_TO_VALIDATION → validation');
console.log('     │');
console.log('     ├─ validation (LEVEL 2 RECALCULATION - full from scratch)');
console.log('     │  ├─ Full recalc all items');
console.log('     │  ├─ Re-run all rules');
console.log('     │  ├─ Calculate final totals');
console.log('     │  ├─ Save quotation document');
console.log('     │  ├─ Generate PDF');
console.log('     │  └─ → completed');
console.log('     │');
console.log('     └─ completed → RETURN_TO_BROWSE');
console.log();

console.log('🛡️  GUARDS:\n');
console.log('  • canMutateBasket: quotation !== null');
console.log('  • canAdvanceToValidation: quotation initialized && no blocking errors');
console.log('  • canSaveQuotation: all items valid && prices calculated');
console.log('  • hasQuotationPaused: quotation context was saved before database');
console.log();

console.log('🔧 TWO LEVELS OF RECALCULATION:\n');
console.log('  LEVEL 1 (Basket - Item-level):');
console.log('    Triggered by: ADD_ITEM, UPDATE_ITEM, REMOVE_ITEM');
console.log('    Actions: expand → defaults → price → rules → update globals');
console.log('    Speed: Quick (incremental)');
console.log('    Scope: Just the affected item(s)');
console.log();
console.log('  LEVEL 2 (Validation - Full from scratch):');
console.log('    Triggered by: VALIDATE_AND_SAVE, RESUME_FROM_DATABASE');
console.log('    Actions: strip computed → defaults → price → all rules → taxes → save → generate PDF');
console.log('    Speed: Full deterministic replay');
console.log('    Scope: All items, all rules, all taxes');
console.log();

console.log('💡 KEY POINTS:\n');
console.log('  • Pause/Resume: Quotation context preserved when going to database');
console.log('  • Soft Deletes: Removed items stay in history for traceability');
console.log('  • Composition: UPDATE_ITEM checks if item is parent, re-expands children');
console.log('  • Database Changes: Resuming from database triggers full recalc (catch price changes)');
console.log('  • Event Sourcing: All basket changes are persisted for deterministic replay');
console.log();

console.log('📖 For interactive visualization, open Stately editor at:');
console.log('   https://stately.ai/editor\n');
