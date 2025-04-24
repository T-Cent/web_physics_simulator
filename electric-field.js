// Simple Electric Field Visualization
let electricCanvas, electricContext;
let charges = [];
let fieldArrows = [];
let isElectricRunning = false;
let electricAnimationId;
let isDragging = false;
let selectedCharge = null;

// Constants
const ARROW_COUNT = 20; // Number of arrows in each dimension
const ARROW_SIZE = 5; // Size of the arrows
const K = 9e9; // Coulomb's constant (scaled for visualization)

// Initialize the electric field simulation
function initElectricFieldSimulation() {
    // Get the canvas
    electricCanvas = document.getElementById('electric-canvas');
    if (!electricCanvas) {
        console.error('Electric field canvas not found');
        return;
    }
    
    electricContext = electricCanvas.getContext('2d');
    
    // Set canvas size
    resizeElectricCanvas();
    
    // Create initial charges
    resetCharges();
    
    // Add event listeners for controls
    const startButton = document.getElementById('electric-start');
    const resetButton = document.getElementById('electric-reset');
    const addPositiveButton = document.getElementById('electric-add-positive');
    const addNegativeButton = document.getElementById('electric-add-negative');
    
    if (startButton) {
        startButton.addEventListener('click', toggleElectric);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetElectric);
    }
    
    if (addPositiveButton) {
        addPositiveButton.addEventListener('click', function() {
            addCharge(1);
        });
    }
    
    if (addNegativeButton) {
        addNegativeButton.addEventListener('click', function() {
            addCharge(-1);
        });
    }
    
    // Add mouse event listeners for charge interaction
    electricCanvas.addEventListener('mousedown', onElectricMouseDown);
    electricCanvas.addEventListener('mousemove', onElectricMouseMove);
    electricCanvas.addEventListener('mouseup', onElectricMouseUp);
    electricCanvas.addEventListener('dblclick', onElectricDoubleClick);
    
    // Add window resize listener
    window.addEventListener('resize', resizeElectricCanvas);
    
    // Draw initial state
    calculateFieldArrows();
    drawElectric();
    
    // Start the electric field visualization automatically after a short delay
    setTimeout(() => {
        if (!isElectricRunning) {
            toggleElectric();
        }
    }, 500);
}

// Resize canvas to fit container
function resizeElectricCanvas() {
    if (!electricCanvas) return;
    
    const container = electricCanvas.parentElement;
    if (container) {
        electricCanvas.width = container.clientWidth;
        electricCanvas.height = 400; // Fixed height
    }
    
    // Recalculate field after resize
    calculateFieldArrows();
    drawElectric();
}

// Initialize charges
function resetCharges() {
    charges = [];
    
    // Add a positive charge on the left
    addCharge(1, electricCanvas.width / 3, electricCanvas.height / 2);
    
    // Add a negative charge on the right
    addCharge(-1, (2 * electricCanvas.width) / 3, electricCanvas.height / 2);
    
    // Recalculate field
    calculateFieldArrows();
}

// Add a charge
function addCharge(sign, x, y) {
    if (!electricCanvas) return;
    
    // If position not specified, add at random position
    if (x === undefined || y === undefined) {
        x = Math.random() * electricCanvas.width;
        y = Math.random() * electricCanvas.height;
    }
    
    // Add the charge
    charges.push({
        x: x,
        y: y,
        charge: sign * 1e-6, // Scaled for visualization
        radius: 15,
        color: sign > 0 ? '#ff0000' : '#0000ff'
    });
}

// Calculate the electric field at a point
function calculateField(x, y) {
    let fieldX = 0;
    let fieldY = 0;
    
    // Sum contributions from all charges (Coulomb's Law)
    for (const charge of charges) {
        // Vector from charge to point
        const dx = x - charge.x;
        const dy = y - charge.y;
        const distanceSquared = dx * dx + dy * dy;
        
        // Avoid division by zero
        if (distanceSquared < 1) continue;
        
        // Calculate field contribution using Coulomb's Law
        const distance = Math.sqrt(distanceSquared);
        const fieldMagnitude = K * charge.charge / distanceSquared;
        
        // Add vector components
        fieldX += fieldMagnitude * dx / distance;
        fieldY += fieldMagnitude * dy / distance;
    }
    
    return { x: fieldX, y: fieldY };
}

// Calculate field arrows for visualization
function calculateFieldArrows() {
    if (!electricCanvas) return;
    
    fieldArrows = [];
    
    // Create a grid of arrows
    const spacing = electricCanvas.width / ARROW_COUNT;
    
    for (let x = spacing / 2; x < electricCanvas.width; x += spacing) {
        for (let y = spacing / 2; y < electricCanvas.height; y += spacing) {
            // Skip if too close to a charge
            let tooClose = false;
            for (const charge of charges) {
                const dx = x - charge.x;
                const dy = y - charge.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < charge.radius * 1.5) {
                    tooClose = true;
                    break;
                }
            }
            
            if (tooClose) continue;
            
            // Calculate field at this point
            const field = calculateField(x, y);
            
            // Calculate arrow properties
            const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);
            
            // Skip if field is too weak
            if (magnitude < 1e-12) continue;
            
            // Normalize direction
            const dirX = field.x / magnitude;
            const dirY = field.y / magnitude;
            
            // Scale arrow length (log scale for better visualization)
            const length = Math.min(10 * Math.log10(1 + magnitude * 1e10), spacing * 0.8);
            
            // Add arrow
            fieldArrows.push({
                x: x,
                y: y,
                dirX: dirX,
                dirY: dirY,
                length: length
            });
        }
    }
}

// Draw an arrow
function drawArrow(fromX, fromY, toX, toY, color = '#000000') {
    if (!electricContext) return;
    
    const headLength = 5;
    const headAngle = Math.PI / 7;
    
    // Calculate the angle of the arrow
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw the line
    electricContext.strokeStyle = color;
    electricContext.lineWidth = 1;
    electricContext.beginPath();
    electricContext.moveTo(fromX, fromY);
    electricContext.lineTo(toX, toY);
    
    // Draw the arrow head
    electricContext.lineTo(
        toX - headLength * Math.cos(angle - headAngle),
        toY - headLength * Math.sin(angle - headAngle)
    );
    electricContext.moveTo(toX, toY);
    electricContext.lineTo(
        toX - headLength * Math.cos(angle + headAngle),
        toY - headLength * Math.sin(angle + headAngle)
    );
    
    electricContext.stroke();
}

// Draw the electric field visualization
function drawElectric() {
    if (!electricContext) return;
    
    // Clear canvas
    electricContext.clearRect(0, 0, electricCanvas.width, electricCanvas.height);
    
    // Draw background
    electricContext.fillStyle = '#f5f5f5';
    electricContext.fillRect(0, 0, electricCanvas.width, electricCanvas.height);
    
    // Draw field arrows
    for (const arrow of fieldArrows) {
        const toX = arrow.x + arrow.dirX * arrow.length;
        const toY = arrow.y + arrow.dirY * arrow.length;
        
        // Color based on field strength (blue to red gradient)
        const normalizedLength = Math.min(arrow.length / 30, 1);
        const r = Math.floor(normalizedLength * 255);
        const b = Math.floor((1 - normalizedLength) * 255);
        const color = `rgb(${r}, 0, ${b})`;
        
        drawArrow(arrow.x, arrow.y, toX, toY, color);
    }
    
    // Draw charges
    for (const charge of charges) {
        // Draw the charge circle
        electricContext.fillStyle = charge.color;
        electricContext.beginPath();
        electricContext.arc(charge.x, charge.y, charge.radius, 0, Math.PI * 2);
        electricContext.fill();
        
        // Draw the charge sign
        electricContext.fillStyle = '#ffffff';
        electricContext.font = '20px Arial';
        electricContext.textAlign = 'center';
        electricContext.textBaseline = 'middle';
        electricContext.fillText(charge.charge > 0 ? '+' : '-', charge.x, charge.y);
    }
}

// Animation loop
function animateElectric() {
    if (!isElectricRunning) return;
    
    // In a more complex simulation, we would update charge positions here
    // For now, we're just redrawing the static field
    drawElectric();
    
    electricAnimationId = requestAnimationFrame(animateElectric);
}

// Toggle electric field animation
function toggleElectric() {
    isElectricRunning = !isElectricRunning;
    
    const startButton = document.getElementById('electric-start');
    if (startButton) {
        startButton.textContent = isElectricRunning ? 'Pause' : 'Start';
    }
    
    if (isElectricRunning) {
        animateElectric();
    } else {
        cancelAnimationFrame(electricAnimationId);
    }
}

// Reset electric field
function resetElectric() {
    resetCharges();
    calculateFieldArrows();
    drawElectric();
    
    // If running, continue animation
    if (!isElectricRunning) {
        drawElectric();
    }
}

// Mouse event handlers for charge interaction
function onElectricMouseDown(event) {
    const rect = electricCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if we clicked on a charge
    for (let i = charges.length - 1; i >= 0; i--) {
        const charge = charges[i];
        const dx = mouseX - charge.x;
        const dy = mouseY - charge.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= charge.radius) {
            selectedCharge = charge;
            isDragging = true;
            break;
        }
    }
}

function onElectricMouseMove(event) {
    if (!isDragging || !selectedCharge) return;
    
    const rect = electricCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Update charge position
    selectedCharge.x = mouseX;
    selectedCharge.y = mouseY;
    
    // Recalculate field
    calculateFieldArrows();
    
    // Update display
    drawElectric();
}