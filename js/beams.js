/**
 * NOIR ÉTERNEL – GradientBlinds Hero Shader
 * Ported from react-bits/GradientBlinds to vanilla Three.js
 * Professional dark gold/amber colorway for luxury perfume brand
 */
(function () {
    'use strict';

    const container = document.getElementById('beams');
    if (!container) return;

    // ─── Renderer ───
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ─── Colors — luxury gold/amber palette ───
    const colors = [
        [0.45, 0.32, 0.12],  // deep amber
        [0.72, 0.55, 0.22],  // warm gold
        [0.20, 0.14, 0.06],  // dark bronze
        [0.55, 0.40, 0.15],  // antique gold
    ];

    // ─── Shader ───
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
        uniform float uNoise;
        uniform float uBlindCount;
        uniform float uSpotlightRadius;
        uniform float uSpotlightSoftness;
        uniform float uSpotlightOpacity;
        uniform float uShineFlip;
        uniform float uOpacity;
        uniform vec3  uColor0;
        uniform vec3  uColor1;
        uniform vec3  uColor2;
        uniform vec3  uColor3;

        varying vec2 vUv;

        float rand(vec2 co) {
            return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec3 getGradientColor(float t) {
            float tt = clamp(t, 0.0, 1.0);
            float scaled = tt * 3.0;
            float seg = floor(scaled);
            float f = fract(scaled);
            // Smooth interpolation
            f = f * f * (3.0 - 2.0 * f);

            if (seg < 1.0) return mix(uColor0, uColor1, f);
            if (seg < 2.0) return mix(uColor1, uColor2, f);
            return mix(uColor2, uColor3, f);
        }

        void main() {
            vec2 uv = vUv;

            // Gradient base
            float t = uv.x;
            vec3 base = getGradientColor(t);

            // Mouse-reactive spotlight
            vec2 mouseUV = iMouse / iResolution.xy;
            float dist = length(uv - mouseUV);
            float r = max(uSpotlightRadius, 0.001);
            float dn = dist / r;
            float spot = (1.0 - 2.0 * pow(dn, uSpotlightSoftness)) * uSpotlightOpacity;
            spot = max(spot, 0.0);

            // Blinds / stripes
            float stripe = fract(uv.x * max(uBlindCount, 1.0));
            if (uShineFlip > 0.5) stripe = 1.0 - stripe;

            // Compose
            vec3 col = vec3(spot) + base - vec3(stripe);

            // Film grain
            col += (rand(gl_FragCoord.xy + iTime) - 0.5) * uNoise;

            // Vignette — fade edges to black
            float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5) * 1.4);
            col *= vignette;

            // Global opacity for scroll dimming
            col *= uOpacity;

            gl_FragColor = vec4(col, 1.0);
        }
    `;

    // ─── Uniforms ───
    const uniforms = {
        iResolution: { value: new THREE.Vector3(innerWidth, innerHeight, 1) },
        iMouse: { value: new THREE.Vector2(innerWidth / 2, innerHeight / 2) },
        iTime: { value: 0 },
        uNoise: { value: 0.25 },
        uBlindCount: { value: 10 },
        uSpotlightRadius: { value: 0.55 },
        uSpotlightSoftness: { value: 1.2 },
        uSpotlightOpacity: { value: 0.85 },
        uShineFlip: { value: 0 },
        uOpacity: { value: 1.0 },
        uColor0: { value: new THREE.Vector3(...colors[0]) },
        uColor1: { value: new THREE.Vector3(...colors[1]) },
        uColor2: { value: new THREE.Vector3(...colors[2]) },
        uColor3: { value: new THREE.Vector3(...colors[3]) },
    };

    // ─── Fullscreen quad ───
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // ─── Mouse tracking with dampening ───
    const mouseTarget = { x: innerWidth / 2, y: innerHeight / 2 };
    const mouseCurrent = { x: innerWidth / 2, y: innerHeight / 2 };
    const dampening = 0.12;

    document.addEventListener('mousemove', (e) => {
        mouseTarget.x = e.clientX * renderer.getPixelRatio();
        mouseTarget.y = (innerHeight - e.clientY) * renderer.getPixelRatio();
    });

    // ─── Resize ───
    function onResize() {
        renderer.setSize(innerWidth, innerHeight);
        const dpr = renderer.getPixelRatio();
        uniforms.iResolution.value.set(innerWidth * dpr, innerHeight * dpr, 1);
        // Adapt blind count to screen width
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

        // Smooth opacity for scroll dimming
        const currentOp = uniforms.uOpacity.value;
        uniforms.uOpacity.value += (targetOpacity - currentOp) * 0.03;

        renderer.render(scene, camera);
    }

    animate(0);

    // ─── Public API for scroll dimming ───
    window.beamsDim = function (dimmed) {
        targetOpacity = dimmed ? 0.08 : 1.0;
    };
})();
