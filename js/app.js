/**
 * NOIR ÉTERNEL – Canvas Frame Renderer v3
 * Apple-style image-sequence with GSAP ScrollTrigger
 * + Creative left element, U-shape animation, adjusted scene timing
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
        setTimeout(() => {
            loader.classList.add('done');
            resize();
            initGSAP();
        }, 200); // faster start after load
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

        // ─── Hero text (Scene 1) ───
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

        // ─── Scene 2: Creative Left + Right Text ───
        const scene2 = scenes[1];
        if (scene2) {
            const tw = scene2.querySelector('.text-wrap');
            const creativeLeft = document.getElementById('creativeLeft');
            const noteLines = creativeLeft?.querySelectorAll('.note-line');
            const noteAccents = creativeLeft?.querySelectorAll('.note-accent');

            // Right text appears earlier (before bottle fully visible)
            ScrollTrigger.create({
                trigger: scene2,
                start: 'top 75%',
                end: '55% top',
                onEnter: () => tw?.classList.add('visible'),
                onLeave: () => tw?.classList.remove('visible'),
                onEnterBack: () => tw?.classList.add('visible'),
                onLeaveBack: () => tw?.classList.remove('visible'),
            });

            // Creative left animation
            if (creativeLeft && noteLines) {
                const leftTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: scene2,
                        start: 'top 70%',
                        end: '50% top',
                        onEnter: () => creativeLeft.classList.add('visible'),
                        onLeave: () => creativeLeft.classList.remove('visible'),
                        onEnterBack: () => {
                            creativeLeft.classList.add('visible');
                            leftTl.restart();
                        },
                        onLeaveBack: () => creativeLeft.classList.remove('visible'),
                    }
                });

                noteLines.forEach((line, i) => {
                    leftTl.to(line, {
                        opacity: 1,
                        x: 0,
                        duration: 0.6,
                        ease: 'power3.out',
                    }, i * 0.12);
                });

                if (noteAccents) {
                    noteAccents.forEach((acc, i) => {
                        leftTl.fromTo(acc,
                            { opacity: 0, scale: 0.5 },
                            { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' },
                            0.3 + i * 0.4
                        );
                    });
                }
            }
        }

        // ─── Scene 3: U-Shape GSAP Animation ───
        const uShapeSection = document.getElementById('uShapeSection');
        if (uShapeSection) {
            const uWords = uShapeSection.querySelectorAll('.u-word');
            const uBody = uShapeSection.querySelector('.u-body');
            let uPlayed = false;

            ScrollTrigger.create({
                trigger: scenes[2],
                start: '35% top',
                end: '95% top',
                onEnter: () => {
                    if (!uPlayed) {
                        uPlayed = true;
                        // Animate each word in
                        gsap.fromTo(uWords[0],
                            { opacity: 0, x: -80, rotateZ: -5 },
                            { opacity: 1, x: 0, rotateZ: 0, duration: 0.8, ease: 'power3.out' }
                        );
                        gsap.fromTo(uWords[1],
                            { opacity: 0, x: 80, rotateZ: 5 },
                            { opacity: 1, x: 0, rotateZ: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 }
                        );
                        if (uBody) {
                            gsap.fromTo(uBody,
                                { opacity: 0, y: 20 },
                                { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', delay: 0.3 }
                            );
                        }
                        gsap.fromTo(uWords[2],
                            { opacity: 0, y: -50 },
                            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.4 }
                        );
                        gsap.fromTo(uWords[3],
                            { opacity: 0, y: 60 },
                            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.55 }
                        );
                        gsap.fromTo(uWords[4],
                            { opacity: 0, scale: 0.3, rotateZ: -180 },
                            { opacity: 1, scale: 1, rotateZ: 0, duration: 1, ease: 'elastic.out(1, 0.5)', delay: 0.65 }
                        );
                    }
                },
                onLeave: () => {
                    gsap.to([...uWords, uBody].filter(Boolean), { opacity: 0, duration: 0.4 });
                    uPlayed = false;
                },
                onEnterBack: () => {
                    gsap.to([...uWords, uBody].filter(Boolean), { opacity: 1, duration: 0.4 });
                },
                onLeaveBack: () => {
                    gsap.to([...uWords, uBody].filter(Boolean), { opacity: 0, duration: 0.3 });
                    uPlayed = false;
                },
            });
        }

        // ─── Scenes 4, 5, 6: Text reveals ───
        // Helper: simple robust text toggle
        function setupTextReveal(sceneEl, startPct) {
            if (!sceneEl) return;
            const tw = sceneEl.querySelector('.text-wrap');
            if (!tw) return;
            ScrollTrigger.create({
                trigger: sceneEl,
                start: startPct + '% top',
                end: '95% top',
                onEnter: () => tw.classList.add('visible'),
                onLeave: () => tw.classList.remove('visible'),
                onEnterBack: () => tw.classList.add('visible'),
                onLeaveBack: () => tw.classList.remove('visible'),
            });
        }

        setupTextReveal(scenes[3], 35);  // Scene 4 – Ring
        setupTextReveal(scenes[4], 35);  // Scene 5 – Infinity
        setupTextReveal(scenes[5], 30);  // Scene 6 – Heart

        // ─── Nav + Beams ───
        ScrollTrigger.create({
            start: 100,
            onUpdate: () => {
                const scrolled = scrollY > 100;
                nav.classList.toggle('scrolled', scrolled);
                if (window.beamsDim) window.beamsDim(scrollY > innerHeight * 0.5);
            }
        });

        paint(0);
    }

    // ─── Init ───
    resize();
    preload();
})();
