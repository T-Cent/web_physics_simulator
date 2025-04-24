// Simple Fluid Dynamics Simulation
let fluidCanvas, fluidContext;
let particles = [];
let obstacle = { x: 0, y: 0, radius: 50 };
let mouseX = 0, mouseY = 0;
let isFluidRunning = false;
let fluidAnimationId;
let objectType = 'circle'; // 'circle', 'airfoil', 'rectangle'

// Parameters
const particleCount = 300;
const flowSpeed = 2;
const particleSize = 2;

// Initialize the fluid simulation
function initFluidSimulation() {
    // Get the canvas
    fluidCanvas = document.getElementById('fluid-canvas');
    if (!fluidCanvas) {
        console.error('Canvas element not found');
        return;
    }
    
    fluidContext = fluidCanvas.getContext('2d');
    
    // Set canvas size
    resizeFluidCanvas();
    
    // Initialize particles
    resetParticles();
    
    // Set obstacle position
    obstacle.x = fluidCanvas.width / 3;
    obstacle.y = fluidCanvas.height / 2;
    
    // Add event listeners for controls
    const startButton = document.getElementById('fluid-start');
    const resetButton = document.getElementById('fluid-reset');
    const objectSelect = document.getElementById('fluid-object');
    
    if (startButton) {
        startButton.addEventListener('click', toggleFluid);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetFluid);
    }
    
    if (objectSelect) {
        objectSelect.addEventListener('change', function() {
            objectType = this.value;
            resetFluid();
        });
    }
    
    // Add window resize listener
    window.addEventListener('resize', resizeFluidCanvas);
    
    // Add mouse listener for interactivity
    fluidCanvas.addEventListener('mousemove', function(e) {
        const rect = fluidCanvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });
    
    // Draw initial state
    drawFluid();
    
    // Start the fluid simulation automatically after a short delay
    setTimeout(() => {
        if (!isFluidRunning) {
            toggleFluid();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeFluidCanvas() {
    if (!fluidCanvas) return;
    
    const container = fluidCanvas.parentElement;
    if (container) {
        fluidCanvas.width = container.clientWidth;
        fluidCanvas.height = 400; // Fixed height
    }
    
    // Adjust obstacle position after resize
    obstacle.x = fluidCanvas.width / 3;
    obstacle.y = fluidCanvas.height / 2;
    
    resetParticles();
    drawFluid();
}

// Create a new particle
function createParticle() {
    return {
        x: Math.random() * fluidCanvas.width,
        y: Math.random() * fluidCanvas.height,
        vx: Math.random() * 2 - 1 + flowSpeed,
        vy: Math.random() * 2 - 1,
        color: `hsla(${Math.random() * 220 + 180}, 100%, 70%, 0.5)`,
        size: Math.random() * 2 + particleSize
    };
}

// Reset all particles
function resetParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
    }
}

// Check if a point is inside the obstacle
function isInsideObstacle(x, y) {
    if (objectType === 'circle') {
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        return Math.sqrt(dx * dx + dy * dy) < obstacle.radius;
    } else if (objectType === 'rectangle') {
        return (
            x > obstacle.x - obstacle.radius / 2 &&
            x < obstacle.x + obstacle.radius / 2 &&
            y > obstacle.y - obstacle.radius &&
            y < obstacle.y + obstacle.radius
        );
    } else if (objectType === 'airfoil') {
        // Simplified airfoil shape check
        const dx = x - obstacle.x;
        const dy = y - obstacle.y;
        
        // Check if point is within the airfoil envelope
        if (dx < 0 || dx > obstacle.radius * 1.5) return false;
        
        const relativeHeight = obstacle.radius / 3;
        const camber = 10 * Math.sin(Math.PI * dx / (obstacle.radius * 1.5));
        
        return Math.abs(dy - camber) < relativeHeight;
    }
    
    return false;
}

// Calculate reflection vector (simplified fluid dynamics)
function reflectVector(vx, vy, nx, ny) {
    const dotProduct = vx * nx + vy * ny;
    return {
        vx: vx - 2 * dotProduct * nx,
        vy: vy - 2 * dotProduct * ny
    };
}

// Update particles
function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Add some randomness to make it look more fluid-like
        p.vx += (Math.random() * 0.4 - 0.2);
        p.vy += (Math.random() * 0.4 - 0.2);
        
        // Limit velocity for stability
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 6) {
            p.vx = (p.vx / speed) * 6;
            p.vy = (p.vy / speed) * 6;
        }
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Check for obstacle collision
        if (isInsideObstacle(p.x, p.y)) {
            // Calculate normal vector (simplified)
            const nx = p.x - obstacle.x;
            const ny = p.y - obstacle.y;
            const len = Math.sqrt(nx * nx + ny * ny);
            
            // Normalize and reflect
            if (len > 0) {
                const normalX = nx / len;
                const normalY = ny / len;
                
                // Move particle outside obstacle
                p.x = obstacle.x + normalX * (obstacle.radius + 2);
                p.y = obstacle.y + normalY * (obstacle.radius + 2);
                
                // Reflect velocity with some randomness for realism
                const reflection = reflectVector(p.vx, p.vy, normalX, normalY);
                p.vx = reflection.vx * 0.8 + (Math.random() * 0.4 - 0.2);
                p.vy = reflection.vy * 0.8 + (Math.random() * 0.4 - 0.2);
            }
        }
        
        // Check for boundary conditions
        if (p.x < 0) {
            p.x = fluidCanvas.width;
            p.y = Math.random() * fluidCanvas.height;
        } else if (p.x > fluidCanvas.width) {
            p.x = 0;
            p.y = Math.random() * fluidCanvas.height;
        }
        
        if (p.y < 0) {
            p.y = 0;
            p.vy *= -0.5;
        } else if (p.y > fluidCanvas.height) {
            p.y = fluidCanvas.height;
            p.vy *= -0.5;
        }
        
        // Add mouse interaction
        const dx = mouseX - p.x;
        const dy = mouseY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 50) {
            p.vx -= dx * 0.01;
            p.vy -= dy * 0.01;
        }
    }
}

// Draw the fluid simulation
function drawFluid() {
    if (!fluidContext) return;
    
    // Clear canvas with semi-transparent black for motion blur effect
    fluidContext.fillStyle = 'rgba(0, 0, 0, 0.1)';
    fluidContext.fillRect(0, 0, fluidCanvas.width, fluidCanvas.height);
    
    // Draw particles
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        fluidContext.fillStyle = p.color;
        fluidContext.beginPath();
        fluidContext.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        fluidContext.fill();
    }
    
    // Draw obstacle
    fluidContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    if (objectType === 'circle') {
        // Draw circle
        fluidContext.beginPath();
        fluidContext.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        fluidContext.fill();
    } else if (objectType === 'rectangle') {
        // Draw rectangle
        fluidContext.fillRect(
            obstacle.x - obstacle.radius / 2,
            obstacle.y - obstacle.radius,
            obstacle.radius,
            obstacle.radius * 2
        );
    } else if (objectType === 'airfoil') {
        // Draw airfoil
        fluidContext.beginPath();
        fluidContext.moveTo(obstacle.x, obstacle.y);
        
        // Draw top curve
        for (let i = 0; i <= 10; i++) {
            const t = i / 10;
            const dx = obstacle.radius * 1.5 * t;
            const camber = 10 * Math.sin(Math.PI * t);
            const thickness = 15 * (1 - t);
            
            fluidContext.lineTo(obstacle.x + dx, obstacle.y + camber - thickness / 2);
        }
        
        // Draw bottom curve
        for (let i = 10; i >= 0; i--) {
            const t = i / 10;
            const dx = obstacle.radius * 1.5 * t;
            const camber = 10 * Math.sin(Math.PI * t);
            const thickness = 15 * (1 - t);
            
            fluidContext.lineTo(obstacle.x + dx, obstacle.y + camber + thickness / 2);
        }
        
        fluidContext.closePath();
        fluidContext.fill();
    }
}

// Animation loop
function animateFluid() {
    if (!isFluidRunning) return;
    
    updateParticles();
    drawFluid();
    
    fluidAnimationId = requestAnimationFrame(animateFluid);
}

// Toggle fluid animation
function toggleFluid() {
    isFluidRunning = !isFluidRunning;
    
    const startButton = document.getElementById('fluid-start');
    if (startButton) {
        startButton.textContent = isFluidRunning ? 'Pause' : 'Start';
    }
    
    if (isFluidRunning) {
        animateFluid();
    } else {
        cancelAnimationFrame(fluidAnimationId);
    }
}

// Reset fluid simulation
function resetFluid() {
    resetParticles();
    
    // If running, continue; otherwise just draw
    if (!isFluidRunning) {
        drawFluid();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulations when their tab is active
    const simNavLinks = document.querySelectorAll('.sim-nav a');
    simNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const simId = this.getAttribute('href').substring(1);
            if (simId === 'fluid') {
                setTimeout(initFluidSimulation, 100);
            }
        });
    });
    
    // Check if fluid is the active tab
    if (window.location.hash === '#fluid') {
        setTimeout(initFluidSimulation, 100);
    }
});