// Simple Wave Interference Simulation
let wavesCanvas, wavesContext;
let frequency1 = 5;
let frequency2 = 5;
let amplitude = 10;
let time_waves = 0;
let isWavesRunning = false;
let wavesAnimationId;

// Default values for reset
const defaultValues = {
    frequency1: 5,
    frequency2: 5,
    amplitude: 10
};

// Initialize the waves simulation
function initWavesSimulation() {
    // Get the canvas
    wavesCanvas = document.getElementById('waves-canvas');
    if (!wavesCanvas) {
        console.error('Canvas element not found');
        return;
    }
    
    wavesContext = wavesCanvas.getContext('2d');
    
    // Set canvas size
    resizeWavesCanvas();
    
    // Add event listeners for controls
    const startButton = document.getElementById('waves-start');
    const resetButton = document.getElementById('waves-reset');
    const freq1Slider = document.getElementById('waves-frequency1');
    const freq2Slider = document.getElementById('waves-frequency2');
    const ampSlider = document.getElementById('waves-amplitude');
    
    // Value display elements
    const freq1Value = document.getElementById('freq1-value');
    const freq2Value = document.getElementById('freq2-value');
    const amplitudeValue = document.getElementById('amplitude-value');
    
    if (startButton) {
        startButton.addEventListener('click', toggleWaves);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetWaves);
    }
    
    if (freq1Slider && freq1Value) {
        freq1Slider.addEventListener('input', function() {
            frequency1 = parseFloat(this.value);
            freq1Value.textContent = frequency1.toFixed(1);
            if (!isWavesRunning) {
                drawWaves();
            }
        });
    }
    
    if (freq2Slider && freq2Value) {
        freq2Slider.addEventListener('input', function() {
            frequency2 = parseFloat(this.value);
            freq2Value.textContent = frequency2.toFixed(1);
            if (!isWavesRunning) {
                drawWaves();
            }
        });
    }
    
    if (ampSlider && amplitudeValue) {
        ampSlider.addEventListener('input', function() {
            amplitude = parseFloat(this.value);
            amplitudeValue.textContent = amplitude.toFixed(0);
            if (!isWavesRunning) {
                drawWaves();
            }
        });
    }
    
    // Add window resize listener
    window.addEventListener('resize', resizeWavesCanvas);
    
    // Draw initial state
    drawWaves();
    
    // Initialize slider values
    if (freq1Value) freq1Value.textContent = frequency1.toFixed(1);
    if (freq2Value) freq2Value.textContent = frequency2.toFixed(1);
    if (amplitudeValue) amplitudeValue.textContent = amplitude.toFixed(0);
    
    // Make waves tab visible if it's hidden
    const wavesTab = document.getElementById('waves');
    if (wavesTab && wavesTab.style.display === 'none') {
        wavesTab.style.display = 'block';
    }
    
    // Start the waves automatically after a short delay
    setTimeout(() => {
        if (!isWavesRunning) {
            toggleWaves();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeWavesCanvas() {
    if (!wavesCanvas) return;
    
    const container = wavesCanvas.parentElement;
    if (container) {
        wavesCanvas.width = container.clientWidth;
        wavesCanvas.height = 400; // Fixed height
    }
    
    drawWaves();
}

// Calculate wave at a specific position
function calculateWave(x, t, frequency, phaseOffset = 0) {
    const k = 0.05 * frequency; // Wave number
    const omega = 2; // Angular frequency
    
    return amplitude * Math.sin(k * x - omega * t * frequency + phaseOffset);
}

// Calculate combined wave (superposition)
function calculateCombinedWave(x, t) {
    const wave1 = calculateWave(x, t, frequency1);
    const wave2 = calculateWave(x, t, frequency2, Math.PI / 4); // Slight phase difference
    
    return wave1 + wave2;
}

// Draw the waves
function drawWaves() {
    if (!wavesContext || !wavesCanvas) return;
    
    // Clear canvas
    wavesContext.clearRect(0, 0, wavesCanvas.width, wavesCanvas.height);
    
    const width = wavesCanvas.width;
    const height = wavesCanvas.height;
    const centerY = height / 2;
    
    // Draw horizontal reference line
    wavesContext.strokeStyle = '#cccccc';
    wavesContext.lineWidth = 1;
    wavesContext.beginPath();
    wavesContext.moveTo(0, centerY);
    wavesContext.lineTo(width, centerY);
    wavesContext.stroke();
    
    // Draw wave 1
    wavesContext.strokeStyle = 'rgba(58, 134, 255, 0.5)';
    wavesContext.lineWidth = 2;
    wavesContext.beginPath();
    
    for (let x = 0; x < width; x++) {
        const y = centerY - calculateWave(x, time_waves, frequency1);
        if (x === 0) {
            wavesContext.moveTo(x, y);
        } else {
            wavesContext.lineTo(x, y);
        }
    }
    
    wavesContext.stroke();
    
    // Draw wave 2
    wavesContext.strokeStyle = 'rgba(255, 0, 110, 0.5)';
    wavesContext.lineWidth = 2;
    wavesContext.beginPath();
    
    for (let x = 0; x < width; x++) {
        const y = centerY - calculateWave(x, time_waves, frequency2, Math.PI / 4);
        if (x === 0) {
            wavesContext.moveTo(x, y);
        } else {
            wavesContext.lineTo(x, y);
        }
    }
    
    wavesContext.stroke();
    
    // Draw combined wave (superposition)
    wavesContext.strokeStyle = '#333333';
    wavesContext.lineWidth = 2;
    wavesContext.beginPath();
    
    for (let x = 0; x < width; x++) {
        const y = centerY - calculateCombinedWave(x, time_waves);
        if (x === 0) {
            wavesContext.moveTo(x, y);
        } else {
            wavesContext.lineTo(x, y);
        }
    }
    
    wavesContext.stroke();
    
    // Add labels
    wavesContext.fillStyle = '#333333';
    wavesContext.font = '14px Arial';
    wavesContext.fillText('Wave 1', 20, 30);
    wavesContext.fillText('Wave 2', 20, 50);
    wavesContext.fillText('Combined Wave', 20, 70);
    
    // Draw color indicators
    wavesContext.fillStyle = 'rgba(58, 134, 255, 0.5)';
    wavesContext.fillRect(100, 20, 20, 10);
    
    wavesContext.fillStyle = 'rgba(255, 0, 110, 0.5)';
    wavesContext.fillRect(100, 40, 20, 10);
    
    wavesContext.fillStyle = '#333333';
    wavesContext.fillRect(100, 60, 20, 10);
}

// Animation loop
function animateWaves() {
    if (!isWavesRunning) return;
    
    time_waves += 0.02;
    drawWaves();
    
    wavesAnimationId = requestAnimationFrame(animateWaves);
}

// Toggle waves animation
function toggleWaves() {
    isWavesRunning = !isWavesRunning;
    
    const startButton = document.getElementById('waves-start');
    if (startButton) {
        startButton.textContent = isWavesRunning ? 'Pause' : 'Start';
    }
    
    if (isWavesRunning) {
        animateWaves();
    } else {
        cancelAnimationFrame(wavesAnimationId);
    }
}

// Reset waves
function resetWaves() {
    // Reset to default values
    frequency1 = defaultValues.frequency1;
    frequency2 = defaultValues.frequency2;
    amplitude = defaultValues.amplitude;
    time_waves = 0;
    
    // Update slider positions and value displays
    const freq1Slider = document.getElementById('waves-frequency1');
    const freq2Slider = document.getElementById('waves-frequency2');
    const ampSlider = document.getElementById('waves-amplitude');
    const freq1Value = document.getElementById('freq1-value');
    const freq2Value = document.getElementById('freq2-value');
    const amplitudeValue = document.getElementById('amplitude-value');
    
    if (freq1Slider) freq1Slider.value = frequency1;
    if (freq2Slider) freq2Slider.value = frequency2;
    if (ampSlider) ampSlider.value = amplitude;
    
    if (freq1Value) freq1Value.textContent = frequency1.toFixed(1);
    if (freq2Value) freq2Value.textContent = frequency2.toFixed(1);
    if (amplitudeValue) amplitudeValue.textContent = amplitude.toFixed(0);
    
    drawWaves();
    
    // If running, stop it
    if (isWavesRunning) {
        toggleWaves();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulation immediately
    initWavesSimulation();
    
    // Also initialize when tab is selected
    const simNavLinks = document.querySelectorAll('.sim-nav a');
    simNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const simId = this.getAttribute('href').substring(1);
            if (simId === 'waves') {
                setTimeout(initWavesSimulation, 100);
            }
        });
    });
});