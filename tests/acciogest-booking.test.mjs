// Reservas (WEB-INTEGRACION 12-11 §4): catálogo ausente (404), citaId numérico y setService: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unpublishedIn, bookingThanksUrl, setServiceInPlace } from '../src/lib/acciogest-helpers.mjs';

test('sin catálogo (/catalogo da 404) ningún id cuenta como despublicado', () => {
  for (const none of [null, undefined]) {
    const gone = unpublishedIn(none);
    assert.equal(gone('41'), false);
    assert.equal(gone(null), false);
  }
});

test('con catálogo, solo los ids que no están cuentan como despublicados', () => {
  const gone = unpublishedIn({ servicios: [{ id: '41' }] });
  assert.equal(gone('41'), false);
  assert.equal(gone('42'), true);
  assert.equal(gone(null), false);
});

test('citaId numérico → &cita=<n>; si no es un entero positivo, sin &cita=', () => {
  const t = '/gracias/?tipo=reserva';
  assert.equal(bookingThanksUrl(t, 123), '/gracias/?tipo=reserva&cita=123');
  assert.equal(bookingThanksUrl(t, '456'), '/gracias/?tipo=reserva&cita=456');
  assert.equal(bookingThanksUrl(t, null), t);
  assert.equal(bookingThanksUrl(t, 0), t);
  assert.equal(bookingThanksUrl(t, -3), t);
  assert.equal(bookingThanksUrl(t, 1.5), t);
  assert.equal(bookingThanksUrl(t, 'MOCK-1'), t);
});

test('setService: se usa si el script lo expone ("" → null); si no, respaldo', () => {
  const calls = [];
  const api = { setService: (id) => calls.push(id) };
  assert.equal(setServiceInPlace(api, '41'), true);
  assert.equal(setServiceInPlace(api, ''), true);
  assert.deepEqual(calls, ['41', null]);
  assert.equal(setServiceInPlace(undefined, '41'), false);
  assert.equal(setServiceInPlace({}, '41'), false);
});
