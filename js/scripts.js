/**
 * ARQUIVO: scripts.js
 * DESCRIÇÃO: Lógica de interação, navegação e integração de formulários.
 */

// Número de WhatsApp da imobiliária — troque aqui quando tiver o número real.
// Usado tanto no formulário de contato.html quanto no botão "WhatsApp Direto" de detalhes.html.
const WHATSAPP_NUMBER = '5511999999999';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Estate Heritage: Scripts carregados com sucesso.');

    // 1. Lógica para o formulário de interesse em detalhes.html (Sheet Monkey)
    const sheetMonkeyForms = document.querySelectorAll('form[action*="sheetmonkey"]');
    sheetMonkeyForms.forEach(form => {
        form.addEventListener('submit', () => {
            console.log('Formulário enviado. Certifique-se de configurar a URL do Sheet Monkey no atributo action.');
        });
    });

    // 2. Smooth Scroll para links internos
    const smoothLinks = document.querySelectorAll('a[href^="#"]');
    smoothLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href');
            const element = document.querySelector(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // 3. Exemplo de animação simples na rolagem (opcional)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('opacity-100');
                entry.target.classList.remove('opacity-0');
            }
        });
    }, observerOptions);

    // Selecione elementos para animar se desejar
    // document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // 4. Menu mobile (toggle do botão hamburguer no header)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        const closeMobileMenu = () => {
            mobileMenu.classList.add('hidden');
            mobileMenu.classList.remove('flex');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
        };

        mobileMenuButton.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.contains('flex');
            mobileMenu.classList.toggle('hidden', isOpen);
            mobileMenu.classList.toggle('flex', !isOpen);
            mobileMenuButton.setAttribute('aria-expanded', String(!isOpen));
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                closeMobileMenu();
            }
        });
    }

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
});
