// app.js — Full 3D experience

const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const scrollY = { current: 0, target: 0 };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 992;

function onMouseMove(event) {
  mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
}

if (!prefersReducedMotion && !isTouch) {
  window.addEventListener('mousemove', onMouseMove, { passive: true });
}

window.addEventListener('scroll', () => {
  scrollY.target = window.scrollY;
}, { passive: true });

// === CUSTOM CURSOR (decorative — native OS cursor always stays visible) ===
const CURSOR_INTERACTIVE = 'a, button, .btn, .btn-3d, .button, .skill, .portfolio-item, .contact-category, .contact-link, .card, .language-item, .nav-link, .accordion-button, input, textarea, select, label[for]';
const isDesktopPointer = !prefersReducedMotion
  && window.matchMedia('(pointer: fine)').matches
  && !window.matchMedia('(pointer: coarse)').matches;

function initCursorGlow() {
  if (!isDesktopPointer) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  glow.setAttribute('aria-hidden', 'true');
  document.body.appendChild(glow);

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  document.body.classList.add('cursor-enhanced');

  let glowX = window.innerWidth / 2;
  let glowY = window.innerHeight / 2;
  let pointerOnPage = false;

  const moveOverlay = (x, y) => {
    glowX = x;
    glowY = y;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    glow.dataset.x = String(x);
    glow.dataset.y = String(y);
    glow.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
  };

  const showOverlay = () => {
    pointerOnPage = true;
    ring.style.opacity = '1';
    glow.style.opacity = '1';
  };

  const hideOverlay = () => {
    pointerOnPage = false;
    ring.style.opacity = '0';
    glow.style.opacity = '0';
    ring.classList.remove('cursor-ring--active', 'cursor-ring--click');
  };

  const handlePointer = (e) => {
    if (e.pointerType === 'touch') return;
    moveOverlay(e.clientX, e.clientY);
    showOverlay();
  };

  window.addEventListener('mousemove', handlePointer, { passive: true });
  window.addEventListener('pointermove', handlePointer, { passive: true });

  document.addEventListener('mouseenter', () => {
    if (pointerOnPage) showOverlay();
  });

  document.addEventListener('mouseleave', (e) => {
    if (!e.relatedTarget && !e.toElement) hideOverlay();
  });

  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    handlePointer(e);
    ring.classList.add('cursor-ring--click');
  }, { passive: true });

  document.addEventListener('pointerup', () => {
    ring.classList.remove('cursor-ring--click');
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(CURSOR_INTERACTIVE)) {
      ring.classList.add('cursor-ring--active');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest(CURSOR_INTERACTIVE);
    if (el && !el.contains(e.relatedTarget)) {
      ring.classList.remove('cursor-ring--active');
    }
  });

  function updateGlow() {
    if (pointerOnPage) {
      const currentX = parseFloat(glow.dataset.x) || glowX;
      const currentY = parseFloat(glow.dataset.y) || glowY;
      const nextX = currentX + (glowX - currentX) * 0.12;
      const nextY = currentY + (glowY - currentY) * 0.12;
      glow.dataset.x = String(nextX);
      glow.dataset.y = String(nextY);
      glow.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) translate(-50%, -50%)`;
    }
    requestAnimationFrame(updateGlow);
  }

  moveOverlay(glowX, glowY);
  updateGlow();
}

// === 3D CARD TILT ===
function init3DTilt() {
  if (prefersReducedMotion || isTouch) return;

  const tiltElements = document.querySelectorAll('.tilt-card, .card, .skill, .portfolio-item, .language-item, .contact-category');

  tiltElements.forEach((el) => {
    el.classList.add('tilt-ready');

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateZ(12px) scale(1.02)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// === THREE.JS FULL 3D SCENE ===
const canvas = document.querySelector('#bg');
let threeObjects = null;

if (canvas && typeof THREE !== 'undefined') {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1a0033, 0.008);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 45);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const iconGroup = new THREE.Group();
  const iconSprites = [];

  function createIconTexture(label, color, font) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fill();

    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(label, size / 2, size / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  const BACKGROUND_ICONS = [
    { label: '</>', font: 'bold 38px monospace', color: '#ff77ff' },
    { label: '{ }', font: 'bold 40px monospace', color: '#c084fc' },
    { label: 'JS', font: 'bold 40px Segoe UI, sans-serif', color: '#f7df1e' },
    { label: 'C+', font: 'bold 34px Segoe UI, sans-serif', color: '#00599c' },
    { label: 'PHP', font: 'bold 34px Segoe UI, sans-serif', color: '#8993be' },
    { label: 'HTML', font: 'bold 28px Segoe UI, sans-serif', color: '#e44d26' },
    { label: 'CSS', font: 'bold 34px Segoe UI, sans-serif', color: '#60a5fa' },
    { label: 'SQL', font: 'bold 34px Segoe UI, sans-serif', color: '#22d3ee' },
    { label: 'API', font: 'bold 32px Segoe UI, sans-serif', color: '#f472b6' },
    { label: '⚡', font: '48px Segoe UI, sans-serif', color: '#fbbf24' },
    { label: '💻', font: '46px Segoe UI, sans-serif', color: '#93c5fd' },
    { label: '🖥', font: '46px Segoe UI, sans-serif', color: '#a78bfa' },
    { label: '✉', font: '50px Segoe UI, sans-serif', color: '#667eea' },
    { label: '📧', font: '46px Segoe UI, sans-serif', color: '#818cf8' },
    { label: '@', font: 'bold 48px Segoe UI, sans-serif', color: '#c4b5fd' },
    { label: 'in', font: 'bold 40px Segoe UI, sans-serif', color: '#0a66c2' },
    { label: 'GH', font: 'bold 36px Segoe UI, sans-serif', color: '#e6edf3' },
    { label: '📷', font: '46px Segoe UI, sans-serif', color: '#e4405f' },
    { label: '▶', font: '44px Segoe UI, sans-serif', color: '#ef4444' },
    { label: '🔗', font: '44px Segoe UI, sans-serif', color: '#38bdf8' },
    { label: 'SEO', font: 'bold 30px Segoe UI, sans-serif', color: '#4ade80' },
  ];

  function addFloatingIcon(iconDef) {
    const texture = createIconTexture(iconDef.label, iconDef.color, iconDef.font);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    const scale = 2.2 + Math.random() * 2.8;
    sprite.scale.set(scale, scale, 1);

    const x = THREE.MathUtils.randFloatSpread(170);
    const y = THREE.MathUtils.randFloatSpread(130);
    const z = THREE.MathUtils.randFloatSpread(110) - 15;
    sprite.position.set(x, y, z);
    sprite.userData = {
      baseX: x,
      baseY: y,
      baseZ: z,
      speed: 0.15 + Math.random() * 0.35,
      offset: Math.random() * Math.PI * 2,
      floatAmp: 1.5 + Math.random() * 2.5,
    };
    iconSprites.push(sprite);
    iconGroup.add(sprite);
  }

  const isMobile = window.innerWidth < 768;
  const iconCopies = isMobile ? 1 : 2;
  for (let copy = 0; copy < iconCopies; copy += 1) {
    BACKGROUND_ICONS.forEach((iconDef) => addFloatingIcon(iconDef));
  }

  scene.add(iconGroup);

  // Lighting
  const mouseLight = new THREE.PointLight(0xcc88ff, 2, 150);
  mouseLight.position.set(0, 0, 50);
  scene.add(mouseLight);

  const accentLight = new THREE.PointLight(0x4488ff, 1.2, 100);
  accentLight.position.set(-30, 20, 30);
  scene.add(accentLight);

  const accentLight2 = new THREE.PointLight(0xff4488, 1, 100);
  accentLight2.position.set(30, -15, 20);
  scene.add(accentLight2);

  scene.add(new THREE.AmbientLight(0x332255, 0.5));

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    scrollY.current += (scrollY.target - scrollY.current) * 0.08;

    if (!prefersReducedMotion) {
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      const scrollFactor = scrollY.current * 0.008;
      camera.position.x += (mouse.x * 12 - camera.position.x) * 0.04;
      camera.position.y += (mouse.y * 8 + scrollFactor * 2 - camera.position.y) * 0.04;
      camera.position.z = 45 - scrollFactor * 3;
      camera.lookAt(0, scrollFactor * -0.5, 0);

      mouseLight.position.set(mouse.x * 60, mouse.y * 50, 40);
      accentLight.position.x = -30 + mouse.x * 10;
      accentLight2.position.x = 30 + mouse.x * 8;

      iconGroup.rotation.y = elapsed * 0.012 + mouse.x * 0.15;
      iconGroup.rotation.x = mouse.y * 0.08;

      iconSprites.forEach((sprite) => {
        const { baseX, baseY, baseZ, speed, offset, floatAmp } = sprite.userData;
        const drift = Math.sin(elapsed * speed + offset) * floatAmp;
        sprite.position.x = baseX + mouse.x * 5 * Math.sin(offset) + drift * 0.4;
        sprite.position.y = baseY + mouse.y * 4 * Math.cos(offset) + Math.cos(elapsed * speed * 0.8 + offset) * floatAmp;
        sprite.position.z = baseZ + Math.sin(elapsed * speed * 0.6 + offset) * 0.6;
        sprite.material.rotation = elapsed * 0.08 + offset;
      });
    }

    renderer.render(scene, camera);
  }
  animate();

  threeObjects = { scene, camera, renderer, accentLight, accentLight2, iconGroup, iconSprites };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// === GSAP 3D SCROLL ANIMATIONS ===
function initScrollAnimations() {
  if (typeof gsap === 'undefined' || prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  gsap.from('.site-header__avatar', { duration: 1, y: 30, opacity: 0, scale: 0.85, ease: 'power3.out' });
  gsap.from('.site-header__eyebrow', { duration: 1, y: 40, opacity: 0, rotateX: -30, transformOrigin: 'center top', ease: 'power3.out', delay: 0.1 });
  gsap.from('.site-header h1', { duration: 1.2, y: 60, opacity: 0, rotateX: -20, scale: 0.9, delay: 0.15, ease: 'power4.out' });
  gsap.from('.site-header__tagline', { duration: 1, y: 40, opacity: 0, delay: 0.4, ease: 'power3.out' });
  gsap.from('.site-header__tagline--secondary', { duration: 1, y: 30, opacity: 0, delay: 0.55, ease: 'power3.out' });
  gsap.from('.navbar', { duration: 0.8, y: -30, opacity: 0, delay: 0.6, ease: 'power2.out' });

  // Section panels — 3D fly-in
  gsap.utils.toArray('.section-panel').forEach((panel, i) => {
    gsap.from(panel, {
      scrollTrigger: { trigger: panel, start: 'top 88%', toggleActions: 'play none none none' },
      duration: 1,
      y: 80,
      opacity: 0,
      rotateX: 12,
      scale: 0.96,
      transformOrigin: 'center bottom',
      ease: 'power3.out',
      delay: i * 0.05,
    });
  });

  // Section headings
  gsap.utils.toArray('section h2').forEach((heading) => {
    gsap.from(heading, {
      scrollTrigger: { trigger: heading, start: 'top 90%' },
      duration: 0.8,
      x: -40,
      opacity: 0,
      rotateY: -15,
      ease: 'power2.out',
    });
  });

  // Skills — 3D stagger pop
  gsap.from('.skill', {
    scrollTrigger: { trigger: '#skills', start: 'top 80%' },
    duration: 0.6,
    y: 50,
    opacity: 0,
    rotateX: 45,
    scale: 0.8,
    stagger: { amount: 0.8, grid: 'auto', from: 'start' },
    ease: 'back.out(1.4)',
  });

  // Experience cards
  gsap.from('#experience .card', {
    scrollTrigger: { trigger: '#experience', start: 'top 80%' },
    duration: 0.9,
    x: (i) => (i % 2 === 0 ? -60 : 60),
    opacity: 0,
    rotateY: (i) => (i % 2 === 0 ? -20 : 20),
    stagger: 0.2,
    ease: 'power3.out',
  });

  // Language cards
  gsap.from('.language-item', {
    scrollTrigger: { trigger: '#languages', start: 'top 80%' },
    duration: 0.7,
    y: 60,
    opacity: 0,
    rotateX: 30,
    stagger: 0.15,
    ease: 'power2.out',
  });

  // Portfolio items
  gsap.from('.portfolio-item', {
    scrollTrigger: { trigger: '#portfolio', start: 'top 80%' },
    duration: 0.9,
    y: 70,
    opacity: 0,
    rotateY: 25,
    scale: 0.9,
    stagger: 0.2,
    ease: 'power3.out',
  });

  // Contact categories
  gsap.from('.contact-category', {
    scrollTrigger: { trigger: '#contact', start: 'top 80%' },
    duration: 0.8,
    y: 50,
    opacity: 0,
    rotateX: 20,
    stagger: 0.15,
    ease: 'power2.out',
  });

  // Education list items
  gsap.from('#education li', {
    scrollTrigger: { trigger: '#education', start: 'top 80%' },
    duration: 0.5,
    x: -30,
    opacity: 0,
    stagger: 0.08,
    ease: 'power2.out',
  });

  // Parallax on header
  gsap.to('.site-header', {
    scrollTrigger: { trigger: '.site-header', start: 'top top', end: 'bottom top', scrub: 1 },
    y: 80,
    opacity: 0.3,
    scale: 0.95,
  });
}

// === THEME-AWARE 3D LIGHTING ===
function update3DTheme(isLight) {
  if (!threeObjects) return;
  const { scene, accentLight, accentLight2, iconGroup, iconSprites } = threeObjects;
  if (isLight) {
    scene.fog.color.setHex(0xe8e0f0);
    scene.fog.density = 0.006;
    accentLight.color.setHex(0x5dade2);
    accentLight2.color.setHex(0x76c7c0);
  } else {
    scene.fog.color.setHex(0x1a0033);
    scene.fog.density = 0.008;
    accentLight.color.setHex(0x4488ff);
    accentLight2.color.setHex(0xff4488);
  }
  if (iconSprites) {
    iconSprites.forEach((sprite) => {
      sprite.material.opacity = isLight ? 0.5 : 0.72;
    });
  }
  if (iconGroup) iconGroup.visible = true;
}

// === MOBILE DYNAMIC ISLAND ===
function initDynamicIsland() {
  const island = document.getElementById('dynamic-island');
  const toggle = document.getElementById('dynamic-island-toggle');
  const panel = document.getElementById('dynamic-island-panel');
  const statusEl = document.getElementById('dynamic-island-status');
  const islandThemeBtn = document.getElementById('dynamic-island-theme');
  const mainThemeBtn = document.getElementById('theme-toggle-button');

  if (!island || !toggle || !panel) return;

  // Mount on <html> so position:fixed stays viewport-locked while scrolling
  if (island.parentElement !== document.documentElement) {
    document.documentElement.appendChild(island);
  }

  const mobileQuery = window.matchMedia('(max-width: 991.98px)');

  const sectionLabels = {
    about: 'About',
    education: 'Education',
    experience: 'Experience',
    skills: 'Skills',
    languages: 'Languages',
    portfolio: 'Portfolio',
    faq: 'FAQ',
    contact: 'Contact',
  };

  const setExpanded = (open) => {
    island.classList.toggle('is-expanded', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close quick actions' : 'Open quick actions');
    panel.hidden = !open;
  };

  const closeIsland = () => setExpanded(false);

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setExpanded(!island.classList.contains('is-expanded'));
  });

  document.addEventListener('click', (e) => {
    if (!island.contains(e.target)) closeIsland();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeIsland();
  });

  panel.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeIsland);
  });

  if (islandThemeBtn && mainThemeBtn) {
    islandThemeBtn.addEventListener('click', () => {
      mainThemeBtn.click();
      islandThemeBtn.textContent = document.body.classList.contains('light-mode') ? 'Light' : 'Dark';
    });
    islandThemeBtn.textContent = document.body.classList.contains('light-mode') ? 'Light' : 'Dark';
  }

  const updateForViewport = () => {
    if (mobileQuery.matches) {
      document.body.classList.add('has-dynamic-island');
    } else {
      document.body.classList.remove('has-dynamic-island');
      closeIsland();
    }
  };

  mobileQuery.addEventListener('change', updateForViewport);
  updateForViewport();

  const sections = Object.keys(sectionLabels)
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (statusEl && sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && statusEl) {
            statusEl.textContent = sectionLabels[entry.target.id] || 'Portfolio';
          }
        });
      },
      { rootMargin: '-40% 0px -45% 0px', threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }
}

// === CHATBASE — ensure bubble stays above page layers ===
function initChatbotPin() {
  const boostBubble = () => {
    const bubble = document.getElementById('chatbase-bubble-button');
    if (bubble) {
      bubble.style.setProperty('z-index', '10050', 'important');
    }
  };

  boostBubble();
  window.addEventListener('load', boostBubble);

  const observer = new MutationObserver(boostBubble);
  observer.observe(document.body, { childList: true, subtree: true });

  let attempts = 0;
  const retry = setInterval(() => {
    boostBubble();
    attempts += 1;
    if (attempts >= 10) clearInterval(retry);
  }, 500);
}

// === INIT ===
function initMobileNav() {
  const navbarCollapse = document.getElementById('mainNavbar');
  if (!navbarCollapse) return;

  navbarCollapse.querySelectorAll('.nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
        const toggler = document.querySelector('.navbar-toggler');
        if (toggler) toggler.click();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCursorGlow();
  init3DTilt();
  initScrollAnimations();
  initMobileNav();

  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('hide');
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, 600);

  const themeToggleButton = document.getElementById('theme-toggle-button');
  const body = document.body;

  const updateToggleButtonIcon = (isLightMode) => {
    if (themeToggleButton) themeToggleButton.textContent = isLightMode ? '☀️' : '🌙';
  };

  const applyInitialTheme = () => {
    const storedTheme = localStorage.getItem('theme');
    const isLight = storedTheme === 'light';
    body.classList.toggle('light-mode', isLight);
    updateToggleButtonIcon(isLight);
    update3DTheme(isLight);
  };

  applyInitialTheme();
  initDynamicIsland();
  initChatbotPin();

  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      const isLightMode = body.classList.contains('light-mode');
      localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
      updateToggleButtonIcon(isLightMode);
      update3DTheme(isLightMode);
      const islandThemeBtn = document.getElementById('dynamic-island-theme');
      if (islandThemeBtn) islandThemeBtn.textContent = isLightMode ? 'Light' : 'Dark';
    });
  }
});
