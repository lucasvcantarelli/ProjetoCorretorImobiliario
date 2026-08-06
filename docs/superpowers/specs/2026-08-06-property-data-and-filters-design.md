# Design: Dados de imóveis, filtros funcionais, WhatsApp e navegação (2026-08-06)

## Contexto

O site (Estate Heritage) tem 4 páginas estáticas (`index.html`, `listagem.html`, `detalhes.html`, `contato.html`). Um round anterior já corrigiu paths de CSS/JS, menu mobile e alguns links quebrados. Pedido atual do usuário:

1. Os itens de menu "Detalhes", "Residencial" e "Comercial" não funcionam bem.
2. A busca de imóveis na home e os filtros da listagem não fazem nada.
3. O formulário "Enviar Solicitação" (contato.html) deve enviar por WhatsApp, formatado.
4. Ao visitar uma propriedade (detalhes.html), não há como voltar.

Investigação revelou a causa raiz comum: **cada card de imóvel aponta para a mesma `detalhes.html` estática**, com um único imóvel fixo ("Residência Lumina") não importa em qual card se clique. `index.html` e `listagem.html` têm conjuntos de imóveis totalmente diferentes (nomes, cidades e specs não batem). Os controles de busca/filtro (dropdowns da home, slider/checkboxes/chips da listagem) nunca tiveram JS por trás. O checkbox de filtro de cidade "Cidade do Cabo" está faltando (existe imóvel nessa cidade mas não há como filtrar por ela). O dropdown de cidade da busca da home lista cidades (Londres, Mônaco, Nova York) que não existem no estoque real de `listagem.html`.

Decisão do usuário: tratar isso como um problema de modelagem de dados — criar uma fonte única de dados de imóveis, fácil de editar/estender e futuramente trocar por dados reais (ou uma API).

## Modelo de dados: `js/properties.js`

Um único array `PROPERTIES`, carregado antes de `js/scripts.js` em todas as páginas. Cada item é um objeto simples, comentado, sem dependências de build:

```js
const PROPERTIES = [
  {
    id: 'pavilhao-vidro',           // slug único, usado na URL (detalhes.html?id=...)
    title: 'O Pavilhão de Vidro',
    city: 'Mayfair, Londres',
    citySlug: 'mayfair-londres',    // usado nos filtros/checkboxes
    category: 'villa-moderna',      // 'villa-moderna' | 'propriedade-historica' | 'cobertura-penthouse'
    type: 'residencial',            // 'residencial' | 'comercial'
    transaction: 'venda',           // 'venda' | 'aluguel' (hoje só há 'venda' em estoque)
    price: 12500000,                // número puro, em BRL, para filtro/ordenação
    priceLabel: 'R$ 12.500.000',    // texto pronto para exibição
    suites: 5,
    bathrooms: 6,
    parkingSpots: null,             // null quando não divulgado nesse card
    areaM2: null,
    badge: 'Disponível',
    images: ['https://...', 'https://...', 'https://...'],
    description: [
      'Parágrafo 1...',
      'Parágrafo 2...'
    ],
    amenities: ['casa-inteligente', 'adega'], // tokens batendo com os chips de infraestrutura
  },
  // ...
];
```

Regras do arquivo:
- Cada campo tem um comentário curto explicando o formato esperado (facilita edição manual e troca futura por dados reais/API).
- Nenhuma outra parte do código depende da ordem ou de índices — sempre por `id`.
- Adicionar um imóvel novo = adicionar um objeto novo ao array. Nenhum outro arquivo precisa mudar.
- Contém os 11 imóveis já existentes nas páginas (mantendo nomes/preços atuais) **mais 2 imóveis comerciais novos** (para o filtro "Comercial" ter resultado real): "Edifício Corporativo Aurora" e "Flagship Retail Prime".

## Cards apontam para o imóvel certo

Em `index.html`, `listagem.html` e na seção "Propriedades Semelhantes" de `detalhes.html`, cada link/onclick de card passa a apontar para `detalhes.html?id=<id>` (o `id` correspondente já definido em `properties.js`), em vez de todos apontarem para `detalhes.html` sem parâmetro.

## `detalhes.html` dinâmico

Novo `js/detalhes.js`:
- Lê `?id=` da URL via `URLSearchParams`.
- Busca o imóvel em `PROPERTIES`; se não encontrar, usa um `id` padrão (`'residencia-lumina'`) — a página nunca quebra com um id inválido.
- Preenche: 3 imagens do hero, badge de localização, título, preço, grid de specs (área/suítes/vagas/piscina — omite blocos cujo dado seja `null`), parágrafos de descrição, grid de amenidades, `document.title`.
- Preenche "Propriedades Semelhantes" escolhendo 3 outros imóveis do array (excluindo o atual).
- Botão "WhatsApp Direto" tem a mensagem pré-preenchida citando o nome do imóvel atual.

### Botão Voltar

Um link/botão "← Voltar" fixo perto do topo do conteúdo (antes da galeria de fotos). Comportamento: `history.back()` se houver histórico de navegação na aba; senão, fallback para `listagem.html`.

## Filtros de `listagem.html` — instantâneos

- Cards continuam sendo HTML normal (não renderizados via JS a partir do array, para preservar o layout já feito à mão), mas ganham atributos `data-id`, `data-tipo`, `data-price`, `data-suites`, `data-city-slug`, `data-amenities` usados só para filtrar/mostrar-esconder.
- Correção de bug: adicionar checkbox "Cidade do Cabo" (faltava).
- Slider de preço: rótulo à direita atualiza ao vivo mostrando "até R$ X"; imóveis com `price` acima do valor selecionado somem.
- Botões de quartos (1+/3+/5+/8+): seleção única; filtra por `suites >= valor`.
- Checkboxes de cidade: múltipla seleção, comportamento OU (nenhuma marcada = todas as cidades).
- Chips de infraestrutura: múltipla seleção, comportamento OU (mostra imóveis com qualquer uma das amenidades marcadas).
- Pills "Todos / Residencial / Comercial" acima da grade de resultados, sincronizadas com `?tipo=` na URL e com os links do menu.
- Todos os filtros combinam entre si com E (preço E quartos E cidade E amenidade E tipo).
- Estado vazio: se nada bater, mostra mensagem "Nenhum imóvel encontrado com esses filtros" + botão "Limpar filtros".
- Parâmetros de URL (`?cidade=`, `?categoria=`, `?transacao=`, `?tipo=`) vindos da busca da home pré-aplicam filtros ao carregar a página, mostrados como chips removíveis acima dos resultados.

## Busca da home (`index.html`)

- Dropdown "Cidade" passa a listar as cidades reais do estoque (`citySlug` dos imóveis em `properties.js`), não mais Londres/Mônaco/Nova York.
- Botão "Buscar" monta a query string a partir dos 3 selects e redireciona para `listagem.html`.
- Sem imóveis de aluguel no estoque: selecionar "Alugar" e buscar mostra o estado vazio da listagem (honesto, sem dado fake).

## Menu: remoção do item "Detalhes"

Como cada card agora leva ao seu próprio imóvel, o item de menu fixo "Detalhes" (presente em `listagem.html`, `detalhes.html`, `contato.html`) não representa mais uma seção específica do site — é removido do menu (desktop e mobile) nas 3 páginas. "Residencial" e "Comercial" passam a ser links reais: `listagem.html?tipo=residencial` e `listagem.html?tipo=comercial`.

## WhatsApp no formulário de contato

- Número de WhatsApp centralizado em uma única constante `WHATSAPP_NUMBER` em `js/scripts.js` (valor placeholder `5511999999999`, igual ao já usado em `detalhes.html`, fácil de trocar depois).
- Submit do formulário em `contato.html`: `preventDefault()`, monta mensagem formatada com nome/e-mail/assunto/mensagem, abre `https://wa.me/<numero>?text=<mensagem>` em nova aba.
- O botão "WhatsApp Direto" de `detalhes.html` passa a usar a mesma constante.

## Fora de escopo (não incluído neste ciclo)

- Backend/API real, persistência, painel administrativo para os imóveis.
- Autenticação ou upload de imagens.
- Internacionalização de moeda/idioma.
- Ordenação de resultados (ex: por preço) — não foi pedido.
