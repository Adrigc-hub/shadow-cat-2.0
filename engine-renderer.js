/**
 * SHADOW CAT ENGINE - ADVANCED GRAPHICS & ANIMATION SYSTEM
 * Multi-capas de renderizado, interpolación de animaciones para Sprites y simulación de Bloom/Neón.
 * Diseñado para mitigar la fatiga gráfica en pantallas Retina de iPad.
 */

class ShadowCatRenderer {
    constructor(canvasEfecto, contextoEfecto) {
        this.canvas = canvasEfecto;
        this.ctx = contextoEfecto;
        
        // Configuración de visualización de alto rendimiento
        this.ajustarResolucionHD();
        
        // Registro de animaciones activas
        this.animacionesGato = {
            "idle": { frames: 4, velocidad: 0.1, actual: 0 },
            "run": { frames: 6, velocidad: 0.2, actual: 0 },
            "hit": { frames: 3, velocidad: 0.25, actual: 0 }
        };
        this.estadoAnimacionActual = "idle";
        this.tickAnimacion = 0;
        
        // Cola de efectos visuales activos (Mecánicas de partículas e iluminación)
        this.lucesNeon = [];
    }

    /**
     * Fuerza al canvas a renderizar usando el doble de píxeles físicos (Backing Store),
     * emulando un escalado nítido de alta densidad (Ultra HD/Retina) sin trabar la GPU del iPad.
     */
    ajustarResolucionHD() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Suavizado de imágenes desactivado para dar un look Pixel-Art limpio si se desea,
        // o activado para degradados de luces fluidos.
        this.ctx.imageSmoothingEnabled = true;
    }

    /**
     * Registra un punto de iluminación neón en el mapa (Mecánica de decoración reactiva)
     */
    añadirLuzAmbiente(x, y, radio, color, intensidad) {
        this.lucesNeon.push({ x, y, radio, color, intensidad, vida: 1.0 });
    }

    /**
     * Dibuja los efectos de iluminación sobre el mapa aplicando composición de pixeles (Blend Modes)
     */
    renderizarCapaIluminacion(scrollX, scrollY) {
        this.ctx.save();
        // Cambiar el modo de fusión para que los colores se sumen y brillen como pantallas de neón
        this.ctx.globalCompositeOperation = "screen";
        
        for (let i = this.lucesNeon.length - 1; i >= 0; i--) {
            let luz = this.lucesNeon[i];
            
            let gradiente = this.ctx.createRadialGradient(
                luz.x - scrollX, luz.y - scrollY, 0,
                luz.x - scrollX, luz.y - scrollY, luz.radio
            );
            
            // Reacción al pulso del audio integrado
            let pulsoBajo = typeof MotorMediaSelector !== 'undefined' ? MotorMediaSelector.obtenerFuerzaRitmoBajo() : 0;
            let radioDinamico = luz.radio * (1.0 + pulsoBajo * 0.3);

            gradiente.addColorStop(0, luz.color);
            gradiente.addColorStop(0.3, luz.color);
            gradiente.addColorStop(1, "rgba(0,0,0,0)");
            
            this.ctx.fillStyle = gradiente;
            this.ctx.beginPath();
            this.ctx.arc(luz.x - scrollX, luz.y - scrollY, radioDinamico, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Degradación del efecto con el tiempo si es temporal
            luz.vida -= 0.01 * EngineState.deltaTime;
            if (luz.vida <= 0) this.lucesNeon.splice(i, 1);
        }
        this.ctx.restore();
    }

    /**
     * Controla el ciclo de fotogramas del personaje para que la animación no vaya
     * ni muy rápido ni muy lento, sin importar los bajones de FPS.
     */
    actualizarFotogramaPersonaje(estado) {
        if (this.estadoAnimacionActual !== estado) {
            this.estadoAnimacionActual = estado;
            this.animacionesGato[estado].actual = 0;
        }

        let anim = this.animacionesGato[this.estadoAnimacionActual];
        this.tickAnimacion += anim.velocidad * EngineState.deltaTime;
        
        if (this.tickAnimacion >= 1) {
            this.tickAnimacion = 0;
            anim.actual = (anim.actual + 1) % anim.frames;
        }
    }

    /**
     * Dibuja el avatar del gato aplicando interpolaciones y rotaciones suaves basadas en vectores físicos.
     */
    dibujarGatoAvanzado(x, y, vx, skinName, texturaCustom) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Mecánica de rotación por inercia: El gato se inclina ligeramente hacia donde se mueve
        let anguloInclinacion = Math.min(Math.max(vx * 0.03, -0.3), 0.3);
        this.ctx.rotate(anguloInclinacion);

        // Si el usuario inyectó una textura desde su galería del iPad, la usamos de inmediato
        if (texturaCustom) {
            // Renderizado de textura con soporte de escalado simétrico
            this.ctx.drawImage(texturaCustom, -20, -20, 40, 40);
        } else {
            // Renderizado geométrico por capas vectoriales de alta fidelidad (Gojo / Itadori / Default)
            let datosEstetica = { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00" };
            
            if (skinName === "Gojo Satoru") datosEstetica = { principal: "#ffffff", pecho: "#121214", ojos: "#00d2ff" };
            if (skinName === "Yuji Itadori") datosEstetica = { principal: "#ff9494", pecho: "#260606", ojos: "#000000" };

            // Sombra base suave
            this.ctx.fillStyle = "rgba(0,0,0,0.3)";
            this.ctx.fillRect(-15, 22, 30, 6);

            // Cuerpo/Cabeza principal
            this.ctx.fillStyle = datosEstetica.principal;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 16, 0, Math.PI * 2);
            this.ctx.fill();

            // Orejas vectoriales
            this.ctx.beginPath();
            this.ctx.moveTo(-14, -10); this.ctx.lineTo(-18, -24); this.ctx.lineTo(-4, -14);
            this.ctx.moveTo(14, -10); this.ctx.lineTo(18, -24); this.ctx.lineTo(4, -14);
            this.ctx.fill();

            // Pecho/Traje
            this.ctx.fillStyle = datosEstetica.pecho;
            this.ctx.fillRect(-7, 6, 14, 12);

            // Ojos Brillantes con brillo simulado
            this.ctx.fillStyle = datosEstetica.ojos;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = datosEstetica.ojos;
            this.ctx.fillRect(-6, -3, 4, 5);
            this.ctx.fillRect(2, -3, 4, 5);
        }

        this.ctx.restore();
    }
}

// Inicialización global del pipeline gráfico
const MotorRenderCore = new ShadowCatRenderer(canvas, ctx);
