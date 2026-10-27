// Pruebas de la limpieza de textos del catálogo de AccioGest: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText } from '../src/integrations/acciogest-catalog.mjs';

const c = (s) => cleanText(s, 600);

test('quita etiquetas HTML normales', () => {
  assert.equal(c('Asesoría <b>online</b><br/>60 min'), 'Asesoría online 60 min');
  assert.equal(c('<p class="x">Hola</p>'), 'Hola');
});

test('quita etiquetas separadas con barra (sin espacio tras el nombre)', () => {
  assert.equal(c('Asesoría <img/src=x onerror=alert(1)>'), 'Asesoría');
  assert.equal(c('<svg/onload=alert(1)>Asesoría'), 'Asesoría');
  assert.ok(!/[<>]/.test(c('a <img/src=x onerror=alert(1)> b')));
});

test('quita una etiqueta sin cerrar y comentarios', () => {
  assert.equal(c('Asesoría <img src=x onerror=alert(1)'), 'Asesoría');
  assert.equal(c('Asesoría <!-- x --> online'), 'Asesoría online');
});

test('conserva < y > que no abren etiqueta', () => {
  assert.equal(c('menores de <18'), 'menores de <18');
  assert.equal(c('a < b > c'), 'a < b > c');
});

test('vacío o no texto → null', () => {
  assert.equal(c('<b></b>'), null);
  assert.equal(c(42), null);
});
