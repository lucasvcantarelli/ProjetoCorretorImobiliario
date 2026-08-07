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
      // Imagem placeholder reaproveitada do imóvel "obsidian-pavilion" — trocar pela foto real do imóvel.
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
