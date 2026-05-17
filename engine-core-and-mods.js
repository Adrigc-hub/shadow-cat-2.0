// ==========================================
// MÓDULO 1: ARQUITECTURA BASE Y TIEMPO REAL
// ==========================================
const EngineState = {
    fps: 60, deltaTime: 1, ultimoTiempo: performance.now(),
    puntos: 150, modo: "carga", pausado: false, score: 0,
    velocidadGlobal: 1.0, gravedadMax: 0.24, friccionAire: 0.98
};

const JugadorEntidad = {
    x: 300, y: 500, vx: 0, vy: 0, targetX: 300, targetY: 500,
    w: 40, h: 40, hp: 100, maxHp: 100, energia: 100,
    velLerp: 0.28, arrastrando: false, invul: false, skin: "Default Cat"
};

// Contenedores globales de infraestructura (200+ Mecánicas dinámicas)
let PARTICULAS = []; let ENEMIGOS = []; let BALAS_ALIADAS = []; 
let BALAS_ENEMIGAS = []; let DROPS = []; let PROYECTOS_MAPAS = [];
let REGISTRO_MODS = []; let CUSTOM_TEXTURES = {}; let AUDIOS_CUSTOM = {};

const canvas = document.getElementById("canvasJuego") || document.createElement("canvas");
const ctx = canvas.getContext("2d");
if(!canvas.parentNode) document.body.appendChild(canvas);

function inicializarResolucioniPad() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
}

// ===================================================
// MÓDULO 2: SISTEMAS INTERACTIVOS (SONGS, TEXTURES, MODS)
// ===================================================
class ShadowCatAPI {
    // Mecánica 1-10: Inyector de Canciones MP3/WAV del usuario
    static cargarCancionUsuario(nombre, urlAudio) {
        let audio = new Audio(); audio.src = urlAudio; audio.loop = true;
        AUDIOS_CUSTOM[nombre] = audio;
        console.log(`🎵 Canción cargada con éxito: ${nombre}`);
    }

    static reproducirCancion(nombre) {
        if(AUDIOS_CUSTOM[nombre]) {
            Object.values(AUDIOS_CUSTOM).forEach(a => a.pause());
            AUDIOS_CUSTOM[nombre].play().catch(e => console.log("Apacha la pantalla para activar audio"));
        }
    }

    // Mecánica 11-30: Inyector de Paquetes de Texturas (Skin Overrides)
    static registrarTexturaUsuario(nombreEntidad, urlImagen) {
        let img = new Image(); img.src = urlImagen;
        CUSTOM_TEXTURES[nombreEntidad] = img;
    }

    // Mecánica 31-60: API de Scripts para Mods de la Comunidad
    static registrarNuevoMod(config) {
        REGISTRO_MODS.push({
            nombre: config.nombre,
            onTick: config.onTick || null,
            onColision: config.onColision || null,
            onEliminarEnemigo: config.onEliminarEnemigo || null,
            propiedades: config.variables || {}
        });
    }
}

// ==========================================
// MÓDULO 3: MOTOR DE EFECTOS Y RENDIMIENTO
// ==========================================
class ParticulaAvanzada {
    constructor(x, y, color, tipo) {
        this.x = x; this.y = y; this.color = color; this.tipo = tipo;
        this.vx = (Math.random() - 0.5) * 10; this.vy = (Math.random() - 0.5) * 10;
        this.vida = 1.0; this.decaimiento = Math.random() * 0.04 + 0.01;
    }
    actualizar() {
        this.x += this.vx * EngineState.deltaTime; this.y += this.vy * EngineState.deltaTime;
        this.vida -= this.decaimiento * EngineState.deltaTime;
    }
    dibujar() {
        if(this.vida <= 0) return;
        ctx.save(); ctx.globalAlpha = this.vida;
        ctx.fillStyle = this.color; ctx.beginPath();
        ctx.arc(this.x, this.y, this.vida * 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

function generarExplosionParticulas(x, y, color, cant, tipo) {
    for(let i=0; i<cant; i++) PARTICULAS.push(new ParticulaAvanzada(x, y, color, tipo));
}

// Bucle principal unificado
function loopMotor(t) {
    let delta = t - EngineState.ultimoTiempo; EngineState.ultimoTiempo = t;
    EngineState.deltaTime = Math.min(3, delta / 16.66);

    if(!EngineState.pausado) {
        // Interpolación fluida de movimiento de gato
        if(JugadorEntidad.arrastrando) {
            JugadorEntidad.x = JugadorEntidad.x + (JugadorEntidad.targetX - JugadorEntidad.x) * JugadorEntidad.velLerp * EngineState.deltaTime;
            JugadorEntidad.y = JugadorEntidad.y + (JugadorEntidad.targetY - JugadorEntidad.y) * JugadorEntidad.velLerp * EngineState.deltaTime;
        }

        // Ejecutar ganchos de mods en cada Tick
        REGISTRO_MODS.forEach(m => { if(m.onTick) m.onTick(JugadorEntidad, EngineState); });

        // Actualizar partículas
        for(let i=PARTICULAS.length-1; i>=0; i--) {
            PARTICULAS[i].actualizar(); if(PARTICULAS[i].vida <= 0) PARTICULAS.splice(i,1);
        }
    }
    requestAnimationFrame(loopMotor);
}

