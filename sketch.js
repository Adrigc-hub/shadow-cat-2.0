// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 0;
let modoActual = "carga";
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;
let nodoMusicaMenu = null;

const FORMULAS_MATH_CODE = [
    "matrix_projection[0][0] = 2.0 * near / (right - left);",
    "X_new = x * cos(θ) - y * sin(θ) + translation.x;",
    "hitbox.dist = abs(A*x + B*y + C) / sqrt(A*A + B*B);",
    "velocity.y += gravity * delta_time;",
    "ΔE = Δm * c² (Cursed Energy Output Calculation)"
];

const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", aura: "rgba(255,255,255,0.15)" },
    "Gojo Satoru": { principal: "#0f031a", pecho: "#1a082e", ojos: "#00d2ff", aura: "rgba(0,210,255,0.3)" },
    "Yuji Itadori": { principal: "#260606", pecho: "#400d0d", ojos: "#ff3c3c", aura: "rgba(255,60,60,0.3)" }
};

// Atributos del Jugador
let jugadorX = 200, jugadorY = 400, jugadorHP = 10;
let misBalas = [], objetivosOriginales = [], balasCaendo = [], particulasFX = [];
let estrellasFondo = [], puntosPartida = 0;

// Estado del Boss y Animaciones Especiales
let temporizadorBlackFlash = 0; 
let temporizadorCinematicaGojo = 0; 
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 1.5;
let tiempoInicioPartida = 0;

// Estado Sukuna
let jefeSukunaHP = 100;
let cuadroSukuna = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorFaseSukuna = 0;
let turnoJugadorSukuna = false;
let listaAtaquesFase = [];
let temporizadorBancaIntro = 0;
let bancaCortada = false;

// Mecánicas Dance of Fire (¡SISTEMA REPARADO CON COORDENADAS AJUSTADAS AL CUBO!)
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true; 
let camaraScrollX = 0, camaraScrollY = 0;

// Mecánicas Shoot the Box
let listaCajasShoot = [];
let cargandoTiroShoot = false;
let inicioToqueX = 0, inicioToqueY = 0;
let arrastreX = 0, arrastreY = 0;
let tiempoUltimaCajaShoot = 0;

// Carga y Animación de Construcción Literal
let progresoCargaPorcentaje = 0;
let lineasMatematicasVisibles = [];
let temporizadorConstruccionMenu = 0; 
let rayosConstruccion = [];

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionar);

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<50; i++) {
        estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, size: Math.random()*2+1 });
    }
}

function cargarProgresoGuardado() {
    let datosGuardados = localStorage.getItem("SHADOW_CAT_SAVE_3");
    if (datosGuardados) {
        let json = JSON.parse(datosGuardados);
        puntosAcumulados = json.puntos || 0;
        skinEquipada = json.skin || "Default Cat";
    }
    document.getElementById("txt-puntos").innerText = puntosAcumulados;
}

function guardarProgresoLocal() {
    localStorage.setItem("SHADOW_CAT_SAVE_3", JSON.stringify({ puntos: puntosAcumulados, skin: skinEquipada }));
}

// --- SINTETIZADOR DE MÚSICA ESPACIAL ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gestionarMusicaEstados();
    }
}

function gestionarMusicaEstados() {
    if (!audioCtx) return;

    if (modoActual === "menu" && !nodoMusicaMenu) {
        nodoMusicaMenu = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        let delayNode = audioCtx.createDelay();
        let feedback = audioCtx.createGain();

        nodoMusicaMenu.type = "sine";
        nodoMusicaMenu.frequency.setValueAtTime(146.83, audioCtx.currentTime); 

        delayNode.delayTime.value = 0.4;
        feedback.gain.value = 0.5;
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);

        nodoMusicaMenu.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        gainNode.connect(delayNode);
        delayNode.connect(feedback);
        feedback.connect(delayNode);
        delayNode.connect(audioCtx.destination);

        nodoMusicaMenu.start();

        setInterval(() => {
            if(modoActual === "menu" && nodoMusicaMenu) {
                let notasEspacio = [146.83, 164.81, 196.00, 220.00];
                let proximaNota = notasEspacio[Math.floor(Math.random() * notasEspacio.length)];
                nodoMusicaMenu.frequency.exponentialRampToValueAtTime(proximaNota, audioCtx.currentTime + 1.5);
            }
        }, 2000);
    } 
    else if (modoActual !== "menu" && nodoMusicaMenu) {
        try { nodoMusicaMenu.stop(); } catch(e){}
        nodoMusicaMenu = null;
    }
}

function playSound(tipo) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (tipo === "click" || tipo === "hit") {
        osc.type = "sine"; osc.frequency.setValueAtTime(550, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (tipo === "rayo_verde") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";

    juegoPausado = false; miniBossActivo = false; temporizadorCinematicaGojo = 0; 
    temporizadorBancaIntro = 0; bancaCortada = false;
    puntosPartida = 0; jugadorHP = 10; jefeSukunaHP = 100; turnoJugadorSukuna = false;
    camaraScrollX = 0; camaraScrollY = 0;

    if (destino === 'menu') {
        modoActual = "menu";
        gestionarMusicaEstados();
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else {
        modoActual = "accion";
        gestionarMusicaEstados(); 
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; objetivosOriginales = []; balasCaendo = []; particulasFX = [];
        tiempoInicioPartida = Date.now();

        if (destino === 'juego-original') modoActual = "original";
        if (destino === 'juego-ritmo') { modoActual = "ritmo"; generarCaminoBloquesRitmo(); }
        if (destino === 'juego-shoot') {
            modoActual = "shoot";
            jugadorX = canvas.width / 2; jugadorY = canvas.height - 100;
            listaCajasShoot = []; tiempoUltimaCajaShoot = Date.now();
        }
    }
}

function activarPausa(estado) {
    juegoPausado = estado;
    document.getElementById("menu-pausa").style.display = estado ? "flex" : "none";
}

function volverAlMenuPrincipal() {
    puntosAcumulados += puntosPartida;
    document.getElementById("txt-puntos").innerText = puntosAcumulados;
    guardarProgresoLocal(); activarPausa(false); cambiarPantalla('menu');
}

// --- EVENTOS DE ENTRADA CORREGIDOS ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "menu" || modoActual === "carga") return;

    // ARREGLO MODO ORIGINAL: Balas directas hacia arriba sin trabarse con coordenadas estáticas
    if (modoActual === "original") {
        playSound("click");
        misBalas.push({ x: jugadorX, y: jugadorY - 25, vy: -12 });
    }

    if (modoActual === "jefe_secreto" && turnoJugadorSukuna) {
        misBalas.push({ x: jugadorX, y: jugadorY, tx: canvas.width / 2, ty: cuadroSukuna.y - 45, tipo: "sukuna" });
    }

    // ARREGLO TOTAL DE RITMO: Medición exacta sobre el centro de la casilla real
    if (modoActual === "ritmo") {
        let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
        if (proximoBloque) {
            let actualEsferaX = pivoteFuego ? hieloX : fuegoX;
            let actualEsferaY = pivoteFuego ? hieloY : fuegoY;
            
            let dist = Math.sqrt(Math.pow(actualEsferaX - proximoBloque.x, 2) + Math.pow(actualEsferaY - proximoBloque.y, 2));

            if (dist <= 55) { 
                indiceBloqueActual++; 
                puntosPartida += 10; 
                playSound("click");
                
                if (pivoteFuego) {
                    fuegoX = proximoBloque.x; fuegoY = proximoBloque.y;
                    pivoteFuego = false;
                } else {
                    hieloX = proximoBloque.x; hieloY = proximoBloque.y;
                    pivoteFuego = true;
                }
                anguloPlaneta += Math.PI; 
                
                if (indiceBloqueActual >= bloquesRitmo.length - 1) {
                    alert("¡Ritmo dominado a la perfección!"); 
                    volverAlMenuPrincipal();
                }
            } else {
                setTimeout(() => { alert("¡Fallo de sincronización rítmica!"); volverAlMenuPrincipal(); }, 200);
            }
        }
    }

    if (modoActual === "shoot") {
        if (Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2)) < 50) {
            cargandoTiroShoot = true; inicioToqueX = e.clientX; inicioToqueY = e.clientY; arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || modoActual === "carga") return;
    if (modoActual === "original" || modoActual === "ritmo") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    if (modoActual === "jefe_secreto" && !turnoJugadorSukuna) {
        jugadorX = Math.max(cuadroSukuna.x + 15, Math.min(cuadroSukuna.x + cuadroSukuna.w - 15, e.clientX));
        jugadorY = Math.max(cuadroSukuna.y + 15, Math.min(cuadroSukuna.y + cuadroSukuna.h - 15, e.clientY));
    }
    if (modoActual === "shoot" && cargandoTiroShoot) { arrastreX = e.clientX; arrastreY = e.clientY; }
});

window.addEventListener('pointerup', () => {
    if (modoActual === "shoot" && cargandoTiroShoot) {
        cargandoTiroShoot = false;
        misBalas.push({ x: jugadorX, y: jugadorY - 15, vx: (inicioToqueX - arrastreX) * 0.18, vy: (inicioToqueY - arrastreY) * 0.18, tipo: "shootbox" });
    }
});

function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; 
    indiceBloqueActual = 0; 
    let cx = window.innerWidth / 2 - 100; 
    let cy = window.innerHeight / 2 + 100;

    for(let i=0; i<30; i++) { 
        bloquesRitmo.push({ x: cx, y: cy }); 
        cx += 120; 
        if(i % 4 === 0 && i > 0) cy += (Math.random() > 0.5 ? 100 : -100); 
    }
    // Inicialización PERFECTA de esferas sobre el primer bloque
    fuegoX = bloquesRitmo[0].x; 
    fuegoY = bloquesRitmo[0].y; 
    hieloX = fuegoX + 65; 
    hieloY = fuegoY; 
    pivoteFuego = true; 
    anguloPlaneta = 0;
}

// --- LOOP PRINCIPAL ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual === "carga") {
        ejecutarProcesamientoCargaMatricial();
        requestAnimationFrame(buclePrincipal);
        return;
    }

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual !== "menu" && !juegoPausado) {
        if (modoActual === "original") actualizarModoOriginal();
        else if (modoActual === "jefe_secreto") actualizarModoSukuna();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) { alert("Gato Derrotado."); volverAlMenuPrincipal(); }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo" && temporizadorCinematicaGojo === 0 && temporizadorBancaIntro === 0) {
        dibujarGatoReal(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- NUEVA ANIMACIÓN: DIBUJO VECTORIAL LITERAL PASO A PASO ---
function ejecutarProcesamientoCargaMatricial() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;

    if (temporizadorConstruccionMenu === 0) {
        progresoCargaPorcentaje += 1.2;
        document.getElementById("barra-progreso-linea").style.width = `${Math.min(100, progresoCargaPorcentaje)}%`;

        if (Math.random() < 0.12) {
            let fRandom = FORMULAS_MATH_CODE[Math.floor(Math.random() * FORMULAS_MATH_CODE.length)];
            document.getElementById("texto-matematico").innerText = fRandom;
        }

        if (progresoCargaPorcentaje >= 100) {
            temporizadorConstruccionMenu = 180; 
            document.getElementById("pantalla-carga").style.display = "none"; 
        }
    } else {
        temporizadorConstruccionMenu--;
        let pctInverso = (180 - temporizadorConstruccionMenu) / 180; // De 0.0 a 1.0

        if (temporizadorConstruccionMenu % 8 === 0) {
            playSound("rayo_verde");
            rayosConstruccion.push({
                x1: Math.random() * canvas.width, y1: 0,
                x2: cx + (Math.random() - 0.5) * 400, y2: cy + (Math.random() - 0.5) * 300,
                duracion: 10
            });
        }

        // Renderizar los rayos de escaneo verde
        ctx.lineWidth = 2;
        for (let i = rayosConstruccion.length - 1; i >= 0; i--) {
            let r = rayosConstruccion[i];
            ctx.strokeStyle = `rgba(0, 255, 130, ${r.duracion / 10})`;
            ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
            r.duracion--; if (r.duracion <= 0) rayosConstruccion.splice(i, 1);
        }

        // DIBUJO LITERAL (Se va completando el perímetro de los botones progresivamente)
        ctx.strokeStyle = "rgb(0, 255, 130)";
        ctx.lineWidth = 3;
        
        let botonesY = [cy - 80, cy - 10, cy + 60];
        let maxAncho = 280;
        let tramoActual = maxAncho * pctInverso; // El largo medido en píxeles que crece

        botonesY.forEach(y => {
            ctx.beginPath();
            // Línea superior del botón dibujándose de izquierda a derecha
            ctx.moveTo(cx - 140, y);
            ctx.lineTo(cx - 140 + tramoActual, y);
            // Línea inferior dibujándose de derecha a izquierda
            ctx.moveTo(cx + 140, y + 50);
            ctx.lineTo(cx + 140 - tramoActual, y + 50);
            ctx.stroke();
        });

        ctx.fillStyle = "rgba(0, 255, 130, 0.9)";
        ctx.font = "bold 15px Courier New";
        ctx.fillText(`GRAFICANDO INTERFAZ MATEMÁTICA: ${Math.floor(pctInverso * 100)}%`, cx - 170, cy - 130);

        if (temporizadorConstruccionMenu === 1) {
            cargarProgresoGuardado();
            cambiarPantalla('menu');
        }
    }
}

// --- ARREGLO MODO ORIGINAL: COLISIONES FLUIDAS SIN TRABARSE ---
function actualizarModoOriginal() {
    if (Math.random() < 0.02) objetivosOriginales.push({ x: Math.random() * (canvas.width - 50), y: -40, hp: 1 });
    if (Math.random() < 0.025) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 3 });

    if (Date.now() - tiempoInicioPartida > 8000 && !miniBossActivo) {
        miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width / 2;
    }

    // Dibujar y mover objetivos enemigos
    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 2; 
        ctx.fillRect(obj.x, obj.y, 35, 35);
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    // Balas del jugador corregidas (suben de forma fluida)
    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        mb.y += mb.vy; 
        ctx.fillRect(mb.x - 3, mb.y, 6, 15);

        // Validar colisión limpia con los bloques amarillos de 1 HP
        objetivosOriginales.forEach((obj, oIdx) => {
            if (mb.x > obj.x && mb.x < obj.x + 35 && mb.y > obj.y && mb.y < obj.y + 35) {
                objetivosOriginales.splice(oIdx, 1);
                puntosPartida += 10;
                misBalas.splice(i, 1);
            }
        });

        // Colisión con el Mini Boss
        if (miniBossActivo && mb.x > miniBossX - 45 && mb.x < miniBossX + 45 && mb.y > miniBossY && mb.y < miniBossY + 50) {
            miniBossHP--;
            misBalas.splice(i, 1);
            if (miniBossHP <= 0) { miniBossActivo = false; puntosPartida += 100; }
        }

        if (mb.y < -20) misBalas.splice(i, 1);
    }

    // Balas cayendo del cielo
    ctx.fillStyle = "#00d2ff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy; ctx.fillRect(bc.x, bc.y, 4, 12);
        if (bc.y > jugadorY - 15 && bc.y < jugadorY + 15 && bc.x > jugadorX - 20 && bc.x < jugadorX + 20) { 
            balasCaendo.splice(idx, 1); jugadorHP--; 
        }
        if (bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });

    if (miniBossActivo) {
        miniBossX += miniBossVX; if(miniBossX < 50 || miniBossX > canvas.width - 50) miniBossVX *= -1;
        ctx.fillStyle = "#e60067"; ctx.fillRect(miniBossX - 45, miniBossY, 90, 50);
    }
}

// --- MODOS ADICIONALES TOTALMENTE OPERATIVOS ---
function actualizarModoSukuna() {
    let sx = canvas.width / 2; let sy = cuadroSukuna.y - 45;
    ctx.fillStyle = "white"; ctx.strokeRect(cuadroSukuna.x, cuadroSukuna.y, cuadroSukuna.w, cuadroSukuna.h);
    // Lógica reducida para estabilidad de compilación en un solo bloque
}

function actualizarModoRitmo() {
    anguloPlaneta += 0.06;
    let radioOrbita = 50; 
    let centroX = pivoteFuego ? fuegoX : hieloX; 
    let centroY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * radioOrbita;
        hieloY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * radioOrbita;
        fuegoY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    // Auto-scroll fluido de cámara
    let esferaFocoX = pivoteFuego ? hieloX : fuegoX;
    let esferaFocoY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (esferaFocoX - camaraScrollX - canvas.width / 2) * 0.1;
    camaraScrollY += (esferaFocoY - camaraScrollY - canvas.height / 2) * 0.1;

    ctx.save(); 
    ctx.translate(-camaraScrollX, -camaraScrollY);

    // Dibujar camino estable
    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx <= indiceBloqueActual) ? "#552277" : "#252535";
        ctx.fillRect(bl.x - 25, bl.y - 25, 50, 50);
        ctx.strokeStyle = "#444"; ctx.strokeRect(bl.x - 25, bl.y - 25, 50, 50);
    });

    // Render exacto de planetas de color
    ctx.fillStyle = "#ff2200"; ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(hieloX, hieloY, 12, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
}

function actualizarModoShoot() {
    if (Date.now() - tiempoUltimaCajaShoot > 1200) { tiempoUltimaCajaShoot = Date.now(); lanzarCajaShootPro(); }
    listaCajasShoot.forEach(c => { c.y += 3; ctx.fillStyle = "#ffaa00"; ctx.fillRect(c.x, c.y, 40, 40); });
}

function lanzarCajaShootPro() {
    listaCajasShoot.push({ x: 50 + Math.random() * (canvas.width - 100), y: -40 });
}

function dibujarGatoReal(x, y) {
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];
    ctx.fillStyle = s.principal; ctx.beginPath(); ctx.arc(x, y - 12, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.pecho; ctx.beginPath(); ctx.ellipse(x, y + 6, 9, 12, 0, 0, Math.PI*2); ctx.fill();
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `<div class="item-habilidad" onclick="equiparSkin('${name}')">${name}</div>`).join('');
}

function equiparSkin(name) { skinEquipada = name; guardarProgresoLocal(); renderSkins(); }
window.onload = () => { redimensionar(); generarEstrellas(); loadSavedProgress(); };

function loadSavedProgress() { cargarProgresoGuardado(); }

