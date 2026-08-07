const test = require('node:test');
const assert = require('node:assert/strict');
const PropertyUtils = require('../js/property-utils.js');

test('filterProperties: no filters returns everything', () => {
  const props = [{ id: 'a' }, { id: 'b' }];
  assert.deepEqual(PropertyUtils.filterProperties(props, {}), props);
});

test('filterProperties: filters by tipo', () => {
  const props = [
    { id: 'a', type: 'residencial' },
    { id: 'b', type: 'comercial' },
  ];
  const result = PropertyUtils.filterProperties(props, { tipo: 'comercial' });
  assert.deepEqual(result.map(p => p.id), ['b']);
});

test('filterProperties: maxPrice excludes properties above the cap', () => {
  const props = [
    { id: 'a', price: 1000000 },
    { id: 'b', price: 9000000 },
  ];
  const result = PropertyUtils.filterProperties(props, { maxPrice: 5000000 });
  assert.deepEqual(result.map(p => p.id), ['a']);
});

test('filterProperties: maxPrice never excludes a property with price null (sob consulta)', () => {
  const props = [{ id: 'a', price: null }];
  const result = PropertyUtils.filterProperties(props, { maxPrice: 1000000 });
  assert.deepEqual(result.map(p => p.id), ['a']);
});

test('filterProperties: minSuites excludes properties with fewer suites', () => {
  const props = [
    { id: 'a', suites: 2 },
    { id: 'b', suites: 5 },
  ];
  const result = PropertyUtils.filterProperties(props, { minSuites: 5 });
  assert.deepEqual(result.map(p => p.id), ['b']);
});

test('filterProperties: citySlugs is OR — empty list means no city filter', () => {
  const props = [
    { id: 'a', citySlug: 'bel-air' },
    { id: 'b', citySlug: 'lago-de-como' },
  ];
  assert.deepEqual(
    PropertyUtils.filterProperties(props, { citySlugs: [] }).map(p => p.id),
    ['a', 'b']
  );
  assert.deepEqual(
    PropertyUtils.filterProperties(props, { citySlugs: ['bel-air'] }).map(p => p.id),
    ['a']
  );
});

test('filterProperties: amenities is OR — matches if property has any selected amenity', () => {
  const props = [
    { id: 'a', amenities: ['adega', 'cinema'] },
    { id: 'b', amenities: ['spa'] },
  ];
  const result = PropertyUtils.filterProperties(props, { amenities: ['spa', 'cinema'] });
  assert.deepEqual(result.map(p => p.id), ['a', 'b']);
});

test('filterProperties: combines filters with AND', () => {
  const props = [
    { id: 'a', type: 'residencial', price: 1000000, citySlug: 'bel-air' },
    { id: 'b', type: 'residencial', price: 1000000, citySlug: 'lago-de-como' },
  ];
  const result = PropertyUtils.filterProperties(props, {
    tipo: 'residencial',
    maxPrice: 2000000,
    citySlugs: ['bel-air'],
  });
  assert.deepEqual(result.map(p => p.id), ['a']);
});

test('formatCurrencyBRL formats with thousands separators and R$ prefix', () => {
  assert.equal(PropertyUtils.formatCurrencyBRL(18000000), 'R$ 18.000.000');
  assert.equal(PropertyUtils.formatCurrencyBRL(1000000), 'R$ 1.000.000');
});

test('buildWhatsAppMessage includes all provided fields in readable form', () => {
  const message = PropertyUtils.buildWhatsAppMessage({
    name: 'Ana Silva',
    email: 'ana@example.com',
    subject: 'Gestão de Portfólio',
    message: 'Quero saber mais.',
  });
  assert.match(message, /Ana Silva/);
  assert.match(message, /ana@example\.com/);
  assert.match(message, /Gestão de Portfólio/);
  assert.match(message, /Quero saber mais\./);
});

test('buildWhatsAppMessage includes propertyTitle when provided', () => {
  const message = PropertyUtils.buildWhatsAppMessage({
    name: 'Ana Silva',
    email: 'ana@example.com',
    propertyTitle: 'Residência Lumina',
  });
  assert.match(message, /Residência Lumina/);
});

test('buildWhatsAppLink URL-encodes the message and uses the given phone number', () => {
  const link = PropertyUtils.buildWhatsAppLink('5511999999999', 'Olá! Tudo bem?');
  assert.equal(link, 'https://wa.me/5511999999999?text=Ol%C3%A1!%20Tudo%20bem%3F');
});

test('buildSearchQuery only includes provided fields', () => {
  assert.equal(PropertyUtils.buildSearchQuery({}), '');
  assert.equal(
    PropertyUtils.buildSearchQuery({ citySlug: 'bel-air' }),
    'cidade=bel-air'
  );
  assert.equal(
    PropertyUtils.buildSearchQuery({ transaction: 'venda', category: 'villa-moderna', citySlug: 'bel-air' }),
    'transacao=venda&categoria=villa-moderna&cidade=bel-air'
  );
});

test('parseSearchParams reads tipo/transacao/categoria/cidade from a query string', () => {
  const parsed = PropertyUtils.parseSearchParams('?tipo=comercial&transacao=venda&categoria=villa-moderna&cidade=bel-air');
  assert.deepEqual(parsed, {
    tipo: 'comercial',
    transaction: 'venda',
    category: 'villa-moderna',
    citySlugs: ['bel-air'],
  });
});

test('parseSearchParams returns nulls/empty array when nothing is present', () => {
  assert.deepEqual(PropertyUtils.parseSearchParams(''), {
    tipo: null,
    transaction: null,
    category: null,
    citySlugs: [],
  });
});

test('pickSimilarProperties returns the N properties after currentId, wrapping around', () => {
  const props = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  assert.deepEqual(
    PropertyUtils.pickSimilarProperties(props, 'c', 3).map(p => p.id),
    ['d', 'a', 'b']
  );
});

test('pickSimilarProperties falls back to the first N properties when currentId is unknown', () => {
  const props = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(
    PropertyUtils.pickSimilarProperties(props, 'unknown', 2).map(p => p.id),
    ['a', 'b']
  );
});
