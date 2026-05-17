/**
 * SHADOW CAT ENGINE v2.0 - ARCHIVO 3: DANCE OF FIRE AND ICE ACCURATE RHYTHM CORE
 * Sincronización estricta por milisegundos, interpolación angular y modificadores de velocidad.
 */
(function(global) {
    "use strict";

    class RhythmCoreEngine {
        constructor() {
            this.anguloRotacion = 0;
            this.velocidadGiroBase = 0.06; // Radianes por frame base
            this.modificadorActual = 1.0;  // Multiplicador de velocidad (Mecánica 151+)
            this.pivoteFuegoActivo = true; // Control de cuál orbe orbita a cuál
            
            this.fuego = { x: 200, y: 300 };
            this.hielo = { x: 250, y: 300 };
            this.radioOrbita = 50;
        }

        /**
         * Aplica los modificadores físicos de las casillas especiales Leopardo/Caracol
         */
        procesarCasillaModificadora(tipoCasilla) {
            if (tipoCasilla === "leopardo") {
                this.modificadorActual = 1.8; // 🐆 Impulso súper veloz
                console.log("[Ritmo] ¡Aceleración de Leopardo Activa! 🐆");
            } else if (tipoCasilla === "caracol") {
                this.modificadorActual = 0.55; // 🐌 Ralentización táctica
                console.log("[Ritmo] ¡Frenado de Caracol Activo! 🐌");
            } else {
                this.modificadorActual = 1.0;  // Velocidad normal de la pista
            }
        }

        actualizarGiroOrbital(deltaTime) {
            // Rotación matemática de precisión angular considerando el Delta Time dinámico
            this.anguloRotacion += this.velocidadGiroBase * this.modificadorActual * deltaTime;

            // Determinar centro de masa según el planeta anclado a la casilla
            let cx = this.pivoteFuegoActivo ? this.fuego.x : this.hielo.x;
            let cy = this.pivoteFuegoActivo ? this.fuego.y : this.hielo.y;

            if (this.pivoteFuegoActivo) {
                // El hielo orbita de forma vectorial alrededor del fuego
                this.hielo.x = cx + Math.cos(this.anguloRotacion) * this.radioOrbita;
                this.hielo.y = cy + Math.sin(this.anguloRotacion) * this.radioOrbita;
            } else {
                // El fuego orbita alrededor del hielo
                this.fuego.x = cx + Math.cos(this.anguloRotacion) * this.radioOrbita;
                this.fuego.y = cy + Math.sin(this.anguloRotacion) * this.radioOrbita;
            }
        }

        intercambiarPivoteDeToque() {
            this.pivoteFuegoActivo = !this.pivoteFuegoActivo;
            // Al cambiar el eje, el ángulo se desfasa 180° (Math.PI) para mantener la inercia lineal
            this.anguloRotacion += Math.PI;
        }
    }

    global.RhythmCoreEngine = RhythmCoreEngine;
})(typeof window !== "undefined" ? window : globalThis);

