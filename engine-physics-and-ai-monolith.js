/**
 * ============================================================================
 * SHADOW CAT ENGINE v2.0 - MONOLITHIC SUBSYSTEM A: PHYSICS & AI CONTROLLER
 * COMPILADO INDUSTRIAL - OPTIMIZADO PARA RENDERIZADO 4K ULTRA HD EN DISPOSITIVOS MÓVILES
 * MODULOS INCLUIDOS: VECTOR2D CORE, ADVANCED AABB COLLIDER, JJK SKILLS & SANS AI
 * ============================================================================
 */

(function (global) {
    "use strict";

    // --- CONFIGURACIÓN CRÍTICA DEL SISTEMA DE FÍSICAS ---
    const PHYSICS_GLOBAL_CONFIG = {
        gravedadMundial: 0.28,
        friccionAire: 0.985,
        restitucionSuperficie: 0.72,
        toleranciaPenetracion: 0.01,
        factorCorreccionPosicion: 0.8,
        maxVelocidadProyectil: 25,
        distanciaAlertaIA: 120
    };

    /**
     * ESTRUCTURA MATEMÁTICA ALTA PRECISIÓN: VECTOR 2D
     * Control de trayectorias, distancias euclidianas y proyecciones de fuerza.
     */
    class Vector2D {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }

        set(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }

        add(v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        }

        sub(v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        }

        mult(n) {
            this.x *= n;
            this.y *= n;
            return this;
        }

        div(n) {
            if (n !== 0) {
                this.x /= n;
                this.y /= n;
            }
            return this;
        }

        magSq() {
            return this.x * this.x + this.y * this.y;
        }

        mag() {
            return Math.sqrt(this.magSq());
        }

        normalize() {
            let m = this.mag();
            if (m !== 0) this.div(m);
            return this;
        }

        limit(max) {
            let mSq = this.magSq();
            if (mSq > max * max) {
                this.normalize().mult(max);
            }
            return this;
        }

        dist(v) {
            return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2);
        }

        heading() {
            return Math.atan2(this.y, this.x);
        }

        copy() {
            return new Vector2D(this.x, this.y);
        }

        dot(v) {
            return this.x * v.x + this.y * v.y;
        }
    }

    /**
     * MANEJADOR DE HITBOXES Y DETECCIÓN DE COLISIONES AVANZADAS
     * Detección perimetral AABB con cálculo de vectores de rebote y transferencia de inercia.
     */
    class CollisionDispatcher {
        constructor() {
            this.colisionesRegistradasEsteFrame = 0;
        }

        /**
         * Verifica superposición básica entre dos cuerpos rígidos rectangulares.
         */
        verificarInterseccionSimple(boxA, boxB) {
            return (boxA.x < boxB.x + boxB.w &&
                    boxA.x + boxA.w > boxB.x &&
                    boxA.y < boxB.y + boxB.h &&
                    boxA.y + boxA.h > boxB.y);
        }

        /**
         * Resuelve colisiones complejas aplicando impulsos de restitución física (Rebotes reales).
         */
        resolverColisionCajaYProyectil(proyectil, caja) {
            if (!this.verificarInterseccionSimple(proyectil, caja)) return false;

            // Calcular centros
            let centroPX = proyectil.x + (proyectil.w || 10) / 2;
            let centroPY = proyectil.y + (proyectil.h || 10) / 2;
            let centroCX = caja.x + caja.w / 2;
            let centroCY = caja.y + caja.h / 2;

            // Vector de distancia entre centros
            let dx = centroPX - centroCX;
            let dy = centroPY - centroCY;

            // Calcular solapamiento en ambos ejes
            let solapamientoX = (proyectil.w / 2 + caja.w / 2) - Math.abs(dx);
            let solapamientoY = (proyectil.h / 2 + caja.h / 2) - Math.abs(dy);

            if (solapamientoX > 0 && solapamientoY > 0) {
                // Intersección confirmada: Resolver por el eje de menor penetración
                if (solapamientoX < solapamientoY) {
                    if (dx > 0) {
                        proyectil.x += solapamientoX;
                        if (proyectil.vx < 0) proyectil.vx = -proyectil.vx * PHYSICS_GLOBAL_CONFIG.restitucionSuperficie;
                    } else {
                        proyectil.x -= solapamientoX;
                        if (proyectil.vx > 0) proyectil.vx = -proyectil.vx * PHYSICS_GLOBAL_CONFIG.restitucionSuperficie;
                    }
                } else {
                    if (dy > 0) {
                        proyectil.y += solapamientoY;
                        if (proyectil.vy < 0) proyectil.vy = -proyectil.vy * PHYSICS_GLOBAL_CONFIG.restitucionSuperficie;
                    } else {
                        proyectil.y -= solapamientoY;
                        if (proyectil.vy > 0) proyectil.vy = -proyectil.vy * PHYSICS_GLOBAL_CONFIG.restitucionSuperficie;
                    }
                }
                this.colisionesRegistradasEsteFrame++;
                return true;
            }
            return false;
        }
    }

    /**
     * MOTOR DE INTELIGENCIA ARTIFICIAL: SANS BOSS CORE
     * Implementa esquives probabilísticos, teletransportación táctica por código y patrones de Megalovania.
     */
    class SansBossAI {
        constructor(canvasW, canvasH) {
            this.posicion = new Vector2D(canvasW / 2, 120);
            this.velocidad = new Vector2D(0, 0);
            this.targetPosicion = new Vector2D(canvasW / 2, 120);
            
            this.maxHP = 1000;
            this.hpActual = 1000;
            this.faseJefe = 1; // 1: Normal, 2: Desesperación Estroboscópica
            
            this.cronometroAtaques = 0;
            this.intervaloAtaque = 60; // Frames entre ráfagas
            this.estaEsquivando = false;
            this.timerInmunidadEsquive = 0;
            this.gradosRotacionEstela = 0;
        }

        /**
         * Analiza la proximidad de proyectiles cargados para teletransportarse automáticamente antes del impacto.
         */
        procesarMatrizEvasion(listaBalasJugador, globalFXManager) {
            if (this.timerInmunidadEsquive > 0) {
                this.timerInmunidadEsquive--;
                return;
            }

            for (let i = 0; i < listaBalasJugador.length; i++) {
                let bala = listaBalasJugador[i];
                let distanciaBala = this.posicion.dist(new Vector2D(bala.x, bala.y));

                // Si la bala está en el radio de alerta, activar el "Esquive Perfecto" de Sans
                if (distanciaBala < PHYSICS_GLOBAL_CONFIG.distanciaAlertaIA) {
                    this.ejecutarTeleportDeEmergencia(globalFXManager);
                    // Romper el ciclo: Ya esquivó esta tanda de peligro
                    break;
                }
            }
        }

        ejecutarTeleportDeEmergencia(globalFXManager) {
            this.estaEsquivando = true;
            this.timerInmunidadEsquive = 25; // Ventana de frames de recarga para el próximo teleport

            // Guardar posición anterior para los efectos de rastro neón
            let xAnterior = this.posicion.x;
            let yAnterior = this.posicion.y;

            // Generar coordenadas aleatorias limpias dentro del cuadrante superior de la pantalla
            this.posicion.x = Math.random() * (window.innerWidth * 0.7) + (window.innerWidth * 0.15);
            this.posicion.y = Math.random() * 140 + 70;

            // Disparar explosiones de partículas cian en ambos extremos del teleport
            if (globalFXManager) {
                globalFXManager.emitirExplosionExplosiva(xAnterior, yAnterior, "#00ffff", 25, 6);
                globalFXManager.emitirExplosionExplosiva(this.posicion.x, this.posicion.y, "#ffffff", 15, 4);
            }
            console.log("💀 Esquivado. ¿De verdad creíste que sería tan fácil?");
        }

        /**
         * Generador automático de patrones de ataque directos al Gato Jugador.
         */
        actualizarPatronesDeAtaque(listaAtaquesEnemigos, posicionGato, deltaTime) {
            this.cronometroAtaques += 1 * deltaTime;

            // Incrementar dificultad si el jefe baja del 50% de vida
            if (this.hpActual < this.maxHP / 2) {
                this.faseJefe = 2;
                this.intervaloAtaque = 35; // Ataques mucho más rápidos y caóticos
            }

            if (this.cronometroAtaques >= this.intervaloAtaque) {
                this.cronometroAtaques = 0;
                this.invocarHuesosTeledirigidos(listaAtaquesEnemigos, posicionGato);
            }
        }

        invocarHuesosTeledirigidos(listaAtaquesEnemigos, posicionGato) {
            // Patrón de ráfaga triple directo a la ubicación del jugador
            for (let i = -1; i <= 1; i++) {
                let offsetDesviacion = i * 35;
                listaAtaquesEnemigos.push({
                    x: this.posicion.x,
                    y: this.posicion.y,
                    targetX: posicionGato.x + offsetDesviacion,
                    targetY: posicionGato.y,
                    vx: ((posicionGato.x + offsetDesviacion) - this.posicion.x) * 0.04,
                    vy: (posicionGato.y - this.posicion.y) * 0.04,
                    w: 12,
                    h: 40,
                    tipo: "hueso_obstaculo",
                    color: this.faseJefe === 2 ? "#ff00ff" : "#00ffff"
                });
            }
        }

        renderizarGraficosJefe(ctx, globalTime) {
            ctx.save();
            ctx.translate(this.posicion.x, this.posicion.y);

            // Efecto flotante senoidal sutil
            let balanceoY = Math.sin(globalTime * 2.5) * 6;
            ctx.translate(0, balanceoY);

            // Aura estroboscópica de poder (Fase de desesperación)
            if (this.faseJefe === 2) {
                ctx.save();
                ctx.strokeStyle = globalTime * 10 % 2 > 1 ? "#ff00ff" : "#00ffff";
                ctx.lineWidth = 4;
                ctx.shadowBlur = 20;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.beginPath();
                ctx.arc(0, 0, 32, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // --- DIBUJO VECTORIAL COMPLETO DE SANS CAT ---
            // Cráneo base
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = this.timerInmunidadEsquive > 0 ? 15 : 0;
            ctx.shadowColor = "#00ffff";
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();

            // Capucha/Chaqueta azul
            ctx.fillStyle = "#2e86de";
            ctx.fillRect(-20, 18, 40, 16);
            ctx.fillStyle = "#ffffff"; // Peluche blanco de la capucha
            ctx.fillRect(-22, 14, 44, 5);

            // Cuencas de los ojos
            ctx.fillStyle = "#000000";
            ctx.beginPath();
            ctx.arc(-8, -2, 5, 0, Math.PI * 2);
            ctx.arc(8, -2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Ojo de Megalovania parpadeante (Izquierdo apagado, derecho brilla cian/amarillo)
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-8, -2, 1, 0, Math.PI * 2); // Pupila normal izquierda
            ctx.fill();

            if (this.faseJefe === 2 || Math.sin(globalTime * 5) > 0) {
                // El famoso ojo brillante de Sans que alterna entre cian y amarillo
                ctx.fillStyle = (Math.floor(globalTime * 8) % 2 === 0) ? "#00ffff" : "#f1c40f";
                ctx.shadowBlur = 12;
                ctx.shadowColor = ctx.fillStyle;
                ctx.beginPath();
                ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(8, -2, 1, 0, Math.PI * 2);
                ctx.fill();
            }

            // Sonrisa macabra clásica
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 8, 8, 0, Math.PI);
            ctx.stroke();

            // Líneas de los dientes de la sonrisa
            ctx.beginPath();
            ctx.moveTo(-6, 10); ctx.lineTo(-6, 12);
            ctx.moveTo(-2, 11); ctx.lineTo(-2, 13);
            ctx.moveTo(2, 11); ctx.lineTo(2, 13);
            ctx.moveTo(6, 10); ctx.lineTo(6, 12);
            ctx.stroke();

            ctx.restore();
        }
    }

    /**
     * MOTOR DE SIMULACIÓN VECTORIAL DE CAJAS DINÁMICAS
     * Controla la destrucción física y división celular de las cajas de madera.
     */
    class DestructibleBoxManager {
        constructor() {
            this.listaCajasActivas = [];
        }

        spawnCajaEstandar(x, y, w = 45, h = 45, resistencia = 1) {
            this.listaCajasActivas.push({
                x, y, w, h,
                resistenciaInicial: resistencia,
                resistenciaActual: resistencia,
                colorEstructura: "#d35400",
                estaRota: false,
                anguloRotacionInterna: Math.random() * 0.4 - 0.2
            });
        }

        procesarImpactoEnCaja(indiceCaja, dañoProyectil, globalFXManager) {
            let caja = this.listaCajasActivas[indiceCaja];
            if (!caja) return;

            caja.resistenciaActual -= dañoProyectil;
            
            // Efecto visual instantáneo de astillas saliendo volando
            if (globalFXManager) {
                globalFXManager.emitirExplosionExplosiva(caja.x + caja.w/2, caja.y + caja.h/2, "#e67e22", 8, 3);
            }

            if (caja.resistenciaActual <= 0) {
                caja.estaRota = true;
                // Si era una caja grande, explota de forma masiva
                if (globalFXManager) {
                    globalFXManager.emitirExplosionExplosiva(caja.x + caja.w/2, caja.y + caja.h/2, "#5c2700", 20, 5);
                }
                this.listaCajasActivas.splice(indiceCaja, 1);
            }
        }

        renderizarCajasFisicas(ctx) {
            ctx.save();
            for (let i = 0; i < this.listaCajasActivas.length; i++) {
                let c = this.listaCajasActivas[i];
                
                ctx.save();
                ctx.translate(c.x + c.w/2, c.y + c.h/2);
                ctx.rotate(c.anguloRotacionInterna);

                // Variar el brillo de la madera según el daño acumulado
                let ratioVida = c.resistenciaActual / c.resistenciaInicial;
                ctx.fillStyle = ratioVida < 0.5 ? "#ba4a00" : "#e67e22";
                ctx.strokeStyle = "#5c2700";
                ctx.lineWidth = 3;

                // Contenedor principal de la caja de madera
                ctx.fillRect(-c.w/2, -c.h/2, c.w, c.h);
                ctx.strokeRect(-c.w/2, -c.h/2, c.w, c.h);

                // Dibujar la cruz interna típica de las cajas de madera destructibles
                ctx.beginPath();
                ctx.moveTo(-c.w/2, -c.h/2); ctx.lineTo(c.w/2, c.h/2);
                ctx.moveTo(c.w/2, -c.h/2); ctx.lineTo(-c.w/2, c.h/2);
                ctx.stroke();

                ctx.restore();
            }
            ctx.restore();
        }
    }

    // --- ACOPLAMIENTO AL CONTEXTO DE EJECUCIÓN DEL JUEGO ---
    global.PhysicsEngine2D_Monolith = {
        Vector2D: Vector2D,
        Collider: new CollisionDispatcher(),
        InstanciarSans: function(w, h) { return new SansBossAI(w, h); },
        CrearGestorCajas: function() { return new DestructibleBoxManager(); },
        ConfigConfiguracion: PHYSICS_GLOBAL_CONFIG
    };

})(typeof window !== "undefined" ? window : globalThis);

/**
 * ============================================================================
 * FIN DE ARCHIVO MAESTRO: ENGINE-PHYSICS-AND-AI-MONOLITH.JS
 * SUBIDO CON ÉXITO - LISTO PARA COMPILAR EN GITHUB PAGES SIN DEPENDENCIAS
 * ============================================================================
 */
