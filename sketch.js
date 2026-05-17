// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 0;
let modoActual = "carga";
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;
let nodoMusicaMenu = null; // Control para la música espacial en bucle

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
let estrellasFondo = [], energiaMaldita = 0, puntosPartida = 0;

// Estado del Boss y Animaciones Especiales
let purpuraActivoContador = 0;
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 1.5;
let tiempoInicioPartida = 0;

// SISTEMAS DE CINEMÁTICA AVANZADA
let temporizadorBlackFlash = 0; 
let jefeMuriendoX = 0;
let jefeMuriendoY = 0;
let temporizadorCinematicaGojo = 0; 

// Estado Sukuna (Reemplazo de Sans)
let jefeSukunaHP = 100;
let cuadroSukuna = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorFaseSukuna = 0;
let turnoJugadorSukuna = false;
let listaAtaquesFase = [];

// Nueva Cinemática de la Banca
let temporizadorBancaIntro = 0;
let bancaCortada = false;

// Mecánicas Dance of Fire (REFORMADO: SIN BOTÓN FIJO EN LA PANTALLA)
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true;
let camaraScrollX = 0, camaraScrollY = 0;
let cuboFalloColorAzul = false;

// Mecánicas Shoot the Box
let listaCajasShoot = [];
let cargandoTiroShoot = false;
let inicioToqueX = 0, inicioToqueY = 0;
let arrastreX = 0, arrastreY = 0;
let duracionSlowMo = 0;
let tiempoUltimaCajaShoot = 0;

// Carga, Rayos y Construcción del Menú
let progresoCargaPorcentaje = 0;
let lineasMatematicasVisibles = [];
let temporizadorConstruccionMenu = 0; // 3 Segundos de construcción (180 cuadros)
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

// --- REPRODUCTOR DE AUDIO Y SINTETIZADOR ESPACIAL ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gestionarMusicaEstados();
    }
}

function gestionarMusicaEstados() {
    if (!audioCtx) return;

    // Si entramos al menú y no está sonando la música espacial, la encendemos
    if (modoActual === "menu" && !nodoMusicaMenu) {
        nodoMusicaMenu = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        let delayNode = audioCtx.createDelay();
        let feedback = audioCtx.createGain();

        nodoMusicaMenu.type = "sine";
        nodoMusicaMenu.frequency.setValueAtTime(146.83, audioCtx.currentTime); // Nota Re (D3) ambiente

        // Efecto Eco / Espacial
        delayNode.delayTime.value = 0.4;
        feedback.gain.value = 0.5;
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);

        nodoMusicaMenu.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Circuito de Eco espacial
        gainNode.connect(delayNode);
        delayNode.connect(feedback);
        feedback.connect(delayNode);
        delayNode.connect(audioCtx.destination);

        nodoMusicaMenu.start();

        // Modulación espacial de frecuencia (vibrato de estrellas)
        setInterval(() => {
            if(modoActual === "menu" && nodoMusicaMenu) {
                let notasEspacio = [146.83, 164.81, 196.00, 220.00];
                let proximaNota = notasEspacio[Math.floor(Math.random() * notasEspacio.length)];
                nodoMusicaMenu.frequency.exponentialRampToValueAtTime(proximaNota, audioCtx.currentTime + 1.5);
            }
        }, 2000);
    } 
    // Apagar música del menú si vamos a jugar un modo de acción rápida
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
        osc.type = "triangle"; osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    } else if (tipo === "purpura") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(95, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    } else if (tipo === "corte") {
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";

    juegoPausado = false; miniBossActivo = false; temporizadorCinematicaGojo = 0; 
    temporizadorBancaIntro = 0; bancaCortada = false;
    puntosPartida = 0; jugadorHP = 10; jefeSukunaHP = 100; turnoJugadorSukuna = false;
    camaraScrollX = 0; camaraScrollY = 0; cuboFalloColorAzul = false;

    if (destino === 'menu') {
        modoActual = "menu";
        gestionarMusicaEstados();
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else {
        modoActual = "accion";
        gestionarMusicaEstados(); // Apaga el bucle del espacio para no entorpecer los niveles
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

// --- EVENTOS DE INTERACCIÓN REFORMADOS ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || temporizadorCinematicaGojo > 0 || temporizadorBancaIntro > 0) return;

    if (modoActual === "original") {
        let toqueX = e.clientX; let toqueY = e.clientY;
        objetivosOriginales.forEach(obj => {
            if (toqueX >= obj.x && toqueX <= obj.x + 35 && toqueY >= obj.y && toqueY <= obj.y + 35) {
                misBalas.push({ x: jugadorX, y: jugadorY - 20, tx: obj.x + 15, ty: obj.y + 15, tipo: "normal" });
            }
        });
        if (miniBossActivo && toqueX >= miniBossX - 45 && toqueX <= miniBossX + 45 && toqueY >= miniBossY && toqueY <= miniBossY + 50) {
            misBalas.push({ x: jugadorX, y: jugadorY - 20, tx: miniBossX, ty: miniBossY + 25, tipo: "boss" });
        }
    }

    if (modoActual === "jefe_secreto" && turnoJugadorSukuna) {
        let bx = canvas.width / 2; let by = cuadroSukuna.y - 45;
        if (Math.abs(e.clientX - bx) < 60 && Math.abs(e.clientY - by) < 60) {
            misBalas.push({ x: jugadorX, y: jugadorY, tx: bx, ty: by, tipo: "sukuna" });
        }
    }

    // SOLUCIÓN TOTAL: Se elimina la restricción del botón. Cualquier toque en la pantalla avanza el ritmo.
    if (modoActual === "ritmo") {
        let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;
        let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
        if (proximoBloque) {
            let dist = Math.sqrt(Math.pow(centroX - proximoBloque.x, 2) + Math.pow(centroY - proximoBloque.y, 2));
            // Tolerancia de precisión para el impacto perfecto en la casilla
            if (dist <= 40) {
                indiceBloqueActual++; puntosPartida += 10; playSound("click");
                if (pivoteFuego) { fuegoX = proximoBloque.x; fuegoY = proximoBloque.y; pivoteFuego = false; }
                else { hieloX = proximoBloque.x; hieloY = proximoBloque.y; pivoteFuego = true; }
                anguloPlaneta = Math.PI; // Reset de órbita simétrica
                if (indiceBloqueActual >= bloquesRitmo.length - 1) { alert("¡Ritmo dominado por completo!"); volverAlMenuPrincipal(); }
            } else { ejecutarFalloRitmo(); }
        }
    }

    if (modoActual === "shoot") {
        if (Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2)) < 50) {
            cargandoTiroShoot = true; inicioToqueX = e.clientX; inicioToqueY = e.clientY; arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || temporizadorBancaIntro > 0) return;
    if (modoActual === "original") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
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

function ejecutarFalloRitmo() {
    cuboFalloColorAzul = true;
    setTimeout(() => { alert("¡Fallo de ritmo! Intentalo de nuevo."); volverAlMenuPrincipal(); }, 350);
}

function ejecutarImpactoEspecialFX(x, y) {
    playSound("hit");
    if (skinEquipada === "Default Cat") {
        for(let i=0; i<10; i++) particulasFX.push({ tipo: "chispa", x: x, y: y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, alpha: 1, color: "#ffcc00" });
    } else if (skinEquipada === "Gojo Satoru") {
        particulasFX.push({ tipo: "agujero_negro", x: x, y: y, radioMax: 30, radioActual: 2, expanding: true, timer: 40 });
    } else if (skinEquipada === "Yuji Itadori") {
        particulasFX.push({ tipo: "corte", x: x, y: y, longitudMax: 25, longitudActual: 0, timer: 20 });
    }
}

function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; indiceBloqueActual = 0; let cx = 150, cy = 350;
    for(let i=0; i<35; i++) { bloquesRitmo.push({ x: cx, y: cy }); cx += 110; if(i % 3 === 0) cy += (Math.random() > 0.5 ? 90 : -90); }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y; hieloX = fuegoX + 110; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

function lanzarCajaShootPro() {
    listaCajasShoot.push({ x: 40 + Math.random() * (canvas.width - 100), y: -40, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, w: 45, h: 45 });
}

// --- LOOP PRINCIPAL DE RENDER ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual === "carga") {
        ejecutarProcesamientoCargaMatricial();
        requestAnimationFrame(buclePrincipal);
        return;
    }

    // Dibujar estrellas de fondo dinámicas
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    actualizarYRenderizarParticulasEspeciales();

    if (modoActual !== "menu" && !juegoPausado) {
        if (modoActual === "original") actualizarModoOriginal();
        else if (modoActual === "jefe_secreto") actualizarModoSukuna();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) { alert(`Gato Exorcizado. Puntos: +${puntosPartida}`); volverAlMenuPrincipal(); }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo" && temporizadorCinematicaGojo === 0 && temporizadorBancaIntro === 0) {
        dibujarGatoReal(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- SISTEMA DE CARGA Y MINI ANIMACIÓN DE CONSTRUCCIÓN (NUEVO) ---
function ejecutarProcesamientoCargaMatricial() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;

    if (temporizadorConstruccionMenu === 0) {
        // Fase 1: Carga normal de porcentaje
        progresoCargaPorcentaje += 0.9;
        document.getElementById("barra-progreso-linea").style.width = `${Math.min(100, progresoCargaPorcentaje)}%`;

        if (Math.random() < 0.15) {
            let fRandom = FORMULAS_MATH_CODE[Math.floor(Math.random() * FORMULAS_MATH_CODE.length)];
            document.getElementById("texto-matematico").innerText = fRandom;
            lineasMatematicasVisibles.push({ texto: fRandom, x: Math.random() * (canvas.width - 250), y: Math.random() * canvas.height, life: 60 });
        }

        ctx.font = "11px Courier New"; ctx.fillStyle = "rgba(0, 255, 170, 0.4)";
        lineasMatematicasVisibles.forEach((lin, idx) => {
            ctx.fillText(lin.texto, lin.x, lin.y); lin.y += 0.6; lin.life--; if (lin.life <= 0) lineasMatematicasVisibles.splice(idx, 1);
        });

        if (progresoCargaPorcentaje >= 100) {
            temporizadorConstruccionMenu = 180; // Iniciamos los 3 segundos de mini animación matemática
            document.getElementById("pantalla-carga").style.display = "none"; // Ocultamos la UI HTML de carga
        }
    } else {
        // Fase 2: Mini animación matemática construyendo el menú principal con rayos verdes
        temporizadorConstruccionMenu--;

        // Generar rayos verdes aleatorios simulando escanear/construir los botones del menú
        if (temporizadorConstruccionMenu % 6 === 0) {
            playSound("rayo_verde");
            rayosConstruccion.push({
                x1: Math.random() * canvas.width, y1: 0,
                x2: cx + (Math.random() - 0.5) * 300, y2: cy + (Math.random() - 0.5) * 200,
                duracion: 8
            });
        }

        // Renderizar rayos de energía matriz
        ctx.lineWidth = 2;
        for (let i = rayosConstruccion.length - 1; i >= 0; i--) {
            let r = rayosConstruccion[i];
            ctx.strokeStyle = `rgba(0, 255, 130, ${r.duracion / 8})`;
            ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
            r.duracion--; if (r.duracion <= 0) rayosConstruccion.splice(i, 1);
        }

        // Estructuras fantasmas vectoriales del menú apareciendo
        ctx.strokeStyle = "rgba(0, 255, 130, 0.4)";
        ctx.strokeRect(cx - 140, cy - 80, 280, 50);
        ctx.strokeRect(cx - 140, cy - 10, 280, 50);
        ctx.strokeRect(cx - 140, cy + 60, 280, 50);

        ctx.fillStyle = "rgba(0, 255, 130, 0.8)";
        ctx.font = "bold 16px Courier New";
        ctx.fillText("CONSTRUYENDO MATRIZ DE INTERFAZ...", cx - 160, cy - 130);

        if (temporizadorConstruccionMenu === 1) {
            cargarProgresoGuardado();
            cambiarPantalla('menu');
        }
    }
}

function actualizarYRenderizarParticulasEspeciales() {
    for (let i = particulasFX.length - 1; i >= 0; i--) {
        let f = particulasFX[i];
        if (f.tipo === "chispa") {
            f.x += f.vx; f.y += f.vy; f.alpha -= 0.04; ctx.globalAlpha = Math.max(0, f.alpha);
            ctx.fillStyle = f.color; ctx.fillRect(f.x, f.y, 3, 3); if(f.alpha <= 0) particulasFX.splice(i, 1);
        } else if (f.tipo === "agujero_negro") {
            f.timer--; if (f.expanding) { f.radioActual += 2.5; if(f.radioActual >= f.radioMax) f.expanding = false; } else { f.radioActual -= 1.5; }
            let grad = ctx.createRadialGradient(f.x, f.y, f.radioActual*0.1, f.x, f.y, f.radioActual);
            grad.addColorStop(0, '#000000'); grad.addColorStop(0.5, '#0033aa'); grad.addColorStop(1, 'rgba(0, 210, 255, 0.0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(f.x, f.y, f.radioActual, 0, Math.PI*2); ctx.fill();
            if (f.timer <= 0 || f.radioActual <= 1) particulasFX.splice(i, 1);
        } else if (f.tipo === "corte") {
            f.timer--; f.longitudActual += 2.5; ctx.strokeStyle = "#ff1133"; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(f.x - f.longitudActual, f.y - f.longitudActual); ctx.lineTo(f.x + f.longitudActual, f.y + f.longitudActual);
            ctx.stroke(); if (f.timer <= 0) particulasFX.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

// --- MODO ORIGINAL (BLOQUES CON 1 HP + CINEMÁTICA GOJO) ---
function actualizarModoOriginal() {
    if (temporizadorCinematicaGojo > 0) {
        temporizadorCinematicaGojo--;
        ctx.fillStyle = "#010108"; ctx.fillRect(0,0,canvas.width,canvas.height);
        let cx = canvas.width / 2; let cy = canvas.height / 2;

        if (temporizadorCinematicaGojo > 240) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25 + Math.sin(temporizadorCinematicaGojo)*4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 18px sans-serif"; ctx.fillText("Gojo invoca: ¡AZUL!", cx - 60, cy + 100);
        } else if (temporizadorCinematicaGojo > 180) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#555555"; ctx.fillRect(cx + 40, cy - 40, 40, 60); 
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.fillText("Sukuna envía a Mahoraga...", cx - 90, cy + 100);
        } else if (temporizadorCinematicaGojo > 130) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(cx + 40, cy - 10, (180 - temporizadorCinematicaGojo)*2, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 20px sans-serif"; ctx.fillText("¡Gojo se teletransporta y patea!", cx - 130, cy + 100);
            if(temporizadorCinematicaGojo % 6 === 0) playSound("hit");
        } else if (temporizadorCinematicaGojo > 80) {
            ctx.fillStyle = "#ff1133"; ctx.beginPath(); ctx.arc(cx + 80, cy - 80, 20, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = "#00aaff"; ctx.fillRect(cx - 100, cy - 75, 160, 8); 
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.fillText("Rojo vs Rayo de Agua", cx - 80, cy + 100);
        } else {
            ctx.fillStyle = "rgba(163, 51, 255, 0.4)"; ctx.fillRect(0,0,canvas.width,canvas.height);
            for(let s=0; s<10; s++) { ctx.fillStyle = "white"; ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 5, 5); }
            ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(cx, cy - 50, (80 - temporizadorCinematicaGojo)*5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.font = "bold 24px Courier New"; ctx.fillText("¡IMAGINARY TECHNIQUE: PURPLE!", cx - 200, cy + 120);
            if(temporizadorCinematicaGojo === 79) playSound("purpura");
        }

        if (temporizadorCinematicaGojo === 1) iniciarPreparacionBancaSukuna();
        return;
    }

    if (temporizadorBlackFlash > 0) {
        temporizadorBlackFlash--;
        if (temporizadorBlackFlash > 130) {
            if (temporizadorBlackFlash % 4 === 0) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height); }
            else if (temporizadorBlackFlash % 4 === 2) {
                ctx.fillStyle = "#ff0022"; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.fillStyle = "#000000"; ctx.font = "bold 35px sans-serif"; ctx.fillText("BLACK FLASH!!", canvas.width/2 - 110, canvas.height/2);
            } else { ctx.fillStyle = "#000000"; ctx.fillRect(0,0,canvas.width,canvas.height); }
            if (temporizadorBlackFlash === 131) playSound("purpura");
        } else { ctx.fillStyle = "black"; ctx.fillRect(0,0,canvas.width,canvas.height); }

        if (temporizadorBlackFlash === 1) {
            if (skinEquipada === "Gojo Satoru") temporizadorCinematicaGojo = 300; 
            else iniciarPreparacionBancaSukuna();
        }
        return;
    }

    if (Math.random() < 0.015) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    if (Math.random() < 0.02) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 2.5 });

    if (Date.now() - tiempoInicioPartida > 7000 && !miniBossActivo && jefeSukunaHP === 100) {
        miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width / 2;
    }

    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 1.8; ctx.fillRect(obj.x, obj.y, 35, 35);
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    ctx.fillStyle = "#00d2ff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy; ctx.fillRect(bc.x, bc.y, 4, 14);
        if (bc.y > jugadorY - 20 && bc.y < jugadorY + 20 && bc.x > jugadorX - 25 && bc.x < jugadorX + 25) { balasCaendo.splice(idx, 1); jugadorHP--; }
        if (bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; let dx = mb.tx - mb.x; let dy = mb.ty - mb.y; let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 6) {
            mb.x += (dx / dist) * 14; mb.y += (dy / dist) * 14;
            ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            if (mb.tipo === "normal") {
                objetivosOriginales.forEach((obj, oIdx) => {
                    if (Math.abs(mb.x - (obj.x + 15)) < 30 && Math.abs(mb.y - (obj.y + 15)) < 30) {
                        ejecutarImpactoEspecialFX(obj.x + 15, obj.y + 15);
                        objetivosOriginales.splice(oIdx, 1); puntosPartida += 10; // ¡1 de HP completo!
                    }
                });
            } else if (mb.tipo === "boss" && miniBossActivo) {
                miniBossHP--;
                if (miniBossHP <= 0) { miniBossActivo = false; temporizadorBlackFlash = 160; }
            }
            misBalas.splice(i, 1);
        }
    }

    if (miniBossActivo) {
        miniBossX += miniBossVX; if(miniBossX < 40 || miniBossX > canvas.width - 40) miniBossVX *= -1;
        ctx.fillStyle = "#e60067"; ctx.fillRect(miniBossX - 45, miniBossY, 90, 50);
    }
}

function iniciarPreparacionBancaSukuna() {
    modoActual = "jefe_secreto";
    jefeSukunaHP = 100; jugadorHP = 10;
    cuadroSukuna.x = canvas.width/2 - 130; cuadroSukuna.y = canvas.height/2 - 60;
    temporizadorBancaIntro = 180; // 3 segundos exactos de animación
    bancaCortada = false; turnoJugadorSukuna = false; temporizadorFaseSukuna = 0;
}

// --- SUKUNA FIGHT SYSTEM ---
function actualizarModoSukuna() {
    if (temporizadorBancaIntro > 0) {
        temporizadorBancaIntro--;
        ctx.fillStyle = "#030207"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        let bx = canvas.width / 2; let by = canvas.height / 2 + 30;

        ctx.fillStyle = "#8b5a2b";
        if (!bancaCortada) {
            ctx.fillRect(bx - 50, by, 100, 15);
            ctx.fillRect(bx - 40, by + 15, 8, 20); ctx.fillRect(bx + 32, by + 15, 8, 20);
            dibujarGatoReal(bx, by + 3);
        } else {
            ctx.fillRect(bx - 60, by + 10, 45, 12); ctx.fillRect(bx + 15, by + 15, 45, 12); 
            dibujarGatoReal(bx, by - 60);
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 14px sans-serif"; ctx.fillText("¡ESQUIVADO!", bx - 38, by - 95);
        }

        if (temporizadorBancaIntro === 90) {
            bancaCortada = true; playSound("corte");
            particulasFX.push({ tipo: "corte", x: bx, y: by, timer: 15 });
        }

        if (temporizadorBancaIntro === 1) {
            jugadorX = canvas.width / 2; jugadorY = cuadroSukuna.y + cuadroSukuna.h / 2;
            generarAtaquesSukuna();
        }
        return;
    }

    let sx = canvas.width / 2; let sy = cuadroSukuna.y - 45;
    ctx.fillStyle = "#1e0202"; ctx.fillRect(sx - 55, sy - 25, 110, 40);
    ctx.strokeStyle = (turnoJugadorSukuna) ? "#00ff66" : "#ff1133"; ctx.strokeRect(sx - 55, sy - 25, 110, 40);
    ctx.fillStyle = "white"; ctx.font = "bold 11px sans-serif"; ctx.fillText("RYOMEN SUKUNA", sx - 45, sy - 10);
    ctx.fillStyle = "#ff3c3c"; ctx.font = "10px monospace"; ctx.fillText(`HP: ${jefeSukunaHP}`, sx - 18, sy + 10);

    if (!turnoJugadorSukuna) {
        ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.strokeRect(cuadroSukuna.x, cuadroSukuna.y, cuadroSukuna.w, cuadroSukuna.h);
    }

    temporizadorFaseSukuna++;
    if (temporizadorFaseSukuna > 300) {
        temporizadorFaseSukuna = 0; turnoJugadorSukuna = !turnoJugadorSukuna;
        if (!turnoJugadorSukuna) generarAtaquesSukuna();
    }

    if (!turnoJugadorSukuna) {
        listaAtaquesFase.forEach(atk => {
            atk.x += atk.vx; atk.y += atk.vy;
            if(atk.x < cuadroSukuna.x || atk.x > cuadroSukuna.x + cuadroSukuna.w) atk.vx *= -1;
            if(atk.y < cuadroSukuna.y || atk.y > cuadroSukuna.y + cuadroSukuna.h) atk.vy *= -1;
            ctx.fillStyle = "#ff3355"; ctx.fillRect(atk.x, atk.y, 10, 10);
            if (Math.abs(jugadorX - atk.x) < 15 && Math.abs(jugadorY - atk.y) < 15) jugadorHP--;
        });
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; let dx = mb.tx - mb.x; let dy = mb.ty - mb.y; let d = Math.sqrt(dx*dx + dy*dy);
        if (d > 5) {
            mb.x += (dx / d) * 15; mb.y += (dy / d) * 15;
            ctx.fillStyle = "#00ff66"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            jefeSukunaHP -= 5; ejecutarImpactoEspecialFX(mb.x, mb.y); misBalas.splice(i, 1);
            if (jefeSukunaHP <= 0) { alert("¡Derrotaste al Rey de las Maldiciones!"); volverAlMenuPrincipal(); }
        }
    }
}

function generarAtaquesSukuna() {
    listaAtaquesFase = [];
    for (let i = 0; i < 18; i++) {
        listaAtaquesFase.push({ x: cuadroSukuna.x + cuadroSukuna.w / 2, y: cuadroSukuna.y + cuadroSukuna.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 });
    }
}

// --- DANCE OF FIRE AND ICE ---
function actualizarModoRitmo() {
    anguloPlaneta += 0.05; let radioOrbita = 65;
    let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * radioOrbita; hieloY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * radioOrbita; fuegoY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
    if (proximoBloque) {
        let activeSphereX = pivoteFuego ? hieloX : fuegoX;
        if (activeSphereX > proximoBloque.x + 50) ejecutarFalloRitmo();
    }

    let esferaActivaX = pivoteFuego ? hieloX : fuegoX; let esferaActivaY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (esferaActivaX - camaraScrollX - canvas.width / 2) * 0.1;
    camaraScrollY += (esferaActivaY - camaraScrollY - canvas.height / 2) * 0.1;

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);
    bloquesRitmo.forEach((bl, idx) => {
        if (cuboFalloColorAzul && idx === indiceBloqueActual + 1) ctx.fillStyle = "#007bef";
        else ctx.fillStyle = (idx <= indiceBloqueActual) ? "#442266" : "#222233";
        ctx.fillRect(bl.x - 20, bl.y - 20, 40, 40);
        ctx.strokeStyle = "#555"; ctx.strokeRect(bl.x - 20, bl.y - 20, 40, 40);
    });

    ctx.fillStyle = "#ff2200"; ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 13, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(hieloX, hieloY, 13, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// --- SHOOT THE BOX ---
function actualizarModoShoot() {
    if (Date.now() - tiempoUltimaCajaShoot > 1150) { tiempoUltimaCajaShoot = Date.now(); lanzarCajaShootPro(); }

    for (let i = listaCajasShoot.length - 1; i >= 0; i--) {
        let caja = listaCajasShoot[i]; caja.x += caja.vx; caja.y += caja.vy;
        ctx.fillStyle = "#ffaa00"; ctx.fillRect(caja.x, caja.y, 45, 45);
        if (caja.y > canvas.height + 20) listaCajasShoot.splice(i, 1);
    }

    if (cargandoTiroShoot) {
        ctx.strokeStyle = "rgba(163, 51, 255, 0.6)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(jugadorX, jugadorY - 15);
        ctx.lineTo(jugadorX + (inicioToqueX - arrastreX) * 2, jugadorY - 15 + (inicioToqueY - arrastreY) * 2); ctx.stroke();
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        mb.x += mb.vx; mb.y += mb.vy;
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 7, 0, Math.PI*2); ctx.fill();
        
        listaCajasShoot.forEach((caja, cIdx) => {
            if (mb.x > caja.x && mb.x < caja.x + 45 && mb.y > caja.y && mb.y < caja.y + 45) {
                ejecutarImpactoEspecialFX(caja.x + 22, caja.y + 22);
                puntosPartida += 10; listaCajasShoot.splice(cIdx, 1); misBalas.splice(i, 1);
            }
        });
        if (mb.y < -20 || mb.x < -20 || mb.x > canvas.width + 20) misBalas.splice(i, 1);
    }
}

// --- RENDERS EXTRA ---
function dibujarGatoReal(x, y) {
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];
    ctx.fillStyle = s.aura; ctx.beginPath(); ctx.arc(x, y - 10, 42, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.principal; ctx.beginPath(); ctx.arc(x, y - 15, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.pecho; ctx.beginPath(); ctx.ellipse(x, y + 8, 10, 14, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.ojos; ctx.fillRect(x - 8, y - 19, 4, 6); ctx.fillRect(x + 4, y - 19, 4, 6);
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `
        <div class="item-habilidad" onclick="equiparSkin('${name}')">
            <div style="font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
            ${skinEquipada === name ? '<span style="color:#00ff66; font-size:11px;">EQUIPADA</span>' : '<button class="btn-comprar">USAR</button>'}
        </div>
    `).join('');
}

function equiparSkin(name) { skinEquipada = name; guardarProgresoLocal(); renderSkins(); }
window.onload = () => { redimensionar(); generarEstrellas(); buclePrincipal(); };

