// Importe de los planes (pago único) desde la raíz del JSON del formulario
// (WEB-INTEGRACION 12-11 §3: payment_amount en euros, solo con payment_enabled = true): npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  extractPlanAmount,
  checkPlanAmount,
  referencePlanAmount,
  planIntervalWarning,
} from '../src/integrations/acciogest-catalog.mjs';

const fields = [{ label: 'Pago', type: 'payment', config: { amount: 125 } }];

test('lee payment_amount de la raíz con payment_enabled = true (euros, tal cual)', () => {
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 242 }), 242);
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 315 }), 315);
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 425 }), 425);
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: '315.00' }), 315);
});

test('sin payment_enabled = true no se lee la raíz (se pasa a fields[] o undefined)', () => {
  assert.equal(extractPlanAmount({ payment_enabled: false, payment_amount: 315 }), undefined);
  assert.equal(extractPlanAmount({ payment_amount: 315 }), undefined);
  assert.equal(extractPlanAmount({ payment_enabled: 'true', payment_amount: 315 }), undefined);
  assert.equal(extractPlanAmount({ payment_enabled: false, payment_amount: 315, fields }), 125);
});

test('payment_amount 0 o no numérico → undefined', () => {
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 0 }), undefined);
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 'gratis' }), undefined);
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: null }), undefined);
});

test('la raíz gana al campo de pago; sin raíz, se usa el campo (respaldo)', () => {
  assert.equal(extractPlanAmount({ payment_enabled: true, payment_amount: 315, fields }), 315);
  assert.equal(extractPlanAmount({ fields }), 125);
});

test('no se leen claves de raíz inventadas', () => {
  assert.equal(extractPlanAmount({ amount: 242 }), undefined);
  assert.equal(extractPlanAmount({ precio: '315,00' }), undefined);
  assert.equal(extractPlanAmount({ importe: '425.00' }), undefined);
  assert.equal(extractPlanAmount({ data: { amount: 242 } }), undefined);
  assert.equal(extractPlanAmount({ amount_cents: 24200 }), undefined);
});

test('sin importe válido → undefined', () => {
  assert.equal(extractPlanAmount({}), undefined);
  assert.equal(extractPlanAmount(null), undefined);
  assert.equal(extractPlanAmount([{ payment_enabled: true, payment_amount: 1 }]), undefined);
});

test('aviso si el plan tiene cobro recurrente (payment_interval no es null)', () => {
  assert.equal(planIntervalWarning({ payment_interval: null }, 'basico'), null);
  assert.equal(planIntervalWarning({}, 'premium'), null);
  assert.equal(planIntervalWarning(null, 'premium'), null);
  assert.match(
    planIntervalWarning({ payment_interval: 'month' }, 'basico') ?? '',
    /«basico» tiene cobro recurrente en AccioGest \(payment_interval="month"\); debe ser pago único/,
  );
  assert.ok(planIntervalWarning({ payment_interval: 'year' }, 'estandar'));
});

test('el fixture de los tres planes tiene la forma real', () => {
  const fx = JSON.parse(readFileSync(new URL('../scripts/acciogest-mock/plan-form.json', import.meta.url), 'utf8'));
  for (const [key, amount] of [['basico', 242], ['estandar', 315], ['premium', 425]]) {
    assert.equal(extractPlanAmount(fx[key]), amount, key);
    assert.equal(planIntervalWarning(fx[key], key), null, key);
    assert.equal(fx[key].payment_currency, 'EUR');
  }
});

test('control del importe frente a servicios.json', () => {
  assert.deepEqual(checkPlanAmount(242, 242), {});
  assert.deepEqual(checkPlanAmount(250, 242), {});
  assert.ok(checkPlanAmount(24200, 242).error);
  assert.ok(checkPlanAmount(500, 242).warning);
  assert.deepEqual(checkPlanAmount(24200, undefined), {});
});

test('importe de referencia por form_key', () => {
  const json = { x: [{ plans: [{ form_key: 'basico', amount: 242 }, { form_key: 'premium', amount: 425 }] }] };
  assert.equal(referencePlanAmount(json, 'premium'), 425);
  assert.equal(referencePlanAmount(json, 'estandar'), undefined);
});
