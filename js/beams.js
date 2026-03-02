/**
 * NOIR ÉTERNEL – Three.js Volumetric Light Beams
 * Epic golden light rays with gentle animation
 */
(function () {
    'use strict';

    const container = document.getElementById('beams');
    if (!container) return;

    // ─── Scene setup ───
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ─── Beam geometry ───
    // Each beam is a tall thin plane with custom shader
    const beamCount = 7;
    const beams = [];

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform float uTime;
        uniform float uSpeed;
        uniform float uIntensity;
        uniform vec3 uColor;
        varying vec2 vUv;

        void main() {
            // Vertical fade — strongest in center, fades at top and bottom
            float vertFade = sin(vUv.y * 3.14159);
            vertFade = pow(vertFade, 0.8);

            // Horizontal fade — bright center, soft edges
            float horizFade = 1.0 - abs(vUv.x - 0.5) * 2.0;
            horizFade = pow(horizFade, 2.0);

            // Shimmer / pulse
            float shimmer = sin(uTime * uSpeed + vUv.y * 4.0) * 0.3 + 0.7;
            float pulse = sin(uTime * uSpeed * 0.5) * 0.15 + 0.85;

            float alpha = vertFade * horizFade * shimmer * pulse * uIntensity;

            // Soft glow color
            vec3 col = uColor;
            // Brighter core
            col += vec3(0.15, 0.1, 0.02) * horizFade;

            gl_FragColor = vec4(col, alpha);
        }
    `;

    // Beam configs: [xPos, width, height, rotZ, speed, intensity, colorShift]
    const beamConfigs = [
        { x: -3.2, w: 0.15, h: 12, rz: 0.08, speed: 0.4, intensity: 0.5 },
        { x: -1.8, w: 0.25, h: 14, rz: -0.05, speed: 0.3, intensity: 0.7 },
        { x: -0.6, w: 0.10, h: 11, rz: 0.12, speed: 0.5, intensity: 0.4 },
        { x: 0.5, w: 0.30, h: 15, rz: -0.03, speed: 0.25, intensity: 0.8 },
        { x: 1.6, w: 0.12, h: 13, rz: 0.07, speed: 0.45, intensity: 0.5 },
        { x: 2.8, w: 0.20, h: 12, rz: -0.10, speed: 0.35, intensity: 0.65 },
        { x: 3.8, w: 0.08, h: 10, rz: 0.15, speed: 0.55, intensity: 0.35 },
    ];

    const goldColor = new THREE.Color(0.8, 0.6, 0.25);

    beamConfigs.forEach((cfg) => {
        const geo = new THREE.PlaneGeometry(cfg.w, cfg.h, 1, 32);
        const mat = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: cfg.speed },
                uIntensity: { value: cfg.intensity },
                uColor: { value: goldColor },
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cfg.x, 0, 0);
        mesh.rotation.z = cfg.rz;
        mesh.userData = {
            baseX: cfg.x,
            baseRz: cfg.rz,
            swaySpeed: 0.2 + Math.random() * 0.3,
            swayAmt: 0.15 + Math.random() * 0.2,
        };

        scene.add(mesh);
        beams.push(mesh);
    });

    // ─── Floating particles ───
    const particleCount = 60;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
        sizes[i] = Math.random() * 3 + 1;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
        color: new THREE.Color(0.9, 0.75, 0.4),
        size: 0.02,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Resize ───
    function onResize() {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth, innerHeight);
    }
    addEventListener('resize', onResize);

    // ─── Animate ───
    let targetOpacity = 1.0;
    let currentOpacity = 1.0;

    function animate(time) {
        requestAnimationFrame(animate);
        const t = time * 0.001;

        // Smooth opacity transition
        currentOpacity += (targetOpacity - currentOpacity) * 0.02;

        // Animate beams
        beams.forEach((mesh) => {
            mesh.material.uniforms.uTime.value = t;
            const ud = mesh.userData;
            mesh.position.x = ud.baseX + Math.sin(t * ud.swaySpeed) * ud.swayAmt;
            mesh.rotation.z = ud.baseRz + Math.sin(t * ud.swaySpeed * 0.7 + 1) * 0.03;
            mesh.material.uniforms.uIntensity.value *= currentOpacity;
        });

        // Animate particles
        const posArr = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArr[i * 3 + 1] += 0.003; // float upward
            if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = t * 0.02;
        particleMat.opacity = 0.4 * currentOpacity;

        renderer.render(scene, camera);
    }

    animate(0);

    // ─── Scroll-based dimming ───
    window.beamsDim = function (dimmed) {
        targetOpacity = dimmed ? 0.15 : 1.0;
    };
})();
