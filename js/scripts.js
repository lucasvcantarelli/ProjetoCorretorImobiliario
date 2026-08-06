/**
 * ARQUIVO: scripts.js
 * DESCRIÇÃO: Lógica de interação, navegação e integração de formulários.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Estate Heritage: Scripts carregados com sucesso.');

    // 1. Lógica para o formulário de contato / interesse
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            // Aqui você pode adicionar validações extras antes do envio
            // O envio real é feito via atributo 'action' configurado para o Sheet Monkey
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
});
