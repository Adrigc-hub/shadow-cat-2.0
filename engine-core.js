/**
 * SHADOW CAT ENGINE - CORE ARCHITECTURE (Part 1 of 5)
 * Físicas Avanzadas, Sistema de Partículas Vectoriales y Mod-Loader Inyectable
 * Optimizado para pantallas táctiles de iPad y rendimiento a 60 FPS estables.
 */

// --- CONFIGURACIÓN GLOBAL Y CONTROL DE TIEMPO (DELTA TIME) ---
let engine = {
    fps: 60,
    deltaTime: 1,
    ultimoTiempo: performance.now(),
    puntosAcumulados: 150,
    modoActual: "carga",
    juegoPausado: false,
    escalaPantalla: 1,
    debugMode: false
};

// --- REGISTRO DE SISTEMAS MAESTROS ---
let SISTEMA_PARTICULAS = [];
let SISTEMA_ANIMACIONES = [];
let REGISTRO_MODS_JUGADOR = [];
let HISTORIAL_INPUTS = [];

// --- ATRIBUTOS DE FÍSICAS REPARADAS Y SUAVES (JUGADOR) ---
let jugador = {
    x: 300, y: 500, vx: 0, vy: 0,
    targetX: 300, targetY: 500,
    ancho: 40, alto: 40,
    hp: 100, maxHp: 100,
    energiaMaldita: 100, maxEnergia: 100,
    velocidadArrastre: 0.25, // Suavizado de interpolación lineal (Lerp)
    estaArrastrando: false,
    invulnerable: false,
    tiempoInvulnerable: 0,
    skinEquipada: "Default Cat"
};

// --- CONTENEDORES DE ENTIDADES ---
let entidadesNormales = [];
let proyectilesAliados = [];
let proyectilesEnemigos = [];
let objetosDrops = [];
let bloquesMapaEditor = [];

// --- CONFIGURACIÓN DE CANVAS ---
const canvas = document.getElementById("canvasJuego") || document.createElement("canvas");
if (!canvas.id) { canvas.id = "canvasJuego"; document.body.appendChild(canvas); }
const ctx = canvas.getContext("2d");

// --- SENSOR DE RENDIMIENTO Y REDIMENSIONADO INTELIGENTE (IPAD COORDENADAS) ---
function inicializarEntornoGrafico() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.escalaPantalla = window.innerWidth / 800; // Normalización de coordenadas base
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        engine.escalaPantalla = window.innerWidth / 800;
    });
}

// --- INTERPOLACIÓN MATEMÁTICA (LERP) PARA MOVIMIENTO ULTRA FLUIDO ---
function lerp(inicio, fin, velocidad) {
    return inicio + (fin - inicio) * velocidad * engine.deltaTime;
}

// --- MOTOR DE PARTÍCULAS DE ALTA DENSIDAD (EFECTOS VISUALES) ---
class ParticulaEfecto {
    constructor(x, y, color, tipo) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.tipo = tipo; // "fuego", "neon", "humo", "gema", "sangre"
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.alfa = 1.0;
        this.gravedad = tipo === "gema" ? 0.15 : -0.05;
        this.escala = Math.random() * 4 + 2;
        this.vidaMax = Math.random() * 30 + 20;
        this.vidaActual = this.vidaMax;
    }

    actualizar() {
        this.x += this.vx * engine.deltaTime;
        this.y += this.vy * engine.deltaTime;
        this.vy += this.gravedad * engine.deltaTime;
        this.vidaActual -= engine.deltaTime;
        this.alfa = Math.max(0, this.vidaActual / this.vidaMax);
    }

    dibujar() {
        ctx.save();
        ctx.globalAlpha = this.alfa;
        ctx.shadowBlur = this.tipo === "neon" ? 15 : 0;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        if (this.tipo === "gema") {
            // Dibujar rombo para gemas de energía sueltas
            ctx.moveTo(this.x, this.y - this.escala);
            ctx.lineTo(this.x + this.escala, this.y);
            ctx.lineTo(this.x, this.y + this.escala);
            ctx.lineTo(this.x - this.escala, this.y);
        } else {
            ctx.arc(this.x, this.y, this.escala, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

function emitirExplosionPartidaria(x, y, color, cantidad, tipo) {
    for (let i = 0; i < cantidad; i++) {
        SISTEMA_PARTICULAS.push(new ParticulaEfecto(x, y, color, tipo));
    }
}

// --- SISTEMA INTERACTIVO DE INYECCIÓN DE MODS DE JUGADORES ---
class ModManager {
    /**
     * Permite a los usuarios inyectar código personalizado estructurado en formato JSON o String
     * @param {string} nombreMod 
     * @param {Object} configuracionMecanicas 
     */
    static registrarMecanicaComunidad(nombreMod, configuracionMecanicas) {
        console.log(`%c Inyectando Mod de la Comunidad: [${nombreMod}] `, 'background: #00ff82; color: #000');
        
        let estructuraMod = {
            id: REGISTRO_MODS_JUGADOR.length,
            nombre: nombreMod,
            activo: true,
            onUpdate: configuracionMecanicas.onUpdate || null,
            onColision: configuracionMecanicas.onColision || null,
            onDisparo: configuracionMecanicas.onDisparo || null,
            propiedadesExtra: configuracionMecanicas.propiedades || {}
        };
        
        REGISTRO_MODS_JUGADOR.push(estructuraMod);
        emitirExplosionPartidaria(canvas.width / 2, canvas.height / 2, "#00ff82", 25, "neon");
    }

    static ejecutarGanchosDeMecanica(tipoGancho, datosContenido) {
        for (let i = 0; i < REGISTRO_MODS_JUGADOR.length; i++) {
            let mod = REGISTRO_MODS_JUGADOR[i];
            if (mod.activo && mod[tipoGancho]) {
                try {
                    mod[tipoGancho](datosContenido, jugador, engine);
                } catch (error) {
                    console.error(`Error en la ejecución del mod [${mod.nombre}]:`, error);
                }
            }
        }
    }
}

// --- BUCLE PRINCIPAL DE RENDERIZADO CON CONTROL DELTA TIME FIJO ---
function buclePrincipalMotor(tiempoActual) {
    // Cálculo preciso de Delta Time para evitar desfaces de velocidad
    let pasoTiempo = tiempoActual - engine.ultimoTiempo;
    if (pasoTiempo > 100) pasoTiempo = 16.66; // Previene saltos gigantes en caídas de rendimiento
    engine.ultimoTiempo = tiempoActual;
    engine.deltaTime = pasoTiempo / (1000 / engine.fps);

    // Limpieza de pantalla con fondo cyberpunk profundo
    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!engine.juegoPausado) {
        // 1. Actualización de Físicas del Jugador usando Suavizado por Arrastre
        if (jugador.estaArrastrando) {
            jugador.x = lerp(jugador.x, jugador.targetX, jugador.velocidadArrastre);
            jugador.y = lerp(jugador.y, jugador.targetY, jugador.velocidadArrastre);
        }

        // 2. Ejecutar ganchos de código de mods creados por la comunidad
        ModManager.ejecutarGanchosDeMecanica("onUpdate", { entidades: entidadesNormales, proyectiles: proyectilesAliados });

        // 3. Procesamiento de Partículas
        for (let i = SISTEMA_PARTICULAS.length - 1; i >= 0; i--) {
            let p = SISTEMA_PARTICULAS[i];
            p.actualizar();
            p.dibujar();
            if (p.vidaActual <= 0) SISTEMA_PARTICULAS.splice(i, 1);
        }
    }

    // Mantener ciclo infinito nativo
    requestAnimationFrame(buclePrincipalMotor);
}

// --- EJEMPLO DE INYECCIÓN DE UNA MECÁNICA CUSTOM (Cómo lo usaría un jugador) ---
// El usuario puede crear campos de gravedad, portales interdimensionales, etc.
window.onload = () => {
    inicializarEntornoGrafico();
    
    // Inyección de prueba: Mecánica de "Rastro de Fuego Neón al arrastrar"
    ModManager.registrarMecanicaComunidad("Rastro Fuego Neon", {
        onUpdate: (datos, player) => {
            if (player.estaArrastrando && Math.random() < 0.4) {
                emitirExplosionPartidaria(player.x, player.y + 15, "#ff0055", 2, "fuego");
            }
        }
    });

    requestAnimationFrame(buclePrincipalMotor);
};

