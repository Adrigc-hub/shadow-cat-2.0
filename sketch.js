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
    "void main() { gl_FragColor = vec4(0.0, 1.0, 0.8, 1.0); }",
    "localStorage.setItem('SHADOW_CAT_SAVE_3', total_pts);"
];

const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", aura: "rgba(255,255,255,0.15)" },
    "Gojo Satoru": { principal: "#0f031a", pecho: "#1a082e", ojos: "#00d2ff", aura: "rgba(0,210,255,0.3)" },
    "Yuji Itadori": { principal: "#260606", pecho: "#400d0d", ojos: "#ff3c3c", aura: "rgba(255,60,60,0.3)" }
};

// Atributos y Estado del Gato
let jugadorX = 200, jugadorY = 400, jugadorHP = 10;
let misBalas = [], objetivosOriginales = [], balasCaendo = [], particulasFX = [];
let estrellasFondo = [], energiaMaldita = 0, puntosPartida = 0;

// Estado del Boss y Turnos
let purpuraActivoContador = 0;
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 1.5; // FASE 1 MÁS FÁCIL (VELOCIDAD REDUCIDA)
let tiempoInicioPartida = 0;
let cutsceneGatoSecretaContador = 0; // Transición cinemática Gojo

let faseJefeSecreto = 1;
let jefeSecretoHP = 100;
let cuadroSans = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorFaseSans = 0;
let turnoJugadorSans = false;
let listaAtaquesFase = [];
let textoRefusedContador = 0;

// Mecánicas Dance of Fire and Ice
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true;
let camaraScrollX = 0, camaraScrollY = 0;
let toleranciaRitmoAcertado = false;

// Mecánicas Shoot the Box
let listaCajasShoot = [];
let cargandoTiroShoot = false;
let inicioToqueX = 0, inicioToqueY = 0;
let arrastreX = 0, arrastreY = 0;
let duracionSlowMo = 0;
let factorMultiplicador = 1;
let tiempoUltimaCajaShoot = 0;

// Variables de Pantalla de Carga y Animación de Rayo Matemático
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

function inicializarAudioNativo() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function sonarClickRitmo() {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sine"; osc.frequency.setValueAtTime(580, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.07);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("btn-purpura").style.display = "none";

    juegoPausado = false; miniBossActivo = false; textoRefusedContador = 0; cutsceneGatoSecretaContador = 0;
    energiaMaldita = 0; puntosPartida = 0; jugadorHP = 10; purpuraActivoContador = 0;
    faseJefeSecreto = 1; jefeSecretoHP = 100; turnoJugadorSans = false;
    duracionSlowMo = 0; factorMultiplicador = 1;
    camaraScrollX = 0; camaraScrollY = 0;

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

// --- CAPTURA DE TOUCH / CLICK EN PANTALLA ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || textoRefusedContador > 0 || cutsceneGatoSecretaContador > 0) return;

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

    if (modoActual === "jefe_secreto" && turnoJugadorSans) {
        let bx = canvas.width / 2; let by = cuadroSans.y - 45;
        if (Math.abs(e.clientX - bx) < 50 && Math.abs(e.clientY - by) < 50) {
            misBalas.push({ x: jugadorX, y: jugadorY, tx: bx, ty: by, tipo: "sans" });
        }
    }

    if (modoActual === "ritmo") {
        if (toleranciaRitmoAcertado) {
            indiceBloqueActual++; puntosPartida += 10; sonarClickRitmo();
            let proximo = bloquesRitmo[indiceBloqueActual];
            if (pivoteFuego) { fuegoX = proximo.x; fuegoY = proximo.y; pivoteFuego = false; }
            else { hieloX = proximo.x; hieloY = proximo.y; pivoteFuego = true; }
            if (indiceBloqueActual >= bloquesRitmo.length - 1) { alert("¡Mapa rítmico completado!"); volverAlMenuPrincipal(); }
        } else {
            alert("¡Fuera de ritmo! Fin del juego."); volverAlMenuPrincipal();
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
    if (juegoPausado || modoActual === "menu" || modoActual === "carga" || textoRefusedContador > 0 || cutsceneGatoSecretaContador > 0) return;

    if (modoActual === "original") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    if (modoActual === "jefe_secreto" && !turnoJugadorSans) {
        jugadorX = Math.max(cuadroSans.x + 15, Math.min(cuadroSans.x + cuadroSans.w - 15, e.clientX));
        jugadorY = Math.max(cuadroSans.y + 15, Math.min(cuadroSans.y + cuadroSans.h - 15, e.clientY));
    }
    if (modoActual === "shoot" && cargandoTiroShoot) { arrastreX = e.clientX; arrastreY = e.clientY; }
});

window.addEventListener('pointerup', (e) => {
    if (modoActual === "shoot" && cargandoTiroShoot) {
        cargandoTiroShoot = false;
        let dx = inicioToqueX - arrastreX; let dy = inicioToqueY - arrastreY;
        misBalas.push({ x: jugadorX, y: jugadorY - 15, vx: dx * 0.18, vy: dy * 0.18, tipo: "shootbox" });
    }
});

function detonarIlimitadoPurpura() {
    if (energiaMaldita >= 100 && purpuraActivoContador === 0) {
        energiaMaldita = 0; purpuraActivoContador = 180;
        document.getElementById("btn-purpura").style.display = "none";
    }
}

// --- MANEJADOR DE PARTÍCULAS EXCLUSIVAS POR SKIN ---
function ejecutarImpactoEspecialFX(x, y) {
    if (skinEquipada === "Default Cat") {
        // Chispas explosivas tradicionales amarillas
        for(let i=0; i<10; i++) {
            particulasFX.push({ tipo: "chispa", x: x, y: y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, alpha: 1, color: "#ffcc00" });
        }
    } else if (skinEquipada === "Gojo Satoru") {
        // Agujero negro expansivo/colapsivo (Vacío infinito miniatura)
        particulasFX.push({ tipo: "agujero_negro", x: x, y: y, radioMax: 30, radioActual: 2, expanding: true, timer: 40 });
    } else if (skinEquipada === "Yuji Itadori") {
        // Efecto de corte en cruz (Corte limpio a la mitad)
        particulasFX.push({ tipo: "corte", x: x, y: y, longitudMax: 25, longitudActual: 0, timer: 20 });
    }
}

function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; indiceBloqueActual = 0;
    let cx = 150, cy = 300;
    for(let i=0; i<30; i++) {
        bloquesRitmo.push({ x: cx, y: cy });
        cx += 80; if(i % 3 === 0) cy += (Math.random() > 0.5 ? 70 : -70);
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y;
    hieloX = fuegoX + 80; hieloY = fuegoY;
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

// --- LOOP PRINCIPAL MOTOR DE GRÁFICOS ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual === "carga") {
        ejecutarProcesamientoCargaMatricial();
        requestAnimationFrame(buclePrincipal);
        return;
    }

    ctx.fillStyle = "rgba(255,255,255,0.15)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, 2, 2); });

    // PROCESAR EFECTOS VISUALES DINÁMICOS EN TIEMPO REAL
    actualizarYRenderizarParticulasEspeciales();

    if (modoActual !== "menu" && !juegoPausado) {
        if (modoActual === "original") actualizarModoOriginal();
        else if (modoActual === "jefe_secreto") actualizarModoSans();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) {
            alert(`Murió el Gato. Puntos conservados: +${puntosPartida}`);
            volverAlMenuPrincipal();
        }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo") {
        dibujarGatoReal(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- ANIMACIÓN DE LA PANTALLA DE CARGA CON RAYO MATEMÁTICO EN LA GRÁFICA ---
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
    
    // Dibujo preliminar del Gato con líneas de vector matemático
    if (!laserDisparadoMatematico) {
        ctx.strokeStyle = "rgba(144, 0, 199, 0.5)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 35 + Math.sin(progresoCargaPorcentaje*0.1)*5, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy - 25, 20, 0, Math.PI*2); ctx.stroke();
        ctx.strokeRect(cx - 20, cy - 45, 40, 40);
        ctx.fillStyle = "#00ffcc";
        ctx.fillText("MATRIX_VEC_HEAD: LOADED", cx + 45, cy - 25);
    }

    // DISPARAR EL RAYO CUANDO LA BARRA LLEGA AL 100%
    if (progresoCargaPorcentaje >= 100 && !laserDisparadoMatematico) {
        laserDisparadoMatematico = true;
        radioLaserDeCarga = 1;
        document.getElementById("tit-compile").innerText = "LINKING INTERFACE...";
    }

    if (laserDisparadoMatematico) {
        radioLaserDeCarga += 15; // Expansión del rayo matemático
        
        // El rayo cruzando de arriba hacia abajo dibujando todo el canvas
        ctx.fillStyle = "white";
        ctx.fillRect(0, cy - 5, canvas.width, 10);
        
        ctx.fillStyle = "rgba(163, 51, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(cx, cy, radioLaserDeCarga, 0, Math.PI*2);
        ctx.fill();

        if (radioLaserDeCarga > canvas.width * 0.9) {
            document.getElementById("pantalla-carga").style.display = "none";
            cargarProgresoGuardado();
            cambiarPantalla('menu');
        }
    }
}

// --- RENDERIZADO DE LOS EFECTOS VISUALES EXCLUSIVOS DE SKIN ---
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
            if (f.expanding) {
                f.radioActual += 2.5;
                if(f.radioActual >= f.radioMax) f.expanding = false;
            } else {
                f.radioActual -= 1.5;
            }
            
            // Dibujar círculo concéntrico morado y azul (Efecto Vacío Infinito)
            let grad = ctx.createRadialGradient(f.x, f.y, f.radioActual*0.1, f.x, f.y, f.radioActual);
            grad.addColorStop(0, '#000000'); grad.addColorStop(0.5, '#4b0082'); grad.addColorStop(1, 'rgba(0, 210, 255, 0.0)');
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(f.x, f.y, f.radioActual, 0, Math.PI*2); ctx.fill();

            if (f.timer <= 0 || f.radioActual <= 1) particulasFX.splice(i, 1);
        }
        else if (f.tipo === "corte") {
            f.timer--;
            f.longitudActual += 2.5;
            
            // Líneas de corte diagonales cruzadas rojas (Divergent Fist/Cleave)
            ctx.strokeStyle = "#ff1133"; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(f.x - f.longitudActual, f.y - f.longitudActual);
            ctx.lineTo(f.x + f.longitudActual, f.y + f.longitudActual);
            ctx.moveTo(f.x + f.longitudActual, f.y - f.longitudActual);
            ctx.lineTo(f.x - f.longitudActual, f.y + f.longitudActual);
            ctx.stroke();

            if (f.timer <= 0) particulasFX.splice(i, 1);
        }
    }
    ctx.globalAlpha = 1.0;
}

// --- MODO ARENA ORIGINAL CORREGIDO ---
function actualizarModoOriginal() {
    // CINEMÁTICA SECRETA GOJO: PANTALLA DE TEXTO CONGELADA
    if (cutsceneGatoSecretaContador > 0) {
        cutsceneGatoSecretaContador--;
        ctx.fillStyle = "rgba(10, 5, 28, 0.9)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white"; ctx.font = "bold 28px sans-serif";
        ctx.fillText("Mini Boss Defeated.", canvas.width/2 - 120, canvas.height/2 - 40);
        ctx.fillStyle = "#00d2ff"; ctx.font = "italic bold 32px Courier New";
        ctx.fillText('"Nah, I\'d win."', canvas.width/2 - 110, canvas.height/2 + 20);
        
        if (cutsceneGatoSecretaContador === 0) iniciarTransicionSans();
        return;
    }

    // FASE 1 COMPLETAMENTE RE-CALIBRADA: VELOCIDAD Y BALAS MUY FÁCILES
    if (Math.random() < 0.012) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -40 });
    if (Math.random() < 0.02) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 2.2 }); // Balas enemigas más lentas

    if (Date.now() - tiempoInicioPartida > 10000 && !miniBossActivo && faseJefeSecreto === 1) {
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

    if (purpuraActivoContador > 0) {
        purpuraActivoContador--;
        ctx.fillStyle = "rgba(163, 51, 255, 0.85)";
        ctx.fillRect(jugadorX - 45, 0, 90, canvas.height);
        objetivosOriginales = []; balasCaendo = [];
        if (miniBossActivo) {
            miniBossHP -= 0.5;
            if (miniBossHP <= 0) verificarDerrotaBossOriginal();
        }
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        let dx = mb.tx - mb.x; let dy = mb.ty - mb.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 6) {
            mb.x += (dx / dist) * 12; mb.y += (dy / dist) * 12;
            ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();
        } else {
            if (mb.tipo === "normal") {
                objetivosOriginales.forEach((obj, oIdx) => {
                    if (Math.abs(mb.x - (obj.x + 15)) < 30 && Math.abs(mb.y - (obj.y + 15)) < 30) {
                        ejecutarImpactoEspecialFX(obj.x + 15, obj.y + 15); // Dispara efecto exclusivo
                        objetivosOriginales.splice(oIdx, 1); puntosPartida += 10;
                        if(energiaMaldita < 100) energiaMaldita += 8;
                    }
                });
            } else if (mb.tipo === "boss" && miniBossActivo) {
                miniBossHP--;
                if (miniBossHP <= 0) verificarDerrotaBossOriginal();
            }
            misBalas.splice(i, 1);
        }
    }

    if (miniBossActivo) {
        miniBossX += miniBossVX;
        if(miniBossX < 40 || miniBossX > canvas.width - 40) miniBossVX *= -1;
        ctx.fillStyle = "#e60067"; ctx.fillRect(miniBossX - 45, miniBossY, 90, 50);
        ctx.fillStyle = "white"; ctx.font = "bold 11px sans-serif";
        ctx.fillText(`MINI BOSS: ${Math.floor(miniBossHP)} HP`, miniBossX - 35, miniBossY - 10);
    }
}

function verificarDerrotaBossOriginal() {
    miniBossActivo = false;
    if (skinEquipada === "Gojo Satoru") {
        cutsceneGatoSecretaContador = 180; // Activa escena de Gojo por 3 segundos
    } else {
        iniciarTransicionSans();
    }
}

function iniciarTransicionSans() {
    modoActual = "jefe_secreto"; faseJefeSecreto = 1; jefeSecretoHP = 100; jugadorHP = 10;
    cuadroSans.x = canvas.width/2 - 130; cuadroSans.y = canvas.height/2 - 60;
    jugadorX = canvas.width/2; jugadorY = canvas.height/2 + 40;
    turnoJugadorSans = false; temporizadorFaseSans = 0;
    generarAtaquesDiagonalesSans();
}

// --- SANS BOSSFIGHT ---
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
    ctx.fillStyle = "white"; ctx.font = "10px sans-serif"; ctx.fillText(`SANS HP: ${jefeSecretoHP}`, sx - 30, sy - 32);

    if (!turnoJugadorSans) {
        ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.strokeRect(cuadroSans.x, cuadroSans.y, cuadroSans.w, cuadroSans.h);
    }

    temporizadorFaseSans++;
    if (temporizadorFaseSans > 300) {
        temporizadorFaseSans = 0; turnoJugadorSans = !turnoJugadorSans;
        if (!turnoJugadorSans) {
            faseJefeSecreto++;
            if (faseJefeSecreto === 10 && jefeSecretoHP > 0) textoRefusedContador = 150;
            else if (faseJefeSecreto > 10 || jefeSecretoHP <= 0) { alert("¡VENCISTE AL JEFE!"); volverAlMenuPrincipal(); }
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
            if (atk.tipo === "gaster_triangulo") {
                atk.timer++;
                ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(atk.x, atk.y - 15); ctx.lineTo(atk.x - 15, atk.y + 15); ctx.lineTo(atk.x + 15, atk.y + 15); ctx.closePath(); ctx.stroke();

                if (atk.timer > 45) {
                    ctx.strokeStyle = "rgba(0, 255, 200, 0.8)"; ctx.lineWidth = 14;
                    ctx.beginPath(); ctx.moveTo(atk.x, atk.y); ctx.lineTo(atk.x + atk.lx * 400, atk.y + atk.ly * 400); ctx.stroke();

                    let distGatoLaser = Math.abs((atk.ly*400)*jugadorX - (atk.lx*400)*jugadorY + (atk.x + atk.lx*400)*atk.y - (atk.y + atk.ly*400)*atk.x) / Math.sqrt(Math.pow(atk.ly*400,2) + Math.pow(atk.lx*400,2));
                    if (distGatoLaser < 16 && jugadorY > atk.y) jugadorHP--;
                }
            }
        });
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        let dx = mb.tx - mb.x; let dy = mb.ty - mb.y;
        let d = Math.sqrt(dx*dx + dy*dy);
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
    let nAtaques = 15 + faseJefeSecreto * 2;
    for (let i = 0; i < nAtaques; i++) {
        if (Math.random() > 0.5) {
            listaAtaquesFase.push({ tipo: "hueso_diagonal", x: cuadroSans.x + cuadroSans.w / 2, y: cuadroSans.y + cuadroSans.h / 2, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 });
        } else {
            listaAtaquesFase.push({ tipo: "gaster_triangulo", x: cuadroSans.x + Math.random() * cuadroSans.w, y: cuadroSans.y + 15, lx: Math.random() - 0.5, ly: Math.random() * 0.5 + 0.5, timer: 0 });
        }
    }
}

// --- DANCE OF FIRE AND ICE ---
function actualizarModoRitmo() {
    anguloPlaneta += 0.055; let radioOrbita = 70;
    let anguloReducido = anguloPlaneta % Math.PI;
    toleranciaRitmoAcertado = (anguloReducido < 0.2 || anguloReducido > Math.PI - 0.2);

    let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;
    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * radioOrbita; hieloY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * radioOrbita; fuegoY = centroY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    let esferaActivaX = pivoteFuego ? hieloX : fuegoX; let esferaActivaY = pivoteFuego ? hieloY : fuegoY;
    if (esferaActivaX - camaraScrollX > canvas.width - 160) camaraScrollX += 4;
    if (esferaActivaX - camaraScrollX < 160) camaraScrollX -= 4;
    if (esferaActivaY - camaraScrollY > canvas.height - 160) camaraScrollY += 4;
    if (esferaActivaY - camaraScrollY < 160) camaraScrollY -= 4;

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);

    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx === indiceBloqueActual) ? "#442266" : "#222233"; ctx.fillRect(bl.x - 20, bl.y - 20, 40, 40);
        ctx.strokeStyle = (idx === indiceBloqueActual + 1 && toleranciaRitmoAcertado) ? "#00ffcc" : "#555"; ctx.strokeRect(bl.x - 20, bl.y - 20, 40, 40);
    });

    ctx.fillStyle = "#ff2200"; ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 15, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(hieloX, hieloY, 15, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// --- SHOOT THE BOX ---
function actualizarModoShoot() {
    if (duracionSlowMo > 0) duracionSlowMo--;
    if (Date.now() - tiempoUltimaCajaShoot > 1100) { tiempoUltimaCajaShoot = Date.now(); lanzarCajaShootPro(); }

    let velSimulada = (duracionSlowMo > 0) ? 0.35 : 1.0;

    for (let i = listaCajasShoot.length - 1; i >= 0; i--) {
        let caja = listaCajasShoot[i]; caja.x += caja.vx * velSimulada; caja.y += caja.vy * velSimulada;
        if(caja.tipo === "trampa") ctx.fillStyle = "#ff3333";
        else if(caja.tipo === "slow") ctx.fillStyle = "#33ff33";
        else if(caja.tipo === "mult") ctx.fillStyle = "#3399ff";
        else ctx.fillStyle = "#ffaa00";

        ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
        ctx.strokeStyle = "white"; ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);
        if (caja.y > canvas.height + 20) listaCajasShoot.splice(i, 1);
    }

    if (cargandoTiroShoot) {
        ctx.strokeStyle = "rgba(163, 51, 255, 0.6)"; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(jugadorX, jugadorY - 15);
        let dx = inicioToqueX - arrastreX; let dy = inicioToqueY - arrastreY;
        ctx.lineTo(jugadorX + dx * 2, jugadorY - 15 + dy * 2); ctx.stroke(); ctx.setLineDash([]);
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        if (mb.tipo === "shootbox") {
            mb.x += mb.vx; mb.y += mb.vy;
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(mb.x, mb.y, 7, 0, Math.PI*2); ctx.fill();

            listaCajasShoot.forEach((caja, cIdx) => {
                if (mb.x > caja.x && mb.x < caja.x + caja.w && mb.y > caja.y && mb.y < caja.y + caja.h) {
                    ejecutarImpactoEspecialFX(caja.x + 20, caja.y + 20); // Animación customizada
                    if (caja.tipo === "trampa") puntosPartida = Math.max(0, puntosPartida - 15);
                    else if (caja.tipo === "slow") duracionSlowMo = 180;
                    else if (caja.tipo === "mult") { factorMultiplicador = 2; setTimeout(() => { factorMultiplicador = 1; }, 5000); }
                    else puntosPartida += 10 * factorMultiplicador;

                    listaCajasShoot.splice(cIdx, 1); misBalas.splice(i, 1);
                }
            });
            if (mb.y < -20 || mb.x < -20 || mb.x > canvas.width + 20) misBalas.splice(i, 1);
        }
    }
}

// --- RENDER COMPLETO DEL GATO REAL ---
function dibujarGatoReal(x, y) {
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];
    ctx.fillStyle = s.aura; ctx.beginPath(); ctx.arc(x, y - 10, 40, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = s.principal; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 15, y + 25); ctx.quadraticCurveTo(x - 30, y + 10, x - 25, y - 5); ctx.stroke();

    ctx.fillStyle = s.pecho; ctx.fillRect(x - 14, y + 22, 8, 10); ctx.fillRect(x + 6, y + 22, 8, 10);
    ctx.fillStyle = s.principal; ctx.beginPath(); ctx.ellipse(x, y + 10, 18, 22, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.pecho; ctx.beginPath(); ctx.ellipse(x, y + 8, 10, 14, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = s.principal; ctx.beginPath(); ctx.arc(x, y - 15, 16, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = s.principal;
    ctx.beginPath(); ctx.moveTo(x - 15, y - 22); ctx.lineTo(x - 16, y - 36); ctx.lineTo(x - 4, y - 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 15, y - 22); ctx.lineTo(x + 16, y - 36); ctx.lineTo(x + 4, y - 26); ctx.fill();
    ctx.fillStyle = "#ffb6c1";
    ctx.beginPath(); ctx.moveTo(x - 13, y - 24); ctx.lineTo(x - 14, y - 32); ctx.lineTo(x - 6, y - 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 13, y - 24); ctx.lineTo(x + 14, y - 32); ctx.lineTo(x + 6, y - 26); ctx.fill();

    ctx.fillStyle = s.ojos; ctx.fillRect(x - 8, y - 19, 4, 6); ctx.fillRect(x + 4, y - 19, 4, 6);
    ctx.fillStyle = "#ffb6c1"; ctx.fillRect(x - 1, y - 13, 2, 2);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 12); ctx.lineTo(x - 16, y - 14); ctx.moveTo(x - 6, y - 11); ctx.lineTo(x - 15, y - 10);
    ctx.moveTo(x + 6, y - 12); ctx.lineTo(x + 16, y - 14); ctx.moveTo(x + 6, y - 11); ctx.lineTo(x + 15, y - 10); ctx.stroke();
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `
        <div class="item-habilidad" onclick="equiparSkin('${name}')">
            <div style="font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
            ${skinEquipada === name ? '<span style="color:#00ff66; font-size:11px; font-weight:bold;">EQUIPADA</span>' : '<button class="btn-comprar" style="background:#222; color:white;">USAR</button>'}
        </div>
    `).join('');
}

function equiparSkin(name) {
    skinEquipada = name; guardarProgresoLocal(); renderSkins();
}

window.onload = () => { redimensionar(); generarEstrellas(); buclePrincipal(); };

