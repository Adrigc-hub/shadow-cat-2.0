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
    "velocity.y += gravity * delta_time;",
    "void main() { gl_FragColor = vec4(0.0, 1.0, 0.8, 1.0); }"
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

// SISTEMA DE ANIMACIÓN EXTENDIDA (BLACK FLASH & SUKUNA)
let temporizadorBlackFlash = 0; 
let jefeMuriendoX = 0;
let jefeMuriendoY = 0;

// Estado Sans
let faseJefeSecreto = 1;
let jefeSecretoHP = 100;
let cuadroSans = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorFaseSans = 0;
let turnoJugadorSans = false;
let listaAtaquesFase = [];
let textoRefusedContador = 0;

// Mecánicas Dance of Fire (Corregido con Ventana de Tiempo)
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

// --- REPRODUCTOR DE AUDIO INTEGRADO (SINTETIZADOR DE EFECTOS Y MÚSICA) ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        reproducirMusicaFondo(); // Inicia la música sintética estilo JJK en bucle
    }
}

function reproducirMusicaFondo() {
    if (!audioCtx) return;
    setInterval(() => {
        if (modoActual !== "menu" && modoActual !== "carga" && !juegoPausado) {
            let notas = [110, 130, 146, 165, 196]; // Escala pentatónica menor oscura
            let nota = notas[Math.floor(Math.random() * notas.length)];
            let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = "sawtooth"; osc.frequency.setValueAtTime(nota, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
            osc.start(); osc.stop(audioCtx.currentTime + 0.4);
        }
    }, 450); // Ritmo constante (Beat)
}

function playSound(tipo) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (tipo === "click" || tipo === "hit") {
        osc.type = "sine"; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start(); osc.stop(audioCtx.currentTime + 0.08);
    } else if (tipo === "black_flash") { // Sonido destructivo y seco con bajos
        osc.type = "triangle"; osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.start(); osc.stop(audioCtx.currentTime + 0.6);
    } else if (tipo === "corte") { // Agudo y rápido
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    }
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("btn-purpura").style.display = "none";

    juegoPausado = false; miniBossActivo = false; textoRefusedContador = 0; temporizadorBlackFlash = 0;
    energiaMaldita = 0; puntosPartida = 0; jugadorHP = 10; purpuraActivoContador = 0;
    faseJefeSecreto = 1; jefeSecretoHP = 100; turnoJugadorSans = false;
    duracionSlowMo = 0; factorMultiplicador = 1;
    camaraScrollX = 0; camaraScrollY = 0; cuboFalloColorAzul = false;

    if (destino === 'menu') {
        modoActual = "menu";
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else {
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2;
        jugadorY = canvas.height - 130;
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
    guardarProgresoLocal();
    activarPausa(false);
    cambiarPantalla('menu');
}

// --- ENTRADAS DE CONTROL ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || textoRefusedContador > 0 || temporizadorBlackFlash > 0) return;

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

    if (modoActual === "ritmo") {
        // CORRECCIÓN: Validar si la bola giratoria está colisionando en el rango correcto del bloque objetivo
        let centroX = pivoteFuego ? fuegoX : hieloX;
        let centroY = pivoteFuego ? fuegoY : hieloY;
        let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];

        if (proximoBloque) {
            let distanciaAlBloque = Math.sqrt(Math.pow(centroX - proximoBloque.x, 2) + Math.pow(centroY - proximoBloque.y, 2));
            
            // Margen de tolerancia de píxeles (Hitbox de ritmo)
            if (distanciaAlBloque <= 30) { 
                indiceBloqueActual++; 
                puntosPartida += 10; 
                playSound("click");
                if (pivoteFuego) { fuegoX = proximoBloque.x; fuegoY = proximoBloque.y; pivoteFuego = false; }
                else { hieloX = proximoBloque.x; hieloY = proximoBridge.y;分配; hieloY = proximoBloque.y; pivoteFuego = true; }
                anguloPlaneta = Math.PI; // Reinicia el ángulo relativo convenientemente para el siguiente pivote
                if (indiceBloqueActual >= bloquesRitmo.length - 1) { alert("¡Mapa completado!"); volverAlMenuPrincipal(); }
            } else {
                ejecutarFalloRitmo();
            }
        }
    }

    if (modoActual === "shoot") {
        let dGato = Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2));
        if (dGato < 40) {
            cargandoTiroShoot = true;
            inicioToqueX = e.clientX; inicioToqueY = e.clientY;
            arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || textoRefusedContador > 0 || temporizadorBlackFlash > 0) return;
    if (modoActual === "original") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    if (modoActual === "shoot" && cargandoTiroShoot) { arrastreX = e.clientX; arrastreY = e.clientY; }
});

window.addEventListener('pointerup', (e) => {
    if (modoActual === "shoot" && cargandoTiroShoot) {
        cargandoTiroShoot = false;
        let dx = inicioToqueX - arrastreX; let dy = inicioToqueY - arrastreY;
        misBalas.push({ x: jugadorX, y: jugadorY - 15, vx: dx * 0.18, vy: dy * 0.18, tipo: "shootbox" });
    }
});

function ejecutarFalloRitmo() {
    cuboFalloColorAzul = true;
    setTimeout(() => {
        alert("¡Fuera de tiempo o muy lejos! Fin del juego.");
        volverAlMenuPrincipal();
    }, 400);
}

// --- EFECTOS VISUALES EXCLUSIVOS ---
function ejecutarImpactoEspecialFX(x, y) {
    playSound("hit");
    if (skinEquipada === "Default Cat") {
        for(let i=0; i<10; i++) {
            particulasFX.push({ tipo: "chispa", x: x, y: y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, alpha: 1, color: "#ffcc00" });
        }
    } else if (skinEquipada === "Gojo Satoru") {
        particulasFX.push({ tipo: "agujero_negro", x: x, y: y, radioMax: 30, radioActual: 2, expanding: true, timer: 40 });
    } else if (skinEquipada === "Yuji Itadori") {
        particulasFX.push({ tipo: "corte", x: x, y: y, longitudMax: 25, longitudActual: 0, timer: 20 });
    }
}

function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; indiceBloqueActual = 0;
    let cx = 150, cy = 300;
    for(let i=0; i<30; i++) {
        bloquesRitmo.push({ x: cx, y: cy });
        cx += 100; if(i % 3 === 0) cy += (Math.random() > 0.5 ? 80 : -80);
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y;
    hieloX = fuegoX + 100; hieloY = fuegoY;
    pivoteFuego = true; anguloPlaneta = 0;
}

function lanzarCajaShootPro() {
    let tipos = ["normal", "trampa", "slow", "mult"];
    let tipoElegido = tipos[Math.floor(Math.random() * tipos.length)];
    listaCajasShoot.push({
        x: 40 + Math.random() * (canvas.width - 100), y: -40,
        vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3,
        w: 45, h: 45, tipo: tipoElegido
    });
}

// --- LOOP PRINCIPAL ---
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
        else if (modoActual === "jefe_secreto") actualizarModoSans();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) {
            alert(`Murió el Gato. Puntos: +${puntosPartida}`);
            volverAlMenuPrincipal();
        }
    }

    // No dibujar al personaje si estamos en cinemática pura o modo rítmico alejado
    if (modoActual !== "menu" && modoActual !== "ritmo" && temporizadorBlackFlash === 0) {
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

    ctx.font = "11px Courier New";
    ctx.fillStyle = "rgba(0, 255, 170, 0.4)";
    lineasMatematicasVisibles.forEach((lin, idx) => {
        ctx.fillText(lin.texto, lin.x, lin.y);
        lin.y += 0.5; lin.life--;
        if (lin.life <= 0) lineasMatematicasVisibles.splice(idx, 1);
    });

    let cx = canvas.width / 2; let cy = canvas.height / 2 - 80;

    if (laserDisparadoMatematico) {
        radioLaserDeCarga += 15;
        ctx.fillStyle = "white";
        ctx.fillRect(0, cy - 5, canvas.width, 10);
        
        ctx.fillStyle = "rgba(163, 51, 255, 0.3)";
        ctx.beginPath(); ctx.arc(cx, cy, radioLaserDeCarga, 0, Math.PI*2); ctx.fill();

        if (radioLaserDeCarga > canvas.width * 0.9) {
            document.getElementById("pantalla-carga").style.display = "none";
            cargarProgresoGuardado();
            cambiarPantalla('menu');
        }
    }

    if (progresoCargaPorcentaje >= 100 && !laserDisparadoMatematico) {
        laserDisparadoMatematico = true;
        radioLaserDeCarga = 1;
    }
}

function actualizarYRenderizarParticulasEspeciales() {
    for (let i = particulasFX.length - 1; i >= 0; i--) {
        let f = particulasFX[i];
        if (f.tipo === "chispa") {
            f.x += f.vx; f.y += f.vy; f.alpha -= 0.04;
            ctx.globalAlpha = Math.max(0, f.alpha);
            ctx.fillStyle = f.color; ctx.fillRect(f.x, f.y, 3, 3);
            if(f.alpha <= 0) particulasFX.splice(i, 1);
        }
        else if (f.tipo === "agujero_negro") {
            f.timer--;
            if (f.expanding) { f.radioActual += 2.5; if(f.radioActual >= f.radioMax) f.expanding = false; }
            else { f.radioActual -= 1.5; }
            let grad = ctx.createRadialGradient(f.x, f.y, f.radioActual*0.1, f.x, f.y, f.radioActual);
            grad.addColorStop(0, '#000000'); grad.addColorStop(0.5, '#4b0082'); grad.addColorStop(1, 'rgba(0, 210, 255, 0.0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(f.x, f.y, f.radioActual, 0, Math.PI*2); ctx.fill();
            if (f.timer <= 0 || f.radioActual <= 1) particulasFX.splice(i, 1);
        }
        else if (f.tipo === "corte") {
            f.timer--; f.longitudActual += 2.5;
            ctx.strokeStyle = "#ff1133"; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(f.x - f.longitudActual, f.y - f.longitudActual); ctx.lineTo(f.x + f.longitudActual, f.y + f.longitudActual);
            ctx.moveTo(f.x + f.longitudActual, f.y - f.longitudActual); ctx.lineTo(f.x - f.longitudActual, f.y + f.longitudActual);
            ctx.stroke();
            if (f.timer <= 0) particulasFX.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

// --- MODO ARENA CON ANIMACIÓN EXTENDIDA DE DERROTA ---
function actualizarModoOriginal() {
    // CINEMÁTICA: BLACK FLASH & SUKUNA SLASHES (EXTENDIDO)
    if (temporizadorBlackFlash > 0) {
        temporizadorBlackFlash--;

        // 1. IMPACT FRAMES: Alternación violenta de colores base
        if (temporizadorBlackFlash > 130) {
            if (temporizadorBlackFlash % 4 === 0) {
                ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height);
            } else if (temporizadorBlackFlash % 4 === 2) {
                ctx.fillStyle = "#ff0022"; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.fillStyle = "#000000"; ctx.font = "bold 40px sans-serif";
                ctx.fillText("BLACK FLASH!!", canvas.width/2 - 130, canvas.height/2);
            } else {
                ctx.fillStyle = "#000000"; ctx.fillRect(0,0,canvas.width,canvas.height);
            }
            
            // Temblor de pantalla agresivo simulado en la posición del render
            jefeMuriendoX += (Math.random() - 0.5) * 20;
            jefeMuriendoY += (Math.random() - 0.5) * 20;

            if (temporizadorBlackFlash === 131) playSound("black_flash");
        } 
        // 2. CORTES CONTINUOS DE SUKUNA (DESMANTELAR)
        else if (temporizadorBlackFlash > 40) {
            ctx.fillStyle = "rgba(5, 2, 10, 0.8)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render del jefe fragmentándose
            ctx.fillStyle = "#e60067"; 
            ctx.fillRect(jefeMuriendoX - 45, jefeMuriendoY, 90, 50);

            // Líneas de corte parpadeantes sobre él
            if (temporizadorBlackFlash % 6 === 0) {
                playSound("corte");
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(jefeMuriendoX - 100, jefeMuriendoY + (Math.random()*50));
                ctx.lineTo(jefeMuriendoX + 100, jefeMuriendoY + (Math.random()*50));
                ctx.stroke();
            }
        } 
        // 3. COLAPSO Y DESINTEGRACIÓN TOTAL
        else {
            ctx.fillStyle = "black"; ctx.fillRect(0,0,canvas.width,canvas.height);
            for (let k = 0; k < 3; k++) {
                particulasFX.push({ tipo: "chispa", x: jefeMuriendoX + (Math.random()-0.5)*80, y: jefeMuriendoY + (Math.random()-0.5)*50, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, alpha: 1, color: "#ff1133" });
            }
        }

        if (temporizadorBlackFlash === 1) iniciarTransicionSans();
        return;
    }

    // FASE 1 REGULAR: Flujo de juego estándar y suave
    if (Math.random() < 0.012) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    if (Math.random() < 0.02) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 2.2 });

    if (Date.now() - tiempoInicioPartida > 8000 && !miniBossActivo && faseJefeSecreto === 1) {
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
        if (bc.y > jugadorY - 20 && bc.y < jugadorY + 20 && bc.x > jugadorX - 25 && bc.x < jugadorX + 25) {
            balasCaendo.splice(idx, 1); jugadorHP--;
        }
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
                        objetivosOriginales.splice(oIdx, 1); puntosPartida += 10;
                    }
                });
            } else if (mb.tipo === "boss" && miniBossActivo) {
                miniBossHP--;
                if (miniBossHP <= 0) {
                    miniBossActivo = false;
                    temporizadorBlackFlash = 170; // 170 cuadros de animación destructiva extendida
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

function iniciarTransicionSans() {
    modoActual = "jefe_secreto"; faseJefeSecreto = 1; jefeSecretoHP = 100; jugadorHP = 10;
    cuadroSans.x = canvas.width/2 - 130; cuadroSans.y = canvas.height/2 - 60;
    jugadorX = canvas.width/2; jugadorY = canvas.height/2 + 40;
    turnoJugadorSans = false; temporizadorFaseSans = 0;
    generarAtaquesDiagonalesSans();
}

// --- SANS COMBAT WORKFLOW ---
function actualizarModoSans() {
    if (textoRefusedContador > 0) {
        textoRefusedContador--;
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0044"; ctx.font = "bold 24px Courier New";
        ctx.fillText("But it refused...", canvas.width/2 - 105, canvas.height/2);
        if(textoRefusedContador === 0) {
            faseJefeSecreto = 10; jefeSecretoHP = 120; temporizadorFaseSans = 0; turnoJugadorSans = false;
            generarAtaquesDiagonalesSans();
        }
        return;
    }

    let sx = canvas.width / 2; let sy = cuadroSans.y - 45;
    ctx.fillStyle = "#111"; ctx.fillRect(sx - 25, sy - 25, 50, 45);
    ctx.strokeStyle = (turnoJugadorSans) ? "#00ff00" : "#ff0044"; ctx.strokeRect(sx - 25, sy - 25, 50, 45);

    if (!turnoJugadorSans) {
        ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.strokeRect(cuadroSans.x, cuadroSans.y, cuadroSans.w, cuadroSans.h);
    }

    temporizadorFaseSans++;
    if (temporizadorFaseSans > 300) {
        temporizadorFaseSans = 0; turnoJugadorSans = !turnoJugadorSans;
        if (!turnoJugadorSans) {
            faseJefeSecreto++;
            if (faseJefeSecreto === 10 && jefeSecretoHP > 0) textoRefusedContador = 150;
            else if (faseJefeSecreto > 10 || jefeSecretoHP <= 0) { alert("¡Derrotado con éxito!"); volverAlMenuPrincipal(); }
            else generarAtaquesDiagonalesSans();
        }
    }

    if (!turnoJugadorSans) {
        listaAtaquesFase.forEach(atk => {
            if (atk.tipo === "hueso_diagonal") {
                atk.x += atk.vx; atk.y += atk.vy;
                if(atk.x < cuadroSans.x || atk.x > cuadroSans.x + cuadroSans.w) atk.vx *= -1;
                if(atk.y < cuadroSans.y || atk.y > cuadroSans.y + cuadroSans.h) atk.vy *= -1;
                ctx.fillStyle = "#ffffff"; ctx.fillRect(atk.x, atk.y, 12, 12);
                if (Math.abs(jugadorX - atk.x) < 18 && Math.abs(jugadorY - atk.y) < 18) jugadorHP--;
            }
        });
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; let dx = mb.tx - mb.x; let dy = mb.ty - mb.y; let d = Math.sqrt(dx*dx + dy*dy);
        if (d > 5) {
            mb.x += (dx / d) * 14; mb.y += (dy / d) * 14;
            ctx.fillStyle = "#00ff00"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            jefeSecretoHP -= 5; ejecutarImpactoEspecialFX(mb.x, mb.y); misBalas.splice(i, 1);
        }
    }
}

function generarAtaquesDiagonalesSans() {
    listaAtaquesFase = [];
    for (let i = 0; i < 15; i++) {
        listaAtaquesFase.push({ tipo: "hueso_diagonal", x: cuadroSans.x + cuadroSans.w / 2, y: cuadroSans.y + cuadroSans.h / 2, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 });
    }
}

// --- DANCE OF FIRE AND ICE (SISTEMA TOTALMENTE RE-ESTRUCTURADO) ---
function actualizarModoRitmo() {
    anguloPlaneta += 0.045; // Velocidad de la órbita de las esferas
    let radioOrbita = 65;

    let centroX = pivoteFuego ? fuegoX : hieloX;
    let centroY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * radioOrbita;
        hieloY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * radioOrbita;
        fuegoY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    // Comprobar automáticamente si el jugador ignoró completamente el bloque y pasó de largo
    let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
    if (proximoBloque) {
        let activeSphereX = pivoteFuego ? hieloX : fuegoX;
        // Si la esfera activa ya pasó el eje X del bloque por mucho margen y no se tocó
        if (activeSphereX > proximoBloque.x + 40) {
            ejecutarFalloRitmo();
        }
    }

    // Control de cámara suave
    let esferaActivaX = pivoteFuego ? hieloX : fuegoX;
    let esferaActivaY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (esferaActivaX - camaraScrollX - canvas.width / 2) * 0.1;
    camaraScrollY += (esferaActivaY - camaraScrollY - canvas.height / 2) * 0.1;

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);

    // Renderizado de la pista de bloques
    bloquesRitmo.forEach((bl, idx) => {
        if (cuboFalloColorAzul && idx === indiceBloqueActual + 1) {
            ctx.fillStyle = "#007bef"; // Se vuelve azul si fallás el toque
        } else {
            ctx.fillStyle = (idx <= indiceBloqueActual) ? "#442266" : "#222233";
        }
        ctx.fillRect(bl.x - 20, bl.y - 20, 40, 40);
        ctx.strokeStyle = "#555"; ctx.strokeRect(bl.x - 20, bl.y - 20, 40, 40);
    });

    // Planetas/Esferas orbitantes
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
        ctx.fillStyle = (caja.tipo === "trampa") ? "#ff3333" : "#ffaa00";
        ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
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
