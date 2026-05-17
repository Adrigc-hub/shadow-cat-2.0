// --- VARIABLES DE MOTOR PRINCIPAL ---
let modoActual = "menu"; // menu, ritmo, disparos, campaña, boss_secreto
let juegoPausado = false;
let estrellas = [];
let ondasToque = [];
let particulasEnergia = [];

// Base de Datos Estética de Habilidades
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

// Configuración de Skins Realistas (Gradientes y Texturas Ópticas)
const SKINS = {
    "Gojo": { centro: [255, 255, 255], brillo: [0, 160, 255], aura: [15, 80, 200, 25], fondo: [3, 4, 18] },
    "Itadori": { centro: [255, 200, 180], brillo: [255, 50, 50], aura: [180, 30, 30, 25], fondo: [16, 3, 3] },
    "Megumi": { centro: [200, 255, 220], brillo: [0, 200, 110], aura: [20, 120, 80, 20], fondo: [2, 14, 10] },
    "Sukuna": { centro: [255, 150, 150], brillo: [150, 0, 30], aura: [100, 0, 20, 30], fondo: [12, 1, 5] }
};
let nombresSkins = ["Gojo", "Itadori", "Megumi", "Sukuna"];
let idxSkin = 0;
let skinActiva = "Gojo";

let oscilacionVida = 0;

// Instancias de Modos
let motorRitmo, motorCajas, motorCampaña, motorBossSecreto;

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Polvo cósmico y estrellas de fondo
    for (let i = 0; i < 75; i++) {
        estrellas.push({ x: random(width), y: random(height), tam: random(1, 2.5), b: random(80, 255), velB: random(2, 5) });
    }
    
    motorRitmo = new ControladorDanceOfFire();
    motorCajas = new ControladorShootTheBox();
    motorCampaña = new ControladorCampania();
    motorBossSecreto = new ControladorBossSecreto();

    let contenedorTienda = document.getElementById("box-tienda");
    if (contenedorTienda) {
        contenedorTienda.innerHTML = CONFIG_TIENDA.map(h => `
            <div class="item-tienda">
                <strong style="color:#fff;">${h.n}</strong>
                <span style="color:#888; display:block; font-size:9px; margin-top:2px;">${h.d}</span>
                <button onclick="event.stopPropagation();">$${h.p}</button>
            </div>
        `).join('');
    }
}

function draw() {
    // Renderizado de fondo espacial realista basado en la skin existente
    let colF = SKINS[skinActiva].fondo;
    background(colF[0], colF[1], colF[2]);
    
    // Fondo estrellado parpadeante
    noStroke();
    estrellas.forEach(e => {
        e.b += e.velB;
        if (e.b > 255 || e.b < 80) e.velB *= -1;
        fill(255, e.b);
        ellipse(e.x, e.y, e.tam, e.tam);
    });

    // Lógica del Bucle: Se detienen las físicas si el juego está en pausa
    if (!juegoPausado) {
        oscilacionVida += 0.04;
        
        if (modoActual === "ritmo") motorRitmo.actualizar();
        if (modoActual === "disparos") motorCajas.actualizar();
        if (modoActual === "campaña") motorCampaña.actualizar();
        if (modoActual === "boss_secreto") motorBossSecreto.actualizar();
        
        actualizarParticulas();
    }

    // El renderizado gráfico continúa corriendo para que el menú de pausa no congele los efectos visuales
    if (modoActual === "menu") dibujarPersonajeExistiendo();
    if (modoActual === "ritmo") motorRitmo.dibujar();
    if (modoActual === "disparos") motorCajas.dibujar();
    if (modoActual === "campaña") motorCampaña.dibujar();
    if (modoActual === "boss_secreto") motorBossSecreto.dibujar();

    dibujarParticulas();
    actualizarYRenderizarOndas();
}

// --- RENDIDERIZADO REALISTA ULTRA FLUIDO DE AVATAR ---
function dibujarPersonajeExistiendo() {
    push();
    translate(width / 2, height / 2 - 60);
    
    let despY = sin(oscilacionVida) * 0.03;
    let despX = cos(oscilacionVida) * 0.01;
    scale(1.0 + despX, 1.0 + despY);

    let sk = SKINS[skinActiva];

    // Renderizado de Aura Volumétrica por capas de difusión
    for (let i = 4; i > 0; i--) {
        fill(sk.aura[0], sk.aura[1], sk.aura[2], sk.aura[3] / (i * 0.7));
        ellipse(0, 0, 80 + (i * 28), 80 + (i * 28));
    }

    // Sombreado e Iluminación Esférica de Alta Fidelidad (Efecto Realista 3D)
    for (let r = 85; r > 0; r -= 3) {
        let inter = map(r, 0, 85, 1, 0);
        let c = lerpColor(color(sk.brillo[0], sk.brillo[1], sk.brillo[2]), color(sk.centro[0], sk.centro[1], sk.centro[2]), inter);
        fill(c);
        ellipse(-3, -3, r, r);
    }
    
    // Destellos e Intermitencias Cósmicas
    fill(255, 200 + sin(oscilacionVida * 2) * 55);
    ellipse(-18, -8, 14, 5);
    ellipse(18, -8, 14, 5);
    pop();

    textAlign(CENTER);
    textSize(13); fill(255, 140);
    text("TAP PARA ALTERNAR SKIN REALISTA", width / 2, height / 2 + 50);
    textSize(22); fill(255);
    text(skinActiva, width / 2, height / 2 + 85);
}

// --- SISTEMA DE PAUSA CONTROLADO ---
function pausarJuego() {
    juegoPausado = true;
    document.getElementById("menu-pausa").style.display = "block";
}

function reanudarJuego() {
    juegoPausado = false;
    document.getElementById("menu-pausa").style.display = "none";
}

// --- REFACTORIZACIÓN DANCE OF FIRE ---
class ControladorDanceOfFire {
    constructor() { this.baldosas = [{x:200,y:400},{x:300,y:400},{x:400,y:400},{x:400,y:300},{x:500,y:300}]; this.idx = 0; this.ang = 0; this.r = 45; }
    iniciar() { this.idx = 0; this.ang = 0; }
    actualizar() {
        this.ang += 0.06;
        let c = this.baldosas[this.idx];
        this.px = c.x + cos(this.ang) * this.r;
        this.py = c.y + sin(this.ang) * this.r;
    }
    dibujar() {
        for (let i = 0; i < this.baldosas.length; i++) {
            let b = this.baldosas[i];
            fill(i === this.idx ? [0, 255, 180, 180] : [255, 40]);
            stroke(255, i === this.idx ? 255 : 30);
            ellipse(b.x, b.y, i === this.idx ? 40 : 30, i === this.idx ? 40 : 30);
        }
        stroke(255, 100); line(this.baldosas[this.idx].x, this.baldosas[this.idx].y, this.px, this.py);
        fill(255, 40, 90); noStroke(); ellipse(this.px, this.py, 18, 18);
    }
    toque() {
        let sig = this.baldosas[this.idx + 1];
        if (!sig) { this.idx = 0; return; }
        if (dist(this.px, this.py, sig.x, sig.y) < 35) {
            this.idx++;
            this.ang = atan2(this.py - sig.y, this.px - sig.x);
            crearExplosionParticulas(this.px, this.py, [0, 255, 180]);
        }
    }
}

// --- REFACTORIZACIÓN SHOOT THE BOX ---
class ControladorShootTheBox {
    constructor() { this.cajas = []; this.pts = 0; }
    iniciar() { this.cajas = []; this.pts = 0; }
    actualizar() {
        if (frameCount % 45 === 0) this.cajas.push({ x: random(50, width-100), y: -50, w: random(35,50), velY: random(2,4) });
        this.cajas.forEach((c, i) => {
            c.velY += 0.08; c.y += c.velY;
            if (c.y > height) { this.cajas.splice(i, 1); this.pts = Math.max(0, this.pts - 5); }
        });
    }
    dibujar() {
        this.cajas.forEach(c => {
            // Renderizado metálico con relieve realista
            fill(230, 110, 0); stroke(255); strokeWeight(2); rect(c.x, c.y, c.w, c.w, 4);
            fill(255, 50); noStroke(); rect(c.x + 3, c.y + 3, c.w - 6, 6);
        });
        fill(255); noStroke(); textSize(22); text(`Puntos: ${this.pts}`, 40, height - 40);
    }
    toque(tx, ty) {
        for (let i = this.cajas.length - 1; i >= 0; i--) {
            let c = this.cajas[i];
            if (tx >= c.x && tx <= c.x + c.w && ty >= c.y && ty <= c.y + c.w) {
                crearExplosionParticulas(c.x + c.w/2, c.y + c.w/2, [255, 120, 0]);
                this.cajas.splice(i, 1); this.pts += 10; break;
            }
        }
    }
}

// --- MODO CAMPAÑA + ACCESO AL BOSS SECRETO ---
class ControladorCampania {
    constructor() { this.vida = 100; }
    iniciar() { this.vida = 100; }
    actualizar() { this.x = width/2; this.y = height/2 - 40; }
    dibujar() {
        push(); translate(this.x, this.y + sin(frameCount * 0.07) * 8);
        
        // Renderizado del enemigo base de campaña (Maldición)
        fill(90, 30, 160); stroke(255, 80, 80); strokeWeight(2); rect(-45, -45, 90, 90, 12);
        fill(255, 0, 0); noStroke(); rect(-55, -65, 110, 8);
        fill(0, 255, 100); rect(-55, -65, map(this.vida, 0, 100, 0, 110), 8);
        pop();

        // 🛑 BOTÓN OCULTO/SECRETO PARA ENTRAR AL BOSS FIGHT
        fill(25, 25, 45, 120); stroke(255, 30);
        rect(20, height - 70, 140, 45, 8);
        fill(140, 140, 160); noStroke(); textSize(12); textAlign(LEFT);
        text("?? GRIETA COSMICA ??", 32, height - 43);
    }
    toque(tx, ty) {
        // Verificar si se presiona el botón secreto de la Grieta Cósmica
        if (tx >= 20 && tx <= 160 && ty >= height - 70 && ty <= height - 25) {
            crearExplosionParticulas(90, height - 47, [163, 51, 255]);
            activarModoJuego('boss_secreto');
            return;
        }
        if (dist(tx, ty, this.x, this.y) < 60) {
            this.vida = Math.max(0, this.vida - 8);
            crearExplosionParticulas(tx, ty, [140, 20, 220]);
            if (this.vida <= 0) this.iniciar();
        }
    }
}

// --- 👑 MODO: BOSS FIGHT SECRETO (SUKUNA EN FORMA REAL) ---
class ControladorBossSecreto {
    constructor() { this.vidaBoss = 250; this.fase = 1; this.escudo = 100; }
    iniciar() { this.vidaBoss = 250; this.fase = 1; this.escudo = 100; }
    actualizar() {
        this.x = width / 2;
        this.y = height / 2 - 60;
        if (this.vidaBoss < 120) this.fase = 2; // Segunda fase del jefe secreto
    }
    dibujar() {
        push();
        translate(this.x, this.y + sin(frameCount * 0.12) * 15);
        
        // Aura apocalíptica del Jefe Secreto
        let colA = this.fase === 1 ? [180, 0, 30] : [255, 0, 150];
        fill(colA[0], colA[1], colA[2], 30 + sin(frameCount*0.1)*15);
        ellipse(0, 0, 170, 170);
        
        // Cuerpo del Boss Secreto
        fill(20, 20, 25); stroke(colA[0], colA[1], colA[2]); strokeWeight(4);
        rect(-65, -65, 130, 130, 25);
        
        // Ojos carmesí del Rey de las Maldiciones
        fill(255, 0, 50); noStroke();
        ellipse(-25, -10, 16, 8); ellipse(25, -10, 16, 8);
        if (this.fase === 2) { // Segundos ojos revelados en Fase 2
            ellipse(-25, 10, 14, 6); ellipse(25, 10, 14, 6);
        }
        
        // Interfaz de salud del Boss Secreto (Mega Barra Superior)
        pop();
        fill(20); rect(width/2 - 150, 40, 300, 16, 5);
        fill(this.fase === 1 ? [200, 0, 40] : [255, 0, 128]);
        rect(width/2 - 150, 40, map(this.vidaBoss, 0, 250, 0, 300), 16, 5);
        
        fill(255); textSize(14); textAlign(CENTER);
        text(this.fase === 1 ? "SUKUNA: REY DE LAS MALDICIONES" : "SUKUNA: EVOLUCIÓN DESENCADENADA (FASE 2)", width/2, 30);
    }
    toque(tx, ty) {
        let d = dist(tx, ty, this.x, this.y);
        if (d < 85) {
            let daño = this.fase === 1 ? 10 : 5; // En fase 2 tiene mucha más resistencia
            this.vidaBoss = Math.max(0, this.vidaBoss - daño);
            crearExplosionParticulas(tx, ty, this.fase === 1 ? [255, 0, 50] : [255, 200, 0]);
            if (this.vidaBoss <= 0) {
                volverAlMenuPrincipal(); // Volver al triunfar
            }
        }
    }
}

// --- CONEXIONES DE NAVEGACIÓN DE INTERFAZ ---
function activarModoJuego(modo) {
    modoActual = modo;
    juegoPausado = false;
    document.getElementById("contenedor-menu").style.display = "none";
    document.getElementById("menu-pausa").style.display = "none";
    document.getElementById("btn-pausa").style.display = "block";
    
    if (modo === "ritmo") motorRitmo.iniciar();
    if (modo === "disparos") motorCajas.iniciar();
    if (modo === "campaña") motorCampaña.iniciar();
    if (modo === "boss_secreto") motorBossSecreto.iniciar();
}

function volverAlMenuPrincipal() {
    modoActual = "menu";
    juegoPausado = false;
    document.getElementById("contenedor-menu").style.display = "block";
    document.getElementById("menu-pausa").style.display = "none";
    document.getElementById("btn-pausa").style.display = "none";
}

// --- MANEJO DE ENTRADAS TÁCTILES & ONDAS REALISTAS (APACHAR) ---
function touchStarted() {
    if (juegoPausado) return false; // Bloquear toques si está en pausa

    // Generar onda de distorsión al apachar la pantalla
    ondasToque.push({ x: mouseX, y: mouseY, r: 8, a: 255 });

    if (modoActual === "menu") {
        let d = dist(mouseX, mouseY, width / 2, height / 2 - 60);
        if (d < 65) {
            idxSkin = (idxSkin + 1) % nombresSkins.length;
            skinActiva = nombresSkins[idxSkin];
            crearExplosionParticulas(mouseX, mouseY, SKINS[skinActiva].brillo);
        }
    } else if (modoActual === "ritmo") {
        motorRitmo.toque();
    } else if (modoActual === "disparos") {
        motorCajas.toque(mouseX, mouseY);
    } else if (modoActual === "campaña") {
        motorCampaña.toque(mouseX, mouseY);
    } else if (modoActual === "boss_secreto") {
        motorBossSecreto.toque(mouseX, mouseY);
    }
    return false;
}

// --- SISTEMAS DE EFECTOS ESPECIALES FLUIDOS ---
function crearExplosionParticulas(x, y, colB) {
    for (let i = 0; i < 20; i++) {
        particulasEnergia.push({ x: x, y: y, vx: random(-5, 5), vy: random(-5, 5), r: random(5, 9), c: colB, a: 255 });
    }
}

function actualizarParticulas() {
    for (let i = particulasEnergia.length - 1; i >= 0; i--) {
        let p = particulasEnergia[i]; p.x += p.vx; p.y += p.vy; p.a -= 6; p.r *= 0.95;
        if (p.a <= 0) particulasEnergia.splice(i, 1);
    }
}

function dibujarParticulas() {
    particulasEnergia.forEach(p => {
        fill(p.c[0], p.c[1], p.c[2], p.a); noStroke();
        ellipse(p.x, p.y, p.r, p.r);
    });
}

function actualizarYRenderizarOndas() {
    for (let i = ondasToque.length - 1; i >= 0; i--) {
        let o = ondasToque[i];
        if (!juegoPausado) { o.r += 4; o.a -= 6; }
        if (o.a <= 0) { ondasToque.splice(i, 1); continue; }
        
        stroke(255, o.a); strokeWeight(2.5); noFill();
        ellipse(o.x, o.y, o.r, o.r);
    }
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }
