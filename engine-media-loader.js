/**
 * SHADOW CAT ENGINE - MULTIMEDIA SUBSYSTEM
 * Manejo nativo de archivos del sistema, decodificación binaria de audio y Texture Packs.
 * Optimizado para Mobile Safari (iPadOS) y renderizado adaptativo.
 */

class ShadowCatMediaCore {
    constructor() {
        this.audioCtx = null;
        this.analizador = null;
        this.bufferFuente = null;
        this.datosFrecuencia = null;
        this.cancionCargada = false;
        
        // Contenedores en memoria primaria
        this.bibliotecaAudios = {};
        this.bibliotecaTexturas = {};
        
        this.crearInterfacesSeleccionOcultas();
    }

    /**
     * Crea elementos del DOM invisibles pero funcionales para interactuar con 
     * el explorador de archivos o la fototeca del iPad de manera directa.
     */
    crearInterfacesSeleccionOcultas() {
        // Selector de canciones personalizadas
        this.inputAudio = document.createElement('input');
        this.inputAudio.type = 'file';
        this.inputAudio.accept = 'audio/*';
        this.inputAudio.style.display = 'none';
        this.inputAudio.addEventListener('change', (e) => this.procesarSubidaAudio(e));

        // Selector de texturas (PNG/JPG)
        this.inputTextura = document.createElement('input');
        this.inputTextura.type = 'file';
        this.inputTextura.accept = 'image/*';
        this.inputTextura.style.display = 'none';
        this.inputTextura.addEventListener('change', (e) => this.procesarSubidaTextura(e));

        document.body.appendChild(this.inputAudio);
        document.body.appendChild(this.inputTextura);
    }

    // --- DISPARADORES DE INTERFAZ ---
    abrirSelectorCanciones() { this.inputAudio.click(); }
    abrirSelectorTexturas(idDestino) { 
        this.texturaDestinoActual = idDestino;
        this.inputTextura.click(); 
    }

    /**
     * Captura el archivo de audio del usuario, lo transforma en un ArrayBuffer binario
     * y levanta el nodo analizador para extraer datos de ritmo matemáticos.
     */
    async procesarSubidaAudio(evento) {
        const archivo = evento.target.files[0];
        if (!archivo) return;

        console.log(`[AudioLoader] Decodificando binario de: ${archivo.name}`);
        
        // Inicializar contexto de audio respetando las restricciones de Apple
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        const lector = new FileReader();
        lector.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                // Decodificación asíncrona del archivo de audio subido
                const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                
                this.bibliotecaAudios[archivo.name] = audioBuffer;
                this.configurarNodosAnalisis(audioBuffer);
                this.cancionCargada = true;
                
                alert(`🎵 Canción "${archivo.name}" inyectada y lista para analizar ritmo.`);
            } catch (err) {
                console.error("Error al decodificar los datos de audio:", err);
                alert("No se pudo procesar este archivo de audio. Intenta con un MP3 o WAV estándar.");
            }
        };
        lector.readAsArrayBuffer(archivo);
    }

    /**
     * Configura el Transformado de Fourier Rápido (FFT) para dividir el espectro
     * de sonido en frecuencias bajas (BASS) para colisiones y mecánicas de ritmo.
     */
    configurarNodosAnalisis(audioBuffer) {
        if (this.bufferFuente) { try { this.bufferFuente.stop(); } catch(e){} }

        this.analizador = this.audioCtx.createAnalyser();
        this.analizador.fftSize = 256; // Tamaño del buffer de frecuencias (128 canales de análisis)
        const bufferLength = this.analizador.frequencyBinCount;
        this.datosFrecuencia = new Uint8Array(bufferLength);

        this.bufferFuente = this.audioCtx.createBufferSource();
        this.bufferFuente.buffer = audioBuffer;
        this.bufferFuente.loop = true;

        // Conexiones de nodos de audio
        this.bufferFuente.connect(this.analizador);
        this.analizador.connect(this.audioCtx.destination);
        
        this.bufferFuente.start(0);
        console.log("[AudioFFT] Nodo de análisis de frecuencias enlazado.");
    }

    /**
     * Extrae la potencia del ritmo actual en un rango específico de hercios.
     * Ideal para hacer que los bloques o la cámara vibren con los bajos de la canción.
     * @returns {number} Valor normalizado entre 0 y 1 de la fuerza del ritmo.
     */
    obtenerFuerzaRitmoBajo() {
        if (!this.cancionCargada || !this.analizador) return 0;
        
        this.analizador.getByteFrequencyData(this.datosFrecuencia);
        
        // Promediar los primeros 10 canales de la FFT (las frecuencias más graves)
        let sumaBajos = 0;
        for (let i = 0; i < 10; i++) {
            sumaBajos += this.datosFrecuencia[i];
        }
        return sumaBajos / 10 / 255; // Retorna un multiplicador limpio de 0.0 a 1.0
    }

    /**
     * Convierte imágenes locales del iPad en texturas utilizables de forma inmediata
     * por el motor de renderizado HTML5 Canvas mediante URLs de objetos en memoria.
     */
    procesarSubidaTextura(evento) {
        const archivo = evento.target.files[0];
        if (!archivo || !this.texturaDestinoActual) return;

        const urlTexturaLocal = URL.createObjectURL(archivo);
        const img = new Image();
        img.src = urlTexturaLocal;
        
        img.onload = () => {
            this.bibliotecaTexturas[this.texturaDestinoActual] = img;
            console.log(`🖼️ Textura cargada para la entidad: [${this.texturaDestinoActual}]`);
            alert(`Textura para "${this.texturaDestinoActual}" inyectada con éxito.`);
        };
    }

    /**
     * Devuelve la textura personalizada del usuario o cae en un callback de respaldo
     * si la entidad sigue usando los gráficos por defecto del sistema.
     */
    obtenerTexturaActiva(idEntidad, renderPorDefectoCallback) {
        if (this.bibliotecaTexturas[idEntidad]) {
            return this.bibliotecaTexturas[idEntidad];
        }
        return null; // El bucle gráfico sabrá que debe usar el dibujo vectorial por defecto
    }
}

// Inicialización global del Subsistema de Medios
const MotorMediaSelector = new ShadowCatMediaCore();

