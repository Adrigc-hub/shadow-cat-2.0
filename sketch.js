// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 0;
let modoActual = "carga";
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;

const FORMULAS_MATH_CODE = [
    "matrix_projection[0][0] = 2.0 * near / (right - left);",
    "X_new = x * cos(θ) - y * sin(θ) + translation.x;",
    "hitbox.dist = abs(A*x + B*y + C) / sqrt(A*A + B*B);",
    "velocity.y += gravity * delta_time;"
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
let temporizadorCinematicaGojo = 0; // Control de la batalla Gojo vs Sukuna

// Estado Sukuna (Reemplazo de Sans)
let jefeSukunaHP = 100;
let cuadroSukuna = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorFaseSukuna = 0;
let turnoJugadorSukuna = false;
let listaAtaquesFase = [];
let textoRefusedContador = 0;

// Nueva Cinemática de la Banca
let temporizadorBancaIntro = 0;
let bancaCortada = false;

// Mecánicas Dance of Fire
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
let factorMultiplicador = 1;
let tiempoUltimaCajaShoot = 0;

// Carga y Rayo
let progresoCargaPorcentaje = 0;
let lineasMatematicasVisibles = [];
let radioLaserDeCarga = 0;
let laserDisparadoMatematico = false;

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionar);

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<40; i++) {
        estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight });
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

// --- REPRODUCTOR DE AUDIO ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        reproducirMusicaFondo();
    }
}

function reproducirMusicaFondo() {
    if (!audioCtx) return;
    setInterval(() => {
        if (modoActual !== "menu" && modoActual !== "carga" && !juegoPausado) {
            let notas = [110, 130, 146, 165, 196];
            let nota = notas[Math.floor(Math.random() * notas.length)];
            let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = "sawtooth"; osc.frequency.setValueAtTime(nota, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        }
    }, 450);
}

function playSound(tipo) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (tipo === "click" || tipo === "hit") {
        osc.type = "sine"; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (tipo === "black_flash" || tipo === "purpura") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(90, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
        osc.start(); osc.stop(audioCtx.currentTime + 0.7);
    } else if (tipo === "corte") {
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start(); osc.stop(audioCtx.currentTime + 0.12);
    }
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("btn-purpura").style.display = "none";

    juegoPausado = false; miniBossActivo = false; textoRefusedContador = 0; temporizadorBlackFlash = 0;
    temporizadorCinematicaGojo = 0; temporizadorBancaIntro = 0; bancaCortada = false;
    energiaMaldita = 0; puntosPartida = 0; jugadorHP = 10; purpuraActivoContador = 0;
    jefeSukunaHP = 100; turnoJugadorSukuna = false;
    camaraScrollX = 0; camaraScrollY = 0; cuboFalloColorAzul = false;

    if (destino === 'menu') {
        modoActual = "menu";
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else {
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

// --- EVENTOS DE JUEGO ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || textoRefusedContador > 0 || temporizadorBlackFlash > 0 || temporizadorCinematicaGojo > 0 || temporizadorBancaIntro > 0) return;

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
        if (Math.abs(e.clientX - bx) < 50 && Math.abs(e.clientY - by) < 50) {
            misBalas.push({ x: jugadorX, y: jugadorY, tx: bx, ty: by, tipo: "sukuna" });
        }
    }

    if (modoActual === "ritmo") {
        let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;
        let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
        if (proximoBloque) {
            let dist = Math.sqrt(Math.pow(centroX - proximoBloque.x, 2) + Math.pow(centroY - proximoBloque.y, 2));
            if (dist <= 35) {
                indiceBloqueActual++; puntosPartida += 10; playSound("click");
                if (pivoteFuego) { fuegoX = proximoBloque.x; fuegoY = proximoBloque.y; pivoteFuego = false; }
                else { hieloX = proximoBloque.x; hieloY = proximoBloque.y; pivoteFuego = true; }
                anguloPlaneta = Math.PI;
                if (indiceBloqueActual >= bloquesRitmo.length - 1) { alert("¡Ritmo dominado!"); volverAlMenuPrincipal(); }
            } else { ejecutarFalloRitmo(); }
        }
    }

    if (modoActual === "shoot") {
        if (Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2)) < 40) {
            cargandoTiroShoot = true; inicioToqueX = e.clientX; inicioToqueY = e.clientY; arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || temporizadorBlackFlash > 0 || temporizadorCinematicaGojo > 0 || temporizadorBancaIntro > 0) return;
    if (modoActual === "original") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    if (modoActual === "jefe_secreto" && !turnoJugadorSukuna) {
        // Moverse únicamente adentro de la caja de pelea de Sukuna
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
    setTimeout(() => { alert("¡Fallo de ritmo catastrófico!"); volverAlMenuPrincipal(); }, 400);
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
    bloquesRitmo = []; indiceBloqueActual = 0; let cx = 150, cy = 300;
    for(let i=0; i<30; i++) { bloquesRitmo.push({ x: cx, y: cy }); cx += 100; if(i % 3 === 0) cy += (Math.random() > 0.5 ? 80 : -80); }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y; hieloX = fuegoX + 100; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

function lanzarCajaShootPro() {
    listaCajasShoot.push({ x: 40 + Math.random() * (canvas.width - 100), y: -40, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3, w: 45, h: 45, tipo: "normal" });
}

// --- LOOP DE RENDER ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual === "carga") {
        ejecutarProcesamientoCargaMatricial();
        requestAnimationFrame(buclePrincipal);
        return;
    }

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, 2, 2); });

    actualizarYRenderizarParticulasEspeciales();

    if (modoActual !== "menu" && !juegoPausado) {
        if (modoActual === "original") actualizarModoOriginal();
        else if (modoActual === "jefe_secreto") actualizarModoSukuna();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) { alert(`Gato Exorcizado. Puntos: +${puntosPartida}`); volverAlMenuPrincipal(); }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo" && temporizadorBlackFlash === 0 && temporizadorCinematicaGojo === 0 && temporizadorBancaIntro === 0) {
        dibujarGatoReal(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

function ejecutarProcesamientoCargaMatricial() {
    if (!laserDisparadoMatematico) {
        progresoCargaPorcentaje += 0.8;
        document.getElementById("barra-progreso-linea").style.width = `${Math.min(100, progresoCargaPorcentaje)}%`;
    }
    if (Math.random() < 0.15 && !laserDisparadoMatematico) {
        let fRandom = FORMULAS_MATH_CODE[Math.floor(Math.random() * FORMULAS_MATH_CODE.length)];
        document.getElementById("texto-matematico").innerText = fRandom;
        lineasMatematicasVisibles.push({ texto: fRandom, x: Math.random() * (canvas.width - 200), y: Math.random() * canvas.height, life: 60 });
    }
    ctx.font = "11px Courier New"; ctx.fillStyle = "rgba(0, 255, 170, 0.4)";
    lineasMatematicasVisibles.forEach((lin, idx) => {
        ctx.fillText(lin.texto, lin.x, lin.y); lin.y += 0.5; lin.life--; if (lin.life <= 0) lineasMatematicasVisibles.splice(idx, 1);
    });
    let cx = canvas.width / 2; let cy = canvas.height / 2 - 80;
    if (laserDisparadoMatematico) {
        radioLaserDeCarga += 15; ctx.fillStyle = "white"; ctx.fillRect(0, cy - 5, canvas.width, 10);
        ctx.fillStyle = "rgba(163, 51, 255, 0.3)"; ctx.beginPath(); ctx.arc(cx, cy, radioLaserDeCarga, 0, Math.PI*2); ctx.fill();
        if (radioLaserDeCarga > canvas.width * 0.9) { document.getElementById("pantalla-carga").style.display = "none"; cargarProgresoGuardado(); cambiarPantalla('menu'); }
    }
    if (progresoCargaPorcentaje >= 100 && !laserDisparadoMatematico) { laserDisparadoMatematico = true; radioLaserDeCarga = 1; }
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
            ctx.moveTo(f.x + f.longitudActual, f.y - f.longitudActual); ctx.lineTo(f.x - f.longitudActual, f.y + f.longitudActual); ctx.stroke();
            if (f.timer <= 0) particulasFX.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

// --- MODO ARENA MODIFICADO (1 HP BLOQUES + CINEMÁTICA GOJO EXTENDIDA) ---
function actualizarModoOriginal() {
    // ENTRADA EN ESCENA: SÚPER ANIMACIÓN DE GOJO VS SUKUNA
    if (temporizadorCinematicaGojo > 0) {
        temporizadorCinematicaGojo--;
        ctx.fillStyle = "#010108"; ctx.fillRect(0,0,canvas.width,canvas.height);

        let cx = canvas.width / 2; let cy = canvas.height / 2;

        // Cuadro 1: Gojo lanza un Azul al cielo
        if (temporizadorCinematicaGojo > 240) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25 + Math.sin(temporizadorCinematicaGojo)*4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "white"; ctx.font = "bold 18px sans-serif"; ctx.fillText("Gojo invoca: ¡AZUL!", cx - 60, cy + 100);
        }
        // Cuadro 2: Sukuna manda a Mahoraga a romper el azul
        else if (temporizadorCinematicaGojo > 180) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#555555"; ctx.fillRect(cx + 40, cy - 40, 40, 60); // Silueta Mahoraga
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.fillText("Sukuna invoca la espada de Mahoraga...", cx - 120, cy + 100);
        }
        // Cuadro 3: Gojo se teletransporta en frente y le mete una patada destructiva
        else if (temporizadorCinematicaGojo > 130) {
            ctx.fillStyle = "#0055ff"; ctx.beginPath(); ctx.arc(cx - 80, cy - 100, 25, 0, Math.PI*2); ctx.fill();
            // Onda expansiva cíclica de la patada
            ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(cx + 30, cy - 20, (180 - temporizadorCinematicaGojo)*2, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 22px sans-serif"; ctx.fillText("¡CRITICAL HIT! Patada Expandida", cx - 110, cy + 100);
            if(temporizadorCinematicaGojo % 5 === 0) playSound("hit");
        }
        // Cuadro 4: Gojo lanza un Rojo, Sukuna tira Rayo de Agua
        else if (temporizadorCinematicaGojo > 80) {
            ctx.fillStyle = "#ff1133"; ctx.beginPath(); ctx.arc(cx + 80, cy - 80, 20, 0, Math.PI*2); ctx.fill(); // Rojo
            ctx.fillStyle = "#00aaff"; ctx.fillRect(cx - 100, cy - 75, 160, 8); // Rayo de agua
            ctx.fillStyle = "white"; ctx.font = "bold 16px sans-serif"; ctx.fillText("Max Elephant: Piercing Blood", cx - 100, cy + 100);
        }
        // Cuadro 5: El azul se traga el agua y colisionan creando el Púrpura Ilimitado
        else {
            ctx.fillStyle = "rgba(163, 51, 255, 0.4)"; ctx.fillRect(0,0,canvas.width,canvas.height);
            // Efectos de estrellas destellantes
            for(let s=0; s<10; s++) {
                ctx.fillStyle = "white"; ctx.fillRect(Math.random()*canvas.width, Math.random()*canvas.height, 6, 6);
            }
            ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(cx, cy - 50, (80 - temporizadorCinematicaGojo)*4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.font = "bold 26px Courier New"; ctx.fillText("¡IMAGINARY TECHNIQUE: PURPLE!", cx - 210, cy + 120);
            if(temporizadorCinematicaGojo === 79) playSound("purpura");
        }

        if (temporizadorCinematicaGojo === 1) iniciarPreparacionBancaSukuna();
        return;
    }

    // TRANSICIÓN INTERMEDIA: ANIMACIÓN PARPADEO BLACK FLASH
    if (temporizadorBlackFlash > 0) {
        temporizadorBlackFlash--;
        if (temporizadorBlackFlash > 130) {
            if (temporizadorBlackFlash % 4 === 0) { ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height); }
            else if (temporizadorBlackFlash % 4 === 2) {
                ctx.fillStyle = "#ff0022"; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.fillStyle = "#000000"; ctx.font = "bold 40px sans-serif"; ctx.fillText("BLACK FLASH!!", canvas.width/2 - 130, canvas.height/2);
            } else { ctx.fillStyle = "#000000"; ctx.fillRect(0,0,canvas.width,canvas.height); }
            jefeMuriendoX += (Math.random() - 0.5) * 20; jefeMuriendoY += (Math.random() - 0.5) * 20;
            if (temporizadorBlackFlash === 131) playSound("black_flash");
        } else if (temporizadorBlackFlash > 40) {
            ctx.fillStyle = "rgba(5, 2, 10, 0.8)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#e60067"; ctx.fillRect(jefeMuriendoX - 45, jefeMuriendoY, 90, 50);
            if (temporizadorBlackFlash % 6 === 0) {
                playSound("corte"); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.moveTo(jefeMuriendoX - 100, jefeMuriendoY + (Math.random()*50)); ctx.lineTo(jefeMuriendoX + 100, jefeMuriendoY + (Math.random()*50)); ctx.stroke();
            }
        } else {
            ctx.fillStyle = "black"; ctx.fillRect(0,0,canvas.width,canvas.height);
        }

        if (temporizadorBlackFlash === 1) {
            if (skinEquipada === "Gojo Satoru") {
                temporizadorCinematicaGojo = 300; // Activa la mega pelea cinemática de 5 segundos
            } else {
                iniciarPreparacionBancaSukuna();
            }
        }
        return;
    }

    // FLUJO DE JUEGO NORMAL DE ARENA
    if (Math.random() < 0.012) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    if (Math.random() < 0.02) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 2.2 });

    if (Date.now() - tiempoInicioPartida > 8000 && !miniBossActivo && jefeSukunaHP === 100) {
        miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width / 2;
    }

    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 1.5; ctx.fillRect(obj.x, obj.y, 35, 35);
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
            mb.x += (dx / dist) * 12; mb.y += (dy / dist) * 12;
            ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            if (mb.tipo === "normal") {
                objetivosOriginales.forEach((obj, oIdx) => {
                    if (Math.abs(mb.x - (obj.x + 15)) < 30 && Math.abs(mb.y - (obj.y + 15)) < 30) {
                        ejecutarImpactoEspecialFX(obj.x + 15, obj.y + 15);
                        objetivosOriginales.splice(oIdx, 1); puntosPartida += 10; // CORREGIDO: 1 HP (Elimina directo)
                    }
                });
            } else if (mb.tipo === "boss" && miniBossActivo) {
                miniBossHP--;
                if (miniBossHP <= 0) {
                    miniBossActivo = false; temporizadorBlackFlash = 170;
                    jefeMuriendoX = miniBossX; jefeMuriendoY = miniBossY;
                }
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
    
    // Activa la cinemática de la banca por 3 segundos (180 cuadros) antes de tirar ataques
    temporizadorBancaIntro = 180; 
    bancaCortada = false;
    turnoJugadorSukuna = false;
    temporizadorFaseSukuna = 0;
}

// --- SSUKUNA BOSS FIGHT WORKFLOW (REEMPLAZO DE SANS) ---
function actualizarModoSukuna() {
    // ANIMACIÓN DE INTRODUCCIÓN: EL GATO EN LA BANCA Y EL CORTE DE SUKUNA
    if (temporizadorBancaIntro > 0) {
        temporizadorBancaIntro--;
        ctx.fillStyle = "#030207"; ctx.fillRect(0, 0, canvas.width, canvas.height);

        let bx = canvas.width / 2; let by = canvas.height / 2 + 30;

        // Dibujar la banca de madera
        ctx.fillStyle = "#8b5a2b";
        if (!bancaCortada) {
            ctx.fillRect(bx - 50, by, 100, 15); // Asiento
            ctx.fillRect(bx - 40, by + 15, 8, 20); // Patas
            ctx.fillRect(bx + 32, by + 15, 8, 20);
            dibujarGatoReal(bx, by + 3); // Gato sentado quieto
        } else {
            // Estructura rota cayéndose
            ctx.fillRect(bx - 60, by + 10, 45, 12); 
            ctx.fillRect(bx + 15, by + 15, 45, 12); 
            dibujarGatoReal(bx, by - 60); // El Gato saltó hacia arriba esquivándolo
            ctx.fillStyle = "#ffcc00"; ctx.font = "bold 14px sans-serif"; ctx.fillText("¡DODGE!", bx - 25, by - 95);
        }

        // Desatar el tajo de Sukuna justo a la mitad del tiempo (a los 1.5 segundos)
        if (temporizadorBancaIntro === 90) {
            bancaCortada = true; playSound("corte");
            particulasFX.push({ tipo: "corte", x: bx, y: by, longitudMax: 60, longitudActual: 0, timer: 15 });
        }

        // Dar 3 segundos de gracia total antes de iniciar los ataques reales
        if (temporizadorBancaIntro === 1) {
            jugadorX = canvas.width / 2;
            jugadorY = cuadroSukuna.y + cuadroSukuna.h / 2;
            generarAtaquesSukuna();
        }
        return;
    }

    // INTERFAZ EN PANTALLA VS SUKUNA
    let sx = canvas.width / 2; let sy = cuadroSukuna.y - 45;
    ctx.fillStyle = "#1e0202"; ctx.fillRect(sx - 50, sy - 25, 100, 40);
    ctx.strokeStyle = (turnoJugadorSukuna) ? "#00ff66" : "#ff1133"; ctx.strokeRect(sx - 50, sy - 25, 100, 40);
    ctx.fillStyle = "white"; ctx.font = "bold 11px sans-serif"; ctx.fillText("RYOMEN SUKUNA", sx - 42, sy - 10);
    ctx.fillStyle = "#ff3c3c"; ctx.font = "10px monospace"; ctx.fillText(`HP: ${jefeSukunaHP}`, sx - 18, sy + 10);

    if (!turnoJugadorSukuna) {
        ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.strokeRect(cuadroSukuna.x, cuadroSukuna.y, cuadroSukuna.w, cuadroSukuna.h);
    }

    temporizadorFaseSukuna++;
    if (temporizadorFaseSukuna > 300) {
        temporizadorFaseSukuna = 0; turnoJugadorSukuna = !turnoJugadorSukuna;
        if (!turnoJugadorSukuna) { generarAtaquesSukuna(); }
    }

    if (!turnoJugadorSukuna) {
        listaAtaquesFase.forEach(atk => {
            if (atk.tipo === "cleave_diagonal") {
                atk.x += atk.vx; atk.y += atk.vy;
                if(atk.x < cuadroSukuna.x || atk.x > cuadroSukuna.x + cuadroSukuna.w) atk.vx *= -1;
                if(atk.y < cuadroSukuna.y || atk.y > cuadroSukuna.y + cuadroSukuna.h) atk.vy *= -1;
                ctx.fillStyle = "#ff3355"; ctx.fillRect(atk.x, atk.y, 10, 10); // Balas de maldición rojas
                if (Math.abs(jugadorX - atk.x) < 16 && Math.abs(jugadorY - atk.y) < 16) jugadorHP--;
            }
        });
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; let dx = mb.tx - mb.x; let dy = mb.ty - mb.y; let d = Math.sqrt(dx*dx + dy*dy);
        if (d > 5) {
            mb.x += (dx / d) * 14; mb.y += (dy / d) * 14;
            ctx.fillStyle = "#00ff66"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            jefeSukunaHP -= 5; ejecutarImpactoEspecialFX(mb.x, mb.y); misBalas.splice(i, 1);
            if (jefeSukunaHP <= 0) { alert("¡Exorcizaste al Rey de las Maldiciones!"); volverAlMenuPrincipal(); }
        }
    }
}

function generarAtaquesSukuna() {
    listaAtaquesFase = [];
    for (let i = 0; i < 18; i++) {
        listaAtaquesFase.push({ tipo: "cleave_diagonal", x: cuadroSukuna.x + cuadroSukuna.w / 2, y: cuadroSukuna.y + cuadroSukuna.h / 2, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 });
    }
}

// --- DANCE OF FIRE AND ICE ---
function actualizarModoRitmo() {
    anguloPlaneta += 0.045; let radioOrbita = 65;
    let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * radioOrbita; hieloY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * radioOrbita; fuegoY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
    if (proximoBloque) {
        let activeSphereX = pivoteFuego ? hieloX : fuegoX;
        if (activeSphereX > proximoBloque.x + 40) { ejecutarFalloRitmo(); }
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
    if (duracionSlowMo > 0) duracionSlowMo--;
    if (Date.now() - tiempoUltimaCajaShoot > 1100) { tiempoUltimaCajaShoot = Date.now(); lanzarCajaShootPro(); }
    let velSimulada = (duracionSlowMo > 0) ? 0.35 : 1.0;

    for (let i = listaCajasShoot.length - 1; i >= 0; i--) {
        let caja = listaCajasShoot[i]; caja.x += caja.vx * velSimulada; caja.y += caja.vy * velSimulada;
        ctx.fillStyle = "#ffaa00"; ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
        if (caja.y > canvas.height + 20) listaCajasShoot.splice(i, 1);
    }

    if (cargandoTiroShoot) {
        ctx.strokeStyle = "rgba(163, 51, 255, 0.6)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(jugadorX, jugadorY - 15);
        ctx.lineTo(jugadorX + (inicioToqueX - arrastreX) * 2, jugadorY - 15 + (inicioToqueY - arrastreY) * 2); ctx.stroke();
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        if (mb.tipo === "shootbox") {
            mb.x += mb.vx; mb.y += mb.vy;
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 7, 0, Math.PI*2); ctx.fill();
            listaCajasShoot.forEach((caja, cIdx) => {
                if (mb.x > caja.x && mb.x < caja.x + caja.w && mb.y > caja.y && mb.y < caja.y + caja.h) {
                    ejecutarImpactoEspecialFX(caja.x + 20, caja.y + 20);
                    puntosPartida += 10; listaCajasShoot.splice(cIdx, 1); misBalas.splice(i, 1);
                }
            });
            if (mb.y < -20 || mb.x < -20 || mb.x > canvas.width + 20) misBalas.splice(i, 1);
        }
    }
}

// --- RENDER PERSONAJE ---
function dibujarGatoReal(x, y) {
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];
    ctx.fillStyle = s.aura; ctx.beginPath(); ctx.arc(x, y - 10, 40, 0, Math.PI*2); ctx.fill();
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

