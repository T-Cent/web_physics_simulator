// Physics Particles following mouse
class PhysicsParticle {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.baseRadius = radius;
        this.density = Math.random() * 30 + 1;
        this.distance = 0;
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        };
        this.maxRadius = this.baseRadius * 5;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update(ctx, mouse, canvasWidth, canvasHeight) {
        // Draw the particle
        this.draw(ctx);

        // Mouse interaction
        if (mouse.x !== undefined && mouse.y !== undefined) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            this.distance = distance;

            // Force direction
            let forceDirectionX = dx / distance;
            let forceDirectionY = dy / distance;

            // Distance threshold
            const maxDistance = 100;
            let force = (maxDistance - distance) / maxDistance;
            if (force < 0) force = 0;

            // Movement based on force
            let directionX = forceDirectionX * force * this.density;
            let directionY = forceDirectionY * force * this.density;

            if (distance < maxDistance) {
                // Push particles away from mouse
                this.x -= directionX;
                this.y -= directionY;
                this.radius = Math.min(this.maxRadius, this.baseRadius + (force * this.maxRadius));
            } else {
                // Return to original size
                if (this.radius > this.baseRadius) {
                    this.radius -= 0.5;
                }

                // Natural movement when not interacting
                this.move(canvasWidth, canvasHeight);
            }
        } else {
            // Natural movement when mouse is outside canvas
            this.move(canvasWidth, canvasHeight);
            
            // Return to original size
            if (this.radius > this.baseRadius) {
                this.radius -= 0.5;
            }
        }
    }

    move(canvasWidth, canvasHeight) {
        // Update position based on velocity
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        // Bounce off edges
        if (this.x <= this.radius || this.x >= canvasWidth - this.radius) {
            this.velocity.x *= -1;
        }
        if (this.y <= this.radius || this.y >= canvasHeight - this.radius) {
            this.velocity.y *= -1;
        }
    }
}

// Initialize the physics canvas when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('physics-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = {
            x: undefined,
            y: undefined
        };

        // Set canvas size
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initParticles();
        }

        // Initialize particles
        function initParticles() {
            particles = [];
            const numberOfParticles = Math.min(100, Math.floor(canvas.width * canvas.height / 9000));
            
            for (let i = 0; i < numberOfParticles; i++) {
                const radius = Math.random() * 5 + 2;
                const x = Math.random() * (canvas.width - radius * 2) + radius;
                const y = Math.random() * (canvas.height - radius * 2) + radius;
                
                // Determine color based on current theme
                let color;
                if (document.body.getAttribute('data-theme') === 'dark') {
                    color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.2})`;
                } else {
                    color = `rgba(58, 134, 255, ${Math.random() * 0.3 + 0.2})`;
                }
                
                particles.push(new PhysicsParticle(x, y, radius, color));
            }
        }

        // Listen for mouse movement
        canvas.addEventListener('mousemove', function(event) {
            mouse.x = event.x;
            mouse.y = event.y;
        });

        // Mouse leaves canvas
        canvas.addEventListener('mouseout', function() {
            mouse.x = undefined;
            mouse.y = undefined;
        });

        // Animate the particles
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update(ctx, mouse, canvas.width, canvas.height);
            }
            
            // Optional: Connect particles with lines when close to each other
            connectParticles();
            
            requestAnimationFrame(animate);
        }

        // Connect particles with lines if they are close enough
        function connectParticles() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        // Draw line between particles
                        ctx.beginPath();
                        ctx.strokeStyle = document.body.getAttribute('data-theme') === 'dark' 
                            ? `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})` 
                            : `rgba(58, 134, 255, ${0.1 * (1 - distance / 100)})`;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
        
        // Handle theme change
        document.addEventListener('themeToggle', function() {
            initParticles();
        });

        // Initialize and start animation
        resizeCanvas();
        animate();
    }
});