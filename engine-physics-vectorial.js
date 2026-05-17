/**
 * SHADOW CAT ENGINE v2.0 - ARCHIVO 1: VECTORIAL PHYSICS & TRAJECTORIES
 * Módulo especializado en colisiones elásticas, trayectorias e impulsos dinámicos.
 */
(function(global) {
    "use strict";

    class PhysicsEngine2D {
        constructor() {
            this.gravedad = new window.HyperCatPro().radioCuerpo ? 0.25 : 0.25;
            this.friccionSuperficie = 0.99;
            this.restitucionCajas = 0.65; // Factor de rebote elástico
        }

        /**
         * Calcula la colisión entre dos cajas usando el algoritmo de Separating Axis Theorem (AABB extendido)
         */
        verificarColisionAABB(boxA, boxB) {
            return (boxA.x < boxB.x + boxB.w &&
                    boxA.x + boxA.w > boxB.x &&
                    boxA.y < boxB.y + boxB.h &&
                    boxA.y + boxA.h > boxB.y);
        }

        /**
         * Resuelve el impacto vectorial transfiriendo la energía cinética entre los proyectiles y las cajas
         */
        resolverImpacto(proyectil, caja) {
            let centroProyectilX = proyectil.x;
            let centroProyectilY = proyectil.y;
            let centroCajaX = caja.x + caja.w / 2;
            let centroCajaY = caja.y + caja.h / 2;

            let overlapX = (caja.w / 2) - Math.abs(centroProyectilX - centroCajaX);
            let overlapY = (caja.h / 2) - Math.abs(centroProyectilY - centroCajaY);

            if (overlapX > 0 && overlapY > 0) {
                // Colisión por el lado más plano (Eje con menor penetración)
                if (overlapX < overlapY) {
                    proyectil.vx = -proyectil.vx * this.restitucionCajas;
                    proyectil.x += (centroProyectilX < centroCajaX) ? -overlapX : overlapX;
                } else {
                    proyectil.vy = -proyectil.vy * this.restitucionCajas;
                    proyectil.y += (centroProyectilY < centroCajaY) ? -overlapY : overlapY;
                }
                return true;
            }
            return false;
        }

        /**
         * Dibuja una línea punteada predictiva en pantalla para apuntar con precisión matemática
         */
        trazarTrayectoriaPredictiva(ctx, origenX, origenY, vx, vy, pasos = 30) {
            ctx.save();
            ctx.strokeStyle = "rgba(0, 255, 130, 0.6)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(origenX, origenY);

            let tempX = origenX;
            let tempY = origenY;
            let tempVy = vy;

            for (let i = 0; i < pasos; i++) {
                tempX += vx;
                tempVy += this.gravedad;
                tempY += tempVy;
                ctx.lineTo(tempX, tempY);
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    global.PhysicsEngine2D = PhysicsEngine2D;
})(typeof window !== "undefined" ? window : globalThis);
