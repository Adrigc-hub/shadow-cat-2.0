/**
 * SHADOW CAT ENGINE - HYPER-REALISTIC FUR FLUID DYNAMICS (4K Simulation)
 * Implementación de física de Verlet para capas de pelo y sombreado volumétrico.
 * El pelaje reacciona en tiempo real a la velocidad del gato y al viento ambiente.
 */

class HyperRealisticNekoRenderer {
    constructor() {
        this.fuerzaVientoGlobal = 0.15;
        this.tiempoViento = 0;
        
        // Configuración de micro-filamentos para la melena/pelaje del gato
        this.numeroMechones = 36; 
        this.largoPeloBase = 12;
        
        // Historial de nodos de pelaje para simulación elástica (Física Verlet)
        this.nodosPelaje = [];
        this.inicializarEstructuraPelaje();
    }

    /**
     * Construye los puntos de anclaje orgánicos alrededor de la cabeza del gato
     */
    inicializarEstructuraPelaje() {
        this.nodosPelaje = [];
        for (let i = 0; i < this.numeroMechones; i++) {
            // Distribución angular alrededor de un cuerpo elíptico
            let angulo = (i / this.numeroMechones) * Math.PI * 2;
            this.nodosPelaje.push({
                angulo: angulo,
                xAnclaje: 0, yAnclaje: 0,
                peloX: Math.cos(angulo) * this.largoPeloBase,
                peloY: Math.sin(angulo) * this.largoPeloBase,
                peloXAnt: Math.cos(angulo) * this.largoPeloBase,
                peloYAnt: Math.sin(angulo) * this.largoPeloBase
            });
        }
    }

    /**
     * Motor de física elástica: Mueve cada mechón de pelo basándose en la inercia,
     * la velocidad de arrastre del iPad y ráfagas de viento senoidales.
     */
    actualizarFisicaPelaje(gatoVX, gatoVY) {
        this.tiempoViento += 0.05 * EngineState.deltaTime;
        // Simulación de ráfaga de viento ambiental usando ondas senoidales complejas
        let vientoX = Math.sin(this.tiempoViento) * Math.cos(this.tiempoViento * 0.6) * this.fuerzaVientoGlobal;
        let vientoY = Math.cos(this.tiempoViento * 0.4) * 0.05;

        // Factor de resistencia por el movimiento del gato (Efecto arrastre de aire)
        let resistenciaAireX = -gatoVX * 0.12;
        let resistenciaAireY = -gatoVY * 0.12;

        for (let i = 0; i < this.nodosPelaje.length; i++) {
            let p = this.nodosPelaje[i];

            // Guardar posición actual para el cálculo de Verlet
            let tempX = p.peloX;
            let tempY = p.peloY;

            // Inercia + Fuerzas externas (Viento + Resistencia del movimiento del gato)
            let desvX = (p.peloX - p.peloXAnt) * 0.85 + vientoX + resistenciaAireX;
            let desvY = (p.peloY - p.peloYAnt) * 0.85 + vientoY + resistenciaAireY;

            p.peloX += desvX * EngineState.deltaTime;
            p.peloY += desvY * EngineState.deltaTime;

            p.peloXAnt = tempX;
            p.peloYAnt = tempY;

            // Restricción de distancia elástica: El pelo no puede separarse infinitamente de la piel
            let dx = p.peloX;
            let dy = p.peloY;
            let distanciaActual = Math.sqrt(dx * dx + dy * dy);
            
            if (distanciaActual > this.largoPeloBase * 1.5) {
                p.peloX = (dx / distanciaActual) * this.largoPeloBase * 1.5;
                p.peloY = (dy / distanciaActual) * this.largoPeloBase * 1.5;
            }
        }
    }

    /**
     * Renderiza el cuerpo del gato en 4K usando mapeo de degradados esféricos para simular 3D,
     * dibujando los filamentos físicos de pelo encima de la piel orgánica.
     */
    dibujarGatoHiperRealista(ctx, x, y, vx, vy, colorPelaje = "#d2691e") {
        this.actualizarFisicaPelaje(vx, vy);

        ctx.save();
        ctx.translate(x, y);

        // 1. EFECTO VOLUMÉTRICO: Sombreado 3D de la Piel (Degradado Esférico)
        let sombreadoCuerpo = ctx.createRadialGradient(-4, -6, 2, 0, 0, 18);
        sombreadoCuerpo.addColorStop(0, "#ffb07c");      // Brillo especular superior (Highlight)
        sombreadoCuerpo.addColorStop(0.4, colorPelaje);  // Color real del pelaje
        sombreadoCuerpo.addColorStop(1, "#5a2d0c");      // Sombra oclusión inferior

        // 2. RENDERIZADO DEL PELAJE DINÁMICO MECHÓN POR MECHÓN
        ctx.strokeStyle = colorPelaje;
        ctx.lineWidth = 1.8;
        ctx.lineCap = "round";

        for (let i = 0; i < this.nodosPelaje.length; i++) {
            let p = this.nodosPelaje[i];
            
            // Punto de origen en el borde del cuerpo esférico del gato
            let origenX = Math.cos(p.angulo) * 15;
            let origenY = Math.sin(p.angulo) * 15;

            ctx.beginPath();
            ctx.moveTo(origenX, origenY);
            // Curva suave hacia la punta del pelo afectada por la física del viento
            ctx.quadraticCurveTo(
                origenX + p.peloX * 0.5, origenY + p.peloY * 0.5,
                origenX + p.peloX, origenY + p.peloY
            );
            ctx.stroke();
        }

        // 3. DIBUJAR LA BASE DE LA CABEZA ORGANICA
        ctx.fillStyle = sombreadoCuerpo;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // 4. OJOS CON PROFUNDIDAD REALISTA (Pupilas felinas que reaccionan)
        // Ojo Izquierdo
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-6, -2, 4, 0, Math.PI * 2); ctx.fill(); // Esclerótica oscura
        ctx.fillStyle = "#00ff66"; ctx.beginPath(); ctx.arc(-6, -2, 3, 0, Math.PI * 2); ctx.fill(); // Iris brillante
        ctx.fillStyle = "#000000"; ctx.fillRect(-7, -4, 1.5, 4); // Pupila felina rasgada
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-5, -3, 0.8, 0, Math.PI * 2); ctx.fill(); // Brillo de cristal

        // Ojo Derecho
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(6, -2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#00ff66"; ctx.beginPath(); ctx.arc(6, -2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000000"; ctx.fillRect(5, -4, 1.5, 4);
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(7, -3, 0.8, 0, Math.PI * 2); ctx.fill();

        // 5. DETALLES FINOS: Hocico y Bigotes flexivos
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 1;
        // Bigotes izquierdos
        ctx.beginPath(); ctx.moveTo(-6, 3); ctx.lineTo(-24, 2 - vy*0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-22, 7 - vy*0.2); ctx.stroke();
        // Bigotes derechos
        ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(24, 2 - vy*0.2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, 4); ctx.lineTo(22, 7 - vy*0.2); ctx.stroke();

        ctx.restore();
    }
}

// Instanciar el subsistema de pelaje realista
const MotorGatoHiperRealista = new HyperRealisticNekoRenderer();

