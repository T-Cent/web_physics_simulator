// Simple Quantum Wave Function Simulation
let quantumCanvas, quantumContext;
let waveFunction = [];
let potentialBarrier = [];
let gridSize = 200;
let time = 0;
let isQuantumRunning = false;
let quantumAnimationId;
let potentialType = 'barrier'; // 'barrier', 'well', 'harmonic'
let waveType = 'gaussian'; // 'gaussian', 'plane'

// Initialize the quantum simulation
function initQuantumSimulation() {
    // Get the canvas
    quantumCanvas = document.getElementById('quantum-canvas');
    if (!quantumCanvas) {
        console.error('Quantum canvas not found');
        return;
    }
    
    quantumContext = quantumCanvas.getContext('2d');
    
    // Set canvas size
    resizeQuantumCanvas();
    
    // Initialize wave function and potential
    initializeWaveFunction();
    initializePotential();
    
    // Add event listeners for controls
    const startButton = document.getElementById('quantum-start');
    const resetButton = document.getElementById('quantum-reset');
    const potentialSelect = document.getElementById('quantum-potential');
    const waveSelect = document.getElementById('quantum-wave');
    
    if (startButton) {
        startButton.addEventListener('click', toggleQuantum);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetQuantum);
    }
    
    if (potentialSelect) {
        potentialSelect.addEventListener('change', function() {
            potentialType = this.value;
            initializePotential();
            drawQuantum();
        });
    }
    
    if (waveSelect) {
        waveSelect.addEventListener('change', function() {
            waveType = this.value;
            resetQuantum();
        });
    }
    
    // Add window resize listener
    window.addEventListener('resize', resizeQuantumCanvas);
    
    // Draw initial state
    drawQuantum();
    
    // Start the quantum simulation automatically after a short delay
    setTimeout(() => {
        if (!isQuantumRunning) {
            toggleQuantum();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeQuantumCanvas() {
    if (!quantumCanvas) return;
    
    const container = quantumCanvas.parentElement;
    if (container) {
        quantumCanvas.width = container.clientWidth;
        quantumCanvas.height = 400; // Fixed height
    }
    
    // Reinitialize after resize
    initializeWaveFunction();
    initializePotential();
    drawQuantum();
}

// Initialize the wave function
function initializeWaveFunction() {
    waveFunction = [];
    
    // Create a wave function across the grid
    for (let i = 0; i < gridSize; i++) {
        // Convert to position (0 to 1)
        const x = i / gridSize;
        
        // Different initial wave packet types
        let real, imag;
        
        if (waveType === 'gaussian') {
            // Gaussian wave packet
            const center = 0.2; // Center at 20% from left
            const width = 0.05; // Width of packet
            const k0 = 150; // Initial momentum
            
            // Real and imaginary parts
            const gaussian = Math.exp(-Math.pow((x - center) / width, 2));
            real = gaussian * Math.cos(k0 * x);
            imag = gaussian * Math.sin(k0 * x);
        } else {
            // Plane wave
            const k = 50; // Wavenumber
            real = Math.cos(k * x);
            imag = Math.sin(k * x);
        }
        
        waveFunction.push({ real, imag });
    }
    
    // Normalize the wave function
    normalizeWaveFunction();
}

// Normalize the wave function (ensure total probability = 1)
function normalizeWaveFunction() {
    // Calculate total probability
    let totalProb = 0;
    for (let i = 0; i < gridSize; i++) {
        const real = waveFunction[i].real;
        const imag = waveFunction[i].imag;
        totalProb += real * real + imag * imag;
    }
    
    // Normalize
    const normFactor = 1 / Math.sqrt(totalProb);
    for (let i = 0; i < gridSize; i++) {
        waveFunction[i].real *= normFactor;
        waveFunction[i].imag *= normFactor;
    }
}

// Initialize the potential barrier
function initializePotential() {
    potentialBarrier = [];
    
    for (let i = 0; i < gridSize; i++) {
        // Convert to position (0 to 1)
        const x = i / gridSize;
        let potential = 0;
        
        if (potentialType === 'barrier') {
            // Potential barrier in the middle
            if (x > 0.45 && x < 0.55) {
                potential = 1;
            }
        } else if (potentialType === 'well') {
            // Potential well (barriers on both sides)
            if (x < 0.3 || x > 0.7) {
                potential = 1;
            }
        } else if (potentialType === 'harmonic') {
            // Harmonic oscillator potential (parabola)
            potential = 2 * Math.pow(x - 0.5, 2);
        }
        
        potentialBarrier.push(potential);
    }
}

// Time evolution of the wave function (simplified)
function evolveWaveFunction() {
    // Create temporary arrays for the new wave function
    const newReal = [];
    const newImag = [];
    
    for (let i = 0; i < gridSize; i++) {
        newReal[i] = 0;
        newImag[i] = 0;
    }
    
    // Constants for the calculation
    const dt = 0.0002; // Time step
    const dx2 = Math.pow(1 / gridSize, 2); // Spatial step squared
    const hbar = 1; // Planck's constant
    const mass = 1; // Particle mass
    
    // Apply the potential term e^(-iVdt/ħ)
    for (let i = 0; i < gridSize; i++) {
        const potential = potentialBarrier[i];
        const phase = -potential * dt / hbar;
        
        const real = waveFunction[i].real;
        const imag = waveFunction[i].imag;
        
        waveFunction[i].real = real * Math.cos(phase) - imag * Math.sin(phase);
        waveFunction[i].imag = real * Math.sin(phase) + imag * Math.cos(phase);
    }
    
    // Apply the kinetic term (simplified laplacian operation)
    const factor = hbar * dt / (2 * mass * dx2);
    
    for (let i = 1; i < gridSize - 1; i++) {
        // Discrete laplacian: f(x+h) - 2f(x) + f(x-h)
        const laplacianReal = waveFunction[i+1].real - 2 * waveFunction[i].real + waveFunction[i-1].real;
        const laplacianImag = waveFunction[i+1].imag - 2 * waveFunction[i].imag + waveFunction[i-1].imag;
        
        // Apply kinetic operator: -iħ²/(2m) ∇²
        newReal[i] = waveFunction[i].real + factor * laplacianImag;
        newImag[i] = waveFunction[i].imag - factor * laplacianReal;
    }
    
    // Update the wave function with boundary conditions
    for (let i = 1; i < gridSize - 1; i++) {
        waveFunction[i].real = newReal[i];
        waveFunction[i].imag = newImag[i];
    }
    
    // Apply the potential term again (split-step method)
    for (let i = 0; i < gridSize; i++) {
        const potential = potentialBarrier[i];
        const phase = -potential * dt / hbar;
        
        const real = waveFunction[i].real;
        const imag = waveFunction[i].imag;
        
        waveFunction[i].real = real * Math.cos(phase) - imag * Math.sin(phase);
        waveFunction[i].imag = real * Math.sin(phase) + imag * Math.cos(phase);
    }
}

// Draw the quantum wave function
function drawQuantum() {
    if (!quantumContext) return;
    
    // Clear canvas
    quantumContext.clearRect(0, 0, quantumCanvas.width, quantumCanvas.height);
    
    // Draw background
    quantumContext.fillStyle = '#f5f5f5';
    quantumContext.fillRect(0, 0, quantumCanvas.width, quantumCanvas.height);
    
    const width = quantumCanvas.width;
    const height = quantumCanvas.height;
    const centerY = height / 2;
    
    // Draw potential barrier
    quantumContext.fillStyle = 'rgba(255, 0, 0, 0.2)';
    
    for (let i = 0; i < gridSize; i++) {
        const x = (i / gridSize) * width;
        const potentialHeight = potentialBarrier[i] * (height / 3);
        
        if (potentialHeight > 1) {
            quantumContext.fillRect(x, centerY - potentialHeight / 2, width / gridSize + 1, potentialHeight);
        }
    }
    
    // Draw wave function (real part)
    quantumContext.strokeStyle = '#3a86ff';
    quantumContext.lineWidth = 2;
    quantumContext.beginPath();
    
    for (let i = 0; i < gridSize; i++) {
        const x = (i / gridSize) * width;
        const y = centerY - waveFunction[i].real * (height / 4);
        
        if (i === 0) {
            quantumContext.moveTo(x, y);
        } else {
            quantumContext.lineTo(x, y);
        }
    }
    
    quantumContext.stroke();
    
    // Draw probability density
    quantumContext.fillStyle = 'rgba(255, 0, 110, 0.3)';
    
    for (let i = 0; i < gridSize; i++) {
        const x = (i / gridSize) * width;
        const real = waveFunction[i].real;
        const imag = waveFunction[i].imag;
        const probability = real * real + imag * imag;
        const rectHeight = probability * height;
        
        quantumContext.fillRect(x, centerY + 50, width / gridSize + 1, rectHeight * 2);
    }
    
    // Add labels
    quantumContext.fillStyle = '#000000';
    quantumContext.font = '14px Arial';
    quantumContext.fillText('Wave Function (Real Part)', 20, 30);
    quantumContext.fillText('Probability Density', 20, centerY + 30);
    
    // Draw potential label
    quantumContext.fillStyle = '#ff0000';
    quantumContext.fillText('Potential', 20, 50);
}

// Animation loop
function animateQuantum() {
    if (!isQuantumRunning) return;
    
    // Evolve wave function multiple times per frame for more visible motion
    for (let i = 0; i < 5; i++) {
        evolveWaveFunction();
    }
    
    drawQuantum();
    
    // Increment time
    time += 1;
    
    quantumAnimationId = requestAnimationFrame(animateQuantum);
}

// Toggle quantum animation
function toggleQuantum() {
    isQuantumRunning = !isQuantumRunning;
    
    const startButton = document.getElementById('quantum-start');
    if (startButton) {
        startButton.textContent = isQuantumRunning ? 'Pause' : 'Start';
    }
    
    if (isQuantumRunning) {
        animateQuantum();
    } else {
        cancelAnimationFrame(quantumAnimationId);
    }
}

// Reset quantum simulation
function resetQuantum() {
    time = 0;
    initializeWaveFunction();
    drawQuantum();
    
    // If running, continue animation
    if (!isQuantumRunning) {
        drawQuantum();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulation when tab is active
    const simNavLinks = document.querySelectorAll('.sim-nav a');
    simNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const simId = this.getAttribute('href').substring(1);
            if (simId === 'quantum') {
                setTimeout(initQuantumSimulation, 100);
            }
        });
    });
    
    // Check if quantum is the active tab
    if (window.location.hash === '#quantum') {
        setTimeout(initQuantumSimulation, 100);
    }
});

// Call initialization directly to ensure it runs
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Document already ready
    setTimeout(initQuantumSimulation, 100);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initQuantumSimulation, 100);
    });
}