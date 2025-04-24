// Simple Elastic Collisions Simulation
let collisionCanvas, collisionContext;
let sphere1, sphere2;
let mass1 = 5;
let mass2 = 5;
let initialVelocity = 5;
let isCollisionRunning = false;
let collisionAnimationId;

// Initialize the collision simulation
function initCollisionSimulation() {
    // Get the canvas
    collisionCanvas = document.getElementById('collision-canvas');
    if (!collisionCanvas) {
        console.error('Collision canvas not found');
        return;
    }
    
    collisionContext = collisionCanvas.getContext('2d');
    
    // Set canvas size
    resizeCollisionCanvas();
    
    // Create spheres
    resetSpheres();
    
    // Add event listeners for controls
    const startButton = document.getElementById('collision-start');
    const resetButton = document.getElementById('collision-reset');
    const mass1Slider = document.getElementById('collision-mass1');
    const mass2Slider = document.getElementById('collision-mass2');
    const velocitySlider = document.getElementById('collision-velocity');
    
    if (startButton) {
        startButton.addEventListener('click', toggleCollision);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetCollision);
    }
    
    if (mass1Slider) {
        mass1Slider.addEventListener('input', function() {
            mass1 = parseInt(this.value);
            resetSpheres();
        });
    }
    
    if (mass2Slider) {
        mass2Slider.addEventListener('input', function() {
            mass2 = parseInt(this.value);
            resetSpheres();
        });
    }
    
    if (velocitySlider) {
        velocitySlider.addEventListener('input', function() {
            initialVelocity = parseInt(this.value);
            resetSpheres();
        });
    }
    
    // Add window resize listener
    window.addEventListener('resize', resizeCollisionCanvas);
    
    // Draw initial state
    drawCollision();
    
    // Start the collision automatically after a short delay
    setTimeout(() => {
        if (!isCollisionRunning) {
            toggleCollision();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeCollisionCanvas() {
    if (!collisionCanvas) return;
    
    const container = collisionCanvas.parentElement;
    if (container) {
        collisionCanvas.width = container.clientWidth;
        collisionCanvas.height = 400; // Fixed height
    }
    
    // Reset after resize
    resetSpheres();
    drawCollision();
}

// Create spheres with proper mass and initial velocity
function resetSpheres() {
    // Calculate radius based on mass (proportional to cube root of mass)
    const radius1 = 10 * Math.pow(mass1 / 5, 1/3);
    const radius2 = 10 * Math.pow(mass2 / 5, 1/3);
    
    // Create sphere 1 (left)
    sphere1 = {
        x: collisionCanvas ? collisionCanvas.width / 4 : 100,
        y: collisionCanvas ? collisionCanvas.height / 2 : 200,
        radius: radius1,
        mass: mass1,
        vx: initialVelocity,
        vy: 0,
        color: '#3a86ff'
    };
    
    // Create sphere 2 (right)
    sphere2 = {
        x: collisionCanvas ? (3 * collisionCanvas.width) / 4 : 300,
        y: collisionCanvas ? collisionCanvas.height / 2 : 200,
        radius: radius2,
        mass: mass2,
        vx: 0,
        vy: 0,
        color: '#ff006e'
    };
}

// Update spheres physics
function updateCollision() {
    // Move spheres
    sphere1.x += sphere1.vx;
    sphere1.y += sphere1.vy;
    sphere2.x += sphere2.vx;
    sphere2.y += sphere2.vy;
    
    // Check for collision between spheres
    const dx = sphere2.x - sphere1.x;
    const dy = sphere2.y - sphere1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < sphere1.radius + sphere2.radius) {
        // Spheres are colliding
        
        // Calculate unit normal vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const vx = sphere2.vx - sphere1.vx;
        const vy = sphere2.vy - sphere1.vy;
        
        // Calculate relative velocity along normal
        const vn = vx * nx + vy * ny;
        
        // If spheres are moving toward each other
        if (vn < 0) {
            // Calculate impulse scalar
            const impulse = -(1 + 0.9) * vn / (1/sphere1.mass + 1/sphere2.mass);
            
            // Apply impulse to velocities
            sphere1.vx -= impulse * nx / sphere1.mass;
            sphere1.vy -= impulse * ny / sphere1.mass;
            sphere2.vx += impulse * nx / sphere2.mass;
            sphere2.vy += impulse * ny / sphere2.mass;
            
            // Move spheres apart to prevent sticking
            const overlap = sphere1.radius + sphere2.radius - distance;
            sphere1.x -= overlap * nx * 0.5;
            sphere1.y -= overlap * ny * 0.5;
            sphere2.x += overlap * nx * 0.5;
            sphere2.y += overlap * ny * 0.5;
        }
    }
    
    // Check for boundary collisions
    if (sphere1.x - sphere1.radius < 0) {
        sphere1.x = sphere1.radius;
        sphere1.vx = -sphere1.vx * 0.9;
    } else if (sphere1.x + sphere1.radius > collisionCanvas.width) {
        sphere1.x = collisionCanvas.width - sphere1.radius;
        sphere1.vx = -sphere1.vx * 0.9;
    }
    
    if (sphere1.y - sphere1.radius < 0) {
        sphere1.y = sphere1.radius;
        sphere1.vy = -sphere1.vy * 0.9;
    } else if (sphere1.y + sphere1.radius > collisionCanvas.height) {
        sphere1.y = collisionCanvas.height - sphere1.radius;
        sphere1.vy = -sphere1.vy * 0.9;
    }
    
    if (sphere2.x - sphere2.radius < 0) {
        sphere2.x = sphere2.radius;
        sphere2.vx = -sphere2.vx * 0.9;
    } else if (sphere2.x + sphere2.radius > collisionCanvas.width) {
        sphere2.x = collisionCanvas.width - sphere2.radius;
        sphere2.vx = -sphere2.vx * 0.9;
    }
    
    if (sphere2.y - sphere2.radius < 0) {
        sphere2.y = sphere2.radius;
        sphere2.vy = -sphere2.vy * 0.9;
    } else if (sphere2.y + sphere2.radius > collisionCanvas.height) {
        sphere2.y = collisionCanvas.height - sphere2.radius;
        sphere2.vy = -sphere2.vy * 0.9;
    }
}

// Draw the collision
function drawCollision() {
    if (!collisionContext) return;
    
    // Clear canvas
    collisionContext.clearRect(0, 0, collisionCanvas.width, collisionCanvas.height);
    
    // Draw background
    collisionContext.fillStyle = '#f5f5f5';
    collisionContext.fillRect(0, 0, collisionCanvas.width, collisionCanvas.height);
    
    // Draw ground line
    collisionContext.strokeStyle = '#cccccc';
    collisionContext.lineWidth = 1;
    collisionContext.beginPath();
    collisionContext.moveTo(0, collisionCanvas.height / 2 + 50);
    collisionContext.lineTo(collisionCanvas.width, collisionCanvas.height / 2 + 50);
    collisionContext.stroke();
    
    // Draw sphere 1
    collisionContext.fillStyle = sphere1.color;
    collisionContext.beginPath();
    collisionContext.arc(sphere1.x, sphere1.y, sphere1.radius, 0, Math.PI * 2);
    collisionContext.fill();
    collisionContext.strokeStyle = '#000000';
    collisionContext.lineWidth = 1;
    collisionContext.stroke();
    
    // Draw sphere 2
    collisionContext.fillStyle = sphere2.color;
    collisionContext.beginPath();
    collisionContext.arc(sphere2.x, sphere2.y, sphere2.radius, 0, Math.PI * 2);
    collisionContext.fill();
    collisionContext.strokeStyle = '#000000';
    collisionContext.lineWidth = 1;
    collisionContext.stroke();
    
    // Draw velocities as arrows
    drawVelocityArrow(sphere1, '#3a86ff');
    drawVelocityArrow(sphere2, '#ff006e');
    
    // Add labels for masses
    collisionContext.fillStyle = '#000000';
    collisionContext.font = '12px Arial';
    collisionContext.textAlign = 'center';
    collisionContext.fillText(`m₁ = ${sphere1.mass}`, sphere1.x, sphere1.y - sphere1.radius - 10);
    collisionContext.fillText(`m₂ = ${sphere2.mass}`, sphere2.x, sphere2.y - sphere2.radius - 10);
}

// Draw velocity arrow
function drawVelocityArrow(sphere, color) {
    if (!collisionContext) return;
    
    const speed = Math.sqrt(sphere.vx * sphere.vx + sphere.vy * sphere.vy);
    if (speed < 0.1) return; // Don't draw very small velocities
    
    const scale = 5; // Scale factor for arrow length
    const arrowLength = speed * scale;
    const angle = Math.atan2(sphere.vy, sphere.vx);
    
    // Start at sphere center
    const startX = sphere.x;
    const startY = sphere.y;
    const endX = startX + Math.cos(angle) * arrowLength;
    const endY = startY + Math.sin(angle) * arrowLength;
    
    // Draw line
    collisionContext.strokeStyle = color;
    collisionContext.lineWidth = 2;
    collisionContext.beginPath();
    collisionContext.moveTo(startX, startY);
    collisionContext.lineTo(endX, endY);
    
    // Draw arrowhead
    const headLen = 5;
    const angle1 = angle - Math.PI / 7;
    const angle2 = angle + Math.PI / 7;
    
    collisionContext.lineTo(
        endX - headLen * Math.cos(angle1),
        endY - headLen * Math.sin(angle1)
    );
    
    collisionContext.moveTo(endX, endY);
    collisionContext.lineTo(
        endX - headLen * Math.cos(angle2),
        endY - headLen * Math.sin(angle2)
    );
    
    collisionContext.stroke();
}

// Animation loop
function animateCollision() {
    if (!isCollisionRunning) return;
    
    updateCollision();
    drawCollision();
    
    collisionAnimationId = requestAnimationFrame(animateCollision);
}

// Toggle collision animation
function toggleCollision() {
    isCollisionRunning = !isCollisionRunning;
    
    const startButton = document.getElementById('collision-start');
    if (startButton) {
        startButton.textContent = isCollisionRunning ? 'Pause' : 'Start';
    }
    
    if (isCollisionRunning) {
        animateCollision();
    } else {
        cancelAnimationFrame(collisionAnimationId);
    }
}

// Reset collision
function resetCollision() {
    resetSpheres();
    drawCollision();
    
    // If running, stop it
    if (isCollisionRunning) {
        toggleCollision();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize simulations when their tab is active
    const simNavLinks = document.querySelectorAll('.sim-nav a');
    simNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const simId = this.getAttribute('href').substring(1);
            if (simId === 'collision') {
                setTimeout(initCollisionSimulation, 100);
            }
        });
    });
    
    // Check if collision is the active tab
    if (window.location.hash === '#collision') {
        setTimeout(initCollisionSimulation, 100);
    }
});

// Call initialization directly to ensure it runs
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Document already ready
    setTimeout(initCollisionSimulation, 100);
} else {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initCollisionSimulation, 100);
    });
}