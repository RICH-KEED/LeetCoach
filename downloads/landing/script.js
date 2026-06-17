// --- GSAP Initializations ---
document.addEventListener('DOMContentLoaded', () => {
  // Entrance Animations
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
  
  tl.to('.badge-container', { opacity: 1, y: 0 })
    .to('.hero-title', { opacity: 1, y: 0 }, '-=0.7')
    .to('.hero-subtitle', { opacity: 1, y: 0 }, '-=0.7')
    .to('.hero-actions', { opacity: 1, y: 0 }, '-=0.7')
    .to('.provider-strip', { opacity: 1, y: 0 }, '-=0.6');
    
  // Custom Hover Cursor tracking
  const cursor = document.querySelector('.custom-cursor');
  document.addEventListener('mousemove', (e) => {
    gsap.to(cursor, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.1,
      ease: 'power1.out'
    });
  });

  // Simulator Interactive Tabs
  const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update panels
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.getAttribute('id') === `panel-${targetTab}`) {
          panel.classList.add('active');
        }
      });
    });
  });

  // Pricing Yearly/Monthly Toggle
  const billingToggle = document.getElementById('billing-toggle');
  const proPrice = document.getElementById('pro-price');
  const proPeriod = document.getElementById('pro-period');

  if (billingToggle && proPrice && proPeriod) {
    billingToggle.addEventListener('change', () => {
      if (billingToggle.checked) {
        // Yearly active (Save 33% -> $4/mo billed annually)
        gsap.to(proPrice, {
          textContent: 4,
          duration: 0.4,
          snap: { textContent: 1 },
          onUpdate: function() {
            proPrice.innerHTML = Math.round(this.targets()[0].textContent);
          }
        });
        proPeriod.textContent = '/mo (billed annually)';
      } else {
        // Monthly active ($6/mo)
        gsap.to(proPrice, {
          textContent: 6,
          duration: 0.4,
          snap: { textContent: 1 },
          onUpdate: function() {
            proPrice.innerHTML = Math.round(this.targets()[0].textContent);
          }
        });
        proPeriod.textContent = '/mo';
      }
    });
  }
});

// --- Three.js Particle Background Animation ---
const canvas = document.getElementById('canvas-3d');
if (canvas) {
  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  // Geometry
  const particlesCount = 800;
  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);
  
  const accentColor = new THREE.Color('#f59e0b');
  const secondaryColor = new THREE.Color('#3b82f6');
  
  for(let i = 0; i < particlesCount * 3; i += 3) {
    // Distribute randomly in a cube
    positions[i] = (Math.random() - 0.5) * 12;
    positions[i+1] = (Math.random() - 0.5) * 12;
    positions[i+2] = (Math.random() - 0.5) * 12;
    
    // Mix colors between LeetCode amber and blue
    const mixRatio = Math.random();
    const mixedColor = accentColor.clone().lerp(secondaryColor, mixRatio);
    
    colors[i] = mixedColor.r;
    colors[i+1] = mixedColor.g;
    colors[i+2] = mixedColor.b;
  }
  
  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  // Custom Circular Particle Shader Material
  const vertexShader = `
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (12.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  
  const fragmentShader = `
    varying vec3 vColor;
    void main() {
      // Create a smooth round circle shape
      float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
      if (distanceToCenter > 0.5) discard;
      float strength = 1.0 - (distanceToCenter * 2.0);
      gl_FragColor = vec4(vColor, strength * 0.8);
    }
  `;
  
  const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  });
  
  // Mesh
  const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);
  
  // Interaction Mouse tracking
  let mouseX = 0;
  let mouseY = 0;
  
  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
  });
  
  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  
  // Animation Loop
  const clock = new THREE.Clock();
  
  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    
    // Rotate particle system slowly
    particleSystem.rotation.y = elapsedTime * 0.05;
    particleSystem.rotation.x = elapsedTime * 0.02;
    
    // Camera parallax movement from mouse position
    camera.position.x += (mouseX * 2.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 2.5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    
    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
  };
  
  tick();
}
