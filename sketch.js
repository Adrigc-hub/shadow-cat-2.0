// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 0;
let modoActual = "carga"; 
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;
let nodoMusicaMenu = null;

// Configuración detallada de apariencia para transformar el personaje en gato real
const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", tipo: "default" },
    "Gojo Satoru": { principal: "#ffffff", pecho: "#121214", ojos: "#00d2ff", tipo: "gojo" },
    "Yuji Itadori": { principal: "#ff9494", pecho: "#260606", ojos: "#black", tipo: "yuji" }
};

// Atributos del Jugador
let jugadorX = 200, jugadorY = 400, jugadorHP = 30; // Vida sincronizada a 30 HP
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [], puntosPartida = 0;

// Estado del Boss (Corregido para colisiones y muerte real)
let miniBossActivo = true; 
let miniBossHP = 100; // 100 HP para el jefe Sukuna
let miniBossMaxHP = 100;
let miniBossX = 200, miniBossY = 90, miniBossVX = 2;
let jefeHitTimer = 0;

// Mecánicas Dance of Fire
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true; 
let camaraScrollX = 0, camaraScrollY = 0;

// Variables de Carga y Construcción Neón
let progresoCarga = 0;
let rayosConstruccion = [];
let botonesMenu = [];
let tiempoInicioMenu = 0;

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    actualizarPosicionesBotones();
}
window.addEventListener('resize', redimensionar);

function actualizarPosicionesBotones() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;
    // Definimos las coordenadas exactas de las cajas en el Canvas
    botonesMenu = [
        { id: "juego-original", texto: "MODO ORIGINAL", x: cx - 130, y: cy - 60, w: 260, h: 45, escala: 0 },
        { id: "juego-ritmo", texto: "DANCE OF FIRE", x: cx - 130, y: cy + 10, w: 260, h: 45, escala: 0 },
        { id: "juego-shoot", texto: "SHOOT THE BOX", x: cx - 130, y: cy + 80, w: 260, h: 45, escala: 0 },
        { id: "hechiceros", texto: "HECHICEROS (SKINS)", x: cx - 130, y: cy + 150, w: 260, h: 45, escala: 0 }
    ];
}

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<40; i++) {
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
}

function guardarProgresoLocal() {
    localStorage.setItem("SHADOW_CAT_SAVE_3", JSON.stringify({ puntos: puntosAcumulados, skin: skinEquipada }));
}

// --- AUDIO AUTOMÁTICO ---
function inicializarAudioNativo() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (modoActual === "menu") gestionarMusicaEstados();
        crearEfectoRespiracionGato();
    }
}

function crearEfectoRespiracionGato() {
    if(!audioCtx) return;
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start();
    setInterval(() => {
        if(audioCtx && !juegoPausado) {
            let t = audioCtx.currentTime;
            gain.gain.linearRampToValueAtTime(0.03, t + 1.5); // Simulación de inhalar energía
            gain.gain.linearRampToValueAtTime(0.01, t + 3.0); // Exhalar
        }
    }, 3000);
}

function gestionarMusicaEstados() {
    if (!audioCtx) return;
    if (modoActual === "menu" && !nodoMusicaMenu) {
        nodoMusicaMenu = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        nodoMusicaMenu.type = "triangle";
        nodoMusicaMenu.frequency.setValueAtTime(130.81, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
        nodoMusicaMenu.connect(gainNode); gainNode.connect(audioCtx.destination);
        nodoMusicaMenu.start();
    } else if (modoActual !== "menu" && nodoMusicaMenu) {
        try { nodoMusicaMenu.stop(); } catch(e){}
        nodoMusicaMenu = null;
    }
}

function playSound(tipo) {
    if (!audioCtx) return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    if (tipo === "click" || tipo === "hit") {
        osc.type = "sine"; osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

function cambiarPantalla(destino) {
    let pHech = document.getElementById("pantalla-hechiceros");
    let hud = document.getElementById("hud-juego");

    if(pHech) pHech.style.display = "none";
    if(hud) hud.style.display = "none";

    juegoPausado = false;
    puntosPartida = 0; jugadorHP = 30;

    if (destino === 'menu') {
        modoActual = "menu";
        tiempoInicioMenu = Date.now();
        gestionarMusicaEstados();
    } else if (destino === 'hechiceros') {
        modoActual = "hechiceros";
        if(pHech) pHech.style.display = "flex";
        renderSkins();
    } else {
        modoActual = destino;
        gestionarMusicaEstados(); 
        if(hud) hud.style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; objetivosOriginales = []; balasCaendo = [];
        miniBossHP = 100; miniBossActivo = true;

        if (destino === 'juego-ritmo') generarCaminoBloquesRitmo();
    }
}

// --- DETECCIÓN DE TOQUES (MÓVIL / CANVAS DIRECTO) ---
window.addEventListener('pointerdown', (e) => {
    inicializarAudioNativo();
    if (juegoPausado) return;

    if (modoActual === "carga" && progresoCarga >= 100) {
        cambiarPantalla('menu');
        return;
    }

    // Gestionar clicks en los botones nativos del Canvas en el Menú
    if (modoActual === "menu") {
        botonesMenu.forEach(btn => {
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w && e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
                playSound("click");
                cambiarPantalla(btn.id);
            }
        });
        return;
    }

    if (modoActual === "juego-original") {
        playSound("click");
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -14 });
    }
});

window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || modoActual === "carga") return;
    jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
});

function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; indiceBloqueActual = 0; 
    let cx = window.innerWidth / 2 - 100; let cy = window.innerHeight / 2 + 100;
    for(let i=0; i<20; i++) { 
        bloquesRitmo.push({ x: cx, y: cy }); cx += 100; 
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y; 
    hieloX = fuegoX + 50; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

// --- SISTEMA DE DIBUJO CARDINAL ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Estrellas
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "carga") {
        dibujarPantallaCargaNeon();
    } else if (modoActual === "menu") {
        dibujarGatoEnBancaMenu();
        animarLineasConstruccionMenu(); 
    } else if (modoActual === "juego-original") {
        actualizarModoOriginal();
    }

    if (modoActual !== "menu" && modoActual !== "carga" && modoActual !== "hechiceros") {
        dibujarGatoEstilizado(jugadorX, jugadorY, skinEquipada);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- PANTALLA DE CARGA ---
function dibujarPantallaCargaNeon() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;

    if (progresoCarga < 100) progresoCarga += 1.5;

    // Los rayos caen y guardan las coordenadas de los botones del menú para "construirlos"
    if (Math.random() < 0.2 && progresoCarga < 100) {
        let botonDestino = botonesMenu[Math.floor(Math.random() * botonesMenu.length)];
        rayosConstruccion.push({
            x1: Math.random() * canvas.width, y1: 0,
            x2: botonDestino.x + Math.random() * botonDestino.w,
            y2: botonDestino.y + Math.random() * botonDestino.h,
            alfa: 1.0
        });
    }

    rayosConstruccion.forEach((r, idx) => {
        ctx.strokeStyle = `rgba(0, 255, 130, ${r.alfa})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
        r.alfa -= 0.08;
        if(r.alfa <= 0) rayosConstruccion.splice(idx, 1);
    });

    ctx.strokeStyle = "rgba(0, 255, 130, 0.2)";
    ctx.strokeRect(cx - 130, cy + 50, 260, 15);
    ctx.fillStyle = "#00ff82";
    ctx.fillRect(cx - 130, cy + 50, 2.6 * progresoCarga, 15);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px Courier New";
    ctx.textAlign = "center";
    ctx.fillText(`COMPILING GEOMETRY_CORE`, cx, cy - 10);
    ctx.font = "12px Courier New";
    ctx.fillStyle = "#00ff82";
    ctx.fillText(`f(x) = sin(θ) * core_matrix`, cx, cy + 25);

    if (progresoCarga >= 100) {
        cambiarPantalla('menu');
    }
}

// --- DIBUJAR LOS RECTÁNGULOS Y TEXTOS EN EL CANVAS (CORREGIDO) ---
function animarLineasConstruccionMenu() {
    let transcurrido = Date.now() - tiempoInicioMenu;
    let pct = Math.min(1, transcurrido / 800); 

    botonesMenu.forEach((btn) => {
        let anchoAnimado = btn.w * pct;
        
        // Caja de borde verde neón exacta a la foto
        ctx.strokeStyle = "#00ff82";
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + (btn.w - anchoAnimado)/2, btn.y, anchoAnimado, btn.h);

        // Si la caja ya terminó de expandirse por el rayo, pintamos el texto adentro
        if (pct >= 1) {
            ctx.fillStyle = "#00ff82";
            ctx.font = "bold 13px Courier New";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(btn.texto, btn.x + btn.w / 2, btn.y + btn.h / 2);
        }
    });
}

// --- BANCA ---
function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2;
    let cy = canvas.height / 2 - 130; 

    // Dibujo de la banca de madera
    ctx.fillStyle = "#7a431d"; ctx.fillRect(cx - 70, cy + 30, 140, 10); 
    ctx.fillStyle = "#5c3214"; ctx.fillRect(cx - 60, cy + 40, 8, 25); ctx.fillRect(cx + 52, cy + 40, 8, 25);   
    ctx.fillRect(cx - 65, cy + 10, 6, 20); ctx.fillRect(cx + 59, cy + 10, 6, 20);   
    ctx.fillRect(cx - 70, cy, 140, 12);      

    // Gato sobre la banca
    dibujarGatoEstilizado(cx, cy + 25, skinEquipada);
}

// --- GENERADOR DE SKIN EN FORMATO GATO REAL (CORREGIDO) ---
function dibujarGatoEstilizado(x, y, nombreSkin) {
    let data = SKINS_GATOS[nombreSkin] || SKINS_GATOS["Default Cat"];
    
    ctx.save();
    // Orejas de gato
    ctx.fillStyle = data.principal;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 20); ctx.lineTo(x - 18, y - 35); ctx.lineTo(x - 4, y - 24); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 14, y - 20); ctx.lineTo(x + 18, y - 35); ctx.lineTo(x + 4, y - 24); ctx.fill();

    // Cabeza y Cuerpo de gato
    ctx.beginPath(); ctx.arc(x, y - 14, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = data.pecho;
    ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Rostro personalizado según hechicero
    if (data.tipo === "gojo") {
        // Venda de ojos negra de Gojo Satoru
        ctx.fillStyle = "#16161a";
        ctx.fillRect(x - 14, y - 18, 28, 7);
        // Destello de ojos infinitos abajo de la venda
        ctx.fillStyle = "#00ffff";
        ctx.fillRect(x - 8, y - 11, 4, 3); ctx.fillRect(x + 4, y - 11, 4, 3);
    } else if (data.tipo === "yuji") {
        // Ojos y marcas faciales de Sukuna/Yuji
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - 8, y - 16, 4, 4); ctx.fillRect(x + 4, y - 16, 4, 4);
        ctx.strokeStyle = "#ff0055"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 8, y - 10); ctx.lineTo(x - 3, y - 10); ctx.stroke();
    } else {
        // Ojos Default
        ctx.fillStyle = data.ojos;
        ctx.fillRect(x - 7, y - 16, 3, 5); ctx.fillRect(x + 4, y - 16, 3, 5);
    }

    // Cola de gato animada
    let anguloCola = Math.sin(Date.now() * 0.005) * 0.3;
    ctx.translate(x - 8, y + 12);
    ctx.rotate(anguloCola);
    ctx.strokeStyle = data.principal;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(-10, -5, -12, -18); ctx.stroke();
    ctx.restore();
}

// --- ACTUALIZAR MODO ORIGINAL (DAÑO Y COLISIONES CORREGIDOS) ---
function actualizarModoOriginal() {
    // Dibujar Barra de Vida del Jefe Sukuna
    if (miniBossActivo) {
        let bx = canvas.width / 2;
        ctx.fillStyle = "#222"; ctx.fillRect(bx - 100, 40, 200, 14);
        ctx.fillStyle = jefeHitTimer > 0 ? "#ffffff" : "#ff0055"; // Parpadea blanco al recibir daño
        ctx.fillRect(bx - 100, 40, (miniBossHP / miniBossMaxHP) * 200, 14);
        
        if (jefeHitTimer > 0) jefeHitTimer--;

        // Movimiento del Jefe
        miniBossX += miniBossVX;
        if (miniBossX < 60 || miniBossX > canvas.width - 60) miniBossVX *= -1;

        // Renderizado del Cuadrado del Jefe
        ctx.fillStyle = jefeHitTimer > 0 ? "#fff" : "#ff3c3c";
        ctx.fillRect(miniBossX - 30, miniBossY, 60, 60);

        // Ataques del jefe caen
        if (Math.random() < 0.04) {
            balasCaendo.push({ x: miniBossX + (Math.random() - 0.5) * 40, y: miniBossY + 60, vy: 5 });
        }
    }

    // Balas del jugador (COLISIÓN REESTRUCTURADA EFECTIVA)
    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i];
        mb.y += mb.vy;
        ctx.fillRect(mb.x - 3, mb.y, 6, 16);

        // Verificar impacto real en la caja del Jefe
        if (miniBossActivo && mb.x >= miniBossX - 30 && mb.x <= miniBossX + 30 && mb.y >= miniBossY && mb.y <= miniBossY + 60) {
            miniBossHP -= 5; // Quita 5 puntos de vida
            jefeHitTimer = 3; // Activa flash visual
            playSound("hit");
            puntosPartida += 10;
            misBalas.splice(i, 1);
            
            if (miniBossHP <= 0) {
                miniBossActivo = false;
                puntosAcumulados += 150;
                alert("¡Sukuna ha sido exiliado!");
                volverAlMenuPrincipal();
            }
            continue;
        }

        if (mb.y < -20) misBalas.splice(i, 1);
    }

    // Balas enemigas dañan al jugador
    ctx.fillStyle = "#00ffff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy;
        ctx.fillRect(bc.x - 2, bc.y, 4, 12);
        
        if (bc.y >= jugadorY - 20 && bc.y <= jugadorY + 20 && bc.x >= jugadorX - 20 && bc.x <= jugadorX + 20) {
            balasCaendo.splice(idx, 1);
            jugadorHP -= 2;
            let txtHP = document.getElementById("txt-vida");
            if(txtHP) txtHP.innerText = jugadorHP;
            if (jugadorHP <= 0) {
                alert("Game Over - Tu gato se quedó sin energía.");
                volverAlMenuPrincipal();
            }
        }
        if (bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `<div class="item-habilidad" onclick="equiparSkin('${name}')">${name}</div>`).join('');
}

function equiparSkin(name) { skinEquipada = name; guardarProgresoLocal(); renderSkins(); }

function activarPausa(estado) {
    juegoPausado = estado;
    let mPausa = document.getElementById("menu-pausa");
    if(mPausa) mPausa.style.display = estado ? "flex" : "none";
}

function volverAlMenuPrincipal() {
    puntosAcumulados += puntosPartida;
    guardarProgresoLocal(); activarPausa(false); cambiarPantalla('menu');
}

window.onload = () => { 
    redimensionar(); 
    generarEstrellas(); 
    cargarProgresoGuardado(); 
    buclePrincipal(); 
};

