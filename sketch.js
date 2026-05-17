// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 0;
let modoActual = "carga"; // Ahora inicia en carga neón, pero controlada por código
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;
let nodoMusicaMenu = null;
let nodoRespiracion = null; // Nodo para el sonido de respiración/ambiente

const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", aura: "rgba(255,255,255,0.15)" },
    "Gojo Satoru": { principal: "#0f031a", pecho: "#1a082e", ojos: "#00d2ff", aura: "rgba(0,210,255,0.3)" },
    "Yuji Itadori": { principal: "#260606", pecho: "#400d0d", ojos: "#ff3c3c", aura: "rgba(255,60,60,0.3)" }
};

// Atributos del Jugador
let jugadorX = 200, jugadorY = 400, jugadorHP = 10;
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [], puntosPartida = 0;

// Estado del Boss
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 1.5;
let tiempoInicioPartida = 0;

// Mecánicas Dance of Fire
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

// Variables de la Pantalla de Carga y Efectos Solicitados
let progresoCarga = 0;
let rayosConstruccion = [];
let tiempoInicioMenu = 0;

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

// --- SINTETIZADOR DE AUDIO AVANZADO (MÚSICA + RESPIRACIÓN NATIVA) ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        gestionarMusicaEstados();
        crearEfectoRespiracionGato();
    }
}

// Genera un pulso sónico cíclico de baja frecuencia para simular respiración de energía maldita
function crearEfectoRespiracionGato() {
    if(!audioCtx) return;
    
    let osc = audioCtx.createOscillator();
    let filtro = audioCtx.createBiquadFilter();
    let gananciaRespiracion = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(60, audioCtx.currentTime); // Frecuencia sub-grave baja

    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(120, audioCtx.currentTime);

    gananciaRespiracion.gain.setValueAtTime(0.01, audioCtx.currentTime);

    osc.connect(filtro);
    filtro.connect(gananciaRespiracion);
    gananciaRespiracion.connect(audioCtx.destination);
    osc.start();

    // Ciclo infinito automatizado de inhalación/exhalación (Cambio de volumen de aire)
    setInterval(() => {
        if(audioCtx && !juegoPausado) {
            let t = audioCtx.currentTime;
            // Inhala (Sube volumen y frecuencia sutilmente)
            gananciaRespiracion.gain.linearRampToValueAtTime(0.04, t + 1.8);
            filtro.frequency.linearRampToValueAtTime(200, t + 1.8);
            
            // Exhala (Baja volumen y frecuencia)
            gananciaRespiracion.gain.linearRampToValueAtTime(0.01, t + 3.6);
            filtro.frequency.linearRampToValueAtTime(100, t + 3.6);
        }
    }, 3600);
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
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);

        nodoMusicaMenu.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        gainNode.connect(delayNode);
        delayNode.connect(feedback);
        feedback.connect(delayNode);
        delayNode.connect(audioCtx.destination);
        nodoMusicaMenu.start();
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
    } else if (tipo === "rayo_carga") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
        osc.start(); osc.stop(audioCtx.currentTime + 0.06);
    }
}

function cambiarPantalla(destino) {
    let pMenu = document.getElementById("pantalla-menu");
    let pHech = document.getElementById("pantalla-hechiceros");
    let hud = document.getElementById("hud-juego");

    if(pMenu) pMenu.classList.remove("activa");
    if(pHech) pHech.classList.remove("activa");
    if(hud) hud.style.display = "none";

    juegoPausado = false; miniBossActivo = false;
    puntosPartida = 0; jugadorHP = 10;
    camaraScrollX = 0; camaraScrollY = 0;

    if (destino === 'menu') {
        modoActual = "menu";
        tiempoInicioMenu = Date.now();
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
    if (juegoPausado) return;
    
    // Si da clic durante la carga neón, puede saltarla o inicializar el sonido
    if (modoActual === "carga" && progresoCarga >= 100) {
        cambiarPantalla('menu');
        return;
    }
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
                    alert("¡Ritmo dominado!"); 
                    volverAlMenuPrincipal();
                }
            } else {
                setTimeout(() => { alert("¡Fallo de ritmo!"); volverAlMenuPrincipal(); }, 200);
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
    bloquesRitmo = []; indiceBloqueActual = 0; 
    let cx = window.innerWidth / 2 - 100; let cy = window.innerHeight / 2 + 100;
    for(let i=0; i<30; i++) { 
        bloquesRitmo.push({ x: cx, y: cy }); cx += 120; 
        if(i % 4 === 0 && i > 0) cy += (Math.random() > 0.5 ? 100 : -100); 
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y; 
    hieloX = fuegoX + 65; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

// --- LOOP PRINCIPAL DE RENDERIZADO ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fondo estelar universal
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "carga") {
        dibujarPantallaCargaNeon();
    } else if (modoActual === "menu") {
        dibujarGatoEnBancaMenu();
        animarLineasConstruccionMenu(); 
    } else if (!juegoPausado) {
        if (modoActual === "original") actualizarModoOriginal();
        else if (modoActual === "ritmo") actualizarModoRitmo();
        else if (modoActual === "shoot") actualizarModoShoot();

        if (jugadorHP <= 0) { alert("Gato Derrotado."); volverAlMenuPrincipal(); }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo" && modoActual !== "carga") {
        dibujarGatoReal(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- NUEVA PANTALLA DE CARGA NEÓN INTEGRADA EFECTIVA ---
function dibujarPantallaCargaNeon() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;

    // Aumentar progreso de carga fluidamente
    if (progresoCarga < 100) {
        progresoCarga += 1.2;
    }

    // Efecto de rayos neón aleatorios directo en el lienzo
    if (Math.random() < 0.15) {
        playSound("rayo_carga");
        rayosConstruccion.push({
            x1: Math.random() * canvas.width, y1: 0,
            x2: cx + (Math.random() - 0.5) * 300, y2: cy,
            alfa: 1.0
        });
    }

    // Dibujar rayos activos
    rayosConstruccion.forEach((r, idx) => {
        ctx.strokeStyle = `rgba(0, 255, 130, ${r.alfa})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
        r.alfa -= 0.1;
        if(r.alfa <= 0) rayosConstruccion.splice(idx, 1);
    });

    // Marco del Contenedor de Carga
    ctx.strokeStyle = "rgba(0, 255, 130, 0.2)";
    ctx.strokeRect(cx - 150, cy + 50, 300, 20);

    // Barra Neón de Progreso
    ctx.fillStyle = "#00ff82";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff82";
    ctx.fillRect(cx - 150, cy + 50, 3 * progresoCarga, 20);
    ctx.shadowBlur = 0; // Reset de sombra para optimizar rendimiento

    // Textos Matriciales de Carga
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(`COMPILING ENGINES: ${Math.floor(progresoCarga)}%`, cx, cy - 20);

    ctx.font = "11px Courier New";
    ctx.fillStyle = "rgba(0,255,130,0.7)";
    ctx.fillText("CONECTANDO COMPONENTES EXPANSIONES DE DOMINIO...", cx, cy + 100);

    // Auto-salto al terminar la carga
    if (progresoCarga >= 100) {
        cambiarPantalla('menu');
    }
}

// --- ANIMACIÓN GATO EN BANCA MUEVE-COLA ---
function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2 - 140; 

    ctx.fillStyle = "#7a431d";
    ctx.fillRect(cx - 70, cy + 30, 140, 10); 
    ctx.fillStyle = "#5c3214";
    ctx.fillRect(cx - 60, cy + 40, 8, 25);   
    ctx.fillRect(cx + 52, cy + 40, 8, 25);   
    ctx.fillRect(cx - 65, cy + 10, 6, 20);   
    ctx.fillRect(cx + 59, cy + 10, 6, 20);   
    ctx.fillRect(cx - 70, cy, 140, 12);      

    let anguloCola = Math.sin(Date.now() * 0.007) * 0.45;
    let s = SKINS_GATOS[skinEquipada] || SKINS_GATOS["Default Cat"];

    ctx.fillStyle = s.aura; ctx.beginPath(); ctx.arc(cx, cy + 10, 35, 0, Math.PI*2); ctx.fill();

    ctx.save();
    ctx.translate(cx - 12, cy + 24);
    ctx.rotate(anguloCola);
    ctx.strokeStyle = s.principal;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-15, -10, -20, -25); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = s.principal;
    ctx.beginPath(); ctx.arc(cx, cy + 10, 14, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = s.pecho;
    ctx.beginPath(); ctx.ellipse(cx, cy + 26, 11, 10, 0, 0, Math.PI*2); ctx.fill(); 

    ctx.fillStyle = s.principal;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx - 14, cy - 10); ctx.lineTo(cx - 4, cy - 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 14, cy - 10); ctx.lineTo(cx + 4, cy - 4); ctx.fill();

    ctx.fillStyle = s.ojos;
    ctx.fillRect(cx - 5, cy + 5, 3, 5); ctx.fillRect(cx + 3, cy + 5, 3, 5);
}

// --- RECTÁNGULOS DE BOTONES COLOCÁNDOSE EN SU LUGAR (ANIMACIÓN MENÚ) ---
function animarLineasConstruccionMenu() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;
    
    let transcurrido = Date.now() - tiempoInicioMenu;
    let pct = Math.min(1, transcurrido / 1000); // 1 segundo exacto de acomodo

    ctx.lineWidth = 2;
    let posicionesY = [cy - 60, cy + 10, cy + 80];
    let anchoCaja = 260;
    let progresoAncho = anchoCaja * pct;

    posicionesY.forEach((y, i) => {
        ctx.strokeStyle = "rgba(0, 255, 130, 0.85)";
        ctx.save();
        ctx.beginPath();
        // Las cajas se expanden limpiamente desde el centro geométrico del botón hacia afuera
        ctx.strokeRect(cx - progresoAncho / 2, y, progresoAncho, 45);
        ctx.restore();
    });
}

// --- DETALLES DE MODOS DE JUEGO ---
function actualizarModoOriginal() {
    if (Math.random() < 0.02) objetivosOriginales.push({ x: Math.random() * (canvas.width - 50), y: -40 });
    if (Math.random() < 0.025) balasCaendo.push({ x: Math.random() * canvas.width, y: -20, vy: 3 });

    if (Date.now() - tiempoInicioPartida > 8000 && !miniBossActivo) {
        miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width / 2;
    }

    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 2; ctx.fillRect(obj.x, obj.y, 35, 35);
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; mb.y += mb.vy; ctx.fillRect(mb.x - 3, mb.y, 6, 15);
        for (let o = objetivosOriginales.length - 1; o >= 0; o--) {
            let obj = objetivosOriginales[o];
            if (mb.x > obj.x && mb.x < obj.x + 35 && mb.y > obj.y && mb.y < obj.y + 35) {
                objetivosOriginales.splice(o, 1); puntosPartida += 10; misBalas.splice(i, 1); break;
            }
        }
        if (miniBossActivo && mb.x > miniBossX - 45 && mb.x < miniBossX + 45 && mb.y > miniBossY && mb.y < miniBossY + 50) {
            miniBossHP--; misBalas.splice(i, 1);
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

function actualizarModoRitmo() {
    anguloPlaneta += 0.06;
    let radioOrbita = 50; 
    let centroX = pivoteFuego ? fuegoX : hieloX; let centroY = pivoteFuego ? fuegoY : hieloY;

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

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);
    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx <= indiceBloqueActual) ? "#552277" : "#252535";
        ctx.fillRect(bl.x - 25, bl.y - 25, 50, 50);
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

// --- ARRANQUE ---
window.onload = () => { 
    redimensionar(); 
    generarEstrellas(); 
    cargarProgresoGuardado(); 
    buclePrincipal(); 
};
