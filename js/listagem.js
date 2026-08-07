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
