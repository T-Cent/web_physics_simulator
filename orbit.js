// Solar System Simulation using Three.js
let orbitsScene, orbitsCamera, orbitsRenderer, orbitsCanvas;
let solarSystem, sun, planets = [];
let centralMass = 5000;
let initialDistance = 120;
let initialVelocity = 5;
let isOrbitsRunning = false;
let orbitsAnimationId;
let orbitsClock;

// Initialize the orbits simulation
function initOrbitsSimulation() {
    // Get the canvas container
    orbitsCanvas = document.getElementById('orbits-canvas');
    
    // If the simulation is already initialized, clean up first
    if (orbitsScene) {
        cancelAnimationFrame(orbitsAnimationId);
        orbitsRenderer.dispose();
        orbitsCanvas.removeChild(orbitsRenderer.domElement);
    }
    
    // Create a scene
    orbitsScene = new THREE.Scene();
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    const bgColor = isDarkMode ? 0x111111 : 0xf5f5f5;
    orbitsScene.background = new THREE.Color(bgColor);
    
    // Create a camera
    const aspect = orbitsCanvas.clientWidth / orbitsCanvas.clientHeight;
    orbitsCamera = new THREE.PerspectiveCamera(60, aspect, 0.1, 10000);
    orbitsCamera.position.set(0, 400, 400);
    orbitsCamera.lookAt(0, 0, 0);
    
    // Create a renderer
    orbitsRenderer = new THREE.WebGLRenderer({ antialias: true });
    orbitsRenderer.setSize(orbitsCanvas.clientWidth, orbitsCanvas.clientHeight);
    orbitsCanvas.innerHTML = '';
    orbitsCanvas.appendChild(orbitsRenderer.domElement);
    
    // Create a clock for timing
    orbitsClock = new THREE.Clock();
    
    // Create the solar system
    createSolarSystem();
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    orbitsScene.add(ambientLight);
    
    // Handle window resize
    window.addEventListener('resize', onOrbitsWindowResize);
    
    // Add event listeners for control buttons
    document.getElementById('orbits-start').addEventListener('click', toggleOrbits);
    document.getElementById('orbits-reset').addEventListener('click', resetOrbits);
    
    // Add event listeners for sliders
    document.getElementById('orbits-mass').addEventListener('input', updateCentralMass);
    document.getElementById('orbits-distance').addEventListener('input', updateInitialDistance);
    document.getElementById('orbits-velocity').addEventListener('input', updateInitialVelocity);
    
    // Initial render
    orbitsRenderer.render(orbitsScene, orbitsCamera);
    
    // Start the orbit simulation automatically after a short delay
    setTimeout(() => {
        if (!isOrbitsRunning) {
            toggleOrbits();
        }
    }, 500);
}

// Create the solar system
function createSolarSystem() {
    // Create a group for the whole solar system
    solarSystem = new THREE.Group();
    orbitsScene.add(solarSystem);
    
    // Create the sun
    const sunGeometry = new THREE.SphereGeometry(30, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    solarSystem.add(sun);
    
    // Add a point light at the sun's position
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 2000);
    sun.add(sunLight);
    
    // Create planets
    const planetColors = [0x3498db, 0xe74c3c, 0x2ecc71, 0x9b59b6, 0xf39c12, 0x1abc9c];
    planets = [];
    
    for (let i = 0; i < 6; i++) {
        const distance = initialDistance + i * 40;
        const speed = initialVelocity * Math.sqrt(centralMass / distance);
        const angle = Math.random() * Math.PI * 2;
        const size = 5 + Math.random() * 10;
        
        // Create planet
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshLambertMaterial({ color: planetColors[i] });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        
        // Position planet
        planet.position.x = distance * Math.cos(angle);
        planet.position.z = distance * Math.sin(angle);
        
        // Create orbit line
        const orbitGeometry = new THREE.RingGeometry(distance - 0.5, distance + 0.5, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        const orbitLine = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbitLine.rotation.x = Math.PI / 2;
        
        // Add planet and orbit
        solarSystem.add(planet);
        solarSystem.add(orbitLine);
        
        // Store planet info
        planets.push({
            mesh: planet,
            distance: distance,
            speed: speed,
            angle: angle,
            orbitLine: orbitLine
        });
    }
}

// Update planets
function updatePlanets(deltaTime) {
    // Rotate planets and update positions
    planets.forEach(planet => {
        // Update angle
        planet.angle += planet.speed * deltaTime * 0.2;
        
        // Update position
        planet.mesh.position.x = planet.distance * Math.cos(planet.angle);
        planet.mesh.position.z = planet.distance * Math.sin(planet.angle);
        
        // Rotate planet on its axis
        planet.mesh.rotation.y += deltaTime * 0.5;
    });
    
    // Rotate sun on its axis
    sun.rotation.y += deltaTime * 0.1;
}

// Update the orbits
function updateOrbits() {
    if (!isOrbitsRunning) return;
    
    const deltaTime = orbitsClock.getDelta();
    
    // Update planets
    updatePlanets(deltaTime);
    
    // Slowly rotate camera around the scene
    orbitsCamera.position.x = 400 * Math.cos(orbitsClock.getElapsedTime() * 0.05);
    orbitsCamera.position.z = 400 * Math.sin(orbitsClock.getElapsedTime() * 0.05);
    orbitsCamera.lookAt(0, 0, 0);
    
    // Render the scene
    orbitsRenderer.render(orbitsScene, orbitsCamera);
    
    // Request the next frame
    orbitsAnimationId = requestAnimationFrame(updateOrbits);
}

// Handle window resize
function onOrbitsWindowResize() {
    if (!orbitsCamera || !orbitsRenderer || !orbitsCanvas) return;
    
    orbitsCamera.aspect = orbitsCanvas.clientWidth / orbitsCanvas.clientHeight;
    orbitsCamera.updateProjectionMatrix();
    orbitsRenderer.setSize(orbitsCanvas.clientWidth, orbitsCanvas.clientHeight);
    orbitsRenderer.render(orbitsScene, orbitsCamera);
}

// Toggle orbits animation
function toggleOrbits() {
    isOrbitsRunning = !isOrbitsRunning;
    
    if (isOrbitsRunning) {
        document.getElementById('orbits-start').textContent = 'Pause';
        orbitsClock.start();
        updateOrbits();
    } else {
        document.getElementById('orbits-start').textContent = 'Start';
        cancelAnimationFrame(orbitsAnimationId);
    }
}

// Reset orbits
function resetOrbits() {
    // Remove old solar system
    if (solarSystem) {
        orbitsScene.remove(solarSystem);
    }
    
    // Create new solar system
    createSolarSystem();
    
    // Update the display
    orbitsRenderer.render(orbitsScene, orbitsCamera);
    
    // If the animation is running, pause it
    if (isOrbitsRunning) {
        toggleOrbits();
    }
}

// Update central mass
function updateCentralMass(event) {
    centralMass = parseInt(event.target.value);
    
    // Update sun size
    const scale = 0.5 + centralMass / 5000;
    if (sun) {
        sun.scale.set(scale, scale, scale);
    }
    
    // Update planet speeds
    planets.forEach(planet => {
        planet.speed = initialVelocity * Math.sqrt(centralMass / planet.distance);
    });
    
    // Update the display
    if (!isOrbitsRunning) {
        orbitsRenderer.render(orbitsScene, orbitsCamera);
    }
}

// Update initial distance
function updateInitialDistance(event) {
    initialDistance = parseInt(event.target.value);
    
    // Only fully update if not running
    if (!isOrbitsRunning) {
        resetOrbits();
    }
}

// Update initial velocity
function updateInitialVelocity(event) {
    initialVelocity = parseInt(event.target.value);
    
    // Update planet speeds
    planets.forEach(planet => {
        planet.speed = initialVelocity * Math.sqrt(centralMass / planet.distance);
    });
    
    // Update the display
    if (!isOrbitsRunning) {
        orbitsRenderer.render(orbitsScene, orbitsCamera);
    }
}