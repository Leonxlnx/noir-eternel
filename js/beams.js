/**
 * GradientBlinds – Vanilla port of react-bits/GradientBlinds
 * Uses OGL-style shader but rendered via Three.js
 * EXACT original shader logic, gold palette, mix-blend-mode: lighten via CSS
 */
(function () {
    'use strict';

    const container = document.getElementById('beams');
    if (!container) return;

    // ─── Renderer ───
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ─── Exact original shader from react-bits ───
    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        precision highp float;

        uniform vec3  iResolution;
        uniform vec2  iMouse;
        uniform float iTime;

        uniform float uAngle;
        uniform float uNoise;
        uniform float uBlindCount;
        uniform float uSpotlightRadius;
        uniform float uSpotlightSoftness;
        uniform float uSpotlightOpacity;
        uniform float uDistort;
        uniform float uShineFlip;
        uniform float uOpacity;

        uniform vec3 uColor0;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;

        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec2 rotate2D(vec2 p, float a) {
            float c = cos(a);
            float s = sin(a);
            return mat2(c, -s, s, c) * p;
        }

        vec3 getGradientColor(float t) {
            float tt = clamp(t, 0.0, 1.0);
            float scaled = tt * 3.0;
            float seg = floor(scaled);
            float f = fract(scaled);
            f = f * f * (3.0 - 2.0 * f);
            if (seg < 1.0) return mix(uColor0, uColor1, f);
            if (seg < 2.0) return mix(uColor1, uColor2, f);
            return mix(uColor2, uColor3, f);
        }

        void main() {
            vec2 uv0 = vUv;

            // Rotate for angled blinds
            float aspect = iResolution.x / iResolution.y;
            vec2 p = uv0 * 2.0 - 1.0;
            p.x *= aspect;
            vec2 pr = rotate2D(p, uAngle);
            pr.x /= aspect;
            vec2 uv = pr * 0.5 + 0.5;

            vec2 uvMod = uv;
            if (uDistort > 0.0) {
                float a = uvMod.y * 6.0;
                float b = uvMod.x * 6.0;
                float w = 0.01 * uDistort;
                uvMod.x += sin(a) * w;
                uvMod.y += cos(b) * w;
            }

            float t = uvMod.x;
            vec3 base = getGradientColor(t);

            // EXACT original spotlight formula
            vec2 offset = vec2(iMouse.x / iResolution.x, iMouse.y / iResolution.y);
            float d = length(uv0 - offset);
            float r = max(uSpotlightRadius, 1e-4);
            float dn = d / r;
            float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
            vec3 cir = vec3(spot);

            // EXACT original stripe formula
            float stripe = fract(uvMod.x * max(uBlindCount, 1.0));
            if (uShineFlip > 0.5) stripe = 1.0 - stripe;
            vec3 ran = vec3(stripe);

            // EXACT original compose
            vec3 col = cir + base - ran;

            // Film grain
            col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;

            // Scroll dimming
            col *= uOpacity;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    // ─── Uniforms — matches original defaults with gold colors ───
    const uniforms = {
        iResolution: { value: new THREE.Vector3(innerWidth, innerHeight, 1) },
        iMouse: { value: new THREE.Vector2(innerWidth / 2, innerHeight / 2) },
        iTime: { value: 0 },
        uAngle: { value: 0.52 },           // ~30deg angled
        uNoise: { value: 0.3 },             // original default
        uBlindCount: { value: 12 },              // original default
        uSpotlightRadius: { value: 0.5 },      // original default
        uSpotlightSoftness: { value: 1.0 },      // original default
        uSpotlightOpacity: { value: 1.0 },      // original default
        uDistort: { value: 0.0 },
        uShineFlip: { value: 0.0 },
        uOpacity: { value: 1.0 },
        // Dark gold palette — blend mode lighten handles visibility
        uColor0: { value: new THREE.Vector3(0.55, 0.35, 0.08) },
        uColor1: { value: new THREE.Vector3(0.25, 0.15, 0.03) },
        uColor2: { value: new THREE.Vector3(0.45, 0.28, 0.06) },
        uColor3: { value: new THREE.Vector3(0.15, 0.08, 0.02) },
    };

    // ─── Fullscreen quad ───
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        depthWrite: false,
    });
    scene.add(new THREE.Mesh(geo, mat));

    // ─── Mouse with dampening ───
    const mouseTarget = { x: innerWidth / 2, y: innerHeight / 2 };
    const mouseCurrent = { x: innerWidth / 2, y: innerHeight / 2 };
    const dampening = 0.15;

    document.addEventListener('mousemove', (e) => {
        const dpr = renderer.getPixelRatio();
        mouseTarget.x = e.clientX * dpr;
        mouseTarget.y = (innerHeight - e.clientY) * dpr;
    });

    // ─── Resize ───
    function onResize() {
        renderer.setSize(innerWidth, innerHeight);
        const dpr = renderer.getPixelRatio();
        uniforms.iResolution.value.set(innerWidth * dpr, innerHeight * dpr, 1);
        const maxBlinds = Math.max(1, Math.floor(innerWidth / 50));
        uniforms.uBlindCount.value = Math.min(12, maxBlinds);
    }
    addEventListener('resize', onResize);
    onResize();

    // ─── Animate ───
    let targetOpacity = 1.0;
    let lastTime = 0;

    function animate(time) {
        requestAnimationFrame(animate);
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        uniforms.iTime.value = time * 0.001;

        // Smooth mouse
        const factor = 1 - Math.exp(-dt / Math.max(dampening, 0.001));
        mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * factor;
        mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * factor;
        uniforms.iMouse.value.set(mouseCurrent.x, mouseCurrent.y);

        // Smooth scroll dimming
        const cur = uniforms.uOpacity.value;
        uniforms.uOpacity.value += (targetOpacity - cur) * 0.03;

        renderer.render(scene, camera);
    }
    animate(0);

    // ─── Public API ───
    window.beamsDim = function (dimmed) {
        targetOpacity = dimmed ? 0.0 : 1.0;
    };
})();
