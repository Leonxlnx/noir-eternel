/**
 * NOIR ÉTERNEL – Canvas Frame Renderer v2
 * Apple-style image-sequence with GSAP ScrollTrigger
 * 588 frames @ 12fps, 98 per scene
 */
(function () {
    'use strict';

    const SCENES = [
        { id: 'scene-01', frames: 98 },
        { id: 'scene-02', frames: 98 },
        { id: 'scene-03', frames: 98 },
        { id: 'scene-04', frames: 98 },
        { id: 'scene-05', frames: 98 },
        { id: 'scene-06', frames: 98 },
    ];
    const TOTAL = SCENES.reduce((s, v) => s + v.frames, 0);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const loader = document.getElementById('loader');
    const loaderBar = document.getElementById('loaderBar');
    const loaderPct = document.getElementById('loaderPercent');
    const nav = document.getElementById('nav');


    const frames = [];
    let loaded = 0;
    let ready = false;
    let curFrame = -1;

    // ─── Canvas sizing ───
    function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        canvas.style.width = innerWidth + 'px';
        canvas.style.height = innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (curFrame >= 0) paint(curFrame);
    }
    addEventListener('resize', resize);

    // ─── Paint ───
    function paint(i) {
        const img = frames[i];
        if (!img?.complete || !img.naturalWidth) return;
        curFrame = i;

        const cw = innerWidth, ch = innerHeight;
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const w = iw * scale, h = ih * scale;

        ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    // ─── Preload ───
    function pad(n) { return String(n).padStart(4, '0'); }

    function preload() {
        let idx = 0;
        for (const scene of SCENES) {
            for (let f = 1; f <= scene.frames; f++) {
                const img = new Image();
                const gi = idx;

                img.onload = img.onerror = () => {
                    loaded++;
                    const pct = Math.round((loaded / TOTAL) * 100);
                    loaderBar.style.width = pct + '%';
                    loaderPct.textContent = pct;
                    if (gi === 0) paint(0);
                    if (loaded >= TOTAL) start();
                };

                img.src = `frames/${scene.id}/frame_${pad(f)}.webp`;
                frames[idx++] = img;
            }
        }

        // Fallback timeout
        setTimeout(() => { if (!ready) start(); }, 15000);
    }

    function start() {
        if (ready) return;
        ready = true;
        loaderBar.style.width = '100%';
        loaderPct.textContent = '100';
        setTimeout(() => {
            loader.classList.add('done');
            resize();
            initGSAP();
        }, 500);
    }

    // ─── GSAP ───
    function initGSAP() {
        gsap.registerPlugin(ScrollTrigger);

        const scenes = document.querySelectorAll('.scene');
        let offset = 0;

        scenes.forEach((section, i) => {
            const sc = SCENES[i];
            if (!sc) return;
            const startF = offset;
            offset += sc.frames;

            // Frame scrubber per section
            ScrollTrigger.create({
                trigger: section,
                start: 'top top',
                end: 'bottom top',
                scrub: 1.8,
                onUpdate: (self) => {
                    const fi = Math.round(startF + self.progress * (sc.frames - 1));
                    paint(Math.min(fi, startF + sc.frames - 1));
                }
            });
        });

        // ─── Hero text ───
        const hero = scenes[0]?.querySelector('.text-wrap');
        if (hero) {
            requestAnimationFrame(() => hero.classList.add('visible'));

            gsap.to(hero, {
                opacity: 0,
                y: -60,
                ease: 'power2.in',
                scrollTrigger: {
                    trigger: scenes[0],
                    start: 'top top',
                    end: '35% top',
                    scrub: true
                }
            });
        }

        // ─── Text reveals ───
        scenes.forEach((section, i) => {
            if (i === 0) return;
            const tw = section.querySelector('.text-wrap');
            if (!tw) return;

            ScrollTrigger.create({
                trigger: section,
                start: 'top 65%',
                end: '60% top',
                onEnter: () => tw.classList.add('visible'),
                onLeave: () => tw.classList.remove('visible'),
                onEnterBack: () => tw.classList.add('visible'),
                onLeaveBack: () => tw.classList.remove('visible'),
            });
        });




        // ─── Nav ───
        ScrollTrigger.create({
            start: 100,
            onUpdate: () => nav.classList.toggle('scrolled', scrollY > 100)
        });



        paint(0);
    }

    // ─── Init ───
    resize();
    preload();
})();
