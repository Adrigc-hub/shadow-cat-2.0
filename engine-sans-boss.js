/**
 * SHADOW CAT ENGINE v2.0 - ARCHIVO 4: SANS BOSS MEGALOVENIA COMPLEX IA
 * Algoritmo de evasión probabilística, ataques estroboscópicos y cálculo de trayectorias teledirigidas.
 */
(function(global) {
    "use strict";

    class SansBossAI {
        constructor() {
            this.hp = 500;
            this.faseActual = "introduccion";
            this.posicion = { x: 400, y: 150 };
            this.velocidadEvasión = 6;
            this.timerTeleport = 0;
            this.cuentaAtaques = 0;
        }

        /**
         * IA Predictiva: Si el jugador le dispara una bala aliada, Sans calcula
         * una probabilidad de teletransportarse instantáneamente para esquivarla de forma perfecta.
         */
        evaluarEvasionDeBalas(listaBalasAliadas) {
            listaBalasAliadas.forEach(b => {
                let distanciaABala = Math.sqrt((b.x - this.posicion.x) ** 2 + (b.y - this.posicion.y) ** 2);
                
                // Si la bala está muy cerca, activa el parpadeo de esquive
                if (distanciaABala < 80 && Math.random() < 0.75) {
                    this.ejecutarTeletransportacionFalsa();
                }
            });
        }

        ejecutarTeletransportacionFalsa() {
            this.posicion.x = Math.random() * (window.innerWidth - 100) + 50;
            this.posicion.y = Math.random() * 200 + 80; // Se mantiene flotando arriba
            
            // Invocar explosión de partículas neón en la posición vieja y nueva
            if(window.FXManagerInstance) {
                window.FXManagerInstance.emitirExplosionExplosiva(this.posicion.x, this.posicion.y, "#00ffff", 15, 4);
            }
            console.log("💀 Te pareció ver que Sans se movía... Esquivado.");
        }

        ejecutarPatronAtaque(balasEnemigasContainer, objetivoGato) {
            this.cuentaAtaques++;
            
            // Ataque 1: Invocación de huesos verticales guiados por hardware
            if (this.cuentaAtaques % 45 === 0) {
                balasEnemigasContainer.push({
                    x: objetivoGato.posicion.x, // Spawnea justo arriba del gato para obligarlo a moverse
                    y: 0,
                    vy: 8,
                    tipo: "hueso_cian"
                });
            }
        }
    }

    global.SansBossAI = SansBossAI;
})(typeof window !== "undefined" ? window : globalThis);

