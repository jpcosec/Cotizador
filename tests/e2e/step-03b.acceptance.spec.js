import { expect, test } from '@playwright/test';

function factoryPanel(page) {
  return page.locator('aside.panel-factory');
}

function contextPanel(page) {
  return page.locator('aside.panel-context');
}

function catalogPanel(page) {
  return page.locator('section.panel-runtime:has(h3:has-text("Catalog"))');
}

function basketPanel(page) {
  return page.locator('section.panel-runtime:has(h3:has-text("Basket"))');
}

async function setGlobalPax(page, value) {
  const input = contextPanel(page).locator('.field:has(label:has-text("PAX global")) input');
  await input.fill(String(value));
}

async function addDbToFactoryAndShip(page) {
  const factory = factoryPanel(page);
  await factory.getByRole('button', { name: 'Add DB item' }).click();
  const card = factory.locator('.factory-card').last();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Ship' }).click();
}

async function addCustomToFactory(page, {
  name,
  perPax = 100,
  rule = null,
}) {
  const factory = factoryPanel(page);
  await factory.getByRole('button', { name: 'New custom' }).click();

  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();

  await modal.locator('input[x-model="customDraft.name"]').fill(name);
  await modal.locator('input[x-model="customDraft.porPersona"]').fill(String(perPax));
  await modal.locator('input[x-model="customDraft.porUnidad"]').fill('0');
  await modal.locator('input[x-model="customDraft.unidadesPorUsuario"]').fill('0');

  await modal.locator('input[x-model="customDraft.requierePax"]').check();
  await modal.locator('input[x-model="customDraft.requiereCant"]').uncheck();

  if (rule) {
    await modal.locator('input[x-model="customDraft.ruleEnabled"]').check();
    await modal.locator('select[x-model="customDraft.ruleType"]').selectOption(rule.type || 'WARNING');
    await modal.locator('select[x-model="customDraft.ruleField"]').selectOption(rule.field || 'pax');
    await modal.locator('select[x-model="customDraft.ruleOperator"]').selectOption(rule.operator || '>');
    await modal.locator('input[x-model="customDraft.ruleValue"]').fill(String(rule.value ?? 20));
    await modal.locator('input[x-model="customDraft.ruleMessage"]').fill(rule.message || 'Custom rule triggered');
  }

  await modal.getByRole('button', { name: 'Add to Factory' }).click();
  const customCard = factory.locator('.factory-card').filter({ hasText: name }).first();
  await expect(customCard).toBeVisible();
}

async function shipFactoryItemByName(page, name) {
  const factory = factoryPanel(page);
  const card = factory.locator('.factory-card').filter({ hasText: name }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Ship' }).click();
}

test.describe('step-03b acceptance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/step-03b');
  });

  test('shipping creates independent catalog and basket entities', async ({ page }) => {
    await addDbToFactoryAndShip(page);

    await expect(catalogPanel(page).locator('.runtime-card')).toHaveCount(1);
    await expect(basketPanel(page).locator('.runtime-card')).toHaveCount(1);

    const firstBasket = basketPanel(page).locator('.runtime-card').first();
    await firstBasket.getByRole('button', { name: 'Remove' }).click();

    await expect(catalogPanel(page).locator('.runtime-card')).toHaveCount(1);
    await expect(basketPanel(page).locator('.runtime-card')).toHaveCount(0);
  });

  test('non-overridden basket reacts to context; overridden basket stays locked', async ({ page }) => {
    const itemName = 'E2E Pax Item';
    await addCustomToFactory(page, { name: itemName, perPax: 100 });
    await shipFactoryItemByName(page, itemName);

    const basketCard = basketPanel(page).locator('.runtime-card').filter({ hasText: itemName }).first();
    const paxInput = basketCard.locator('input[type="number"]').first();

    await setGlobalPax(page, 30);
    await expect(paxInput).toHaveValue('30');
    await expect(basketCard).toContainText('$3.000');

    await paxInput.fill('50');
    await paxInput.press('Tab');
    await expect(paxInput).toHaveValue('50');

    await setGlobalPax(page, 80);
    await expect(paxInput).toHaveValue('50');
    await expect(basketCard).toContainText('$5.000');

    await basketCard.getByRole('button', { name: 'Reset overrides' }).click();
    await expect(paxInput).toHaveValue('80');

    await setGlobalPax(page, 25);
    await expect(paxInput).toHaveValue('25');
    await expect(basketCard).toContainText('$2.500');
  });

  test('rule indicator parity between catalog and basket', async ({ page }) => {
    const itemName = 'E2E Rule Item';
    await addCustomToFactory(page, {
      name: itemName,
      perPax: 10,
      rule: {
        type: 'WARNING',
        field: 'pax',
        operator: '>',
        value: 20,
        message: 'Pax high warning',
      },
    });
    await shipFactoryItemByName(page, itemName);

    await setGlobalPax(page, 30);

    const catalogCard = catalogPanel(page).locator('.runtime-card').filter({ hasText: itemName }).first();
    const basketCard = basketPanel(page).locator('.runtime-card').filter({ hasText: itemName }).first();
    const expectedRuleName = `Custom rule for ${itemName}`;

    const catalogIndicator = catalogCard.locator('.rules-indicator').first();
    await catalogIndicator.locator('.rules-dot').hover();
    await expect(catalogIndicator.locator('.rules-popover')).toBeVisible();
    await expect(catalogIndicator.locator('.popover-rule-row')).toContainText(expectedRuleName);
    await expect(catalogIndicator.locator('.popover-rule-row')).toHaveClass(/row-warn/);

    const basketIndicator = basketCard.locator('.rules-indicator').first();
    await basketIndicator.locator('.rules-dot').hover();
    await expect(basketIndicator.locator('.rules-popover')).toBeVisible();
    await expect(basketIndicator.locator('.popover-rule-row')).toContainText(expectedRuleName);
    await expect(basketIndicator.locator('.popover-rule-row')).toHaveClass(/row-warn/);
  });
});
