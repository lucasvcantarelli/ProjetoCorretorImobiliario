# Property Data, Working Filters, WhatsApp & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every property card link to its own real imóvel, make the home search bar and listagem.html filters actually filter, send the contato.html form via WhatsApp, and add a working "Voltar" button on detalhes.html.

**Architecture:** A single hand-editable data file (`js/properties.js`) becomes the source of truth for every imóvel on the site. A small set of pure, framework-free helper functions (`js/property-utils.js`) does the filtering/formatting logic and is unit-tested with Node's built-in test runner (no dependencies to install). Two page-specific scripts (`js/listagem.js`, `js/detalhes.js`) wire that logic to the DOM. Existing static HTML cards are kept (to preserve the hand-tuned layout) but gain `data-*` attributes so they can be found and filtered.

**Tech Stack:** Vanilla JS (ES5-compatible, no build step, loaded via plain `<script>` tags), Tailwind CDN (already in use), Node.js built-in test runner (`node --test`) for the pure logic — no npm packages, no `package.json` needed.

## Global Constraints

- No build step / bundler / npm dependency — every script is a plain file loaded via `<script src="...">`, exactly like the existing `js/scripts.js`.
- All user-facing text stays in Portuguese (pt-BR), matching the rest of the site.
- Reuse existing Tailwind design tokens/colors already defined in each page's `tailwind.config` (e.g. `primary`, `outline-variant`, `secondary`) — do not introduce new colors.
- `js/property-utils.js` functions must be pure (no DOM access) so they run identically under Node (for tests) and in the browser. Export via the UMD-style guard shown in Task 1 — do not use `import`/`export` (no build step to transpile them).
- The WhatsApp number lives in exactly one place: the `WHATSAPP_NUMBER` constant in `js/scripts.js`.
- No property in `js/properties.js` may invent inventory that doesn't already exist on the site (transaction is always `'venda'` — there is no rental stock) — empty filter results are the honest, correct outcome, not a bug to work around.
- Every new/edited page must still open correctly as a static file served by `python -m http.server` (no server-side code anywhere).

---

## File Structure

**Create:**
- `js/property-utils.js` — pure filtering/formatting functions, used by both the browser and the Node tests.
- `js/properties.js` — the single array of imóvel data (`PROPERTIES`).
- `js/listagem.js` — wires the sidebar filters + tipo pills + URL params to the DOM on `listagem.html`.
- `js/detalhes.js` — reads `?id=` and renders the whole `detalhes.html` content from `PROPERTIES`; wires the "Voltar" button.
- `tests/property-utils.test.js` — Node test suite for `js/property-utils.js`.
- `tests/properties-data.test.js` — Node test suite validating `js/properties.js` schema integrity.

**Modify:**
- `index.html` — script includes, featured-card links (`?id=`), hero search dropdown values, nav Residencial/Comercial hrefs.
- `listagem.html` — script includes, `data-*` attributes + 2 new commercial cards, missing "Cidade do Cabo" checkbox, tipo pills, empty-state markup, filter-chips container, remove pagination, remove "Detalhes" nav item, fix Residencial/Comercial hrefs.
- `detalhes.html` — script includes, replace hardcoded content with empty containers `detalhes.js` fills in, add "Voltar" button, remove "Detalhes" nav item, fix Residencial/Comercial hrefs.
- `contato.html` — script includes, WhatsApp form wiring, remove "Detalhes" nav item, fix Residencial/Comercial hrefs.
- `js/scripts.js` — add `WHATSAPP_NUMBER` constant + contato.html form submit handler + index.html hero search handler.

---

### Task 1: Pure utility functions (`js/property-utils.js`)

**Files:**
- Create: `js/property-utils.js`
- Test: `tests/property-utils.test.js`

**Interfaces:**
- Produces (used by Tasks 4, 6, 7, 8, `js/scripts.js`):
  - `PropertyUtils.filterProperties(properties, filters)` → filtered array. `filters` is a plain object, all keys optional: `{ tipo, transaction, category, maxPrice, minSuites, citySlugs: string[], amenities: string[] }`.
  - `PropertyUtils.formatCurrencyBRL(value)` → `"R$ 18.000.000"` (string).
  - `PropertyUtils.buildWhatsAppMessage(fields)` → formatted string. `fields`: `{ name, email, subject, message, propertyTitle }` (all optional except `name`/`email`).
  - `PropertyUtils.buildWhatsAppLink(phoneNumber, message)` → `"https://wa.me/<phoneNumber>?text=<encoded>"`.
  - `PropertyUtils.buildSearchQuery(selection)` → query string (no leading `?`). `selection`: `{ transaction, category, citySlug }`.
  - `PropertyUtils.parseSearchParams(searchString)` → `{ tipo, transaction, category, citySlugs: string[] }`.
  - `PropertyUtils.pickSimilarProperties(properties, currentId, count)` → array of `count` properties, the ones immediately following `currentId` in array order (wraps around), excluding `currentId` itself.

- [ ] **Step 1: Write the failing tests**

Create `tests/property-utils.test.js`:

```js
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/property-utils.test.js`
Expected: FAIL — `Cannot find module '../js/property-utils.js'`

- [ ] **Step 3: Write the implementation**

Create `js/property-utils.js`:

```js
/**
 * ARQUIVO: property-utils.js
 * DESCRIÇÃO: Funções puras (sem acesso ao DOM) para filtrar imóveis e formatar
 * mensagens. Funcionam tanto no navegador (window.PropertyUtils) quanto no
 * Node (para os testes em tests/property-utils.test.js), sem depender de
 * nenhuma ferramenta de build.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PropertyUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function filterProperties(properties, filters) {
    filters = filters || {};
    return properties.filter(function (property) {
      if (filters.tipo && property.type !== filters.tipo) {
        return false;
      }
      if (filters.transaction && property.transaction !== filters.transaction) {
        return false;
      }
      if (filters.category && property.category !== filters.category) {
        return false;
      }
      if (
        typeof filters.maxPrice === 'number' &&
        typeof property.price === 'number' &&
        property.price > filters.maxPrice
      ) {
        return false;
      }
      if (
        typeof filters.minSuites === 'number' &&
        typeof property.suites === 'number' &&
        property.suites < filters.minSuites
      ) {
        return false;
      }
      if (filters.citySlugs && filters.citySlugs.length > 0) {
        if (filters.citySlugs.indexOf(property.citySlug) === -1) {
          return false;
        }
      }
      if (filters.amenities && filters.amenities.length > 0) {
        var propertyAmenities = property.amenities || [];
        var hasAny = filters.amenities.some(function (amenity) {
          return propertyAmenities.indexOf(amenity) !== -1;
        });
        if (!hasAny) {
          return false;
        }
      }
      return true;
    });
  }

  function formatCurrencyBRL(value) {
    return 'R$ ' + Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }

  function buildWhatsAppMessage(fields) {
    fields = fields || {};
    var lines = [];
    lines.push('Olá! Meu nome é ' + fields.name + '.');
    lines.push('E-mail: ' + fields.email);
    if (fields.propertyTitle) {
      lines.push('Imóvel de interesse: ' + fields.propertyTitle);
    }
    if (fields.subject) {
      lines.push('Assunto: ' + fields.subject);
    }
    if (fields.message) {
      lines.push('Mensagem: ' + fields.message);
    }
    return lines.join('\n');
  }

  function buildWhatsAppLink(phoneNumber, message) {
    return 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
  }

  function buildSearchQuery(selection) {
    selection = selection || {};
    var params = new URLSearchParams();
    if (selection.transaction) {
      params.set('transacao', selection.transaction);
    }
    if (selection.category) {
      params.set('categoria', selection.category);
    }
    if (selection.citySlug) {
      params.set('cidade', selection.citySlug);
    }
    return params.toString();
  }

  function parseSearchParams(searchString) {
    var params = new URLSearchParams(searchString || '');
    var cidade = params.get('cidade');
    return {
      tipo: params.get('tipo') || null,
      transaction: params.get('transacao') || null,
      category: params.get('categoria') || null,
      citySlugs: cidade ? [cidade] : [],
    };
  }

  function pickSimilarProperties(properties, currentId, count) {
    var currentIndex = properties.findIndex(function (property) {
      return property.id === currentId;
    });
    if (currentIndex === -1) {
      return properties.slice(0, count);
    }
    var result = [];
    for (var offset = 1; offset < properties.length && result.length < count; offset++) {
      result.push(properties[(currentIndex + offset) % properties.length]);
    }
    return result;
  }

  return {
    filterProperties: filterProperties,
    formatCurrencyBRL: formatCurrencyBRL,
    buildWhatsAppMessage: buildWhatsAppMessage,
    buildWhatsAppLink: buildWhatsAppLink,
    buildSearchQuery: buildSearchQuery,
    parseSearchParams: parseSearchParams,
    pickSimilarProperties: pickSimilarProperties,
  };
}));
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/property-utils.test.js`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add js/property-utils.js tests/property-utils.test.js
git commit -m "feat: add pure property filtering/formatting utilities with tests"
```

---

### Task 2: Property data (`js/properties.js`)

**Files:**
- Create: `js/properties.js`
- Test: `tests/properties-data.test.js`

**Interfaces:**
- Consumes: nothing (plain data).
- Produces (used by Tasks 4, 5, 6, 7, 8): global `PROPERTIES` array (browser) / `module.exports` (Node). Each item has the shape documented in the comment at the top of the file: `id, title, city, citySlug, category, type, transaction, price, priceLabel, suites, parkingSpots, areaM2, pool, badge, images, description, amenities`.

- [ ] **Step 1: Write the failing test**

Create `tests/properties-data.test.js`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/properties-data.test.js`
Expected: FAIL — `Cannot find module '../js/properties.js'`

- [ ] **Step 3: Write the data file**

Create `js/properties.js`:

```js
/**
 * ARQUIVO: properties.js
 * DESCRIÇÃO: Fonte única dos dados de imóveis do site. Para adicionar um
 * imóvel novo, adicione um objeto ao array PROPERTIES — nenhum outro
 * arquivo precisa mudar. Para trocar por dados reais/uma API no futuro,
 * troque só este arquivo por algo que preencha o mesmo array (mesmos
 * campos, mesmos tipos).
 *
 * Campos de cada imóvel:
 *   id           string   único, usado na URL (detalhes.html?id=<id>)
 *   title        string   nome do imóvel
 *   city         string   texto de exibição, ex: "Bel Air, Califórnia"
 *   citySlug     string   usado nos filtros (checkboxes/URL), ex: "bel-air"
 *   category     string|null  'villa-moderna' | 'propriedade-historica' | 'cobertura-penthouse' | null
 *   type         string   'residencial' | 'comercial'
 *   transaction  string   'venda' | 'aluguel' (hoje só existe estoque 'venda')
 *   price        number|null  valor em BRL, ou null quando for "Sob Consulta"
 *   priceLabel   string   texto pronto para exibir, ex: "R$ 12.500.000" ou "Sob Consulta"
 *   suites       number   nº de suítes (imóveis comerciais usam este campo para salas/unidades)
 *   parkingSpots number   nº de vagas
 *   areaM2       number   área em m²
 *   pool         boolean  tem piscina/lazer aquático
 *   badge        string|null  selo mostrado nos cards, ex: "Disponível" (null = sem selo)
 *   images       string[] 1 a 3 URLs de imagem (detalhes.html se adapta à quantidade)
 *   description  string[] 1 ou mais parágrafos para a página de detalhes
 *   amenities    string[] tokens batendo com os chips de infraestrutura da listagem:
 *                         'casa-inteligente' | 'spa' | 'adega' | 'cinema' (pode ter outros,
 *                         usados só na página de detalhes, não nos filtros)
 */
var PROPERTIES = [
  {
    id: 'pavilhao-vidro',
    title: 'O Pavilhão de Vidro',
    city: 'Mayfair, Londres',
    citySlug: 'mayfair-londres',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 12500000,
    priceLabel: 'R$ 12.500.000',
    suites: 5,
    parkingSpots: 4,
    areaM2: 620,
    pool: true,
    badge: 'Disponível',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDbyd7peaHqU2owI_xyaaoqKAdXwc527Jq2RF8WZ7pOBOBEXlcDTXViqoeT7p5FMzMfBbNm4gXdL7Wrxx5rYwNeZwnhDRgjYI5DzvOHpIAiguUdpsQk0wBVsVwch4Xnl8VC5IQ_7GpVhXPw4tlL4kO7aSdds0oRGPKxRoEDC5CVOOK0fO0hRIGdTBefvx8f59uvzmJmng6FBJv0kldSun3b2SRgVizLqRGuhp2RZZ9Fhmc706ypWj2SP8V41Kdg7acTuMwR9qTisT4v',
    ],
    description: [
      'Um pavilhão contemporâneo de vidro e aço no coração de Mayfair, onde amplos vãos envidraçados emolduram vistas privilegiadas do bairro mais discreto de Londres.',
    ],
    amenities: ['adega', 'cinema'],
  },
  {
    id: 'azure-heights',
    title: 'Azure Heights',
    city: 'Monte Carlo, Mônaco',
    citySlug: 'monte-carlo-monaco',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 18200000,
    priceLabel: 'R$ 18.200.000',
    suites: 7,
    parkingSpots: 6,
    areaM2: 980,
    pool: true,
    badge: 'Portfólio',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTlQ7Z2Ba2d172d0rM1gbHEuNAQpoK27c5dLYd9cjXyYlerSj_54eMnVrwtF2TuzF6bQ3SY1Hit2bxRrvwf_T5XM19f6mGYjRAR-8DsOLvJfq67i8P7mwAG9MJeNuKKxQuZ3nx3DuDXZGJNsCtG4PCfbOQwOqdhkdX5qqIXkgU6K-uUJenzM932h6Q52oKWQAs4bRE1SQp6Jz-65clIBrV_3D8fwAvwZQmcJHUROqG5qeSDtKFjkzZAT1fSVHpyk3KozJ0vZ5LjGv',
    ],
    description: [
      'Uma mansão à beira-mar em Monte Carlo, com terraços em cascata e acabamentos em mármore que traduzem o glamour atemporal do Mediterrâneo.',
    ],
    amenities: ['spa', 'casa-inteligente'],
  },
  {
    id: 'suite-obsidian',
    title: 'Suíte Obsidian',
    city: 'Upper East Side, Nova York',
    citySlug: 'upper-east-side-ny',
    category: 'cobertura-penthouse',
    type: 'residencial',
    transaction: 'venda',
    price: 9800000,
    priceLabel: 'R$ 9.800.000',
    suites: 3,
    parkingSpots: 2,
    areaM2: 410,
    pool: false,
    badge: 'Lançamento',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiumEjrO9frkyQrIsIaL9z3PfjDntycc1aM_naNjwXMwcb5ZCzDAzfja0Pnsto_KT5UXZP6_TdONJa39ITYRVF3HnDnbmssnXLI8UxjHh8uYrUcbKf186cL4sGYjvTH-tJI9vkYrNY0XOpyt88hKud2Cr62oxOmq34vuZGVBjZA_BGQVHIen8uOtbgug4PU1QvIHyaPZ1meabl3heyD-IL7L0zOlZmKfwMzdL6OG_1KLzRotGX80pg46JfloW4qHDXMte-Cxn-lZ3C',
    ],
    description: [
      'Uma suíte penthouse no Upper East Side, com cozinha contemporânea integrada e vista panorâmica para o skyline de Nova York.',
    ],
    amenities: ['cinema'],
  },
  {
    id: 'obsidian-pavilion',
    title: 'The Obsidian Pavilion',
    city: 'Bel Air, Califórnia',
    citySlug: 'bel-air',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 28500000,
    priceLabel: 'R$ 28.500.000',
    suites: 7,
    parkingSpots: 12,
    areaM2: 1718,
    pool: true,
    badge: 'Novo Lançamento',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCiumEjrO9frkyQrIsIaL9z3PfjDntycc1aM_naNjwXMwcb5ZCzDAzfja0Pnsto_KT5UXZP6_TdONJa39ITYRVF3HnDnbmssnXLI8UxjHh8uYrUcbKf186cL4sGYjvTH-tJI9vkYrNY0XOpyt88hKud2Cr62oxOmq34vuZGVBjZA_BGQVHIen8uOtbgug4PU1QvIHyaPZ1meabl3heyD-IL7L0zOlZmKfwMzdL6OG_1KLzRotGX80pg46JfloW4qHDXMte-Cxn-lZ3C',
    ],
    description: [
      'Uma vila moderna ultra-luxuosa em Bel Air, com 12 vagas cobertas, spa privativo e integração total de automação residencial.',
    ],
    amenities: ['casa-inteligente', 'adega'],
  },
  {
    id: 'villa-lheritage',
    title: "Villa L'Héritage",
    city: 'Saint-Jean-Cap-Ferrat, França',
    citySlug: 'saint-jean-cap-ferrat',
    category: 'propriedade-historica',
    type: 'residencial',
    transaction: 'venda',
    price: 14200000,
    priceLabel: 'R$ 14.200.000',
    suites: 5,
    parkingSpots: 6,
    areaM2: 855,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-4VeZYfL0FZMR_nkzgplKPh94CfOXPXr4qZKpMQWAMB62frMJBZAJhOOzSV4BYw7Ktsp3FtVgjPz7pJV0yqycrkkDiVDNwKzfB6FgrTHUXvaRjPkRLD5hXoPoWkq4Ejsn6vu7hqqQmvar4oT8yegP71krGx8Qk3EB2DyuPbePBLP0JrvlNjGamWmtH-oRoCl_B0UyvzXiP0K155s73I8H11PVteMzrkiY5FoT5nkpEG8tUUvS21_0qfalYQo7S5_bg41G3QkH-JZm',
    ],
    description: [
      'Uma propriedade histórica na Riviera Francesa, restaurada com rigor artesanal e jardins projetados de frente para o Mediterrâneo.',
    ],
    amenities: ['adega', 'cinema'],
  },
  {
    id: 'azure-lake-house',
    title: 'Azure Lake House',
    city: 'Lago de Como, Itália',
    citySlug: 'lago-de-como',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 21800000,
    priceLabel: 'R$ 21.800.000',
    suites: 6,
    parkingSpots: 4,
    areaM2: 1059,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB1wIMMwgbiUaEivNxGk6_kmeZ6HeP7fmfe6EICzF490ULHZhgX62lnsT0G48T4ifFDCH2VaPvjRTxrP4vD_rrJIHgQXdZlGmOmtbxg9V_pQ0y1qWJVY4pN23KBdiRw_0EPmJQx5ZC93upG5GtnThg3rq0ULTbcDcy3ECcG0qSszrHK7pch5wiazjRkyZ72_JIEOSK5HdL0FbHIZGOpw2iakR9xeISck5ePLYaZut58NjlRvufBn_pLKFMEre8i1A6jkYf5TL-7RIVu',
    ],
    description: [
      'Uma mansão contemporânea de frente para o Lago de Como, com cais privativo e vãos de vidro que dissolvem a fronteira entre casa e paisagem.',
    ],
    amenities: ['spa', 'cinema'],
  },
  {
    id: 'cliff-pavilion',
    title: 'The Cliff Pavilion',
    city: 'Cidade do Cabo, África do Sul',
    citySlug: 'cidade-do-cabo',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 9500000,
    priceLabel: 'R$ 9.500.000',
    suites: 4,
    parkingSpots: 3,
    areaM2: 632,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5bzA21kfpaGXY_rMWfNsy9OnXGX8-0KbFFY-3gVYOjj7P2SB_jeIjyqvyIn9PVZVIkzT-hWPrzf405rSQo4oRkt-y6GbYZw7tf9uw3P7XmhWdhUSwmVEJ37DKbD9hsNVG1rRFZUEyFlW5UxZXaWiYBVMdz9RzjhHfXWsmf1q9IoMh5nn7bsTd0nSIxjOaE5qtF27JjZcTbT1_TK0YEp9wk3axomdqcjlnUKiw8hDOAeFCrA5I6I9ln9rRA-FxUcF7If8nzgB_nQbg',
    ],
    description: [
      'Um pavilhão moderno erguido sobre uma encosta rochosa em Cidade do Cabo, com piscina de borda infinita voltada para o Atlântico.',
    ],
    amenities: ['casa-inteligente', 'spa'],
  },
  {
    id: 'residencia-lumina',
    title: 'Residência Lumina',
    city: 'Jardim Europa, São Paulo',
    citySlug: 'jardim-europa-sp',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 18500000,
    priceLabel: 'R$ 18.500.000',
    suites: 5,
    parkingSpots: 8,
    areaM2: 1250,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBqibbf1tE526Q1ua-1gMGHsKMI8lFjZw3IDqs4b_2phvXItXiY8y94NeKFZvYAvHzi9iy9Z-_DUryP7NyqQzqX47xRdHw76WGeEzGPTbnic5W2lNv2BeOC6SczviIfNTAWmKfY7Xh-dU5-GvUIVXZRILcD1VB_k2C_wfAYC1oMx0PS-jbOpibbRHUmP9947GuDYHvDnh4KXd0gt47hokKuClL6VtU8kAbmP7kQAJfNnJbz7YeG5fRCdcJhUpTdBjL7IM1b4bo03ysH',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3I0k-UxcT6Cwv7mWBq1k_IjKx4bUVB75rQUXaXADyaWqqDvl8ElQTkXi41bVn1Dvgd08wq5mFj9auShFtneBU1rkuOwXJnlYkokEtVmHELkgr0ze0IZ02WWywkoZ2qiLzlz0wZPE9aj1H9UfPSVkah5nX8NFqacXJVWjV5j8Q5bFgCHDkID69XtihKa0g9gDsdy2nDJ9NASUv13j91V5jUl1CXSVnnbtGgth72swMPZ-83ImMm8J8Bj5EMAhSdovItBACPqoao56d',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCcQHDpcQuuLOWG6qZoNAVaDMFrmc7SDbyy5LiNo9ZdcITuFY9Ad6mwxwZmtt1g8dy_inkK1bYylVIZhHJoIuJKYJEhHyOL3wUCP7f1TAVT4LKkh_jLqIkJwCBVWzQFZa23jeIlBreSenKoMw8cFBDLmVzGBvCWSg9KabZKnnlXZr6qRF77t8ciH-9wgE1QV6UScK75iN3ZKLIM_Qe2Ol9YLHTPvhSSMfL8O_0O20PigftjUDt4VFSmBw7y2mCWc4NOVk8s3Yy-iwnr',
    ],
    description: [
      'Uma obra-prima da arquitetura contemporânea localizada no coração do Jardim Europa. A Residência Lumina foi concebida para integrar a sofisticação urbana com a tranquilidade da natureza privativa. Seus amplos vãos de vidro permitem que a luz natural flua através de cada ambiente, destacando os acabamentos em mármore Travertino e madeira nobre.',
      'O projeto paisagístico assinado envolve toda a residência, criando microclimas de serenidade em meio à metrópole. Cada detalhe foi meticulosamente planejado para oferecer uma experiência de moradia inigualável, onde o conforto encontra o design atemporal.',
    ],
    amenities: ['adega', 'cinema', 'spa', 'automacao', 'gourmet', 'academia'],
  },
  {
    id: 'penthouse-horizon',
    title: 'Penthouse Horizon',
    city: 'Itaim Bibi, São Paulo',
    citySlug: 'itaim-bibi-sp',
    category: 'cobertura-penthouse',
    type: 'residencial',
    transaction: 'venda',
    price: null,
    priceLabel: 'Sob Consulta',
    suites: 4,
    parkingSpots: 3,
    areaM2: 850,
    pool: false,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo4VVqmBCcGM5vJXuOG0PrsX53F_zK_zTQQ4aiBDnmU_Zi6CLWy2VafSVuVIXzsNVlN_PFKieDLrk4oFqBU4_7d-svnwfMNAWp6b18dBuf0aoOMKFJ7rVqscKMjP9gVM7F3kNHrr_D8bqlYgFamfG0Q4H6O_NlIpYgvhBSVFfPkvNS4rx9DghVuZH3zpPgXO9G1ameacqfodUUyYgU6ScVnfDKaUNVlGCv2IrnhcIQXxUB61gkPcwyG_6Ysj0mM6_jaW66U6fqfLWl',
    ],
    description: [
      'Um penthouse assinado no Itaim Bibi, com terraço gourmet e vista aberta para o horizonte de São Paulo — valor sob consulta para clientes qualificados.',
    ],
    amenities: ['casa-inteligente'],
  },
  {
    id: 'mansao-oasis-urbano',
    title: 'Mansão Oásis Urbano',
    city: 'Cidade Jardim, São Paulo',
    citySlug: 'cidade-jardim-sp',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 22000000,
    priceLabel: 'R$ 22.000.000',
    suites: 6,
    parkingSpots: 8,
    areaM2: 1400,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAUy5by3xbXqr0WZAjGp7QSQ1ylspYGKeFxI5YgMrMW2Kk4_YSTALXRj8DULKpoPg0OjoTqkzX8ie3wOHpFjPlvJjK8dY36cuTMjQ-rYJLM-gq3osCyQ_9xTV_jBq5Q8c3ltV8SeH5b-RwD8sbSMyUzXz9ZiX0HKSiGW9n13hC54OvAkhjVYrh7vVIHBYobirmY9O0jxWbL_KO8VlpCD0A6_-wijUuC1fWMpPoGLVByByItmAZH_gF4_xTjFnCVHPY4WuoGPMvBbyUv',
    ],
    description: [
      'Uma mansão urbana na Cidade Jardim, com paisagismo assinado e espaços de convivência pensados para grandes eventos privados.',
    ],
    amenities: ['spa', 'adega'],
  },
  {
    id: 'villa-serenita',
    title: 'Villa Serenità',
    city: 'Alto de Pinheiros, São Paulo',
    citySlug: 'alto-de-pinheiros-sp',
    category: 'villa-moderna',
    type: 'residencial',
    transaction: 'venda',
    price: 15800000,
    priceLabel: 'R$ 15.800.000',
    suites: 5,
    parkingSpots: 5,
    areaM2: 920,
    pool: true,
    badge: null,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAusVx-_2dkZNlS6rOE0P4N0QnsspN6If410apEOoF3GFebWUlWtBecVdG3n6DMJueIVEl840xaA7-NgeJWSkf1nEw8sMwZfPdw8s16W5SK8M1-jlIIczN-qpCggjcGJqb55S-4aXiDxD3e-LhAQHTSlAso3H3joqibbdMrTCWl357lzPK7SCfuxLprk61GFmoTTP0pyyhE_n32ya_xLtXdVXM9oA-O3k_GiTyVMxuuYI1e85t2MxMsUzy17D8SCLYCaAw-wSkr6DrG',
    ],
    description: [
      'Uma villa serena no Alto de Pinheiros, equilibrando arquitetura contemporânea e áreas verdes privativas em um dos endereços mais cobiçados de São Paulo.',
    ],
    amenities: ['cinema', 'casa-inteligente'],
  },
  {
    id: 'edificio-corporativo-aurora',
    title: 'Edifício Corporativo Aurora',
    city: 'Faria Lima, São Paulo',
    citySlug: 'faria-lima-sp',
    category: null,
    type: 'comercial',
    transaction: 'venda',
    price: 45000000,
    priceLabel: 'R$ 45.000.000',
    suites: 48,
    parkingSpots: 120,
    areaM2: 3200,
    pool: false,
    badge: 'Alto Padrão Corporativo',
    images: [
      // Imagem placeholder reaproveitada do imóvel "azure-heights" — trocar pela foto real do prédio.
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvTlQ7Z2Ba2d172d0rM1gbHEuNAQpoK27c5dLYd9cjXyYlerSj_54eMnVrwtF2TuzF6bQ3SY1Hit2bxRrvwf_T5XM19f6mGYjRAR-8DsOLvJfq67i8P7mwAG9MJeNuKKxQuZ3nx3DuDXZGJNsCtG4PCfbOQwOqdhkdX5qqIXkgU6K-uUJenzM932h6Q52oKWQAs4bRE1SQp6Jz-65clIBrV_3D8fwAvwZQmcJHUROqG5qeSDtKFjkzZAT1fSVHpyk3KozJ0vZ5LjGv',
    ],
    description: [
      'Um edifício corporativo de alto padrão na Faria Lima, com lajes corporativas flexíveis, heliponto e certificação de sustentabilidade internacional.',
    ],
    amenities: [],
  },
  {
    id: 'flagship-retail-prime',
    title: 'Flagship Retail Prime',
    city: 'Oscar Freire, São Paulo',
    citySlug: 'oscar-freire-sp',
    category: null,
    type: 'comercial',
    transaction: 'venda',
    price: 32000000,
    priceLabel: 'R$ 32.000.000',
    suites: 1,
    parkingSpots: 15,
    areaM2: 850,
    pool: false,
    badge: 'Ponto Comercial Premium',
    images: [
      // Imagem placeholder reaproveitada do imóvel "villa-lheritage" — trocar pela foto real da loja.
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-4VeZYfL0FZMR_nkzgplKPh94CfOXPXr4qZKpMQWAMB62frMJBZAJhOOzSV4BYw7Ktsp3FtVgjPz7pJV0yqycrkkDiVDNwKzfB6FgrTHUXvaRjPkRLD5hXoPoWkq4Ejsn6vu7hqqQmvar4oT8yegP71krGx8Qk3EB2DyuPbePBLP0JrvlNjGamWmtH-oRoCl_B0UyvzXiP0K155s73I8H11PVteMzrkiY5FoT5nkpEG8tUUvS21_0qfalYQo7S5_bg41G3QkH-JZm',
    ],
    description: [
      'Um ponto comercial flagship na Oscar Freire, com vitrine dupla altura e fluxo privilegiado na principal rua de luxo de São Paulo.',
    ],
    amenities: [],
  },
];

if (typeof module === 'object' && module.exports) {
  module.exports = PROPERTIES;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/properties-data.test.js`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add js/properties.js tests/properties-data.test.js
git commit -m "feat: add single-source property data file with schema tests"
```

---

### Task 3: `index.html` — real links, working hero search

**Files:**
- Modify: `index.html`
- Modify: `js/scripts.js`

**Interfaces:**
- Consumes: `PropertyUtils.buildSearchQuery` (Task 1), loaded via `<script src="js/property-utils.js">`.

- [ ] **Step 1: Add the script include**

In `index.html`, change (line 304):

```html
<script defer="" src="js/scripts.js"></script>
```

to:

```html
<script defer="" src="js/property-utils.js"></script>
<script defer="" src="js/scripts.js"></script>
```

- [ ] **Step 2: Point the featured cards at real imóveis**

In `index.html`, change the three card links (lines 195, 211, 227) from:

```html
<a class="group cursor-pointer" href="detalhes.html">
```

to (respectively, matching each card's imóvel from `js/properties.js`):

```html
<a class="group cursor-pointer" href="detalhes.html?id=pavilhao-vidro">
```
```html
<a class="group cursor-pointer" href="detalhes.html?id=azure-heights">
```
```html
<a class="group cursor-pointer" href="detalhes.html?id=suite-obsidian">
```

- [ ] **Step 3: Fix the hero search dropdowns**

In `index.html`, replace the "Comprar/Alugar" `<select>` (lines 154-157):

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer">
<option>Venda</option>
<option>Aluguel</option>
</select>
```

with:

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer" id="busca-transacao">
<option value="venda">Venda</option>
<option value="aluguel">Aluguel</option>
</select>
```

Replace the "Tipo de Imóvel" `<select>` (lines 161-165):

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer">
<option>Villa Moderna</option>
<option>Propriedade Histórica</option>
<option>Cobertura / Penthouse</option>
</select>
```

with:

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer" id="busca-categoria">
<option value="villa-moderna">Villa Moderna</option>
<option value="propriedade-historica">Propriedade Histórica</option>
<option value="cobertura-penthouse">Cobertura / Penthouse</option>
</select>
```

Replace the "Cidade" `<select>` (lines 169-173) — the old options (Londres/Mônaco/Nova York) don't exist in `listagem.html`'s inventory, so a search from here always returned zero results:

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer">
<option>Londres, UK</option>
<option>Mônaco</option>
<option>Nova York, NY</option>
</select>
```

with:

```html
<select class="w-full bg-transparent border-none p-0 focus:ring-0 font-body-md text-stone-800 cursor-pointer" id="busca-cidade">
<option value="">Todas as cidades</option>
<option value="bel-air">Bel Air, Califórnia</option>
<option value="saint-jean-cap-ferrat">Saint-Jean-Cap-Ferrat, França</option>
<option value="lago-de-como">Lago de Como, Itália</option>
<option value="cidade-do-cabo">Cidade do Cabo, África do Sul</option>
</select>
```

Give the "Buscar" button an id — change (line 176):

```html
<button class="w-full md:w-auto bg-[#AC855E] text-white px-10 py-4 font-label-caps text-label-caps uppercase hover:bg-[#926d48] transition-colors flex items-center justify-center gap-2">
```

to:

```html
<button class="w-full md:w-auto bg-[#AC855E] text-white px-10 py-4 font-label-caps text-label-caps uppercase hover:bg-[#926d48] transition-colors flex items-center justify-center gap-2" id="busca-submit" type="button">
```

- [ ] **Step 4: Wire the "Buscar" button in `js/scripts.js`**

In `js/scripts.js`, add this block right after the "4. Menu mobile" block added previously (before the final `});` that closes the `DOMContentLoaded` listener):

```js
    // 5. Busca da home: redireciona para listagem.html com os filtros escolhidos
    const searchButton = document.getElementById('busca-submit');
    if (searchButton && typeof PropertyUtils !== 'undefined') {
        searchButton.addEventListener('click', () => {
            const transactionSelect = document.getElementById('busca-transacao');
            const categorySelect = document.getElementById('busca-categoria');
            const citySelect = document.getElementById('busca-cidade');
            const query = PropertyUtils.buildSearchQuery({
                transaction: transactionSelect ? transactionSelect.value : '',
                category: categorySelect ? categorySelect.value : '',
                citySlug: citySelect ? citySelect.value : '',
            });
            window.location.href = 'listagem.html' + (query ? '?' + query : '');
        });
    }
```

- [ ] **Step 5: Fix the nav's Residencial/Comercial links (desktop + mobile)**

In `index.html`, change both occurrences (desktop nav line 121-122, mobile nav line 133-134) from:

```html
<a class="font-serif tracking-tight text-sm uppercase text-stone-600 hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Residencial</a>
<a class="font-serif tracking-tight text-sm uppercase text-stone-600 hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Comercial</a>
```

to:

```html
<a class="font-serif tracking-tight text-sm uppercase text-stone-600 hover:text-[#AC855E] transition-colors duration-300" href="listagem.html?tipo=residencial">Residencial</a>
<a class="font-serif tracking-tight text-sm uppercase text-stone-600 hover:text-[#AC855E] transition-colors duration-300" href="listagem.html?tipo=comercial">Comercial</a>
```

(mobile nav copy: same replacement, matching classes `font-serif tracking-tight text-sm uppercase text-stone-600 py-3`)

- [ ] **Step 6: Manual verification**

Run: `python -m http.server 8791` from the project root, then in a browser:
1. Open `http://localhost:8791/index.html`. Click each of the 3 featured cards — confirm each opens `detalhes.html?id=...` with a *different* property id in the address bar.
2. Pick a city in the hero search, click "Buscar" — confirm you land on `listagem.html?...` with a `cidade=` param in the URL.
3. Click "Residencial" then "Comercial" in the nav — confirm the URL changes to `listagem.html?tipo=residencial` / `?tipo=comercial`.

- [ ] **Step 7: Commit**

```bash
git add index.html js/scripts.js
git commit -m "feat: link featured cards to real imóveis and wire the home search bar"
```

---

### Task 4: `listagem.html` — card data attributes, missing checkbox, new commercial cards, tipo pills, empty state

**Files:**
- Modify: `listagem.html`

- [ ] **Step 1: Add the script includes**

Change (line 376):

```html
<script defer="" src="js/scripts.js"></script>
```

to:

```html
<script defer="" src="js/property-utils.js"></script>
<script defer="" src="js/properties.js"></script>
<script defer="" src="js/listagem.js"></script>
<script defer="" src="js/scripts.js"></script>
```

- [ ] **Step 2: Add `data-*` attributes and fix links on the 4 existing cards**

Card 1 — change (lines 219, 233):

```html
<article class="group cursor-pointer" onclick="window.location.href='detalhes.html'">
```

to:

```html
<article class="group cursor-pointer property-card" data-amenities="casa-inteligente adega" data-category="villa-moderna" data-city-slug="bel-air" data-id="obsidian-pavilion" data-price="28500000" data-suites="7" data-tipo="residencial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=obsidian-pavilion'">
```

and:

```html
<a aria-label="Ver detalhes de The Obsidian Pavilion" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html">
```

to:

```html
<a aria-label="Ver detalhes de The Obsidian Pavilion" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=obsidian-pavilion">
```

Card 2 — change (lines 254, 265):

```html
<article class="group cursor-pointer" onclick="window.location.href='detalhes.html'">
```

to:

```html
<article class="group cursor-pointer property-card" data-amenities="adega cinema" data-category="propriedade-historica" data-city-slug="saint-jean-cap-ferrat" data-id="villa-lheritage" data-price="14200000" data-suites="5" data-tipo="residencial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=villa-lheritage'">
```

and:

```html
<a aria-label="Ver detalhes de Villa L'Héritage" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html">
```

to:

```html
<a aria-label="Ver detalhes de Villa L'Héritage" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=villa-lheritage">
```

Card 3 — change (lines 286, 297):

```html
<article class="group cursor-pointer" onclick="window.location.href='detalhes.html'">
```

to:

```html
<article class="group cursor-pointer property-card" data-amenities="spa cinema" data-category="villa-moderna" data-city-slug="lago-de-como" data-id="azure-lake-house" data-price="21800000" data-suites="6" data-tipo="residencial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=azure-lake-house'">
```

and:

```html
<a aria-label="Ver detalhes de Azure Lake House" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html">
```

to:

```html
<a aria-label="Ver detalhes de Azure Lake House" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=azure-lake-house">
```

Card 4 — change (lines 318, 329):

```html
<article class="group cursor-pointer" onclick="window.location.href='detalhes.html'">
```

to:

```html
<article class="group cursor-pointer property-card" data-amenities="casa-inteligente spa" data-category="villa-moderna" data-city-slug="cidade-do-cabo" data-id="cliff-pavilion" data-price="9500000" data-suites="4" data-tipo="residencial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=cliff-pavilion'">
```

and:

```html
<a aria-label="Ver detalhes de The Cliff Pavilion" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html">
```

to:

```html
<a aria-label="Ver detalhes de The Cliff Pavilion" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=cliff-pavilion">
```

- [ ] **Step 3: Add the 2 new commercial cards**

In `listagem.html`, right after Card 4's closing `</article>` (line 348) and before the grid's closing `</div>` (line 349), insert:

```html
<!-- Card de Imóvel 5 (Comercial) -->
<article class="group cursor-pointer property-card" data-amenities="" data-category="" data-city-slug="faria-lima-sp" data-id="edificio-corporativo-aurora" data-price="45000000" data-suites="48" data-tipo="comercial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=edificio-corporativo-aurora'">
<div class="relative overflow-hidden aspect-[4/3] bg-surface-container-high mb-6">
<img alt="Edifício corporativo de alto padrão na Faria Lima" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvTlQ7Z2Ba2d172d0rM1gbHEuNAQpoK27c5dLYd9cjXyYlerSj_54eMnVrwtF2TuzF6bQ3SY1Hit2bxRrvwf_T5XM19f6mGYjRAR-8DsOLvJfq67i8P7mwAG9MJeNuKKxQuZ3nx3DuDXZGJNsCtG4PCfbOQwOqdhkdX5qqIXkgU6K-uUJenzM932h6Q52oKWQAs4bRE1SQp6Jz-65clIBrV_3D8fwAvwZQmcJHUROqG5qeSDtKFjkzZAT1fSVHpyk3KozJ0vZ5LjGv"/>
<div class="absolute top-4 left-4">
<span class="bg-surface/90 backdrop-blur px-3 py-1 font-label-caps text-[10px] text-primary uppercase">Alto Padrão Corporativo</span>
</div>
</div>
<div class="flex justify-between items-start mb-2">
<div>
<h3 class="font-headline-md text-headline-md mb-1">Edifício Corporativo Aurora</h3>
<p class="font-body-md text-sm text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Faria Lima, São Paulo
                            </p>
</div>
<a aria-label="Ver detalhes de Edifício Corporativo Aurora" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=edificio-corporativo-aurora">
<span class="material-symbols-outlined">arrow_forward</span>
</a>
</div>
<div class="flex gap-6 py-4 border-y border-outline-variant/50 mb-4">
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Salas</span>
<span class="font-headline-md text-lg">48</span>
</div>
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Vagas</span>
<span class="font-headline-md text-lg">120</span>
</div>
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Área</span>
<span class="font-headline-md text-lg">3,200 <span class="text-xs font-body-md uppercase">m²</span></span>
</div>
</div>
<p class="font-headline-md text-headline-md text-primary">R$ 45.000.000</p>
</article>
<!-- Card de Imóvel 6 (Comercial) -->
<article class="group cursor-pointer property-card" data-amenities="" data-category="" data-city-slug="oscar-freire-sp" data-id="flagship-retail-prime" data-price="32000000" data-suites="1" data-tipo="comercial" data-transaction="venda" onclick="window.location.href='detalhes.html?id=flagship-retail-prime'">
<div class="relative overflow-hidden aspect-[4/3] bg-surface-container-high mb-6">
<img alt="Ponto comercial flagship na Oscar Freire" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-4VeZYfL0FZMR_nkzgplKPh94CfOXPXr4qZKpMQWAMB62frMJBZAJhOOzSV4BYw7Ktsp3FtVgjPz7pJV0yqycrkkDiVDNwKzfB6FgrTHUXvaRjPkRLD5hXoPoWkq4Ejsn6vu7hqqQmvar4oT8yegP71krGx8Qk3EB2DyuPbePBLP0JrvlNjGamWmtH-oRoCl_B0UyvzXiP0K155s73I8H11PVteMzrkiY5FoT5nkpEG8tUUvS21_0qfalYQo7S5_bg41G3QkH-JZm"/>
<div class="absolute top-4 left-4">
<span class="bg-surface/90 backdrop-blur px-3 py-1 font-label-caps text-[10px] text-primary uppercase">Ponto Comercial Premium</span>
</div>
</div>
<div class="flex justify-between items-start mb-2">
<div>
<h3 class="font-headline-md text-headline-md mb-1">Flagship Retail Prime</h3>
<p class="font-body-md text-sm text-secondary flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Oscar Freire, São Paulo
                            </p>
</div>
<a aria-label="Ver detalhes de Flagship Retail Prime" class="w-10 h-10 border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all" href="detalhes.html?id=flagship-retail-prime">
<span class="material-symbols-outlined">arrow_forward</span>
</a>
</div>
<div class="flex gap-6 py-4 border-y border-outline-variant/50 mb-4">
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Unidades</span>
<span class="font-headline-md text-lg">01</span>
</div>
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Vagas</span>
<span class="font-headline-md text-lg">15</span>
</div>
<div class="flex flex-col">
<span class="font-label-caps text-[10px] text-primary uppercase">Área</span>
<span class="font-headline-md text-lg">850 <span class="text-xs font-body-md uppercase">m²</span></span>
</div>
</div>
<p class="font-headline-md text-headline-md text-primary">R$ 32.000.000</p>
</article>
```

- [ ] **Step 4: Fix the price slider (live label) and quartos/localização/infraestrutura controls**

Change the price filter block (lines 157-166) from:

```html
<div>
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Faixa de Preço</h3>
<div class="space-y-4">
<input class="w-full accent-primary" max="50000000" min="1000000" step="500000" type="range"/>
<div class="flex justify-between font-label-caps text-[10px] text-secondary">
<span>R$ 1M</span>
<span>R$ 50M+</span>
</div>
</div>
</div>
```

to:

```html
<div>
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Faixa de Preço</h3>
<div class="space-y-4">
<input class="w-full accent-primary" id="filtro-preco" max="50000000" min="1000000" step="500000" type="range" value="50000000"/>
<div class="flex justify-between font-label-caps text-[10px] text-secondary">
<span>R$ 1M</span>
<span id="filtro-preco-label">Até R$ 50.000.000</span>
</div>
</div>
</div>
```

Change the quartos buttons (lines 170-175) from:

```html
<div class="grid grid-cols-4 gap-2">
<button class="py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all">1+</button>
<button class="py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all">3+</button>
<button class="py-2 bg-primary text-white font-label-caps text-label-caps">5+</button>
<button class="py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all">8+</button>
</div>
```

to:

```html
<div class="grid grid-cols-4 gap-2" id="filtro-quartos">
<button class="quartos-btn py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all" data-min-suites="1" type="button">1+</button>
<button class="quartos-btn py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all" data-min-suites="3" type="button">3+</button>
<button class="quartos-btn py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all" data-min-suites="5" type="button">5+</button>
<button class="quartos-btn py-2 border border-outline-variant hover:border-primary font-label-caps text-label-caps transition-all" data-min-suites="8" type="button">8+</button>
</div>
```

(note: none of the buttons keeps the old hardcoded "selected" style — `listagem.js`, Task 5, applies the selected style in JS so it can also be cleared)

Change the localização checkboxes block (lines 178-200) from:

```html
<div class="border-t border-outline-variant pt-8">
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Localização</h3>
<div class="space-y-3">
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Bel Air, Califórnia
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Saint-Jean-Cap-Ferrat, França
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Lago de Como, Itália
                            </span>
</label>
</div>
</div>
```

to (adds the missing Cidade do Cabo checkbox plus the 2 new commercial cities, each with `data-city-slug`):

```html
<div class="border-t border-outline-variant pt-8">
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Localização</h3>
<div class="space-y-3" id="filtro-localizacao">
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="bel-air" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Bel Air, Califórnia
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="saint-jean-cap-ferrat" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Saint-Jean-Cap-Ferrat, França
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="lago-de-como" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Lago de Como, Itália
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="cidade-do-cabo" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Cidade do Cabo, África do Sul
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="faria-lima-sp" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Faria Lima, São Paulo
                            </span>
</label>
<label class="flex items-center gap-3 cursor-pointer group">
<input class="w-4 h-4 rounded-none border-outline-variant text-primary focus:ring-primary" data-city-slug="oscar-freire-sp" type="checkbox"/>
<span class="font-body-md text-sm text-secondary group-hover:text-on-surface transition-colors flex items-center gap-1">
<span class="material-symbols-outlined text-[16px]">location_on</span> Oscar Freire, São Paulo
                            </span>
</label>
</div>
</div>
```

Change the infraestrutura chips block (lines 202-210) from:

```html
<div class="border-t border-outline-variant pt-8">
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Infraestrutura</h3>
<div class="flex flex-wrap gap-2">
<button class="px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all">CASA INTELIGENTE</button>
<button class="px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all">SPA E BEM-ESTAR</button>
<button class="px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all">ADEGA</button>
<button class="px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all">CINEMA PRIVADO</button>
</div>
</div>
```

to:

```html
<div class="border-t border-outline-variant pt-8">
<h3 class="font-label-caps text-label-caps uppercase text-primary mb-6">Infraestrutura</h3>
<div class="flex flex-wrap gap-2" id="filtro-infraestrutura">
<button class="amenity-btn px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all" data-amenity="casa-inteligente" type="button">CASA INTELIGENTE</button>
<button class="amenity-btn px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all" data-amenity="spa" type="button">SPA E BEM-ESTAR</button>
<button class="amenity-btn px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all" data-amenity="adega" type="button">ADEGA</button>
<button class="amenity-btn px-3 py-1 border border-outline-variant rounded-full font-label-caps text-[10px] text-secondary hover:bg-surface-variant transition-all" data-amenity="cinema" type="button">CINEMA PRIVADO</button>
</div>
</div>
```

- [ ] **Step 5: Add tipo pills, filter chips container, and empty state; remove the fake pagination**

Change the header of the results column (lines 216-217) from:

```html
<div class="flex-1">
<div class="grid grid-cols-1 md:grid-cols-2 gap-12">
```

to:

```html
<div class="flex-1">
<div class="flex flex-wrap items-center justify-between gap-4 mb-8">
<div class="flex gap-2" id="filtro-tipo-pills">
<button class="tipo-pill px-4 py-2 rounded-full font-label-caps text-[10px] uppercase border border-outline-variant transition-all" data-tipo="" type="button">Todos</button>
<button class="tipo-pill px-4 py-2 rounded-full font-label-caps text-[10px] uppercase border border-outline-variant transition-all" data-tipo="residencial" type="button">Residencial</button>
<button class="tipo-pill px-4 py-2 rounded-full font-label-caps text-[10px] uppercase border border-outline-variant transition-all" data-tipo="comercial" type="button">Comercial</button>
</div>
<div class="flex flex-wrap gap-2" id="filtros-aplicados"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 gap-12" id="grade-imoveis">
```

The `id="grade-imoveis"` div above is a straight rename of the old `grid grid-cols-1 md:grid-cols-2 gap-12` div (same nesting level, same children) — the pills/chips row is a new sibling *before* it, not a wrapper around it. So the closing `</div>` that used to close the old grid div still closes `#grade-imoveis` unchanged; only add the empty-state paragraph right after it. Concretely, change (this is the closing tag right after the 6th card added in Step 3):

```html
<p class="font-headline-md text-headline-md text-primary">R$ 32.000.000</p>
</article>
</div>
```

to:

```html
<p class="font-headline-md text-headline-md text-primary">R$ 32.000.000</p>
</article>
</div>
<p class="hidden font-body-lg text-secondary text-center py-16" id="empty-state">Nenhum imóvel encontrado com esses filtros. <button class="text-primary underline" id="limpar-filtros" type="button">Limpar filtros</button></p>
```

- [ ] **Step 6: Remove the fake pagination**

The pagination block (lines 351-366) shows "14" pages for a 6-card catalog — that's invented inventory, exactly the kind of dishonest UI this project is fixing elsewhere. Delete it entirely:

```html
<!-- PAGINAÇÃO
                 Navegação entre páginas de resultados. -->
<nav class="mt-20 flex justify-center items-center gap-4">
<button aria-label="Página anterior" class="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-transparent" disabled="">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<div class="flex items-center gap-2">
<button class="w-12 h-12 bg-primary text-white font-headline-md">01</button>
<button class="w-12 h-12 border border-outline-variant font-headline-md hover:bg-surface-variant transition-all">02</button>
<button class="w-12 h-12 border border-outline-variant font-headline-md hover:bg-surface-variant transition-all">03</button>
<span class="px-4 font-headline-md text-secondary">...</span>
<button class="w-12 h-12 border border-outline-variant font-headline-md hover:bg-surface-variant transition-all">14</button>
</div>
<button aria-label="Próxima página" class="w-12 h-12 border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</nav>
```

Delete this whole block (replace with nothing).

- [ ] **Step 7: Remove the "Detalhes" nav item and fix Residencial/Comercial hrefs (desktop + mobile)**

Change the desktop nav (lines 116-123) from:

```html
<div class="hidden md:flex items-center space-x-8">
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="index.html">Início</a>
<a class="font-label-caps text-sm uppercase text-primary border-b-2 border-primary pb-1" href="listagem.html">Portfólio</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="listagem.html">Residencial</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="listagem.html">Comercial</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="detalhes.html">Detalhes</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="contato.html">Contato</a>
</div>
```

to:

```html
<div class="hidden md:flex items-center space-x-8">
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="index.html">Início</a>
<a class="font-label-caps text-sm uppercase text-primary border-b-2 border-primary pb-1" href="listagem.html">Portfólio</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="listagem.html?tipo=residencial">Residencial</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="listagem.html?tipo=comercial">Comercial</a>
<a class="font-label-caps text-sm uppercase text-secondary hover:text-primary transition-colors duration-300" href="contato.html">Contato</a>
</div>
```

Apply the same removal (drop the "Detalhes" `<a>`) and href fix to the mobile nav (lines 136-141).

- [ ] **Step 8: Manual verification**

Run: `python -m http.server 8791` from the project root, then in a browser:
1. Open `http://localhost:8791/listagem.html` — confirm 6 cards render, no console errors, no pagination footer.
2. Confirm "Cidade do Cabo" now appears as a checkbox option.
3. Confirm each card's "Ver detalhes" arrow and the card itself link to `detalhes.html?id=<respective-id>`.

- [ ] **Step 9: Commit**

```bash
git add listagem.html
git commit -m "feat: tag listagem cards with filter data, add commercial listings and tipo pills"
```

---

### Task 5: `js/listagem.js` — the filtering engine

**Files:**
- Create: `js/listagem.js`

**Interfaces:**
- Consumes: `PropertyUtils.filterProperties`, `PropertyUtils.formatCurrencyBRL`, `PropertyUtils.parseSearchParams` (Task 1); DOM elements added in Task 4 (`#filtro-preco`, `#filtro-preco-label`, `.quartos-btn`, `#filtro-localizacao input[data-city-slug]`, `.amenity-btn`, `.tipo-pill`, `#grade-imoveis`, `.property-card`, `#empty-state`, `#limpar-filtros`, `#filtros-aplicados`).

- [ ] **Step 1: Write `js/listagem.js`**

```js
/**
 * ARQUIVO: listagem.js
 * DESCRIÇÃO: Liga os controles de filtro de listagem.html aos cards de
 * imóvel (que continuam sendo HTML estático, com atributos data-*).
 */
document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.property-card'));
    if (cards.length === 0) {
        return;
    }

    const priceInput = document.getElementById('filtro-preco');
    const priceLabel = document.getElementById('filtro-preco-label');
    const quartosButtons = Array.from(document.querySelectorAll('.quartos-btn'));
    const cityCheckboxes = Array.from(document.querySelectorAll('#filtro-localizacao input[data-city-slug]'));
    const amenityButtons = Array.from(document.querySelectorAll('.amenity-btn'));
    const tipoPills = Array.from(document.querySelectorAll('.tipo-pill'));
    const grid = document.getElementById('grade-imoveis');
    const emptyState = document.getElementById('empty-state');
    const clearFiltersButton = document.getElementById('limpar-filtros');
    const appliedFiltersContainer = document.getElementById('filtros-aplicados');

    const cardsData = cards.map((card) => ({
        id: card.dataset.id,
        type: card.dataset.tipo,
        transaction: card.dataset.transaction,
        category: card.dataset.category || null,
        citySlug: card.dataset.citySlug,
        price: card.dataset.price ? Number(card.dataset.price) : null,
        suites: card.dataset.suites ? Number(card.dataset.suites) : null,
        amenities: card.dataset.amenities ? card.dataset.amenities.split(' ').filter(Boolean) : [],
    }));

    const state = {
        maxPrice: Number(priceInput.max),
        minSuites: 0,
        citySlugs: [],
        amenities: [],
        tipo: '',
        category: null,
        transaction: null,
    };

    function applyFilters() {
        const filters = {
            maxPrice: state.maxPrice,
            minSuites: state.minSuites,
            citySlugs: state.citySlugs,
            amenities: state.amenities,
        };
        if (state.tipo) {
            filters.tipo = state.tipo;
        }
        if (state.category) {
            filters.category = state.category;
        }
        if (state.transaction) {
            filters.transaction = state.transaction;
        }

        const visibleIds = PropertyUtils.filterProperties(cardsData, filters).map((c) => c.id);

        let visibleCount = 0;
        cards.forEach((card) => {
            const isVisible = visibleIds.indexOf(card.dataset.id) !== -1;
            card.classList.toggle('hidden', !isVisible);
            if (isVisible) {
                visibleCount++;
            }
        });

        grid.classList.toggle('hidden', visibleCount === 0);
        emptyState.classList.toggle('hidden', visibleCount > 0);
    }

    // Preço
    priceInput.addEventListener('input', () => {
        state.maxPrice = Number(priceInput.value);
        priceLabel.textContent = 'Até ' + PropertyUtils.formatCurrencyBRL(state.maxPrice);
        applyFilters();
    });

    // Quartos (seleção única)
    quartosButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const alreadySelected = button.classList.contains('bg-primary');
            quartosButtons.forEach((b) => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('border', 'border-outline-variant');
            });
            if (alreadySelected) {
                state.minSuites = 0;
            } else {
                button.classList.add('bg-primary', 'text-white');
                button.classList.remove('border', 'border-outline-variant');
                state.minSuites = Number(button.dataset.minSuites);
            }
            applyFilters();
        });
    });

    // Localização (múltipla seleção, OU)
    cityCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
            state.citySlugs = cityCheckboxes
                .filter((c) => c.checked)
                .map((c) => c.dataset.citySlug);
            applyFilters();
        });
    });

    // Infraestrutura (múltipla seleção, OU)
    amenityButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const isActive = button.classList.toggle('bg-primary');
            button.classList.toggle('text-white', isActive);
            state.amenities = amenityButtons
                .filter((b) => b.classList.contains('bg-primary'))
                .map((b) => b.dataset.amenity);
            applyFilters();
        });
    });

    // Tipo (pills, seleção única)
    function setTipoPill(tipo) {
        state.tipo = tipo;
        tipoPills.forEach((pill) => {
            const isActive = pill.dataset.tipo === tipo;
            pill.classList.toggle('bg-primary', isActive);
            pill.classList.toggle('text-white', isActive);
        });
    }
    tipoPills.forEach((pill) => {
        pill.addEventListener('click', () => {
            setTipoPill(pill.dataset.tipo);
            applyFilters();
        });
    });

    // Chips de filtros vindos da busca da home (categoria/transação/cidade)
    function renderAppliedChip(label, onRemove) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'px-3 py-1 rounded-full font-label-caps text-[10px] uppercase bg-surface-variant text-on-surface flex items-center gap-1';
        chip.textContent = label + ' ✕';
        chip.addEventListener('click', onRemove);
        appliedFiltersContainer.appendChild(chip);
    }

    function renderAppliedChips() {
        appliedFiltersContainer.innerHTML = '';
        if (state.category) {
            renderAppliedChip('Categoria: ' + state.category, () => {
                state.category = null;
                renderAppliedChips();
                applyFilters();
            });
        }
        if (state.transaction) {
            renderAppliedChip('Transação: ' + state.transaction, () => {
                state.transaction = null;
                renderAppliedChips();
                applyFilters();
            });
        }
    }

    // Limpar filtros
    clearFiltersButton.addEventListener('click', () => {
        state.maxPrice = Number(priceInput.max);
        state.minSuites = 0;
        state.citySlugs = [];
        state.amenities = [];
        state.category = null;
        state.transaction = null;
        priceInput.value = priceInput.max;
        priceLabel.textContent = 'Até ' + PropertyUtils.formatCurrencyBRL(state.maxPrice);
        quartosButtons.forEach((b) => {
            b.classList.remove('bg-primary', 'text-white');
            b.classList.add('border', 'border-outline-variant');
        });
        cityCheckboxes.forEach((c) => { c.checked = false; });
        amenityButtons.forEach((b) => { b.classList.remove('bg-primary', 'text-white'); });
        setTipoPill('');
        renderAppliedChips();
        applyFilters();
    });

    // Aplica os parâmetros vindos da URL (busca da home / links Residencial-Comercial do menu)
    const params = PropertyUtils.parseSearchParams(window.location.search);
    setTipoPill(params.tipo || '');
    state.category = params.category;
    state.transaction = params.transaction;
    if (params.citySlugs.length > 0) {
        state.citySlugs = params.citySlugs;
        cityCheckboxes.forEach((checkbox) => {
            checkbox.checked = params.citySlugs.indexOf(checkbox.dataset.citySlug) !== -1;
        });
    }
    priceLabel.textContent = 'Até ' + PropertyUtils.formatCurrencyBRL(state.maxPrice);
    renderAppliedChips();
    applyFilters();
});
```

- [ ] **Step 2: Manual verification**

Run: `python -m http.server 8791` from the project root, then in a browser:
1. Open `http://localhost:8791/listagem.html`. Drag the price slider down — confirm the label updates live and cards above that price disappear.
2. Click "5+" quartos — confirm only cards with ≥5 suítes show; click it again — confirm it deselects and all reappear.
3. Check "Cidade do Cabo" — confirm only "The Cliff Pavilion" shows.
4. Click "ADEGA" — confirm cards with the adega amenity show (verify against the `data-amenities` you set in Task 4).
5. Click the "Comercial" pill — confirm only the 2 new commercial cards show.
6. Uncheck/clear everything until no card matches (e.g. drag price to minimum with "5+" quartos active) — confirm the empty-state message appears and "Limpar filtros" restores the full grid.
7. Open `http://localhost:8791/listagem.html?tipo=comercial&cidade=faria-lima-sp` directly — confirm it loads with the Comercial pill and Faria Lima checkbox pre-applied.

- [ ] **Step 3: Commit**

```bash
git add js/listagem.js
git commit -m "feat: implement live filtering on listagem.html"
```

---

### Task 6: `detalhes.html` becomes dynamic + "Voltar" button

**Files:**
- Modify: `detalhes.html`
- Create: `js/detalhes.js`

**Interfaces:**
- Consumes: `PROPERTIES` (Task 2), `PropertyUtils.pickSimilarProperties`, `PropertyUtils.buildWhatsAppLink` (Task 1), `WHATSAPP_NUMBER` (Task 7 — declared in `js/scripts.js`, loaded before `js/detalhes.js`, see Step 1 ordering below).

- [ ] **Step 1: Script includes and load order**

Change (line 338):

```html
<script defer="" src="js/scripts.js"></script>
```

to (note `scripts.js` — which will define `WHATSAPP_NUMBER` in Task 7 — loads *before* `detalhes.js`, which needs it):

```html
<script defer="" src="js/property-utils.js"></script>
<script defer="" src="js/properties.js"></script>
<script defer="" src="js/scripts.js"></script>
<script defer="" src="js/detalhes.js"></script>
```

- [ ] **Step 2: Add the "Voltar" button**

Change the opening of `<main>` (line 135-136) from:

```html
<main class="pt-20">
<!-- Galeria de Imagens Hero: Layout em grade para destacar a fachada principal e detalhes internos -->
<section class="max-w-container-max mx-auto px-margin-page mt-unit">
```

to:

```html
<main class="pt-20">
<div class="max-w-container-max mx-auto px-margin-page pt-8">
<a class="inline-flex items-center gap-2 font-label-caps text-label-caps uppercase text-secondary hover:text-primary transition-colors" href="listagem.html" id="botao-voltar">
<span class="material-symbols-outlined text-lg">arrow_back</span>
                Voltar
            </a>
</div>
<!-- Galeria de Imagens Hero: Layout em grade para destacar a fachada principal e detalhes internos -->
<section class="max-w-container-max mx-auto px-margin-page mt-unit">
```

- [ ] **Step 3: Give the dynamic regions stable ids, remove hardcoded content that `detalhes.js` will fill in**

Change the hero gallery (lines 137-151) from:

```html
<section class="max-w-container-max mx-auto px-margin-page mt-unit">
<div class="grid grid-cols-12 gap-4 h-[600px]">
<div class="col-span-8 overflow-hidden rounded-lg relative group">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A grand architectural masterpiece of a modern luxury villa featuring sleek glass walls and natural stone textures." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqibbf1tE526Q1ua-1gMGHsKMI8lFjZw3IDqs4b_2phvXItXiY8y94NeKFZvYAvHzi9iy9Z-_DUryP7NyqQzqX47xRdHw76WGeEzGPTbnic5W2lNv2BeOC6SczviIfNTAWmKfY7Xh-dU5-GvUIVXZRILcD1VB_k2C_wfAYC1oMx0PS-jbOpibbRHUmP9947GuDYHvDnh4KXd0gt47hokKuClL6VtU8kAbmP7kQAJfNnJbz7YeG5fRCdcJhUpTdBjL7IM1b4bo03ysH"/>
</div>
<div class="col-span-4 flex flex-col gap-4">
<div class="h-1/2 overflow-hidden rounded-lg relative group">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="An expansive open-concept living area within a high-end luxury home." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3I0k-UxcT6Cwv7mWBq1k_IjKx4bUVB75rQUXaXADyaWqqDvl8ElQTkXi41bVn1Dvgd08wq5mFj9auShFtneBU1rkuOwXJnlYkokEtVmHELkgr0ze0IZ02WWywkoZ2qiLzlz0wZPE9aj1H9UfPSVkah5nX8NFqacXJVWjV5j8Q5bFgCHDkID69XtihKa0g9gDsdy2nDJ9NASUv13j91V5jUl1CXSVnnbtGgth72swMPZ-83ImMm8J8Bj5EMAhSdovItBACPqoao56d"/>
</div>
<div class="h-1/2 overflow-hidden rounded-lg relative group">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A luxurious master bathroom designed as a private spa sanctuary." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcQHDpcQuuLOWG6qZoNAVaDMFrmc7SDbyy5LiNo9ZdcITuFY9Ad6mwxwZmtt1g8dy_inkK1bYylVIZhHJoIuJKYJEhHyOL3wUCP7f1TAVT4LKkh_jLqIkJwCBVWzQFZa23jeIlBreSenKoMw8cFBDLmVzGBvCWSg9KabZKnnlXZr6qRF77t8ciH-9wgE1QV6UScK75iN3ZKLIM_Qe2Ol9YLHTPvhSSMfL8O_0O20PigftjUDt4VFSmBw7y2mCWc4NOVk8s3Yy-iwnr"/>
</div>
</div>
</div>
</section>
```

to (a single container `detalhes.js` rebuilds based on `property.images.length`):

```html
<section class="max-w-container-max mx-auto px-margin-page mt-unit">
<div class="grid grid-cols-12 gap-4 h-[600px]" id="galeria-imovel"></div>
</section>
```

Change the title/location/price block (lines 156-163) from:

```html
<div class="mb-12">
<div class="flex items-center gap-2 text-primary mb-4">
<span class="material-symbols-outlined text-[20px]">location_on</span>
<span class="font-label-caps text-label-caps uppercase">Jardim Europa, São Paulo</span>
</div>
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-4">Residência Lumina</h1>
<p class="font-headline-lg text-headline-lg text-primary">R$ 18.500.000</p>
</div>
```

to:

```html
<div class="mb-12">
<div class="flex items-center gap-2 text-primary mb-4">
<span class="material-symbols-outlined text-[20px]">location_on</span>
<span class="font-label-caps text-label-caps uppercase" id="imovel-cidade">Jardim Europa, São Paulo</span>
</div>
<h1 class="font-headline-xl text-headline-xl text-on-surface mb-4" id="imovel-titulo">Residência Lumina</h1>
<p class="font-headline-lg text-headline-lg text-primary" id="imovel-preco">R$ 18.500.000</p>
</div>
```

Change the stats grid (lines 165-186) from:

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-surface-variant mb-12">
<div class="text-center border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">straighten</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Área Total</p>
<p class="font-headline-md text-headline-md">1.250 m²</p>
</div>
<div class="text-center border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">king_bed</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Suítes</p>
<p class="font-headline-md text-headline-md">5 Suítes</p>
</div>
<div class="text-center md:border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">directions_car</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Vagas</p>
<p class="font-headline-md text-headline-md">8 Vagas</p>
</div>
<div class="text-center">
<span class="material-symbols-outlined text-primary text-3xl mb-2">pool</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Piscina</p>
<p class="font-headline-md text-headline-md">Privativa</p>
</div>
</div>
```

to:

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-surface-variant mb-12">
<div class="text-center border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">straighten</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Área Total</p>
<p class="font-headline-md text-headline-md" id="imovel-area">1.250 m²</p>
</div>
<div class="text-center border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">king_bed</span>
<p class="font-label-caps text-label-caps text-outline uppercase" id="imovel-suites-label">Suítes</p>
<p class="font-headline-md text-headline-md" id="imovel-suites">5 Suítes</p>
</div>
<div class="text-center md:border-r border-surface-variant">
<span class="material-symbols-outlined text-primary text-3xl mb-2">directions_car</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Vagas</p>
<p class="font-headline-md text-headline-md" id="imovel-vagas">8 Vagas</p>
</div>
<div class="text-center">
<span class="material-symbols-outlined text-primary text-3xl mb-2">pool</span>
<p class="font-label-caps text-label-caps text-outline uppercase">Piscina</p>
<p class="font-headline-md text-headline-md" id="imovel-piscina">Privativa</p>
</div>
</div>
```

Change the description block (lines 188-194) from:

```html
<div class="mb-16">
<h2 class="font-headline-lg text-headline-lg mb-6">Sobre a Propriedade</h2>
<div class="font-body-lg text-body-lg text-on-surface-variant space-y-6 max-w-3xl">
<p>Uma obra-prima da arquitetura contemporânea localizada no coração do Jardim Europa. A Residência Lumina foi concebida para integrar a sofisticação urbana com a tranquilidade da natureza privativa. Seus amplos vãos de vidro permitem que a luz natural flua através de cada ambiente, destacando os acabamentos em mármore Travertino e madeira nobre.</p>
<p>O projeto paisagístico assinado envolve toda a residência, criando microclimas de serenidade em meio à metrópole. Cada detalhe foi meticulosamente planejado para oferecer uma experiência de moradia inigualável, onde o conforto encontra o design atemporal.</p>
</div>
</div>
```

to:

```html
<div class="mb-16">
<h2 class="font-headline-lg text-headline-lg mb-6">Sobre a Propriedade</h2>
<div class="font-body-lg text-body-lg text-on-surface-variant space-y-6 max-w-3xl" id="imovel-descricao"></div>
</div>
```

Change the amenities grid (lines 196-224) — replace its contents container with an empty one `detalhes.js` fills based on `property.amenities`:

```html
<div class="mb-16">
<h2 class="font-headline-lg text-headline-lg mb-8">Diferenciais &amp; Lazer</h2>
<div class="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-12" id="imovel-amenidades"></div>
</div>
```

(delete the six hardcoded `<div class="flex items-center gap-3">...</div>` blocks that were inside it)

Change the WhatsApp direct link (line 246) from:

```html
<a class="flex items-center justify-center gap-2 w-full border border-primary text-primary py-4 font-label-caps text-label-caps uppercase hover:bg-surface-container transition-all" href="https://wa.me/5511999999999" target="_blank">
```

to:

```html
<a class="flex items-center justify-center gap-2 w-full border border-primary text-primary py-4 font-label-caps text-label-caps uppercase hover:bg-surface-container transition-all" id="whatsapp-direto" target="_blank">
```

(`detalhes.js` sets `href` once it knows the property title)

Change the map card title (lines 264, and the "Jardim Europa" caption) — update ids so `detalhes.js` can personalize it:

```html
<h3 class="font-headline-md text-headline-md mb-1" id="mapa-cidade-curta">Jardim Europa</h3>
```

Change the "Propriedades Semelhantes" grid (lines 278-324) to an empty container `detalhes.js` renders into:

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter" id="imoveis-semelhantes"></div>
```

(delete the three hardcoded `<article>` blocks inside it)

- [ ] **Step 4: Remove the "Detalhes" nav item, fix Residencial/Comercial hrefs (desktop + mobile)**

Change the desktop nav (lines 115-120) from:

```html
<div class="hidden md:flex items-center gap-8"><a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="index.html">Início</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Portfólio</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Residencial</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Comercial</a>
<a class="text-[#AC855E] border-b-2 border-[#AC855E] pb-1 font-serif tracking-tight text-sm uppercase" href="detalhes.html">Detalhes</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="contato.html">Contato</a></div>
```

to (no item is marked "active" here since detalhes.html is reached from a card, not from the nav itself):

```html
<div class="hidden md:flex items-center gap-8"><a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="index.html">Início</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html">Portfólio</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html?tipo=residencial">Residencial</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="listagem.html?tipo=comercial">Comercial</a>
<a class="text-stone-600 font-serif tracking-tight text-sm uppercase hover:text-[#AC855E] transition-colors duration-300" href="contato.html">Contato</a></div>
```

Apply the same removal + href fix to the mobile nav (lines 127-132).

- [ ] **Step 5: Write `js/detalhes.js`**

```js
/**
 * ARQUIVO: detalhes.js
 * DESCRIÇÃO: Lê ?id= da URL, busca o imóvel em PROPERTIES e preenche
 * detalhes.html inteiro. Sem id reconhecido, mostra a Residência Lumina
 * (imóvel padrão) para a página nunca quebrar.
 */
document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_PROPERTY_ID = 'residencia-lumina';
    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('id');
    const property = PROPERTIES.find((p) => p.id === requestedId) ||
        PROPERTIES.find((p) => p.id === DEFAULT_PROPERTY_ID);

    if (!property) {
        return;
    }

    document.title = property.title + ' - Estate Heritage';

    // Galeria: 1 a 3 imagens, sem duplicar a mesma foto para preencher espaço
    const gallery = document.getElementById('galeria-imovel');
    if (property.images.length === 1) {
        gallery.innerHTML = `
            <div class="col-span-12 overflow-hidden rounded-lg relative group">
                <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[0]}"/>
            </div>`;
    } else if (property.images.length === 2) {
        gallery.innerHTML = `
            <div class="col-span-6 overflow-hidden rounded-lg relative group">
                <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[0]}"/>
            </div>
            <div class="col-span-6 overflow-hidden rounded-lg relative group">
                <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[1]}"/>
            </div>`;
    } else {
        gallery.innerHTML = `
            <div class="col-span-8 overflow-hidden rounded-lg relative group">
                <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[0]}"/>
            </div>
            <div class="col-span-4 flex flex-col gap-4">
                <div class="h-1/2 overflow-hidden rounded-lg relative group">
                    <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[1]}"/>
                </div>
                <div class="h-1/2 overflow-hidden rounded-lg relative group">
                    <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="${property.title}" src="${property.images[2]}"/>
                </div>
            </div>`;
    }

    document.getElementById('imovel-cidade').textContent = property.city;
    document.getElementById('imovel-titulo').textContent = property.title;
    document.getElementById('imovel-preco').textContent = property.priceLabel;
    document.getElementById('imovel-area').textContent = property.areaM2.toLocaleString('pt-BR') + ' m²';
    document.getElementById('imovel-suites-label').textContent = property.type === 'comercial' ? 'Salas' : 'Suítes';
    document.getElementById('imovel-suites').textContent = String(property.suites).padStart(2, '0') + (property.type === 'comercial' ? ' Salas' : ' Suítes');
    document.getElementById('imovel-vagas').textContent = property.parkingSpots + ' Vagas';
    document.getElementById('imovel-piscina').textContent = property.pool ? 'Privativa' : 'Não possui';

    const descriptionContainer = document.getElementById('imovel-descricao');
    descriptionContainer.innerHTML = property.description.map((paragraph) => `<p>${paragraph}</p>`).join('');

    const AMENITY_LABELS = {
        'casa-inteligente': 'Casa Inteligente',
        spa: 'Spa & Sauna',
        adega: 'Adega Climatizada',
        cinema: 'Cinema Privativo',
        automacao: 'Sistema de Automação',
        gourmet: 'Espaço Gourmet',
        academia: 'Academia Profissional',
    };
    const amenitiesContainer = document.getElementById('imovel-amenidades');
    amenitiesContainer.innerHTML = property.amenities.map((token) => `
        <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary" data-weight="fill">check_circle</span>
            <span class="font-body-md text-body-md">${AMENITY_LABELS[token] || token}</span>
        </div>`).join('');

    const whatsappLink = document.getElementById('whatsapp-direto');
    if (whatsappLink && typeof PropertyUtils !== 'undefined' && typeof WHATSAPP_NUMBER !== 'undefined') {
        const message = 'Olá! Tenho interesse no imóvel "' + property.title + '" (' + property.city + ').';
        whatsappLink.href = PropertyUtils.buildWhatsAppLink(WHATSAPP_NUMBER, message);
    }

    const mapCaption = document.getElementById('mapa-cidade-curta');
    if (mapCaption) {
        mapCaption.textContent = property.city.split(',')[0];
    }

    const similarContainer = document.getElementById('imoveis-semelhantes');
    if (similarContainer && typeof PropertyUtils !== 'undefined') {
        const similar = PropertyUtils.pickSimilarProperties(PROPERTIES, property.id, 3);
        similarContainer.innerHTML = similar.map((similarProperty) => `
            <article class="group cursor-pointer" onclick="window.location.href='detalhes.html?id=${similarProperty.id}'">
                <div class="aspect-[4/3] overflow-hidden mb-6">
                    <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="${similarProperty.title}" src="${similarProperty.images[0]}"/>
                </div>
                <div class="space-y-2">
                    <p class="font-label-caps text-[10px] text-outline uppercase">${similarProperty.city.split(',')[0]}</p>
                    <h4 class="font-headline-md text-headline-md group-hover:text-primary transition-colors">${similarProperty.title}</h4>
                    <div class="flex gap-4 text-outline font-body-md text-sm">
                        <span>${similarProperty.areaM2.toLocaleString('pt-BR')} m²</span>
                        <span>${similarProperty.suites} ${similarProperty.type === 'comercial' ? 'Salas' : 'Suítes'}</span>
                    </div>
                    <p class="font-body-lg text-primary pt-2">${similarProperty.priceLabel}</p>
                </div>
            </article>`).join('');
    }

    // Botão Voltar: usa o histórico do navegador quando existe, senão volta para a listagem
    const backButton = document.getElementById('botao-voltar');
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            if (window.history.length > 1) {
                event.preventDefault();
                window.history.back();
            }
        });
    }
});
```

- [ ] **Step 6: Manual verification**

Run: `python -m http.server 8791` from the project root, then in a browser:
1. Open `http://localhost:8791/detalhes.html?id=obsidian-pavilion` — confirm the title, location, price, and stats show "The Obsidian Pavilion" data (not "Residência Lumina"), and the gallery shows exactly 1 image (no duplicated photo).
2. Open `http://localhost:8791/detalhes.html?id=residencia-lumina` — confirm it matches the original page exactly (3 images, same description, same 6 amenities).
3. Open `http://localhost:8791/detalhes.html` (no id) — confirm it falls back to Residência Lumina without any console error.
4. Click "Voltar" after arriving from `listagem.html` — confirm it returns to `listagem.html` with your filters still applied (browser back, not a fresh page load).
5. Open `http://localhost:8791/detalhes.html?id=bogus-id` — confirm it falls back to Residência Lumina instead of crashing.
6. Check the "Propriedades Semelhantes" cards — confirm they're 3 different properties from the one you're viewing and each links to its own `?id=`.

- [ ] **Step 7: Commit**

```bash
git add detalhes.html js/detalhes.js
git commit -m "feat: make detalhes.html render any property by id, add Voltar button"
```

---

### Task 7: WhatsApp submission for `contato.html`

**Files:**
- Modify: `js/scripts.js`
- Modify: `contato.html`

**Interfaces:**
- Consumes: `PropertyUtils.buildWhatsAppMessage`, `PropertyUtils.buildWhatsAppLink` (Task 1).
- Produces: `WHATSAPP_NUMBER` constant (consumed by `js/detalhes.js`, Task 6 — so `js/scripts.js` must load before `js/detalhes.js`, already ordered that way in Task 6 Step 1).

- [ ] **Step 1: Add the script include**

In `contato.html`, change (line 254):

```html
<script defer="" src="js/scripts.js"></script>
```

to:

```html
<script defer="" src="js/property-utils.js"></script>
<script defer="" src="js/scripts.js"></script>
```

- [ ] **Step 2: Add ids to the form's `name`/`select`/`textarea` so the handler can read them, and set `type="button"` isn't needed (already `type="submit"`) — just add `id="contato-form"`**

Change (line 191):

```html
<form action="#" class="space-y-8" method="POST">
```

to:

```html
<form class="space-y-8" id="contato-form">
```

(the fields already have `id="name"`, `id="email"`, `id="subject"`, `id="message"` — no further change needed there)

- [ ] **Step 3: Add `WHATSAPP_NUMBER` and the submit handler to `js/scripts.js`**

At the very top of `js/scripts.js`, right after the file's doc comment (before `document.addEventListener('DOMContentLoaded', ...)`), add:

```js
// Número de WhatsApp da imobiliária — troque aqui quando tiver o número real.
// Usado tanto no formulário de contato.html quanto no botão "WhatsApp Direto" de detalhes.html.
const WHATSAPP_NUMBER = '5511999999999';
```

Then, inside the `DOMContentLoaded` listener, add this block after the "5. Busca da home" block added in Task 3:

```js
    // 6. Formulário de contato: monta a mensagem e abre o WhatsApp
    const contactForm = document.getElementById('contato-form');
    if (contactForm && typeof PropertyUtils !== 'undefined') {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const subjectField = document.getElementById('subject');
            const messageField = document.getElementById('message');
            const message = PropertyUtils.buildWhatsAppMessage({
                name: nameField.value,
                email: emailField.value,
                subject: subjectField.value,
                message: messageField.value,
            });
            const link = PropertyUtils.buildWhatsAppLink(WHATSAPP_NUMBER, message);
            window.open(link, '_blank');
        });
    }
```

- [ ] **Step 4: Remove the now-unused generic form-submit console.log block (it would otherwise also fire for `#contato-form`, which is harmless but redundant/confusing)**

Change the "1. Lógica para o formulário de contato / interesse" block near the top of the `DOMContentLoaded` listener from:

```js
    // 1. Lógica para o formulário de contato / interesse
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Aqui você pode adicionar validações extras antes do envio
            // O envio real é feito via atributo 'action' configurado para o Sheet Monkey
            console.log('Formulário enviado. Certifique-se de configurar a URL do Sheet Monkey no atributo action.');
        });
    });
```

to:

```js
    // 1. Lógica para o formulário de interesse em detalhes.html (Sheet Monkey)
    const sheetMonkeyForms = document.querySelectorAll('form[action*="sheetmonkey"]');
    sheetMonkeyForms.forEach(form => {
        form.addEventListener('submit', () => {
            console.log('Formulário enviado. Certifique-se de configurar a URL do Sheet Monkey no atributo action.');
        });
    });
```

- [ ] **Step 5: Remove "Detalhes" nav item and fix Residencial/Comercial hrefs (desktop + mobile) in `contato.html`**

Change the desktop nav (lines 114-119) from:

```html
<div class="hidden md:flex items-center gap-8">
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="index.html">Início</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html">Portfólio</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html">Residencial</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html">Comercial</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="detalhes.html">Detalhes</a>
<a class="font-serif tracking-tight text-sm uppercase text-primary border-b-2 border-primary pb-1" href="contato.html">Contato</a>
</div>
```

to:

```html
<div class="hidden md:flex items-center gap-8">
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="index.html">Início</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html">Portfólio</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html?tipo=residencial">Residencial</a>
<a class="font-serif tracking-tight text-sm uppercase text-secondary hover:text-primary transition-colors" href="listagem.html?tipo=comercial">Comercial</a>
<a class="font-serif tracking-tight text-sm uppercase text-primary border-b-2 border-primary pb-1" href="contato.html">Contato</a>
</div>
```

Apply the same removal + href fix to the mobile nav (lines 127-132).

- [ ] **Step 6: Manual verification**

Run: `python -m http.server 8791` from the project root, then in a browser:
1. Open `http://localhost:8791/contato.html`, fill the form, click "Enviar Solicitação Privada".
2. Confirm a new tab opens to `https://wa.me/5511999999999?text=...` with your name/email/assunto/mensagem readable in the pre-filled WhatsApp message (WhatsApp Web will show "número não encontrado" or similar since it's a placeholder number — that's expected, the link construction is what you're verifying).
3. Confirm the original page did *not* navigate away (no `#` jump, no reload).

- [ ] **Step 7: Commit**

```bash
git add js/scripts.js contato.html
git commit -m "feat: submit contato.html form via WhatsApp instead of a dead action=#"
```

---

### Task 8: Final cross-page verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `node --test tests/`
Expected: all tests in `tests/property-utils.test.js` and `tests/properties-data.test.js` PASS.

- [ ] **Step 2: Static asset check**

Run:
```bash
python -m http.server 8791 &
sleep 1
for f in index.html listagem.html detalhes.html contato.html css/style.css js/scripts.js js/property-utils.js js/properties.js js/listagem.js js/detalhes.js; do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8791/$f)
  echo "$f -> $code"
done
kill %1
```
Expected: every file returns `200`.

- [ ] **Step 3: Full manual walkthrough**

In a browser, with the local server running:
1. `index.html` → click each featured card → each lands on a different property in `detalhes.html`.
2. `index.html` → hero search with a city selected → lands on `listagem.html` with that city pre-filtered.
3. `index.html` and `listagem.html` and `contato.html` and `detalhes.html` → nav no longer shows "Detalhes"; "Residencial"/"Comercial" filter the listing.
4. `listagem.html` → every filter (preço, quartos, localização, infraestrutura, tipo) changes the visible cards live; clearing filters restores all 6.
5. Any property card → `detalhes.html?id=...` → "Voltar" returns to where you came from.
6. `contato.html` → submitting the form opens a WhatsApp link in a new tab with a readable message.
7. `detalhes.html?id=azure-lake-house` → hover/inspect the "WhatsApp Direto" button → confirm its `href` is `https://wa.me/5511999999999?text=...` and the decoded text mentions "Azure Lake House" (this only works once Task 7 has run, since it defines `WHATSAPP_NUMBER` — if you're verifying right after Task 6 alone, the button will have no `href` yet, which is expected and not a bug).
8. Open the browser console on all 4 pages — confirm no JS errors.

- [ ] **Step 4: Commit** (only if Step 3 required fixes; otherwise nothing to commit)

```bash
git add -A
git commit -m "fix: address issues found in final cross-page verification"
```
(skip this step if verification found nothing to fix)
