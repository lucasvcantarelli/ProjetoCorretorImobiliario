/*
 * Scroll story: sequência de frames (imagem por imagem) controlada pelo
 * progresso do scroll, usada como background da Hero (#hero-header,
 * fixo/"sticky" dentro do wrapper mais alto #hero-scroll-wrapper).
 *
 * CONFIGURAÇÃO — ajuste livremente:
 *   totalFrames     quantidade de frames da sequência.
 *   framePath(n)    caminho do frame n (1-based). Troque a pasta/padrão de nome aqui.
 *   scrollHeightVh  altura da seção de scroll, em "vh". Quanto maior, mais lenta
 *                   (mais scroll necessário) é a progressão pelos frames.
 *   smoothing       0 a 1. 1 = frame sempre exatamente na posição do scroll (sem atraso).
 *                   Valores um pouco menores (ex.: 0.5) suavizam saltos bruscos de scroll
 *                   (roda do mouse, "Page Down") sem introduzir atraso perceptível.
 *   maxDevicePixelRatio  limita a resolução do canvas em telas de alta densidade
 *                        (economiza memória/GPU, principalmente no mobile).
 *   preloadBatchSize     quantos frames carregar por lote, em segundo plano, após o frame 1.
 */
(() => {
    'use strict';

    const CONFIG = {
        totalFrames: 80,
        framePath: (n) => `assets/frames/frame-${String(n).padStart(3, '0')}.webp`,
        scrollHeightVh: 400,
        smoothing: 0.5,
        maxDevicePixelRatio: 1.5,
        preloadBatchSize: 10,
    };

    const wrapper = document.getElementById('hero-scroll-wrapper');
    const header = document.getElementById('hero-header');
    const canvas = document.getElementById('construction-canvas');
    if (!wrapper || !header || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fonte única da verdade para a altura do wrapper (sobrescreve o fallback do CSS/Tailwind).
    wrapper.style.height = `${CONFIG.scrollHeightVh}vh`;

    const lastIndex = CONFIG.totalFrames - 1;
    const images = new Array(CONFIG.totalFrames);

    let targetProgress = 0;
    let displayProgress = 0;
    let currentFrameIndex = -1;
    let rafId = null;
    let sectionInView = false;

    function loadImage(index) {
        return new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => { images[index] = img; resolve(); };
            img.onerror = () => resolve(); // uma falha isolada não deve travar o preload dos demais
            img.src = CONFIG.framePath(index + 1);
        });
    }

    function nearestLoadedFrame(target) {
        if (images[target]) return target;
        for (let d = 1; d <= lastIndex; d++) {
            if (images[target - d]) return target - d;
            if (images[target + d]) return target + d;
        }
        return -1;
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDevicePixelRatio);
        const w = Math.round(rect.width * dpr);
        const h = Math.round(rect.height * dpr);
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
    }

    // Desenha preservando o enquadramento original (equivalente a object-fit: cover),
    // sem zoom, pan ou rotação adicionais além do necessário para preencher o canvas.
    function drawFrame(index) {
        const img = images[index] || images[nearestLoadedFrame(index)];
        if (!img) return false;

        const cw = canvas.width;
        const ch = canvas.height;
        const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
        return true;
    }

    function computeTargetProgress() {
        const rect = wrapper.getBoundingClientRect();
        // O quanto o header (elemento sticky) fica "preso" é (altura do wrapper -
        // altura do próprio header) — não a altura da viewport, já que o header
        // tem uma altura fixa própria (h-[921px]) que pode ser maior ou menor
        // que a tela.
        const scrollable = rect.height - header.offsetHeight;
        if (scrollable <= 0) return rect.top <= 0 ? 1 : 0;
        return Math.min(1, Math.max(0, -rect.top / scrollable));
    }

    function tick() {
        targetProgress = computeTargetProgress();
        displayProgress += (targetProgress - displayProgress) * CONFIG.smoothing;
        if (Math.abs(targetProgress - displayProgress) < 0.0008) {
            displayProgress = targetProgress;
        }

        const frameIndex = Math.min(lastIndex, Math.max(0, Math.floor(displayProgress * lastIndex)));
        if (frameIndex !== currentFrameIndex && drawFrame(frameIndex)) {
            currentFrameIndex = frameIndex;
        }

        // Continua rodando enquanto a seção estiver visível ou ainda houver
        // distância até o alvo (ex.: suavização terminando de convergir).
        if (sectionInView || displayProgress !== targetProgress) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
        }
    }

    function requestTick() {
        if (rafId === null) {
            rafId = requestAnimationFrame(tick);
        }
    }

    const observer = new IntersectionObserver((entries) => {
        sectionInView = entries[0].isIntersecting;
        if (sectionInView) requestTick();
    }, { rootMargin: '15% 0px 15% 0px' });
    observer.observe(wrapper);

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resizeCanvas();
            if (currentFrameIndex !== -1) drawFrame(currentFrameIndex);
        }, 150);
    }, { passive: true });

    function preloadRemaining() {
        const queue = [];
        for (let i = 1; i <= lastIndex; i++) queue.push(i);

        const scheduleIdle = window.requestIdleCallback
            ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
            : (cb) => setTimeout(() => cb({ timeRemaining: () => 10 }), 1);

        function loadNextBatch() {
            if (queue.length === 0) return;
            const batch = queue.splice(0, CONFIG.preloadBatchSize);
            Promise.all(batch.map(loadImage)).then(() => {
                if (queue.length > 0) scheduleIdle(loadNextBatch);
            });
        }
        scheduleIdle(loadNextBatch);
    }

    async function init() {
        resizeCanvas();
        await loadImage(0);
        drawFrame(0);
        currentFrameIndex = 0;
        requestTick();
        preloadRemaining();
    }

    init();
})();
