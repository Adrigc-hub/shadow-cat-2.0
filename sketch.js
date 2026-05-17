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
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
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

// Mecánicas Dance of Fire (COORDENADAS CORREGIDAS AL CUBO GRIS)
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
    let txtPuntos = document.getElementById("txt-puntos");
    if(txtPuntos) txtPuntos.innerText = puntosAcumulados;
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
    let pMenu = document.getElementById("pantalla-menu");
    let pHech = document.getElementById("pantalla-hechiceros");
    let hud = document.getElementById("hud-juego");

    if(pMenu) pMenu.classList.remove("activa");
    if(pHech) pHech.classList.remove("activa");
    if(hud) hud.style.display = "none";

    juegoPausado = false; miniBossActivo = false; temporizadorCinematicaGojo = 0; 
    temporizadorBancaIntro = 0; bancaCortada = false;
    puntosPartida = 0; jugadorHP = 10; jefeSukunaHP = 100; turnoJugadorSukuna = false;
    camaraScrollX = 0; camaraScrollY = 0;

    if (destino === 'menu') {
        modoActual = "menu";
        gestionarMusicaEstados();
        if(pMenu) pMenu.classList.add("activa");
    } else if (destino === 'hechiceros') {
        if(pHech) pHech.classList.add("activa");
        renderSkins();
    } else {
        modoActual = "accion";
        gestionarMusicaEstados(); 
        if(hud) hud.style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; objetivosOriginales = []; balasCaendo = [];
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
    let mPausa = document.getElementById("menu-pausa");
    if(mPausa) mPausa.style.display = estado ? "flex" : "none";
}

function volverAlMenuPrincipal() {
    puntosAcumulados += puntosPartida;
    let txtPuntos = document.getElementById("txt-puntos");
    if(txtPuntos) txtPuntos.innerText = puntosAcumulados;
    guardarProgresoLocal(); activarPausa(false); cambiarPantalla('menu');
}

// --- EVENTOS DE ENTRADA ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado || modoActual === "carga") return;

    if (modoActual === "menu") return;

    if (modoActual === "original") {
        playSound("click");
        misBalas.push({ x: jugadorX, y: jugadorY - 25, vy: -12 });
    }

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
                anguloPlaneta = Math.PI; 
                
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
    fuegoX = bloquesRitmo[0].x; 
    fuegoY = bloquesRitmo[0].y; 
    hieloX = fuegoX + 65; 
    hieloY = fuegoY; 
    pivoteFuego = true; 
    anguloPlaneta = 0;
}

// --- LOOP PRINCIPAL CORREGIDO (NUNCA SE TRABA) ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual === "carga") {
        ejecutarProcesamientoCargaMatricial();
        requestAnimationFrame(buclePrincipal);
        return;
    }

    // Estrellas de fondo uniformes
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "menu") {
        dibujarGatoEnBancaMenu();
    } else if (!juegoPausado) {
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

// --- ANIMACIÓN: GATO EN BANCA MOVIENDO LA COLA (MENÚ PRINCIPAL) ---
function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2 - 120; // Situado estratégicamente arriba de tus botones HTML

    // Dibujar la Banca de Madera de fondo
    ctx.fillStyle = "#7a431d";
    ctx.fillRect(cx - 70, cy + 30, 140, 10); // Asiento
    ctx.fillStyle = "#5c3214";
    ctx.fillRect(cx - 60, cy + 40, 8, 25);   // Pata izquierda
    ctx.fillRect(cx + 52, cy + 40, 8, 25);   // Pata derecha
    ctx.fillRect(cx - 65, cy + 10, 6, 20);   // Soporte respaldo izquierdo
    ctx.fillRect(cx + 59, cy + 10, 6, 20);   // Soporte respaldo derecho
    ctx.fillRect(cx - 70, cy, 140, 12);      // Respaldo horizontal

    // Lógica rítmica de la colita del gato (Usa seno basado en los cuadros de animación)
    let anguloCola = Math.sin(Date.now() * 0.006) * 0.4;

    // Obtener colores de la Skin
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];

    // Aura sutil flotante
    ctx.fillStyle = s.aura; ctx.beginPath(); ctx.arc(cx, cy + 10, 35, 0, Math.PI*2); ctx.fill();

    // Dibujar la Colita Rítmica (Atrás del cuerpo)
    ctx.save();
    ctx.translate(cx - 12, cy + 24);
    ctx.rotate(anguloCola);
    ctx.strokeStyle = s.principal;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-15, -10, -20, -25);
    ctx.stroke();
    ctx.restore();

    // Cuerpo del gato sentado
    ctx.fillStyle = s.principal;
    ctx.beginPath(); ctx.arc(cx, cy + 10, 14, 0, Math.PI*2); ctx.fill(); // Cabeza
    ctx.fillStyle = s.pecho;
    ctx.beginPath(); ctx.ellipse(cx, cy + 26, 11, 10, 0, 0, Math.PI*2); ctx.fill(); // Pecho/Cuerpo

    // Orejitas puntudas
    ctx.fillStyle = s.principal;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 14, cy - 10); ctx.lineTo(cx - 4, cy - 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 14, cy - 10); ctx.lineTo(cx + 4, cy - 4); ctx.fill();

    // Ojitos brillantes de la Skin
    ctx.fillStyle = s.ojos;
    ctx.fillRect(cx - 6, cy + 6, 3, 5);
    ctx.fillRect(cx + 3, cy + 6, 3, 5);
}

// --- ANIMACIÓN DE CARGA VECTORIAL PASO A PASO ---
function ejecutarProcesamientoCargaMatricial() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;

    if (temporizadorConstruccionMenu === 0) {
        progresoCargaPorcentaje += 1.5;
        let barra = document.getElementById("barra-progreso-linea");
        if(barra) barra.style.width = `${Math.min(100, progresoCargaPorcentaje)}%`;

        if (Math.random() < 0.12) {
            let fRandom = FORMULAS_MATH_CODE[Math.floor(Math.random() * FORMULAS_MATH_CODE.length)];
            let txtMath = document.getElementById("texto-matematico");
            if(txtMath) txtMath.innerText = fRandom;
        }

        if (progresoCargaPorcentaje >= 100) {
            temporizadorConstruccionMenu = 180; 
            let pCarga = document.getElementById("pantalla-carga");
            if(pCarga) pCarga.style.display = "none"; 
        }
    } else {
        temporizadorConstruccionMenu--;
        let pctInverso = (180 - temporizadorConstruccionMenu) / 180; 

        if (temporizadorConstruccionMenu % 8 === 0) {
            playSound("rayo_verde");
            rayosConstruccion.push({
                x1: Math.random() * canvas.width, y1: 0,
                x2: cx + (Math.random() - 0.5) * 400, y2: cy + (Math.random() - 0.5) * 300,
                duracion: 10
            });
        }

        ctx.lineWidth = 2;
        for (let i = rayosConstruccion.length - 1; i >= 0; i--) {
            let r = rayosConstruccion[i];
            ctx.strokeStyle = `rgba(0, 255, 130, ${r.duracion / 10})`;
            ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
            r.duracion--; if (r.duracion <= 0) rayosConstruccion.splice(i, 1);
        }

        // Dibujo secuencial de los tres rectángulos del menú
        ctx.strokeStyle = "rgb(0, 255, 130)";
        ctx.lineWidth = 3;
        
        let botonesY = [cy - 80, cy - 10, cy + 60];
        let maxAncho = 280;
        let tramoActual = maxAncho * pctInverso; 

        botonesY.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(cx - 140, y);
            ctx.lineTo(cx - 140 + tramoActual, y);
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

// --- MODO ORIGINAL (REPARADO Y FLUIDO) ---
function actualizarModoOriginal() {
    if (Math.random() < 0.02) objetivosOriginales.push({ x: Math.random() * (canvas.width - 50), y: -40 });
    if (Math.random() < 0.025) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 3 });

    if (Date.now() - tiempoInicioPartida > 8000 && !miniBossActivo) {
        miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width / 2;
    }

    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 2; 
        ctx.fillRect(obj.x, obj.y, 35, 35);
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    // Movimiento vertical sin interrupción para las balas del jugador
    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        mb.y += mb.vy; 
        ctx.fillRect(mb.x - 3, mb.y, 6, 15);

        // Colisión limpia contra bloques amarillos
        for (let o = objetivosOriginales.length - 1; o >= 0; o--) {
            let obj = objetivosOriginales[o];
            if (mb.x > obj.x && mb.x < obj.x + 35 && mb.y > obj.y && mb.y < obj.y + 35) {
                objetivosOriginales.splice(o, 1);
                puntosPartida += 10;
                misBalas.splice(i, 1);
                break;
            }
        }

        // Colisión limpia contra el Mini Boss
        if (miniBossActivo && mb.x > miniBossX - 45 && mb.x < miniBossX + 45 && mb.y > miniBossY && mb.y < miniBossY + 50) {
            miniBossHP--;
            misBalas.splice(i, 1);
            if (miniBossHP <= 0) { miniBossActivo = false; puntosPartida += 100; }
        }

        if (mb.y < -20) misBalas.splice(i, 1);
    }

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

// --- OTROS MÉTODOS Y RENDERS STUB ---
function actualizarModoSukuna() {}

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

    let esferaFocoX = pivoteFuego ? hieloX : fuegoX;
    let esferaFocoY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (esferaFocoX - camaraScrollX - canvas.width / 2) * 0.1;
    camaraScrollY += (esferaFocoY - camaraScrollY - canvas.height / 2) * 0.1;

    ctx.save(); 
    ctx.translate(-camaraScrollX, -camaraScrollY);

    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx <= indiceBloqueActual) ? "#552277" : "#252535";
        ctx.fillRect(bl.x - 25, bl.y - 25, 50, 50);
        ctx.strokeStyle = "#444"; ctx.strokeRect(bl.x - 25, bl.y - 25, 50, 50);
    });

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

window.onload = () => { 
    redimensionar(); 
    generarEstrellas(); 
    cargarProgresoGuardado(); 
};
