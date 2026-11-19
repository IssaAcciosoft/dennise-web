// Importe de los planes (cuota mensual) desde la raíz del JSON del formulario: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractPlanAmount, checkPlanAmount, referencePlanAmount } from '../src/integrations/acciogest-catalog.mjs';

test('lee el importe de la raíz (número o texto numérico)', () => {
  assert.equal(extractPlanAmount({ amount: 242 }), 242);
  assert.equal(extractPlanAmount({ precio: '315,00' }), 315);
  assert.equal(extractPlanAmount({ importe: '425.00' }), 425);
  assert.equal(extractPlanAmount({ price: 315.5 }), 315.5);
  assert.equal(extractPlanAmount({ data: { amount: 242 } }), 242);
  assert.equal(extractPlanAmount({ amount_cents: 24200 }), 242);
});

test('la raíz gana al campo de pago; sin raíz, se usa el campo (forma anterior)', () => {
  const fields = [{ label: 'Pago', type: 'payment', config: { amount: 125 } }];
  assert.equal(extractPlanAmount({ amount: 242, fields }), 242);
  assert.equal(extractPlanAmount({ fields }), 125);
});

test('sin importe válido → undefined', () => {
  assert.equal(extractPlanAmount({}), undefined);
  assert.equal(extractPlanAmount({ amount: 0 }), undefined);
  assert.equal(extractPlanAmount({ amount: 'gratis' }), undefined);
  assert.equal(extractPlanAmount(null), undefined);
  assert.equal(extractPlanAmount([{ amount: 1 }]), undefined);
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
