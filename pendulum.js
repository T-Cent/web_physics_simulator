// Simple Double Pendulum Simulation
let pendulumCanvas, pendulumContext;
let angle1 = Math.PI / 4; // Initial angle of first pendulum
let angle2 = Math.PI / 8; // Initial angle of second pendulum
let angleVelocity1 = 0;
let angleVelocity2 = 0;
let length1 = 80; // Length of first pendulum arm
let length2 = 80; // Length of second pendulum arm
let mass1 = 10; // Mass of first bob
let mass2 = 10; // Mass of second bob
let gravity = 1;
let damping = 0.999;
let isPendulumRunning = false;
let pendulumAnimationId;
let trailPoints = [];
let maxTrailLength = 100;

// Initialize the pendulum simulation
function initPendulumSimulation() {
    // Get the canvas
    pendulumCanvas = document.getElementById('pendulum-canvas');
    if (!pendulumCanvas) {
        console.error('Canvas element not found');
        return;
    }
    
    pendulumContext = pendulumCanvas.getContext('2d');
    
    // Set canvas size
    resizeCanvas();
    
    // Add event listeners for buttons
    const startButton = document.getElementById('pendulum-start');
    const resetButton = document.getElementById('pendulum-reset');
    
    if (startButton) {
        startButton.addEventListener('click', togglePendulum);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetPendulum);
    }
    
    // Add window resize listener
    window.addEventListener('resize', resizeCanvas);
    
    // Draw initial state
    drawPendulum();
    
    // Start the pendulum automatically after a short delay
    setTimeout(() => {
        if (!isPendulumRunning) {
            togglePendulum();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeCanvas() {
    if (!pendulumCanvas) return;
    
    const container = pendulumCanvas.parentElement;
    if (container) {
        pendulumCanvas.width = container.clientWidth;
        pendulumCanvas.height = 400; // Fixed height
    }
    
    drawPendulum();
}

// Update pendulum physics
function updatePendulum() {
    // Calculate forces using the equations of motion for a double pendulum
    const g = gravity;
    const m1 = mass1;
    const m2 = mass2;
    const l1 = length1;
    const l2 = length2;
    const a1 = angle1;
    const a2 = angle2;
    const v1 = angleVelocity1;
    const v2 = angleVelocity2;
    
    // These equations are derived from Lagrangian mechanics
    const denominator = 2 * m1 + m2 - m2 * Math.cos(2 * (a1 - a2));
    
    // Angular acceleration for the first pendulum
    const a1_acceleration = (-g * (2 * m1 + m2) * Math.sin(a1) - m2 * g * Math.sin(a1 - 2 * a2)
        - 2 * Math.sin(a1 - a2) * m2 * (v2 * v2 * l2 + v1 * v1 * l1 * Math.cos(a1 - a2))) / (l1 * denominator);
    
    // Angular acceleration for the second pendulum
    const a2_acceleration = (2 * Math.sin(a1 - a2) * (v1 * v1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1)
        + v2 * v2 * l2 * m2 * Math.cos(a1 - a2))) / (l2 * denominator);
    
    // Update velocities (with time step = 0.1)
    angleVelocity1 += a1_acceleration * 0.1;
    angleVelocity2 += a2_acceleration * 0.1;
    
    // Apply damping
    angleVelocity1 *= damping;
    angleVelocity2 *= damping;
    
    // Update angles
    angle1 += angleVelocity1 * 0.1;
    angle2 += angleVelocity2 * 0.1;
    
    // Track trail of second bob
    const centerX = pendulumCanvas.width / 2;
    const centerY = 100;
    
    // Position of first bob
    const bob1X = centerX + Math.sin(angle1) * length1;
    const bob1Y = centerY + Math.cos(angle1) * length1;
    
    // Position of second bob
    const bob2X = bob1X + Math.sin(angle2) * length2;
    const bob2Y = bob1Y + Math.cos(angle2) * length2;
    
    trailPoints.push({ x: bob2X, y: bob2Y });
    
    // Limit trail length
    if (trailPoints.length > maxTrailLength) {
        trailPoints.shift();
    }
}

// Draw the pendulum
function drawPendulum() {
    if (!pendulumContext) return;
    
    // Clear canvas
    pendulumContext.clearRect(0, 0, pendulumCanvas.width, pendulumCanvas.height);
    
    const centerX = pendulumCanvas.width / 2;
    const centerY = 100;
    
    // Position of first bob
    const bob1X = centerX + Math.sin(angle1) * length1;
    const bob1Y = centerY + Math.cos(angle1) * length1;
    
    // Position of second bob
    const bob2X = bob1X + Math.sin(angle2) * length2;
    const bob2Y = bob1Y + Math.cos(angle2) * length2;
    
    // Draw pivot
    pendulumContext.fillStyle = '#333333';
    pendulumContext.beginPath();
    pendulumContext.arc(centerX, centerY, 5, 0, Math.PI * 2);
    pendulumContext.fill();
    
    // Draw trail
    if (trailPoints.length > 1) {
        pendulumContext.strokeStyle = 'rgba(255, 0, 110, 0.5)';
        pendulumContext.lineWidth = 2;
        pendulumContext.beginPath();
        pendulumContext.moveTo(trailPoints[0].x, trailPoints[0].y);
        
        for (let i = 1; i < trailPoints.length; i++) {
            pendulumContext.lineTo(trailPoints[i].x, trailPoints[i].y);
        }
        
        pendulumContext.stroke();
    }
    
    // Draw first rod
    pendulumContext.strokeStyle = '#666666';
    pendulumContext.lineWidth = 2;
    pendulumContext.beginPath();
    pendulumContext.moveTo(centerX, centerY);
    pendulumContext.lineTo(bob1X, bob1Y);
    pendulumContext.stroke();
    
    // Draw first bob
    pendulumContext.fillStyle = '#3a86ff';
    pendulumContext.beginPath();
    pendulumContext.arc(bob1X, bob1Y, 8, 0, Math.PI * 2);
    pendulumContext.fill();
    
    // Draw second rod
    pendulumContext.beginPath();
    pendulumContext.moveTo(bob1X, bob1Y);
    pendulumContext.lineTo(bob2X, bob2Y);
    pendulumContext.stroke();
    
    // Draw second bob
    pendulumContext.fillStyle = '#ff006e';
    pendulumContext.beginPath();
    pendulumContext.arc(bob2X, bob2Y, 8, 0, Math.PI * 2);
    pendulumContext.fill();
}

// Animation loop
function animatePendulum() {
    if (!isPendulumRunning) return;
    
    updatePendulum();
    drawPendulum();
    
    pendulumAnimationId = requestAnimationFrame(animatePendulum);
}

// Toggle pendulum animation
function togglePendulum() {
    isPendulumRunning = !isPendulumRunning;
    
    const startButton = document.getElementById('pendulum-start');
    if (startButton) {
        startButton.textContent = isPendulumRunning ? 'Pause' : 'Start';
    }
    
    if (isPendulumRunning) {
        animatePendulum();
    } else {
        cancelAnimationFrame(pendulumAnimationId);
    }
}

// Reset pendulum
function resetPendulum() {
    // Reset angles and velocities
    angle1 = Math.PI / 4;
    angle2 = Math.PI / 8;
    angleVelocity1 = 0;
    angleVelocity2 = 0;
    trailPoints = [];
    
    drawPendulum();
    
    // If running, stop it
    if (isPendulumRunning) {
        togglePendulum();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulations when their tab is active
    const simNavLinks = document.querySelectorAll('.sim-nav a');
    simNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const simId = this.getAttribute('href').substring(1);
            if (simId === 'pendulum') {
                setTimeout(initPendulumSimulation, 100);
            }
        });
    });
    
    // Check if pendulum is the active tab
    if (window.location.hash === '#pendulum' || !window.location.hash) {
        setTimeout(initPendulumSimulation, 100);
    }
});