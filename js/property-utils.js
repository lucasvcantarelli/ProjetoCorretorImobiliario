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
