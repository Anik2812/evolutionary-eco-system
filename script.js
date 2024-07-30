const canvas = document.getElementById('ecosystem');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let creatures = [];
let food = [];
let predators = [];
let generation = 1;
let isSimulationRunning = false;

class Creature {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.speed = Math.random() * 2 + 1;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.direction = Math.random() * Math.PI * 2;
        this.energy = 100;
    }

    update() {
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        if (this.x < 0 || this.x > canvas.width) this.direction = Math.PI - this.direction;
        if (this.y < 0 || this.y > canvas.height) this.direction = -this.direction;

        this.energy -= 0.1;
        if (this.energy <= 0) {
            const index = creatures.indexOf(this);
            if (index > -1) creatures.splice(index, 1);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    reproduce() {
        if (this.energy > 150) {
            this.energy -= 50;
            const childX = this.x + (Math.random() - 0.5) * 20;
            const childY = this.y + (Math.random() - 0.5) * 20;
            const child = new Creature(childX, childY);
            child.color = this.color;
            if (Math.random() < 0.1) {
                child.speed = Math.max(0.5, Math.min(5, this.speed + (Math.random() - 0.5)));
            } else {
                child.speed = this.speed;
            }
            creatures.push(child);
        }
    }
}

function createFood() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    food.push({ x, y });
}

function createPredator() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    predators.push({ x, y, size: 10 });
}

function drawFood() {
    ctx.fillStyle = '#00ff00';
    food.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawPredators() {
    ctx.fillStyle = '#ff0000';
    predators.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFood();
    drawPredators();

    creatures.forEach(creature => {
        creature.update();
        creature.draw();

        // Eating food
        food = food.filter(f => {
            const dist = Math.hypot(creature.x - f.x, creature.y - f.y);
            if (dist < creature.size + 2) {
                creature.energy += 20;
                return false;
            }
            return true;
        });

        // Avoiding predators
        predators.forEach(p => {
            const dist = Math.hypot(creature.x - p.x, creature.y - p.y);
            if (dist < creature.size + p.size) {
                const index = creatures.indexOf(creature);
                if (index > -1) creatures.splice(index, 1);
            } else if (dist < 100) {
                creature.direction = Math.atan2(creature.y - p.y, creature.x - p.x);
            }
        });

        creature.reproduce();
    });

    if (Math.random() < 0.02) createFood();

    updateStats();

    if (isSimulationRunning) {
        requestAnimationFrame(updateSimulation);
    }
}

function updateStats() {
    document.getElementById('generation').textContent = generation;
    document.getElementById('population').textContent = creatures.length;

    const speeds = creatures.map(c => c.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    document.getElementById('dominant-trait').textContent = `Avg Speed: ${avgSpeed.toFixed(2)}`;

    if (creatures.length === 0) {
        generation++;
        initializeCreatures();
    }
}

function initializeCreatures() {
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        creatures.push(new Creature(x, y));
    }
}

document.getElementById('start-stop').addEventListener('click', () => {
    isSimulationRunning = !isSimulationRunning;
    if (isSimulationRunning) updateSimulation();
});

document.getElementById('add-food').addEventListener('click', () => {
    for (let i = 0; i < 10; i++) createFood();
});

document.getElementById('add-predator').addEventListener('click', createPredator);

document.getElementById('temperature').addEventListener('input', (e) => {
    const temp = e.target.value;
    creatures.forEach(c => {
        c.speed = Math.max(0.5, Math.min(5, c.speed * (1 + (temp - 50) / 100)));
    });
});

document.getElementById('humidity').addEventListener('input', (e) => {
    const humidity = e.target.value;
    creatures.forEach(c => {
        c.size = Math.max(3, Math.min(8, 5 + (humidity - 50) / 10));
    });
});

initializeCreatures();
updateSimulation();