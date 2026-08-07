const test = require('node:test');
const assert = require('node:assert/strict');
const PROPERTIES = require('../js/properties.js');

const REQUIRED_STRING_FIELDS = ['id', 'title', 'city', 'citySlug', 'type', 'transaction', 'priceLabel'];
const VALID_TYPES = ['residencial', 'comercial'];
const VALID_CATEGORIES = ['villa-moderna', 'propriedade-historica', 'cobertura-penthouse', null];

test('PROPERTIES is a non-empty array', () => {
  assert.ok(Array.isArray(PROPERTIES));
  assert.ok(PROPERTIES.length > 0);
});

test('every property has the required string fields filled in', () => {
  PROPERTIES.forEach((property) => {
    REQUIRED_STRING_FIELDS.forEach((field) => {
      assert.equal(
        typeof property[field], 'string',
        `property "${property.id}" is missing string field "${field}"`
      );
      assert.ok(property[field].length > 0, `property "${property.id}" has empty "${field}"`);
    });
  });
});

test('every property id is unique', () => {
  const ids = PROPERTIES.map((property) => property.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

test('every property has a valid type and category', () => {
  PROPERTIES.forEach((property) => {
    assert.ok(VALID_TYPES.indexOf(property.type) !== -1, `property "${property.id}" has invalid type "${property.type}"`);
    assert.ok(
      VALID_CATEGORIES.indexOf(property.category) !== -1,
      `property "${property.id}" has invalid category "${property.category}"`
    );
  });
});

test('every property has price as a number or null, matching priceLabel', () => {
  PROPERTIES.forEach((property) => {
    assert.ok(
      property.price === null || typeof property.price === 'number',
      `property "${property.id}" has invalid price "${property.price}"`
    );
    if (property.price === null) {
      assert.equal(property.priceLabel, 'Sob Consulta', `property "${property.id}" has null price but priceLabel isn't "Sob Consulta"`);
    }
  });
});

test('every property has at least one image and a non-empty description', () => {
  PROPERTIES.forEach((property) => {
    assert.ok(Array.isArray(property.images) && property.images.length > 0, `property "${property.id}" has no images`);
    assert.ok(Array.isArray(property.description) && property.description.length > 0, `property "${property.id}" has no description`);
  });
});

test('at least one property exists for each nav filter used on the site (residencial, comercial)', () => {
  const types = PROPERTIES.map((property) => property.type);
  assert.ok(types.indexOf('residencial') !== -1);
  assert.ok(types.indexOf('comercial') !== -1);
});
