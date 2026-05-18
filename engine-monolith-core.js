/**
 * ============================================================================
 * SHADOW CAT ENGINE v2.02 - MASTER UNIFIED ARC ARCHITECTURE
 * UNIFICACIÓN DE ESTADO, MENÚS, RITMO, FÍSICAS Y SANBOX MODS
 * CORRIGE ERRORES DE VARIABLES INDEFINIDAS AL CARGAR EN GITHUB PAGES
 * ============================================================================
 */

(function (global) {
    "use strict";

    // ==========================================
    // 1. CONTROL DE ESTADO GLOBAL (SINGLETON)
    // ==========================================
    const ENGINE_STATE = {
        modoActual: "MENU", // MENU, MODO_NORMAL, DANCE_OF_FIRE, SHOOT_THE_BOX, CONSTRUCCION
        running: true,
        score: 0,
        globalTime: 0,
        deltaTime: 1,
        lastFrameTime: performance.now(),
        scrollX: 0,
        scrollY: 0,
        energyActive: 100,
        skinsDisponibles: ["Default", "Gojo Satoru", "Yuji Itadori", "Sukuna"],
        skinEquipada: "Default"
    };

    // ==========================================
    // 2. VECTOR GRÁFICO ELÁSTICO & FÍSICAS COHERENTES
    // ==========================================
    class EngineVector2D {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        set(x, y) { this.x = x; this.y = y; return this; }
        add(v) { this.x += v.x; this.y += v.y; return this; }
        sub(v) { this.x -= v.x; this.y -= v.y; return this; }
        mult(n) { this.x *= n; this.y *= n; return this; }
        div(n) { if (n !== 0) { this.x /= n; this.y /= n; } return this; }
        mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        normalize() { let m = this.mag(); if (m !== 0) this.div(m); return this; }
        dist(v) { return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2); }
        copy() { return new EngineVector2D(this.x, this.y); }
    }

    // ==========================================
    // 3. ENTORNO SEGURO PARA MODS DE LA COMUNIDAD
    // ==========================================
    class SecureModSandbox {
        constructor() {
            this.registry = new Map();
        }
        registrarMod(id, config) {
            this.registry.set(id, {
                nombre: config.nombre || "Mod Anónimo",
                onTick: config.onTick || null,
                onScore: config.onScore || null,
                memoria: config.memoriaInicial || {}
            });
            console.log(`%c 🐈 Mod Registrado con éxito: ${config.nombre}`, "color: #00ffcc; font-weight: bold;");
        }
        ejecutarGancho(nombreGancho, arg1, arg2) {
            this.registry.forEach((mod) => {
                if (mod[nombreGancho]) {
                    try {
                        mod[nombreGancho](arg1, arg2, mod.memoria);
                    } catch (e) {
                        console.error(`[Mod Error - ${mod.nombre}]:`, e);
                    }
                }
            });
        }
    }

    // ==========================================
    // 4. ENTIDADES DEL ENTORNO DE JUEGO (JUGADOR & SANS)
    // ==========================================
    class HyperRealisticNeko {
        constructor(x, y) {
            this.posicion = new EngineVector2D(x, y);
            this.velocidad = new EngineVector2D(0, 0);
            this.target = new EngineVector2D(x, y);
            this.radio = 24;
            this.anclajesPelo = [];
            this.generarFilamentosPelaje();
        }

        generarFilamentosPelaje() {
            this.anclajesPelo = [];
            for (let i = 0; i < 36; i++) {
                let ang = (i / 36) * Math.PI * 2;
                this.anclajesPelo.push({
                    angulo: ang,
                    x: Math.cos(ang) * 12,
                    y: Math.sin(ang) * 12,
                    px: Math.cos(ang) * 12,
                    py: Math.sin(ang) * 12
                });
            }
        }

        actualizarMecánicas(deltaTime) {
            let prevX = this.posicion.x;
            let prevY = this.posicion.y;

            // Interpolación elástica suave al arrastrar en la pantalla del iPad
            this.posicion.x += (this.target.x - this.posicion.x) * 0.22 * deltaTime;
            this.posicion.y += (this.target.y - this.posicion.y) * 0.22 * deltaTime;

            this.velocidad.set(this.posicion.x - prevX, this.posicion.y - prevY);

            // Simulación física de Verlet sobre los filamentos de pelaje (Viento reactivo)
            let fxViento = -this.velocidad.x * 0.2 + Math.sin(ENGINE_STATE.globalTime * 3) * 0.15;
            let fyViento = -this.velocidad.y * 0.2 + Math.cos(ENGINE_STATE.globalTime * 2) * 0.05;

            for (let i = 0; i < this.anclajesPelo.length; i++) {
                let p = this.anclajesPelo[i];
                let tx = p.x;
                let ty = p.y;

                p.x += (p.x - p.px) * 0.8 + fxViento * deltaTime;
                p.y += (p.y - p.py) * 0.8 + fyViento * deltaTime;

                p.px = tx;
                p.py = ty;

                let d = Math.sqrt(p.x * p.x + p.y * p.y);
                if (d > 18) {
                    p.x = (p.x / d) * 18;
                    p.y = (p.y / d) * 18;
                }
            }
        }

        renderizarGato(ctx) {
            ctx.save();
            ctx.translate(this.posicion.x, this.posicion.y);
            ctx.rotate(Math.min(Math.max(this.velocidad.x * 0.03, -0.2), 0.2));

            // Render del pelo Verlet
            ctx.strokeStyle = ENGINE_STATE.skinEquipada === "Gojo Satoru" ? "#ffffff" : "#d35400";
            ctx.lineWidth = 2;
            for (let i = 0; i < this.anclajesPelo.length; i++) {
                let p = this.anclajesPelo[i];
                ctx.beginPath();
                ctx.moveTo(Math.cos(p.angulo) * this.radio * 0.6, Math.sin(p.angulo) * this.radio * 0.6);
                ctx.quadraticCurveTo(p.x * 1.1, p.y * 1.1, p.x * 1.4, p.y * 1.4);
                ctx.stroke();
            }

            // Cuerpo esférico 3D simulado
            let grad = ctx.createRadialGradient(-4, -5, 2, 0, 0, this.radio);
            if (ENGINE_STATE.skinEquipada === "Gojo Satoru") {
                grad.addColorStop(0, "#57606f"); grad.addColorStop(1, "#1e272e");
            } else {
                grad.addColorStop(0, "#ffb142"); grad.addColorStop(1, "#cc8e35");
            }
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(0, 0, this.radio, 0, Math.PI * 2); ctx.fill();

            // Ojos de Hechicero destellantes
            ctx.fillStyle = ENGINE_STATE.skinEquipada === "Gojo Satoru" ? "#00ffff" : "#00ff66";
            ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
            ctx.fillRect(-8, -4, 4, 6); ctx.fillRect(4, -4, 4, 6);
            ctx.restore();
        }
    }

    class SansMegalovaniaBoss {
        constructor(w) {
            this.pos = new EngineVector2D(w / 2, 100);
            this.hp = 1000;
            this.timerAtaque = 0;
            this.ojoColor = "#00ffff";
        }
        actualizarAtaques(balasArray, targetGato, deltaTime) {
            this.timerAtaque += 1 * deltaTime;
            if (this.timerAtaque >= 50) {
                this.timerAtaque = 0;
                // Mecánica de esparcimiento de proyectiles guiados hacia el gato
                balasArray.push({
                    x: this.pos.x,
                    y: this.pos.y,
                    vx: (targetGato.posicion.x - this.pos.x) * 0.03,
                    vy: 6,
                    w: 14,
                    h: 14,
                    color: this.ojoColor
                });
            }
        }
        renderizarJefe(ctx) {
            ctx.save();
            ctx.translate(this.pos.x, this.pos.y + Math.sin(ENGINE_STATE.globalTime * 4) * 5);
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#000000";
            ctx.beginPath(); ctx.arc(-6, -2, 4, 0, Math.PI * 2); ctx.arc(6, -2, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = this.ojoColor; ctx.shadowBlur = 8; ctx.shadowColor = this.ojoColor;
            ctx.beginPath(); ctx.arc(6, -2, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    // ==========================================
    // 5. MOTOR CORE PIPELINE UNIFICADO
    // ==========================================
    class ShadowCatEngineMonolith {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.gato = null;
            this.sans = null;
            this.sandbox = new SecureModSandbox();
            
            this.balasEnemigas = [];
            this.cajasDestructibles = [];
            this.orbesRitmo = { angulo: 0, activo: true };
        }

        inicializarSistemaTotal(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.warn(`[Engine] Alerta: No se detectó un canvas con ID '${canvasId}'. Intentando auto-creación.`);
                this.canvas = document.createElement("canvas");
                this.canvas.id = canvasId;
                document.body.appendChild(this.canvas);
            }
            this.ctx = this.canvas.getContext("2d");
            
            // Forzar resolución nítida adaptable
            this.ajustarResolucionPantalla();
            window.addEventListener("resize", () => this.ajustarResolucionPantalla());

            // Crear entidades
            this.gato = new HyperRealisticNeko(window.innerWidth / 2, window.innerHeight * 0.7);
            this.sans = new SansMegalovaniaBoss(window.innerWidth);

            // Ligar los eventos del puntero para control táctil nativo del iPad
            this.configurarControladoresDeEntrada();

            // Iniciar bucle maestro
            this.maestroLoop();
        }

        ajustarResolucionPantalla() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        configurarControladoresDeEntrada() {
            const actualizarPuntero = (e) => {
                let clientX = e.touches ? e.touches[0].clientX : e.clientX;
                let clientY = e.touches ? e.touches[0].clientY : e.clientY;
                if (this.gato) {
                    this.gato.target.set(clientX, clientY);
                }
            };
            window.addEventListener("mousemove", actualizarPuntero);
            window.addEventListener("touchmove", actualizarPuntero, { passive: true });

            // Detectar los clics de tu menú de interfaces HTML existente
            window.addEventListener("click", (e) => {
                if (ENGINE_STATE.modoActual === "DANCE_OF_FIRE") {
                    this.orbesRitmo.activo = !this.orbesRitmo.activo;
                    this.orbesRitmo.angulo += Math.PI; // Inversión angular exacta estilo Dance of Fire and Ice
                }
            });
        }

        cambiarModoDeSubJuego(nuevoModo) {
            ENGINE_STATE.modoActual = nuevoModo;
            this.balasEnemigas = [];
            this.cajasDestructibles = [];
            
            if (nuevoModo === "SHOOT_THE_BOX") {
                // Generar grilla de cajas iniciales limpia para destruir
                for(let i = 0; i < 5; i++) {
                    this.cajasDestructibles.push({ x: 100 + i * 60, y: 200, w: 40, h: 40 });
                }
            }
            console.log(`[Engine] Transición completada con éxito al modo: ${nuevoModo}`);
        }

        maestroLoop() {
            let ahora = performance.now();
            ENGINE_STATE.deltaTime = (ahora - ENGINE_STATE.lastFrameTime) / 16.666;
            ENGINE_STATE.lastFrameTime = ahora;
            ENGINE_STATE.globalTime += 0.016 * ENGINE_STATE.deltaTime;

            if (ENGINE_STATE.running) {
                this.ctx.fillStyle = "#030307"; // Borrado nítido de pantalla espacial
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

                // Despachar ganchos de código del Sandbox para tus mods personalizados V2.02
                this.sandbox.ejecutarGancho("onTick", this.gato, ENGINE_STATE.deltaTime);

                // --- GESTIÓN INTERNA DE SUB-JUEGOS ---
                switch (ENGINE_STATE.modoActual) {
                    case "MENU":
                        // Si estás en el menú, el motor renderiza un protector de pantalla sutil de fondo
                        this.ctx.fillStyle = "rgba(255,255,255,0.1)";
                        this.ctx.font = "20px monospace";
                        this.ctx.fillText("SHADOW CAT CORE RENDERER ACTIVO", window.innerWidth/2 - 160, 40);
                        break;

                    case "MODO_NORMAL":
                        // Simulación de evasión de balas tipo Sans Boss
                        if (this.sans && this.gato) {
                            this.sans.actualizarAtaques(this.balasEnemigas, this.gato, ENGINE_STATE.deltaTime);
                            this.sans.renderizarJefe(this.ctx);
                            
                            this.gato.actualizarMecánicas(ENGINE_STATE.deltaTime);
                            this.gato.renderizarGato(this.ctx);
                        }
                        this.procesarYRenderizarProyectilesEnemigos();
                        break;

                    case "DANCE_OF_FIRE":
                        // Lógica rítmica circular de dos cuerpos
                        if (this.gato) {
                            this.orbesRitmo.angulo += 0.06 * ENGINE_STATE.deltaTime;
                            let cx = window.innerWidth / 2;
                            let cy = window.innerHeight / 2;

                            let fx = cx + Math.cos(this.orbesRitmo.angulo) * 60;
                            let fy = cy + Math.sin(this.orbesRitmo.angulo) * 60;

                            this.ctx.fillStyle = "#ff3838"; // Orbe de Fuego
                            this.ctx.beginPath(); this.ctx.arc(cx, cy, 12, 0, Math.PI * 2); this.ctx.fill();
                            
                            this.ctx.fillStyle = "#00d2ff"; // Orbe de Hielo
                            this.ctx.beginPath(); this.ctx.arc(fx, fy, 12, 0, Math.PI * 2); this.ctx.fill();
                        }
                        break;

                    case "SHOOT_THE_BOX":
                        // Modo colisiones destructivas vectoriales
                        if (this.gato) {
                            this.gato.actualizarMecánicas(ENGINE_STATE.deltaTime);
                            this.gato.renderizarGato(this.ctx);
                        }
                        this.renderizarCajasDestructibles();
                        break;
                }
            }

            requestAnimationFrame(() => this.maestroLoop());
        }

        procesarYRenderizarProyectilesEnemigos() {
            for (let i = this.balasEnemigas.length - 1; i >= 0; i--) {
                let b = this.balasEnemigas[i];
                b.x += b.vx * ENGINE_STATE.deltaTime;
                b.y += b.vy * ENGINE_STATE.deltaTime;

                this.ctx.fillStyle = b.color || "#ff0055";
                this.ctx.fillRect(b.x, b.y, b.w, b.h);

                // Detección perimetral básica AABB con el gato
                if (this.gato && 
                    b.x < this.gato.posicion.x + this.gato.radio &&
                    b.x + b.w > this.gato.posicion.x - this.gato.radio &&
                    b.y < this.gato.posicion.y + this.gato.radio &&
                    b.y + b.h > this.gato.posicion.y - this.gato.radio) {
                    
                    console.log("💥 Impacto detectado en el felino.");
                    this.balasEnemigas.splice(i, 1);
                    ENGINE_STATE.energyActive = Math.max(0, ENGINE_STATE.energyActive - 10);
                }

                // Limpieza de memoria fuera de pantalla
                if (b.y > window.innerHeight || b.x < 0 || b.x > window.innerWidth) {
                    this.balasEnemigas.splice(i, 1);
                }
            }
        }

        renderizarCajasDestructibles() {
            this.ctx.strokeStyle = "#e67e22";
            this.ctx.lineWidth = 3;
            for (let i = 0; i < this.cajasDestructibles.length; i++) {
                let c = this.cajasDestructibles[i];
                this.ctx.strokeRect(c.x, c.y, c.w, c.h);
            }
        }
    }

    // Exportación única y limpia
    global.MasterShadowCatEngine = new ShadowCatEngineMonolith();
    global.ENGINE_GLOBAL_STATE = ENGINE_STATE;

})(typeof window !== "undefined" ? window : globalThis);
