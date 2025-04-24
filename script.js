// Navigation menu toggle for mobile
document.addEventListener('DOMContentLoaded', () => {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-links li');
    const themeToggle = document.getElementById('theme-toggle-btn');

    // Check for saved theme in localStorage
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', currentTheme);
    
    // Set the toggle state based on the current theme
    if (themeToggle) {
        themeToggle.checked = currentTheme === 'dark';
        updateToggleText();
    }

    // Toggle dark mode
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const newTheme = themeToggle.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleText();
            
            // Update canvas particles
            document.dispatchEvent(new Event('themeToggle'));
            
            // Update simulation backgrounds if on simulation page
            updateSimulationBackgrounds();
        });
    }

    // Update toggle text based on state
    function updateToggleText() {
        const toggleText = document.querySelector('.toggle-text');
        if (toggleText) {
            toggleText.textContent = themeToggle.checked ? 'Light Mode' : 'Dark Mode';
        }
    }

    // Update simulation scene backgrounds if they exist
    function updateSimulationBackgrounds() {
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        const bgColor = isDarkMode ? 0x2d2d2d : 0xf5f5f5;
        
        // Update pendulum scene
        if (typeof pendulumScene !== 'undefined' && pendulumScene) {
            pendulumScene.background = new THREE.Color(bgColor);
            if (pendulumRenderer) {
                pendulumRenderer.render(pendulumScene, pendulumCamera);
            }
        }
        
        // Update orbits scene
        if (typeof orbitsScene !== 'undefined' && orbitsScene) {
            orbitsScene.background = new THREE.Color(bgColor);
            if (orbitsRenderer) {
                orbitsRenderer.render(orbitsScene, orbitsCamera);
            }
        }
        
        // Update waves scene
        if (typeof wavesScene !== 'undefined' && wavesScene) {
            wavesScene.background = new THREE.Color(bgColor);
            if (wavesRenderer) {
                wavesRenderer.render(wavesScene, wavesCamera);
            }
        }
        
        // Update collision scene
        if (typeof collisionScene !== 'undefined' && collisionScene) {
            collisionScene.background = new THREE.Color(bgColor);
            if (collisionRenderer) {
                collisionRenderer.render(collisionScene, collisionCamera);
            }
        }
    }

    // Toggle navigation
    burger.addEventListener('click', () => {
        // Toggle nav
        nav.classList.toggle('nav-active');
        
        // Animate links
        navLinks.forEach((link, index) => {
            if (link.style.animation) {
                link.style.animation = '';
            } else {
                link.style.animation = `navLinkFade 0.5s ease forwards ${index / 7 + 0.3}s`;
            }
        });
        
        // Burger animation
        burger.classList.toggle('toggle');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (nav.classList.contains('nav-active') && 
            e.target !== burger && 
            !burger.contains(e.target) && 
            e.target !== nav && 
            !nav.contains(e.target)) {
            nav.classList.remove('nav-active');
            burger.classList.remove('toggle');
            
            navLinks.forEach((link) => {
                link.style.animation = '';
            });
        }
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Active link highlighting based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentLocation = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        // Set active class based on current page
        if (currentLocation.includes(linkPath) && linkPath !== '/') {
            link.classList.add('active');
        } else if (currentLocation === '/' && linkPath === 'index.html') {
            link.classList.add('active');
        }
    });
});

// For simulation page - activate the correct tab based on hash
if (window.location.pathname.includes('simulations.html')) {
    window.addEventListener('DOMContentLoaded', () => {
        const hash = window.location.hash || '#pendulum';
        activateSimulationTab(hash.substring(1));
    });
    
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash || '#pendulum';
        activateSimulationTab(hash.substring(1));
    });
}

// Function to activate the correct simulation tab
function activateSimulationTab(simId) {
    // Hide all simulations
    document.querySelectorAll('.simulation-wrapper').forEach(sim => {
        sim.style.display = 'none';
    });
    
    // Show the selected simulation
    const activeSim = document.getElementById(simId);
    if (activeSim) {
        activeSim.style.display = 'block';
    }
    
    // Update the active class on navigation
    document.querySelectorAll('.sim-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${simId}`) {
            link.classList.add('active');
        }
    });
    
    // Initialize the appropriate simulation
    initializeSimulation(simId);
}

// Function to initialize the appropriate simulation
function initializeSimulation(simId) {
    switch(simId) {
        case 'pendulum':
            if (typeof initPendulumSimulation === 'function') {
                initPendulumSimulation();
            }
            break;
        case 'electric':
            if (typeof initElectricFieldSimulation === 'function') {
                initElectricFieldSimulation();
            }
            break;
        case 'quantum':
            if (typeof initQuantumSimulation === 'function') {
                initQuantumSimulation();
            }
            break;
        case 'fluid':
            if (typeof initFluidSimulation === 'function') {
                initFluidSimulation();
            }
            break;
        case 'waves':
            if (typeof initWavesSimulation === 'function') {
                initWavesSimulation();
            }
            break;
        case 'collision':
            if (typeof initCollisionSimulation === 'function') {
                initCollisionSimulation();
            }
            break;
    }
}

// Display a loading message while simulations are initializing
function showLoadingMessage(canvasId) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '20px Poppins, sans-serif';
    ctx.fillStyle = '#3a86ff';
    ctx.textAlign = 'center';
    ctx.fillText('Loading simulation...', canvas.width / 2, canvas.height / 2);
}