#!/usr/bin/env node

/**
 * Example: Create a quotation flow with QuotationService.
 *
 * This demonstrates the full workflow:
 * 1. Start a new quotation
 * 2. Add items to the basket
 * 3. Inspect and modify items
 * 4. Validate and save through adapter service
 *
 * Run: node examples/create-quotation.js
 */

import { QuotationService } from '../../src/QuotationService.js';
import { createSeededStore } from '../../tests/helpers/store_factory.js';

function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

async function main() {
  const service = new QuotationService({ store: createSeededStore() });

  console.log('\n' + '='.repeat(60));
  console.log('📝 Creating Corporate Seminar Quotation');
  console.log('='.repeat(60));

  // 1. Start new quotation
  console.log('\n✓ Step 1: Starting quotation for corporate event');
  console.log('  Client: CLI_CORP | Attendees: 25 | Date: 2025-06-15');

  const actor = service.startNew('CLI_CORP', 25, {
    fechaEvento: '2025-06-15',
    duracionDias: 1,
  });

  const state = service.getSnapshot();
  console.log(
    `  State: ${JSON.stringify(state.value.quotation_workflow).replace(/"/g, '')}`
  );

  // 2. Add items
  console.log('\n✓ Step 2: Adding items to quotation');
  const items = [
    { id: 'ITEM_CHINOOK', name: 'Salón Chinook' },
    { id: 'ITEM_COFFEE_BASIC', name: 'Café Básico' },
    { id: 'ITEM_ALMUERZO', name: 'Almuerzo' },
  ];

  items.forEach(item => {
    service.addItem(item.id);
    console.log(`  • Added: ${item.name}`);
  });

  // Debug: Check if items were actually added
  const snapAfterAdd = service.getSnapshot();
  if (!snapAfterAdd.context.lineas || snapAfterAdd.context.lineas.length === 0) {
    console.log('\n⚠ Warning: No items in basket after add. Checking store...');
    console.log(`  Store has ${snapAfterAdd.context.store.all('ITEM_CATALOGO').length} items in catalog`);
  }

  // 3. Inspect basket
  console.log('\n✓ Step 3: Current basket summary');
  const basket = service.inspect();

  console.log('  Items:');
  basket.items.forEach(item => {
    const status = item.removed ? ' [REMOVED]' : '';
    console.log(`    • ${item.item}: ${formatCLP(item.price)}${status}`);
  });

  console.log('\n  Totals:');
  console.log(`    Subtotal: ${formatCLP(basket.totals.subtotal)}`);
  basket.totals.taxes.forEach(tax => {
    console.log(`    Tax (${(tax.rate * 100).toFixed(0)}%): ${formatCLP(tax.amount)}`);
  });
  console.log(`    TOTAL: ${formatCLP(basket.totals.total)}`);

  // 4. Modify: increase pax (if items exist)
  if (basket.items.length > 0) {
    console.log('\n✓ Step 4: Modifying quotation - increasing pax from 25 → 35');
    const lineId = basket.items[0].id;
    service.updateItem(lineId, { Override_Pax: 35 });

    const updated = service.inspect();
    console.log(`  Updated total: ${formatCLP(updated.totals.total)}`);
    console.log(`  Price difference: ${formatCLP(updated.totals.total - basket.totals.total)}`);
  } else {
    console.log('\n⚠ Step 4: Skipping modification (no items in basket)');
  }

  // 5. Validate and save
  console.log('\n✓ Step 5: Validating and saving quotation');
  let result;
  try {
    result = service.validateAndSave();
    const quotationId = result.context.quotation.cotizacion.ID_Cotizacion;
    console.log(`  Saved quotation: ${quotationId}`);
    console.log(
      `  State: ${JSON.stringify(result.value.quotation_workflow).replace(/"/g, '')}`
    );
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    process.exit(1);
  }

  const finalSnapshot = service.getSnapshot();
  console.log('\n✓ Final snapshot');
  console.log(`  Items: ${finalSnapshot.context.lineas.length}`);
  console.log(`  Total: ${formatCLP(finalSnapshot.context.totals.total)}`);
  console.log(`  Estado: ${finalSnapshot.context.quotation.cotizacion.Estado}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Complete!');
  console.log('='.repeat(60) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
