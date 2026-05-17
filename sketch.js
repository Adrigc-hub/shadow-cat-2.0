// --- CONFIGURACIÓN E INFRAESTRUCTURA DEL SISTEMA ---
let puntosAcumulados = 150;
let skinEquipada = "Default Cat";
let modoActual = "carga"; 
let juegoPausado = false;

// Audio Context y Sintetizador de Canción Integrado (Sin dependencias externas)
let audioCtx = null;
let notaSecuencia = 0;
let tiempoUltimaNota = 0;

const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", tipo: "default" },
    "Gojo Satoru": { principal: "#ffffff", pecho: "#121214", ojos: "#00d2ff", tipo: "gojo" },
    "Yuji Itadori": { principal: "#ff9494", pecho: "#260606", ojos: "#000000", tipo: "yuji" }
};

let HABILIDADES_TIENDA = [];

// Atributos y Vectores del Jugador / Proyectiles
let jugadorX = 200, jugadorY = 400, jugadorHP = 30;
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [], puntosPartida = 0;

// Variables de Oleadas y Jefes Reales (Sans Boss con Animaciones Complejas)
let jefeFase = "oleada"; 
let tiempoTransicionJefe = 0;
let miniBossActivo = false;
let miniBossHP = 150, miniBossMaxHP = 150, miniBossX = 300, miniBossY = 100, miniBossVX = 3;
let jefeHitTimer = 0;
let oscilacionSans = 0;

// Estructuras de Dance of Fire and Ice (Bloques pegados uno al otro)
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true; 
let camaraScrollX = 0, camaraScrollY = 0;

// Estructuras de Shoot the Box (Tiro Parabólico de Resorte Físico Completo)
let listaCajasShoot = [];
let cargandoTiroShoot = false;
let inicioToqueX = 0, inicioToqueY = 0, arrastreX = 0, arrastreY = 0;
let tiempoUltimaCajaShoot = 0;

// Elementos de Carga y Estética de Menú
let progresoCarga = 0;
let rayosConstruccion = [];
let botonesMenu = [];
let botonConstruccionCirc = {};
let tiempoInicioMenu = 0;

// --- VARIABLES DEL MOTOR DE CONSTRUCCIÓN Y SUB-TIPOS DE SUB-NIVELES ---
let nivelesCreados = [];
let busquedaFiltro = "";
let catalogoBloques = [];
let bloqueSeleccionado = -1; // -1 = Modo Arrastrar Mano
let scrollEditorX = 0;
let estaArrastrandoEditor = false;
let ultimoToqueEditorX = 0;
let modoPruebaActivo = false;
let tipoSubNivelEditor = "normal"; // "normal", "dance", "shoot"
let cancionSeleccionadaEditor = "Viento Maldito";

const SECCIONES_CONSTRUCCION = [
    "Energía Maldita", "Ladrillos Escuela", "Trampas Espinas", "Plataformas Neón", 
    "Suelos Metálicos", "Cajas de Madera", "Cristales Vacío", "Bancas Descanso", 
    "Portales Espacio", "Paredes Fortaleza"
];

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    actualizarPosicionesBotones();
}
window.addEventListener('resize', redimensionar);

function actualizarPosicionesBotones() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;
    botonesMenu = [
        { id: "juego-original", texto: "MODO ORIGINAL", x: cx - 130, y: cy - 70, w: 260, h: 45 },
        { id: "juego-ritmo", texto: "DANCE OF FIRE", x: cx - 130, y: cy - 10, w: 260, h: 45 },
        { id: "juego-shoot", texto: "SHOOT THE BOX", x: cx - 130, y: cy + 50, w: 260, h: 45 },
        { id: "hechiceros", texto: "SELECCIÓN DE SKINS", x: cx - 130, y: cy + 110, w: 260, h: 45 },
        { id: "tienda_mejoras", texto: "TIENDA DE MEJORAS", x: cx - 130, y: cy + 170, w: 260, h: 45 }
    ];
    botonConstruccionCirc = { cx: cx + 180, cy: cy + 50, r: 35 };
}

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<50; i++) estrellasFondo.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1 });
}

function inicializarCatalogoBloques() {
    catalogoBloques = []; let idGlobal = 0;
    SECCIONES_CONSTRUCCION.forEach((seccion, sIdx) => {
        let colores = ["#ff0055", "#4a4a4a", "#ffaa00", "#00ff82", "#00ffff", "#7a431d", "#a333ff", "#5c3214", "#0022ff", "#ff5500"];
        let simbolos = ["■", "🧱", "▲", "▰", "⚙", "📦", "❖", "▕", "🌀", "⧇"];
        for(let i = 1; i <= 100; i++) {
            catalogoBloques.push({ id: idGlobal++, seccion: seccion, nombre: `${seccion} B${i}`, color: colores[sIdx], simbolo: simbolos[sIdx] });
        }
    });
}

// Cargar Datos Remotos simulando archivo JSON integrado
async function cargarDatosConfig() {
    try {
        let res = await fetch('datos_juego.json');
        let data = await res.json();
        puntosAcumulados = data.puntosIniciales;
        HABILIDADES_TIENDA = data.habilidadesOriginales.map(h => ({...h, desc: "Habilidad defensiva/ofensiva", comprado: false}));
    } catch(e) {
        // Fallback robusto en caso de desarrollo local
        puntosAcumulados = 150;
        HABILIDADES_TIENDA = [{ id: "auto_aim", nombre: "Auto-Aim Legendario", costo: 1000000, comprado: false }];
    }
    
    // Carga complementaria desde LocalStorage para persistencia en iPad
    let local = localStorage.getItem("SHADOW_CAT_SAVE");
    if (local) {
        let parsed = JSON.parse(local);
        nivelesCreados = parsed.nivelesCreados || [];
        puntosAcumulados = parsed.puntosAcumulados || puntosAcumulados;
    }
}

function guardarProgresoTotal() {
    let obj = { nivelesCreados: nivelesCreados, puntosAcumulados: puntosAcumulados };
    localStorage.setItem("SHADOW_CAT_SAVE", JSON.stringify(obj));
}

// --- MANEJO DE FLUJOS DE SINTETIZADOR PARA LA MÚSICA ---
function reproducirNotaMusicaSintetizada() {
    if (!audioCtx) return;
    if (Date.now() - tiempoUltimaNota > 250) {
        tiempoUltimaNota = Date.now();
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        
        let frecuencias = [261.63, 293.66, 329.63, 392.00, 440.00]; // Melodía pentatónica retro de fondo
        osc.frequency.setValueAtTime(frecuencias[notaSecuencia % frecuencias.length], audioCtx.currentTime);
        osc.type = modoActual === "juego-ritmo" ? "square" : "triangle";
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
        notaSecuencia++;
    }
}

// --- CAMBIO DE VISTAS ---
function cambiarPantalla(destino) {
    document.getElementById("pantalla-hechiceros").style.display = "none";
    document.getElementById("pantalla-tienda").style.display = "none";
    document.getElementById("pantalla-construccion-raiz").style.display = "none";
    document.getElementById("pantalla-selector-tipo-construccion").style.display = "none";
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("editor-pausa-overlay").style.display = "none";

    juegoPausado = false; modoPruebaActivo = false; puntosPartida = 0; jugadorHP = 30;

    if (destino === 'menu') {
        modoActual = "menu"; tiempoInicioMenu = Date.now();
    } else if (destino === 'hechiceros') {
        modoActual = "hechiceros"; document.getElementById("pantalla-hechiceros").style.display = "flex"; renderSkins();
    } else if (destino === 'tienda_mejoras') {
        modoActual = "tienda"; document.getElementById("pantalla-tienda").style.display = "flex"; renderTienda();
    } else if (destino === 'menu_construccion') {
        modoActual = "construccion_raiz"; document.getElementById("pantalla-construccion-raiz").style.display = "flex"; actualizarListaNivelesHTML();
    } else if (destino === 'abrir_selector_tipo') {
        document.getElementById("pantalla-selector-tipo-construccion").style.display = "flex";
    } else {
        modoActual = destino;
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; balasCaendo = []; objetivosOriginales = [];

        if (destino === 'juego-original') {
            jefeFase = "oleada"; miniBossActivo = false;
            for (let i = 0; i < 5; i++) objetivosOriginales.push({ x: 100 + i * 140, y: 100, hp: 10 });
        }
        if (destino === 'juego-ritmo') iniciarMecanicaDanceOfFire();
        if (destino === 'juego-shoot') { listaCajasShoot = []; tiempoUltimaCajaShoot = Date.now(); }
    }
}

// --- PREPARACIÓN DE CONFIGURACIÓN DEL EDITOR POR SUB-TIPOS ---
function iniciarNuevoProyectoFlujo(tipo) {
    tipoSubNivelEditor = tipo;
    document.getElementById("pantalla-selector-tipo-construccion").style.display = "none";
    
    // Desplegar Tutorial Dinámico según Tipo elegido
    if (tipo === 'dance') {
        alert("📖 TUTORIAL DANCE OF FIRE:\nLos bloques se generan automáticamente PESTADOS uno al otro formando carriles continuos. Usa la paleta inferior para cambiar de carril táctil.");
    } else if (tipo === 'shoot') {
        alert("📖 TUTORIAL SHOOT THE BOX:\nPuedes colocar Spawners de cajas pesadas (Bloques Amarillos) y Obstáculos Dañinos (Bloques Rojos de Espinas).");
    } else {
        alert("📖 TUTORIAL ORIGINAL MOD:\nModo libre para colocar bloques de fortaleza y enemigos flotantes.");
    }

    modoActual = "editor_mapa";
    let nombreProyecto = prompt("Nombre de tu juego/nivel:", "Mi Nivel Custom");
    scrollEditorX = 0; bloqueSeleccionado = -1;
    
    let bloquesEstructuralesIniciales = [];
    if (tipo === 'dance') {
        // Genera bloques pegados continuos por defecto en la grilla para arrancar
        for(let i=0; i<15; i++) {
            bloquesEstructuralesIniciales.push({ gx: i, gy: 8, idBloque: 300 }); // Fila de plataformas neón pegadas
        }
    }

    nivelesCreados.push({
        nombre: nombreProyecto || "Nivel SpaceX Mod",
        tipo: tipoSubNivelEditor,
        bloques: bloquesEstructuralesIniciales
    });
    
    actualizarListaNivelesHTML();
    guardarProgresoTotal();
}

// --- CONFIGURACIÓN DE MECÁNICA CONTINUA DANCE OF FIRE ---
function iniciarMecanicaDanceOfFire() {
    bloquesRitmo = []; indiceBloqueActual = 0;
    let stX = 150; let stY = canvas.height / 2;
    // Pista de bloques pegados uniformemente
    for(let i=0; i<30; i++) {
        bloquesRitmo.push({ x: stX, y: stY });
        stX += 50; // Totalmente pegados basados en un tamaño de bloque de 50
        if (i > 0 && i % 6 === 0) stY += (Math.random() > 0.5 ? 50 : -50);
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y;
    hieloX = fuegoX + 50; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

function ejecutarGiroDanceOfFire() {
    let sig = bloquesRitmo[indiceBloqueActual + 1];
    if (sig) {
        let fx = pivoteFuego ? hieloX : fuegoX;
        let fy = pivoteFuego ? hieloY : fuegoY;
        let d = Math.sqrt(Math.pow(fx - sig.x, 2) + Math.pow(fy - sig.y, 2));
        
        if (d < 60) { // Tolerancia matemática correcta
            indiceBloqueActual++; puntosPartida += 10;
            if (pivoteFuego) { fuegoX = sig.x; fuegoY = sig.y; pivoteFuego = false; }
            else { hieloX = sig.x; hieloY = sig.y; pivoteFuego = true; }
            anguloPlaneta = Math.PI;
        } else {
            cambiarPantalla('menu');
        }
    }
}

// --- DETECCIÓN DE ENTRADAS ---
window.addEventListener('pointerdown', (e) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    if (modoActual === "carga" && progresoCarga >= 100) { cambiarPantalla('menu'); return; }

    if (modoActual === "menu") {
        botonesMenu.forEach(btn => {
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w && e.clientY >= btn.y && e.clientY <= btn.y + btn.h) cambiarPantalla(btn.id);
        });
        let distConst = Math.sqrt(Math.pow(e.clientX - botonConstruccionCirc.cx, 2) + Math.pow(e.clientY - botonConstruccionCirc.cy, 2));
        if (distConst <= botonConstruccionCirc.r) cambiarPantalla('menu_construccion');
        return;
    }

    if (modoActual === "editor_mapa") {
        // Intercepción de Botón Pausa del Editor (II)
        if (e.clientX > canvas.width - 55 && e.clientY < 45) {
            document.getElementById("editor-pausa-overlay").style.display = "flex"; return;
        }
        // Intercepción de Botón Probar del Editor (▶)
        if (e.clientX > canvas.width - 110 && e.clientX <= canvas.width - 55 && e.clientY < 45) {
            iniciarModoPruebaTotal(); return;
        }

        // Barra de Catálogo inferior
        if (e.clientY > canvas.height - 90) {
            if (e.clientX < 80) bloqueSeleccionado = -1; // Mano libre
            else {
                let clk = Math.floor((e.clientX - 95) / 45);
                if (clk >= 0 && clk < 10) bloqueSeleccionado = clk * 100;
            }
            return;
        }

        if (bloqueSeleccionado === -1) {
            estaArrastrandoEditor = true; ultimoToqueEditorX = e.clientX;
        } else {
            let gx = Math.floor((e.clientX + scrollEditorX) / 40);
            let gy = Math.floor(e.clientY / 40);
            let lvl = nivelesCreados[nivelesCreados.length - 1];
            lvl.bloques = lvl.bloques.filter(b => b.gx !== gx || b.gy !== gy);
            lvl.bloques.push({ gx: gx, gy: gy, idBloque: bloqueSeleccionado });
        }
        return;
    }

    if (modoPruebaActivo) {
        if (e.clientX > canvas.width - 120 && e.clientY < 45) {
            modoPruebaActivo = false; modoActual = "editor_mapa"; return;
        }
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -12 });
        return;
    }

    if (modoActual === "juego-original" && jefeFase !== "animacion_secreta") {
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -14 });
    }
    if (modoActual === "juego-ritmo") ejecutarGiroDanceOfFire();
    if (modoActual === "juego-shoot") {
        if (Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2)) < 60) {
            cargandoTiroShoot = true; inicioToqueX = e.clientX; inicioToqueY = e.clientY;
            arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (modoActual === "editor_mapa" && estaArrastrandoEditor) {
        let delta = e.clientX - ultimoToqueEditorX;
        scrollEditorX = Math.max(0, scrollEditorX - delta);
        ultimoToqueEditorX = e.clientX;
        return;
    }
    if (modoActual === "juego-original" || modoActual === "juego-ritmo" || modoPruebaActivo) {
        jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    }
    if (modoActual === "juego-shoot" && cargandoTiroShoot) { arrastreX = e.clientX; arrastreY = e.clientY; }
});

window.addEventListener('pointerup', () => {
    estaArrastrandoEditor = false;
    if (modoActual === "juego-shoot" && cargandoTiroShoot) {
        cargandoTiroShoot = false;
        misBalas.push({ x: jugadorX, y: jugadorY - 15, vx: (inicioToqueX - arrastreX) * 0.16, vy: (inicioToqueY - arrastreY) * 0.16, tipo: "shoot" });
    }
});

// --- RENDERIZADO DE MODOS ACTIVOS ---
function actualizarModoOriginalMatematico() {
    reproducirNotaMusicaSintetizada();

    if (jefeFase === "oleada") {
        ctx.fillStyle = "#e67e22";
        objetivosOriginales.forEach(obj => { ctx.fillRect(obj.x, obj.y, 35, 35); });
        if (objetivosOriginales.length === 0) { jefeFase = "animacion_secreta"; tiempoTransicionJefe = Date.now(); }
    } 
    else if (jefeFase === "animacion_secreta") {
        let diff = Date.now() - tiempoTransicionJefe;
        ctx.fillStyle = `rgba(255,0,0, ${Math.sin(diff*0.01)})`;
        ctx.font = "bold 24px Courier New"; ctx.textAlign = "center";
        ctx.fillText("⚠️ SANS BOSS HA SIDO INVOCADO ⚠️", canvas.width/2, canvas.height/2);
        if (diff > 3000) { jefeFase = "boss_secreto"; miniBossActivo = true; }
    } 
    else if (jefeFase === "boss_secreto" && miniBossActivo) {
        oscilacionSans += 0.05;
        miniBossX += miniBossVX; if (miniBossX < 80 || miniBossX > canvas.width - 80) miniBossVX *= -1;
        let dynamicallyY = miniBossY + Math.sin(oscilacionSans) * 15;

        // --- DIBUJO REAL DETALLADO DE SANS BOSS ---
        let sx = miniBossX; let sy = dynamicallyY;
        ctx.fillStyle = "#ffffff"; ctx.fillRect(sx - 20, sy - 20, 40, 30); // Cabeza Blanca
        ctx.fillStyle = "#0000ff"; ctx.fillRect(sx - 25, sy + 10, 50, 45); // Chamarra Azul
        ctx.fillStyle = "#000000"; ctx.fillRect(sx - 8, sy - 10, 6, 6);   // Ojo Izquierdo
        // Ojo de Sans parpadeante azul/megalovania
        ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? "#00ffff" : "#000000";
        ctx.fillRect(sx + 4, sy - 10, 6, 6);
        ctx.fillStyle = "#000000"; ctx.fillRect(sx - 10, sy + 2, 20, 3);   // Sonrisa esqueleto

        // HUD de Vida de Sans
        ctx.fillStyle = "#222"; ctx.fillRect(canvas.width/2 - 100, 30, 200, 10);
        ctx.fillStyle = jefeHitTimer > 0 ? "#fff" : "#00ffff"; ctx.fillRect(canvas.width/2 - 100, 30, (miniBossHP/miniBossMaxHP)*200, 10);
        if (jefeHitTimer > 0) jefeHitTimer--;

        if (Math.random() < 0.06) balasCaendo.push({ x: miniBossX, y: dynamicallyY + 55, vy: 5 });
    }

    // Balas jugador colisiones
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let b = misBalas[i]; b.y += b.vy; ctx.fillStyle = "#a333ff"; ctx.fillRect(b.x - 3, b.y, 6, 15);
        if (jefeFase === "oleada") {
            objetivosOriginales.forEach((o, oIdx) => {
                if (b.x >= o.x && b.x <= o.x + 35 && b.y >= o.y && b.y <= o.y + 35) { objetivosOriginales.splice(oIdx, 1); misBalas.splice(i, 1); puntosAcumulados += 10; }
            });
        }
        if (jefeFase === "boss_secreto" && b.x >= miniBossX - 25 && b.x <= miniBossX + 25 && b.y >= miniBossY && b.y <= miniBossY + 60) {
            miniBossHP -= 5; jefeHitTimer = 3; misBalas.splice(i, 1);
            if (miniBossHP <= 0) { miniBossActivo = false; cambiarPantalla('menu'); }
        }
    }

    // Balas enemigas
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy; ctx.fillStyle = "#00ffff"; ctx.fillRect(bc.x, bc.y, 5, 12);
        if (bc.y >= jugadorY - 15 && bc.y <= jugadorY + 15 && bc.x >= jugadorX - 15 && bc.x <= jugadorX + 15) { balasCaendo.splice(idx, 1); jugadorHP -= 2; }
    });
}

function actualizarModoRitmoMatematico() {
    reproducirNotaMusicaSintetizada();
    anguloPlaneta += 0.08;
    let cx = pivoteFuego ? fuegoX : hieloX; let cy = pivoteFuego ? fuegoY : hieloY;
    if (pivoteFuego) { hieloX = cx + Math.cos(anguloPlaneta)*50; hieloY = cy + Math.sin(anguloPlaneta)*50; }
    else { fuegoX = cx + Math.cos(anguloPlaneta)*50; fuegoY = cy + Math.sin(anguloPlaneta)*50; }

    let targetX = pivoteFuego ? hieloX : fuegoX; let targetY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (targetX - camaraScrollX - canvas.width/2) * 0.1;
    camaraScrollY += (targetY - camaraScrollY - canvas.height/2) * 0.1;

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);
    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = idx <= indiceBloqueActual ? "#27ae60" : "#2c3e50";
        ctx.fillRect(bl.x, bl.y, 48, 48); // Bloques pegados continuos visibles
    });
    ctx.fillStyle = "#ff3c3c"; ctx.beginPath(); ctx.arc(fuegoX + 24, fuegoY + 24, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(hieloX + 24, hieloY + 24, 10, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

function actualizarModoShootMatematico() {
    if (Date.now() - tiempoUltimaCajaShoot > 1500) {
        tiempoUltimaCajaShoot = Date.now();
        listaCajasShoot.push({ x: Math.random()*(canvas.width - 100) + 50, y: -40 });
    }
    if (cargandoTiroShoot) {
        ctx.strokeStyle = "#ffaa00"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(jugadorX, jugadorY - 15); ctx.lineTo(jugadorX + (inicioToqueX - arrastreX), (jugadorY - 15) + (inicioToqueY - arrastreY)); ctx.stroke();
    }
    ctx.fillStyle = "#f1c40f";
    listaCajasShoot.forEach((c, idx) => { c.y += 3; ctx.fillRect(c.x, c.y, 40, 40); if(c.y > canvas.height) listaCajasShoot.splice(idx, 1); });

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let b = misBalas[i]; if (b.tipo === "shoot") {
            b.x += b.vx; b.y += b.vy; b.vy += 0.22; ctx.fillStyle = "#9b59b6"; ctx.fillRect(b.x, b.y, 8, 8);
            listaCajasShoot.forEach((c, cIdx) => {
                if (b.x >= c.x && b.x <= c.x + 40 && b.y >= c.y && b.y <= c.y + 40) { listaCajasShoot.splice(cIdx, 1); misBalas.splice(i, 1); puntosAcumulados += 15; }
            });
        }
    }
}

// --- VISUALIZADOR DEL EDITOR GENERAL ---
function dibujarPantallaEditorCompleto() {
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height - 90); ctx.stroke(); }
    
    let lvlActivo = nivelesCreados[nivelesCreados.length - 1];
    if (lvlActivo) {
        lvlActivo.bloques.forEach(b => {
            let def = catalogoBloques[b.idBloque] || catalogoBloques[0];
            let rx = b.gx * 40 - scrollEditorX;
            ctx.fillStyle = def.color; ctx.fillRect(rx + 1, b.gy * 40 + 1, 38, 38);
            ctx.fillStyle = "#fff"; ctx.font = "10px Arial"; ctx.fillText(def.simbolo, rx + 15, b.gy * 40 + 24);
        });
    }

    // Barra inferior
    ctx.fillStyle = "#05050a"; ctx.fillRect(0, canvas.height - 90, canvas.width, 90);
    ctx.fillStyle = bloqueSeleccionado === -1 ? "#00ff82" : "#222"; ctx.fillRect(10, canvas.height - 75, 75, 60);
    ctx.fillStyle = bloqueSeleccionado === -1 ? "#000" : "#fff"; ctx.font = "9px Courier New"; ctx.fillText("✋ MOVER", 22, canvas.height - 40);

    for(let i=0; i<10; i++) {
        let bl = catalogoBloques[i * 100]; let bx = 100 + i * 45;
        ctx.fillStyle = bl.color; ctx.fillRect(bx, canvas.height - 75, 38, 38);
        if (bloqueSeleccionado === i * 100) { ctx.strokeStyle = "#fff"; ctx.strokeRect(bx-2, canvas.height - 77, 42, 42); }
    }

    // Botones de control nativos vectoriales superiores
    ctx.fillStyle = "#ff3c3c"; ctx.fillRect(canvas.width - 50, 10, 40, 30); // Pausa
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px Arial"; ctx.fillText("II", canvas.width - 34, 30);

    ctx.fillStyle = "#00ff82"; ctx.fillRect(canvas.width - 100, 10, 40, 30); // Play Triángulo
    ctx.fillStyle = "#000"; ctx.font = "bold 12px Arial"; ctx.fillText("▶", canvas.width - 84, 30);
}

// --- MODO PRUEBA INTEGRADO PARA PROBAR TUS NIVELES ---
function iniciarModoPruebaTotal() {
    modoPruebaActivo = true; jugadorX = 150; jugadorY = canvas.height - 160; misBalas = [];
}

function renderizarModoPruebaGrafica() {
    let lvlActivo = nivelesCreados[nivelesCreados.length - 1];
    if (lvlActivo) {
        lvlActivo.bloques.forEach(b => {
            let def = catalogoBloques[b.idBloque] || catalogoBloques[0];
            ctx.fillStyle = def.color; ctx.fillRect(b.gx * 40, b.gy * 40, 40, 40);
        });
    }
    dibujarGatoEstilizado(jugadorX, jugadorY, skinEquipada);
    
    ctx.fillStyle = "#ff3c3c"; ctx.fillRect(canvas.width - 130, 10, 120, 30);
    ctx.fillStyle = "#fff"; ctx.font = "11px Courier New"; ctx.fillText("CERRAR PRUEBA", canvas.width - 120, 28);
}

// --- BUCLE PRINCIPAL ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.12)"; estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "carga") {
        let cx = canvas.width / 2; let cy = canvas.height / 2;
        if (progresoCarga < 100) progresoCarga += 1.2;
        
        // Rayitos de compilación restaurados mediante loops matemáticos p5/canvas directos
        if (Math.random() < 0.3) {
            ctx.strokeStyle = "#00ff82"; ctx.beginPath();
            ctx.moveTo(Math.random()*canvas.width, 0); ctx.lineTo(cx + (Math.random()-0.5)*200, cy); ctx.stroke();
        }

        ctx.fillStyle = "#00ff82"; ctx.fillRect(cx - 130, cy + 50, 2.6 * progresoCarga, 12);
        if (progresoCarga >= 100) cambiarPantalla('menu');
    } 
    else if (modoActual === "menu") {
        dibujarGatoEnBancaMenu(); animarLineasConstruccionMenu(); dibujarBotonConstruccionCircular();
    } 
    else if (modoActual === "juego-original") actualizarModoOriginalMatematico();
    else if (modoActual === "juego-ritmo") actualizarModoRitmoMatematico();
    else if (modoActual === "juego-shoot") actualizarModoShootMatematico();
    else if (modoActual === "editor_mapa") {
        if (modoPruebaActivo) renderizarModoPruebaGrafica();
        else dibujarPantallaEditorCompleto();
    }

    if ((modoActual === "juego-original" || modoActual === "juego-shoot") && modoActual !== "editor_mapa") {
        dibujarGatoEstilizado(jugadorX, jugadorY, skinEquipada);
    }

    requestAnimationFrame(buclePrincipal);
}

function animarLineasConstruccionMenu() {
    let elapsed = Date.now() - tiempoInicioMenu; let pct = Math.min(1, elapsed / 700);
    botonesMenu.forEach(btn => {
        ctx.strokeStyle = "#00ff82"; ctx.strokeRect(btn.x, btn.y, btn.w * pct, btn.h);
        if (pct >= 1) { ctx.fillStyle = "#00ff82"; ctx.font = "11px Courier New"; ctx.fillText(btn.texto, btn.x + 30, btn.y + 26); }
    });
}

function dibujarBotonConstruccionCircular() {
    let bc = botonConstruccionCirc;
    ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bc.cx, bc.cy, bc.r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.font = "10px Arial"; ctx.fillText("🛠️", bc.cx - 8, bc.cy + 4);
    ctx.fillStyle = "#00ff82"; ctx.font = "9px Courier New"; ctx.fillText("CONSTRUCCIÓN", bc.cx - 30, bc.cy + bc.r + 15);
}

function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2; ctx.fillStyle = "#5c3214"; ctx.fillRect(cx - 60, canvas.height/2 - 100, 120, 8);
    dibujarGatoEstilizado(cx, canvas.height/2 - 115, skinEquipada);
}

function dibujarGatoEstilizado(x, y, name) {
    let d = SKINS_GATOS[name] || SKINS_GATOS["Default Cat"];
    ctx.fillStyle = d.principal; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = d.pecho; ctx.fillRect(x - 6, y + 4, 12, 10);
    ctx.fillStyle = d.ojos; ctx.fillRect(x - 5, y - 4, 3, 4); ctx.fillRect(x + 2, y - 4, 3, 4);
}

function renderSkins() {
    document.getElementById("contenedor-hechiceros").innerHTML = Object.keys(SKINS_GATOS).map(n => `<div class="item-habilidad" onclick="skinEquipada='${n}'; cambiarPantalla('menu');">${n}</div>`).join('');
}
function renderTienda() {
    document.getElementById("contenedor-tienda").innerHTML = HABILIDADES_TIENDA.map((h, i) => `<div class="item-tienda"><span>${h.nombre}</span><button class="btn-comprar" onclick="comprarHabilidad(${i})">${h.costo} PTS</button></div>`).join('');
}
function comprarHabilidad(i) { if(puntosAcumulados >= HABILIDADES_TIENDA[i].costo) { puntosAcumulados -= HABILIDADES_TIENDA[i].costo; alert("Adquirido"); cambiarPantalla('menu'); } }
function accionarLupa() { let s = prompt("Buscar:"); if(s) { busquedaFiltro = s.toLowerCase(); actualizarListaNivelesHTML(); } }
function mostrarRecientes() { busquedaFiltro = "reciente"; actualizarListaNivelesHTML(); }
function guardarYSalirEditorTotal() { guardarProgresoTotal(); cambiarPantalla('menu_construccion'); }
function cerrarOverlayPausaEditor() { document.getElementById("editor-pausa-overlay").style.display = "none"; }

function actualizarListaNivelesHTML() {
    let m = nivelesCreados.map(n => `<div style="padding:8px; border-bottom:1px solid #333;">📦 ${n.nombre} (${n.tipo.toUpperCase()})</div>`).join('');
    document.getElementById("lista-proyectos").innerHTML = m || "<small>No hay mapas custom creados.</small>";
}

window.onload = () => { inicializarCatalogoBloques(); cargarDatosConfig(); redimensionar(); generarEstrellas(); buclePrincipal(); };
