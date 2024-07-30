const canvas = document.getElementById('ecosystem');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth - 300;
canvas.height = window.innerHeight;

let creatures = [];
let food = [];
let predators = [];
let generation = 1;
let isSimulationRunning = false;
let selectedCreature = null;
let mutationRate = 0.1;
let temperature = 50;
let humidity = 50;

class Creature {
    constructor(x, y, parent = null) {
        this.x = x;
        this.y = y;
        this.size = 5;
        this.speed = parent ? parent.speed + (Math.random() - 0.5) : Math.random() * 2 + 1;
        this.color = parent ? this.mutateColor(parent.color) : `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.direction = Math.random() * Math.PI * 2;
        this.energy = 100;
        this.age = 0;
        this.generation = parent ? parent.generation + 1 : 1;
    }

    mutateColor(parentColor) {
        const hsl = parentColor.match(/\d+/g).map(Number);
        const newHue = (hsl[0] + (Math.random() - 0.5) * 30 + 360) % 360;
        return `hsl(${newHue}, ${hsl[1]}%, ${hsl[2]}%)`;
    }

    update() {
        this.direction += (Math.random() - 0.5) * 0.5;
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        if (this.x < 0 || this.x > canvas.width) this.direction = Math.PI - this.direction;
        if (this.y < 0 || this.y > canvas.height) this.direction = -this.direction;

        this.energy -= 0.1 * (1 + (temperature - 50) / 100);
        this.age += 0.1;

        if (this.energy <= 0 || this.age > 200) {
            const index = creatures.indexOf(this);
            if (index > -1) creatures.splice(index, 1);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        if (this === selectedCreature) {
            ctx.strokeStyle = '#fab387';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    reproduce() {
        if (this.energy > 150 && Math.random() < 0.01) {
            this.energy -= 50;
            const childX = this.x + (Math.random() - 0.5) * 20;
            const childY = this.y + (Math.random() - 0.5) * 20;
            const child = new Creature(childX, childY, this);
            if (Math.random() < mutationRate) {
                child.speed = Math.max(0.5, Math.min(5, child.speed + (Math.random() - 0.5)));
                child.size = Math.max(3, Math.min(8, child.size + (Math.random() - 0.5)));
            }
            creatures.push(child);
        }
    }

    select() {
        selectedCreature = this;
        updateCreatureInfo();
    }
}

class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.energy = 20;
        this.size = 2;
    }

    draw() {
        ctx.fillStyle = '#89dceb';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Predator {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.speed = 1.5;
        this.direction = Math.random() * Math.PI * 2;
    }

    update() {
        this.direction += (Math.random() - 0.5) * 0.3;
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        if (this.x < 0 || this.x > canvas.width) this.direction = Math.PI - this.direction;
        if (this.y < 0 || this.y > canvas.height) this.direction = -this.direction;
    }

    draw() {
        ctx.fillStyle = '#f38ba8';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createFood() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    food.push(new Food(x, y));
}

function createPredator() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    predators.push(new Predator(x, y));
}

function updateSimulation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    food.forEach(f => f.draw());
    predators.forEach(p => {
        p.update();
        p.draw();
    });

    creatures.forEach(creature => {
        creature.update();
        creature.draw();

        // Eating food
        food = food.filter(f => {
            const dist = Math.hypot(creature.x - f.x, creature.y - f.y);
            if (dist < creature.size + f.size) {
                creature.energy += f.energy;
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
    if (selectedCreature) updateCreatureInfo();

    if (isSimulationRunning) {
        requestAnimationFrame(updateSimulation);
    }
}

function updateStats() {
    document.getElementById('generation').textContent = generation;
    document.getElementById('population').textContent = creatures.length;

    if (creatures.length > 0) {
        const speeds = creatures.map(c => c.speed);
        const sizes = creatures.map(c => c.size);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        document.getElementById('dominant-trait').textContent = `Avg Speed: ${avgSpeed.toFixed(2)}, Avg Size: ${avgSize.toFixed(2)}`;
    } else {
        document.getElementById('dominant-trait').textContent = 'None';
    }

    if (creatures.length === 0) {
        generation++;
        initializeCreatures();
    }
}

function updateCreatureInfo() {
    if (selectedCreature) {
        document.getElementById('creature-energy').textContent = selectedCreature.energy.toFixed(2);
        document.getElementById('creature-speed').textContent = selectedCreature.speed.toFixed(2);
        document.getElementById('creature-size').textContent = selectedCreature.size.toFixed(2);
    }
}

function initializeCreatures() {
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        creatures.push(new Creature(x, y));
    }
}

function updateRangeValue(inputId, spanId) {
    const input = document.getElementById(inputId);
    const span = document.getElementById(spanId);
    span.textContent = input.value;
    input.addEventListener('input', () => {
        span.textContent = input.value;
    });
}

// Event Listeners
document.getElementById('start-stop').addEventListener('click', () => {
    isSimulationRunning = !isSimulationRunning;
    if (isSimulationRunning) updateSimulation();
});

document.getElementById('add-food').addEventListener('click', () => {
    for (let i = 0; i < 10; i++) createFood();
});

document.getElementById('add-predator').addEventListener('click', createPredator);

document.getElementById('reset').addEventListener('click', () => {
    creatures = [];
    food = [];
    predators = [];
    generation = 1;
    initializeCreatures();
    updateStats();
});

document.getElementById('temperature').addEventListener('input', (e) => {
    temperature = parseInt(e.target.value);
});

document.getElementById('humidity').addEventListener('input', (e) => {
    humidity = parseInt(e.target.value);
    creatures.forEach(c => {
        c.size = Math.max(3, Math.min(8, 5 + (humidity - 50) / 10));
    });
});

document.getElementById('mutation-rate').addEventListener('input', (e) => {
    mutationRate = e.target.value / 100;
});

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    selectedCreature = null;
    for (let creature of creatures) {
        const distance = Math.hypot(creature.x - x, creature.y - y);
        if (distance <= creature.size) {
            creature.select();
            break;
        }
    }
    if (!selectedCreature) {
        document.getElementById('creature-energy').textContent = 'N/A';
        document.getElementById('creature-speed').textContent = 'N/A';
        document.getElementById('creature-size').textContent = 'N/A';
    }
});

// Initialize
updateRangeValue('temperature', 'temp-value');
updateRangeValue('humidity', 'humidity-value');
updateRangeValue('mutation-rate', 'mutation-value');
initializeCreatures();
updateSimulation();

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 300;
    canvas.height = window.innerHeight;
});