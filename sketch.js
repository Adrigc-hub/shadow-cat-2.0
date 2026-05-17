// --- CONFIGURACIÓN DE RENDIMIENTO Y DECORACIÓN ---
let modoActual = "menu"; // menu, ritmo, disparos, campaña
let estrellas = [];
let ondasToque = [];
let particulasEnergia = [];

// Base de Datos de Habilidades (15)
const CONFIG_TIENDA = [
    { n: "Destello Negro", p: 150, d: "Golpe rítmico crítico físico." },
    { n: "Vacío Inconmensurable", p: 1000, d: "Congela la pantalla por completo." },
    { n: "Puño Divergente", p: 100, d: "Impacto con doble onda de choque." },
    { n: "Nuevitas Sombras", p: 200, d: "Aumenta la absorción magnética." },
    { n: "Corte / Desmantelar", p: 450, d: "Corta objetivos de manera pasiva." },
    { n: "Flecha de Fuego", p: 750, d: "Destrucción lineal de alta temperatura." },
    { n: "Azul Máximo", p: 350, d: "Genera un centro de gravedad atractivo." },
    { n: "Rojo Resplandor", p: 400, d: "Repele amenazas con empuje cinético." },
    { n: "Púrpura Imaginario", p: 900, d: "Elimina toda la materia visible." },
    { n: "Quimera Sombría", p: 600, d: "Invoca clones de sombra autónomos." },
    { n: "Golpe de Ráfaga", p: 50, d: "Pequeño aumento de velocidad táctil." },
    { n: "Energía Inversa", p: 300, d: "Sana errores y fallos rítmicos." },
    { n: "Paso Veloz", p: 120, d: "Teletransportación instantánea fluida." },
    { n: "Furia de Sangre", p: 250, d: "Multiplicador de daño por tiempo limitado." },
    { n: "Impacto Crítico", p: 180, d: "Físicas pesadas contra estructuras." }
];

// Configuración de Skins e Identidades Visuales Avanzadas
const SKINS = {
    "Gojo": { colorPrimario: [0, 150, 255], colorAura: [100, 200, 255, 40], fondo: [5, 5, 25] },
    "Itadori": { colorPrimario: [255, 60, 60], colorAura: [255, 150, 150, 40], fondo: [25, 5, 5] },
    "Megumi": { colorPrimario: [40, 200, 130], colorAura: [100, 255, 180, 30], fondo: [5, 20, 15] },
    "Sukuna": { colorPrimario: [180, 0, 50], colorAura: [255, 0, 100, 45], fondo: [20, 2, 8] }
};
let nombresSkins = ["Gojo", "Itadori", "Megumi", "Sukuna"];
let idxSkin = 0;
let skinActiva = "Gojo";

// Variables de Animación de "Existir"
let oscilacionVida = 0;

// Instancias de Motores de Minijuegos
let motorRitmo;
let motorCajas;
let motorCampaña;

// --- CONFIGURACIÓN INICIAL DE P5.JS ---
function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Crear el campo de estrellas decorativas espaciales
    for (let i = 0; i < 60; i++) {
        estrellas.push({ x: random(width), y: random(height), tam: random(1, 3), brillo: random(100, 255) });
    }
    
    // Inicializar los componentes de los minijuegos de forma segura
    motorRitmo = new ControladorDanceOfFire();
    motorCajas = new ControladorShootTheBox();
    motorCampaña = new ControladorCampania();

    // Inyectar de forma segura la tienda en el HTML sin congelamientos
    let contenedorTienda = document.getElementById("box-tienda");
    if (contenedorTienda) {
        contenedorTienda.innerHTML = CONFIG_TIENDA.map(h => `
            <div class="item-tienda">
                <strong style="color:#fff;">${h.n}</strong>
                <span style="color:#aaa; display:block; font-size:9px; margin-top:2px;">${h.d}</span>
                <button onclick="event.stopPropagation();">$${h.p}</button>
            </div>
        `).join('');
    }
}

// --- BUCLE PRINCIPAL DE RENDERIZADO GRÁFICO (60 FPS) ---
function draw() {
    // Renderizado del fondo cósmico cambiante basado en la skin
    let configVisual = SKINS[skinActiva];
    background(configVisual.fondo[0], configVisual.fondo[1], configVisual.fondo[2]);
    
    // Dibujar y hacer parpadear la decoración de estrellas espaciales
    fill(255);
    noStroke();
    estrellas.forEach(e => {
        e.brillo += random(-10, 10);
        let b = constrain(e.brillo, 100, 255);
        fill(255, b);
        ellipse(e.x, e.y, e.tam, e.tam);
    });

    // Enrutar pantallas
    if (modoActual === "menu") {
        dibujarPersonajeExistiendo();
    } else if (modoActual === "ritmo") {
        motorRitmo.ejecutar();
    } else if (modoActual === "disparos") {
        motorCajas.ejecutar();
    } else if (modoActual === "campaña") {
        motorCampaña.ejecutar();
    }

    // Renderizar efectos de partículas de energía de forma fluida
    actualizarParticulas();

    // Renderizar ondas de impacto/apachar en pantalla
    actualizarOndasToque();
}

// --- ANIMACIÓN REALISTA E HIPERFLUIDA PARA EXISTIR (IDLE) ---
function dibujarPersonajeExistiendo() {
    push();
    translate(width / 2, height / 2 - 60);
    
    oscilacionVida += 0.04;
    // Escala elástica avanzada para simular respiración real de la skin
    let escalaY = 1.0 + sin(oscilacionVida) * 0.04;
    let escalaX = 1.0 - sin(oscilacionVida) * 0.02;
    scale(escalaX, escalaY);

    let info = SKINS[skinActiva];

    // Efecto de aura brillante de energía mística (Mejor renderizado)
    for (let i = 3; i > 0; i--) {
        fill(info.colorAura[0], info.colorAura[1], info.colorAura[2], (info.colorAura[3] / i) + sin(oscilacionVida)*5);
        ellipse(0, 0, 90 + (i * 25), 90 + (i * 25));
    }

    // Núcleo del Personaje
    stroke(255, 180);
    strokeWeight(3);
    fill(info.colorPrimario[0], info.colorPrimario[1], info.colorPrimario[2]);
    ellipse(0, 0, 90, 90);
    
    // Detalles estéticos internos (Ojos brillantes simulados)
    fill(255);
    noStroke();
    ellipse(-15, -5, 12, 6);
    ellipse(15, -5, 12, 6);
    pop();

    // UI flotante de instrucciones en el lienzo
    textAlign(CENTER);
    textSize(14);
    fill(255, 160);
    text("Toca al personaje para alternar entre Gojo, Itadori, Megumi y Sukuna", width / 2, height / 2 + 60);
    textSize(20);
    fill(255);
    text(`Skin Existente: ${skinActiva}`, width / 2, height / 2 + 95);
}

// --- LOGICA DEL MINIJUEGO: DANCE OF FIRE ---
class ControladorDanceOfFire {
    constructor() {
        this.angulo = 0;
        this.velocidad = 0.06;
        this.baldosas = [
            {x: 200, y: 400}, {x: 300, y: 400}, {x: 400, y: 400},
            {x: 400, y: 300}, {x: 500, y: 300}, {x: 500, y: 200}
        ];
        this.indice = 0;
        this.px = 0; this.py = 0;
        this.radio = 50;
    }

    iniciar() { this.indice = 0; this.angulo = 0; }

    ejecutar() {
        if (this.baldosas.length === 0) return;
        
        this.angulo += this.velocidad;
        let centro = this.baldosas[this.indice];
        this.px = centro.x + cos(this.angulo) * this.radio;
        this.py = centro.y + sin(this.angulo) * this.radio;

        // Dibujar baldosas con mejor renderizado
        for (let i = 0; i < this.baldosas.length; i++) {
            let b = this.baldosas[i];
            if (i === this.indice) {
                fill(0, 255, 200, 180);
                stroke(255);
                strokeWeight(2);
                ellipse(b.x, b.y, 45, 45);
            } else {
                fill(255, 40);
                noStroke();
                ellipse(b.x, b.y, 35, 35);
            }
        }

        // Línea de órbita y Planeta rítmico
        stroke(255, 150);
        line(centro.x, centro.y, this.px, this.py);
        fill(255, 50, 100);
        noStroke();
        ellipse(this.px, this.py, 20, 20);
    }

    chequearToque() {
        let siguiente = this.baldosas[this.indice + 1];
        if (!siguiente) { this.indice = 0; return; }

        // Hitbox perfecta arreglada por distancia euclidiana
        let d = dist(this.px, this.py, siguiente.x, siguiente.y);
        if (d < 38) {
            this.indice++;
            this.angulo = atan2(this.py - siguiente.y, this.px - siguiente.x);
            crearExplosionParticulas(this.px, this.py, [0, 255, 200]);
        }
    }
}

// --- LOGICA DEL MINIJUEGO: SHOOT THE BOX ---
class ControladorShootTheBox {
    constructor() { this.cajas = []; this.puntos = 0; }
    iniciar() { this.cajas = []; this.puntos = 0; }

    ejecutar() {
        if (frameCount % 40 === 0) {
            let tam = random(35, 55);
            this.cajas.push({ x: random(40, width - 80), y: -60, w: tam, h: tam, velY: random(2, 5), gravedad: 0.07 });
        }

        for (let i = this.cajas.length - 1; i >= 0; i--) {
            let c = this.cajas[i];
            c.velY += c.gravedad; // Físicas aceleradas estables
            c.y += c.velY;

            // Renderizado estilo neón decorado
            fill(255, 140, 0);
            stroke(255);
            strokeWeight(2);
            rect(c.x, c.y, c.w, c.h, 6);

            if (c.y > height) { this.cajas.splice(i, 1); this.puntos = Math.max(0, this.puntos - 5); }
        }

        fill(255); noStroke(); textSize(24);
        text(`Puntaje: ${this.puntos}`, 40, height - 40);
    }

    registrarTiro(tx, ty) {
        for (let i = this.cajas.length - 1; i >= 0; i--) {
            let c = this.cajas[i];
            // Hitbox precisa cuadrada corregida
            if (tx >= c.x && tx <= c.x + c.w && ty >= c.y && ty <= c.y + c.h) {
                crearExplosionParticulas(c.x + c.w/2, c.y + c.h/2, [255, 140, 0]);
                this.cajas.splice(i, 1);
                this.puntos += 10;
                break;
            }
        }
    }
}

// --- LOGICA DEL MODO CAMPAÑA (COMPLETO) ---
class ControladorCampania {
    constructor() { this.enemigoX = 0; this.enemigoY = 0; this.vidaEnemigo = 100; }
    iniciar() { this.enemigoX = width / 2; this.enemigoY = height / 2 - 50; this.vidaEnemigo = 100; }
    
    ejecutar() {
        // Renderizado del Boss de la campaña
        push();
        translate(this.enemigoX, this.enemigoY + sin(frameCount * 0.08) * 10);
        fill(120, 20, 200);
        stroke(255, 50, 50);
        strokeWeight(3);
        rect(-50, -50, 100, 100, 15);
        
        // Barra de Vida estilizada del enemigo
        fill(255, 0, 0); noStroke(); rect(-60, -70, 120, 10);
        fill(0, 255, 0); rect(-60, -70, map(this.vidaEnemigo, 0, 100, 0, 120), 10);
        pop();

        fill(255); textSize(20); textAlign(CENTER);
        text("MODO CAMPAÑA: ¡Apacha al jefe maldito para derrotarlo!", width/2, height - 50);
    }

    atacar(tx, ty) {
        let d = dist(tx, ty, this.enemigoX, this.enemigoY);
        if (d < 70) {
            this.vidaEnemigo = Math.max(0, this.vidaEnemigo - 10);
            crearExplosionParticulas(tx, ty, [120, 20, 200]);
            if (this.vidaEnemigo <= 0) this.iniciar(); // Resucita con salud completa al ganar
        }
    }
}

// --- ENRUTAMIENTOS DE INTERFAZ GENERAL ---
function activarModoJuego(modo) {
    modoActual = modo;
    document.getElementById("contenedor-menu").style.display = "none";
    document.getElementById("btn-regresar").style.display = "block";
    
    if (modo === "ritmo") motorRitmo.iniciar();
    if (modo === "disparos") motorCajas.iniciar();
    if (modo === "campaña") motorCampaña.iniciar();
}

function volverAlMenuPrincipal() {
    modoActual = "menu";
    document.getElementById("contenedor-menu").style.display = "block";
    document.getElementById("btn-regresar").style.display = "none";
}

// --- MANEJO DE EFECTOS ESPECIALES DE APALSAR (TOUCH) ---
function touchStarted() {
    // 1. Crear onda de expansión realista en la zona del toque
    ondasToque.push({ x: mouseX, y: mouseY, radio: 5, alfa: 255 });

    // 2. Gestionar interacciones de juego basadas en hitboxes
    if (modoActual === "menu") {
        let d = dist(mouseX, mouseY, width / 2, height / 2 - 60);
        if (d < 65) {
            idxSkin = (idxSkin + 1) % nombresSkins.length;
            skinActiva = nombresSkins[idxSkin];
            crearExplosionParticulas(mouseX, mouseY, SKINS[skinActiva].colorPrimario);
        }
    } else if (modoActual === "ritmo") {
        motorRitmo.chequearToque();
    } else if (modoActual === "disparos") {
        motorCajas.registrarTiro(mouseX, mouseY);
    } else if (modoActual === "campaña") {
        motorCampaña.atacar(mouseX, mouseY);
    }
    return false;
}

// Generador modular de explosiones de partículas decorativas
function crearExplosionParticulas(x, y, colorBase) {
    for (let i = 0; i < 15; i++) {
        particulasEnergia.push({
            x: x, y: y,
            vx: random(-4, 4), vy: random(-4, 4),
            r: random(4, 8), col: colorBase, alfa: 255
        });
    }
}

function actualizarParticulas() {
    for (let i = particulasEnergia.length - 1; i >= 0; i--) {
        let p = particulasEnergia[i];
        p.x += p.vx; p.y += p.vy;
        p.alfa -= 6; p.r *= 0.96;
        
        if (p.alfa <= 0) { particulasEnergia.splice(i, 1); continue; }
        
        fill(p.col[0], p.col[1], p.col[2], p.alfa);
        noStroke();
        ellipse(p.x, p.y, p.r, p.r);
    }
}

function actualizarOndasToque() {
    for (let i = ondasToque.length - 1; i >= 0; i--) {
        let o = ondasToque[i];
        o.radio += 4; o.alfa -= 7;
        
        if (o.alfa <= 0) { ondasToque.splice(i, 1); continue; }
        
        stroke(255, o.alfa);
        strokeWeight(2);
        noFill();
        ellipse(o.x, o.y, o.radio, o.radio);
    }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
