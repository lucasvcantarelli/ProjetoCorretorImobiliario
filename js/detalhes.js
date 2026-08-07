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
