// --- BASE DE DATOS Y GUARDADO ESTILO JSON (LOCALSTORAGE) ---
let puntosAcumulados = 150;
let skinEquipada = "Default Cat";
let modoActual = "carga"; 
let juegoPausado = false;
let audioCtx = null;

// Configuración de Skins Gato Reales
const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", tipo: "default" },
    "Gojo Satoru": { principal: "#ffffff", pecho: "#121214", ojos: "#00d2ff", tipo: "gojo" },
    "Yuji Itadori": { principal: "#ff9494", pecho: "#260606", ojos: "#000000", tipo: "yuji" }
}

// 10 Habilidades de la Tienda Restauradas por Completo
let HABILIDADES_TIENDA = [
    { id: "escudo_temp", nombre: "Escudo Temporal (Activable)", desc: "Genera un escudo temporal por 5s.", costo: 50, comprado: false },
    { id: "escudo_auto", nombre: "Escudo Automático (Pasiva)", desc: "Genera un escudo cada 10 balas esquivadas.", costo: 30, comprado: false },
    { id: "auto_aim", nombre: "Auto-Aim Legendario", desc: "Impacto garantizado sin apuntar.", costo: 1000000, comprado: false },
    { id: "rafaga_maldita", nombre: "Ráfaga Maldita", desc: "Dispara dos balas extra por los lados.", costo: 120, comprado: false },
    { id: "destello_negro", nombre: "Probabilidad de Destello Negro", desc: "X2 de daño crítico aleatorio.", costo: 200, comprado: false },
    { id: "vuelo_libre", nombre: "Vuelo de Pájaro", desc: "Permite mover al gato libremente en el eje Y.", costo: 180, comprado: false },
    { id: "recarga_rapida", nombre: "Recarga de Hechicero", desc: "Reduce el tiempo de espera entre disparos.", costo: 90, comprado: false },
    { id: "imantado", nombre: "Imán de Puntos", desc: "Atrae las monedas y energía maldita.", costo: 75, comprado: false },
    { id: "curacion_reversa", nombre: "Técnica de Maldición Inversa", desc: "Recupera 5 HP al eliminar un mini-boss.", costo: 300, comprado: false },
    { id: "seis_ojos", nombre: "Percepción de los Seis Ojos", desc: "Ralentiza el tiempo de los proyectiles enemigos.", costo: 500, comprado: false }
];

// Variables de Estado del Jugador
let jugadorX = 200, jugadorY = 400, jugadorHP = 30;
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [], puntosPartida = 0;

// Variables de Oleadas y Jefes del Modo Original
let tiempoInicioPartida = 0;
let jefeFase = "oleada"; // "oleada", "animacion_secreta", "boss_secreto"
let tiempoTransicionJefe = 0;
let miniBossActivo = false;
let miniBossHP = 100, miniBossMaxHP = 100, miniBossX = 200, miniBossY = 90, miniBossVX = 2;
let jefeHitTimer = 0;

// Mecánicas Reactivadas Completa de Dance of Fire
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true; 
let camaraScrollX = 0, camaraScrollY = 0;

// Mecánicas Reactivadas Completa de Shoot the Box
let listaCajasShoot = [];
let cargandoTiroShoot = false;
let inicioToqueX = 0, inicioToqueY = 0, arrastreX = 0, arrastreY = 0;
let tiempoUltimaCajaShoot = 0;

// Pantalla de Carga y Animación de Líneas del Menú Principal
let progresoCarga = 0;
let rayosConstruccion = [];
let botonesMenu = [];
let botonConstruccionCirc = {};
let tiempoInicioMenu = 0;

// --- VARIABLES DEL MOTOR DE CONSTRUCCIÓN Y EDITOR (100% REESTRUCTURADO) ---
let nivelesCreados = [];
let busquedaFiltro = "";
let catalogoBloques = [];
let bloqueSeleccionado = -1; // -1 significa NINGUNO (Modo Arrastrar Pantalla activo)
let nivelEnEdicion = { nombre: "Nuevo Nivel", bloques: [] };
let scrollEditorX = 0;
let estaArrastrandoEditor = false;
let ultimoToqueEditorX = 0;
let modoPruebaActivo = false;
let nivelAProbar = null;

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
    let cx = canvas.width / 2;
    let cy = canvas.height / 2;
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
    for(let i=0; i<40; i++) estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, size: Math.random()*2+1 });
}

// Inicializar Catálogo Masivo de 1,000 Bloques (10 Secciones de 100)
function inicializarCatalogoBloques() {
    catalogoBloques = [];
    let idGlobal = 0;
    SECCIONES_CONSTRUCCION.forEach((seccion, sIdx) => {
        let colores = ["#ff0055", "#4a4a4a", "#ffaa00", "#00ff82", "#00ffff", "#7a431d", "#a333ff", "#5c3214", "#0022ff", "#333333"];
        let simbolos = ["■", "▤", "▲", "▰", "⚙", "⧇", "❖", "▕", "🌀", "🧱"];
        for(let i = 1; i <= 100; i++) {
            catalogoBloques.push({
                id: idGlobal++,
                seccion: seccion,
                nombre: `${seccion} Bloque ${i}`,
                color: colores[sIdx],
                simbolo: simbolos[sIdx]
            });
        }
    });
}

// Cargar y Guardar Datos Simulando Estructura JSON en LocalStorage
function cargarDatosSistema() {
    let raw = localStorage.getItem("SHADOW_CAT_JSON_DATA");
    if (raw) {
        let data = JSON.parse(raw);
        puntosAcumulados = data.puntosAcumulados || 0;
        skinEquipada = data.skinEquipada || "Default Cat";
        nivelesCreados = data.nivelesCreados || [];
        if (data.habilidades) HABILIDADES_TIENDA = data.habilidades;
    }
}

function guardarDatosSistema() {
    let objetoJSON = {
        puntosAcumulados: puntosAcumulados,
        skinEquipada: skinEquipada,
        nivelesCreados: nivelesCreados,
        habilidades: HABILIDADES_TIENDA
    };
    localStorage.setItem("SHADOW_CAT_JSON_DATA", JSON.stringify(objetoJSON));
}

function cambiarPantalla(destino) {
    document.getElementById("pantalla-hechiceros").style.display = "none";
    document.getElementById("pantalla-tienda").style.display = "none";
    document.getElementById("pantalla-construccion-raiz").style.display = "none";
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("editor-pausa-overlay").style.display = "none";

    juegoPausado = false; modoPruebaActivo = false; puntosPartida = 0; jugadorHP = 30;

    if (destino === 'menu') {
        modoActual = "menu";
        tiempoInicioMenu = Date.now();
    } else if (destino === 'hechiceros') {
        modoActual = "hechiceros";
        document.getElementById("pantalla-hechiceros").style.display = "flex";
        renderSkins();
    } else if (destino === 'tienda_mejoras') {
        modoActual = "tienda";
        document.getElementById("pantalla-tienda").style.display = "flex";
        renderTienda();
    } else if (destino === 'menu_construccion') {
        modoActual = "construccion_raiz";
        document.getElementById("pantalla-construccion-raiz").style.display = "flex";
        actualizarListaNivelesHTML();
    } else if (destino === 'editor_nuevo') {
        modoActual = "editor_mapa";
        nivelEnEdicion = { nombre: "Nivel SpaceX " + (nivelesCreados.length + 1), bloques: [] };
        scrollEditorX = 0; bloqueSeleccionado = -1;
    } else {
        modoActual = destino;
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; balasCaendo = []; objetivosOriginales = [];

        if (destino === 'juego-original') {
            jefeFase = "oleada";
            miniBossActivo = false;
            tiempoInicioPartida = Date.now();
            // Generar esbirros iniciales
            for (let i = 0; i < 5; i++) {
                objetivosOriginales.push({ x: 50 + Math.random() * (canvas.width - 100), y: 50 + Math.random() * 150, hp: 10 });
            }
        }
        if (destino === 'juego-ritmo') generarCaminoBloquesRitmo();
        if (destino === 'juego-shoot') {
            listaCajasShoot = [];
            tiempoUltimaCajaShoot = Date.now();
        }
    }
}

// --- CONFIGURACIÓN DE GESTOS TÁCTILES Y ARRASTRES ---
window.addEventListener('pointerdown', (e) => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    if (modoActual === "carga" && progresoCarga >= 100) { cambiarPantalla('menu'); return; }

    if (modoActual === "menu") {
        botonesMenu.forEach(btn => {
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w && e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
                cambiarPantalla(btn.id);
            }
        });
        let distConst = Math.sqrt(Math.pow(e.clientX - botonConstruccionCirc.cx, 2) + Math.pow(e.clientY - botonConstruccionCirc.cy, 2));
        if (distConst <= botonConstruccionCirc.r) cambiarPantalla('menu_construccion');
        return;
    }

    if (modoActual === "editor_mapa") {
        // Botón Pausa del Editor (Arriba a la derecha)
        if (e.clientX > canvas.width - 60 && e.clientY < 50) {
            document.getElementById("editor-pausa-overlay").style.display = "flex";
            return;
        }
        // Botón Probar del Editor (Triángulo superior derecho)
        if (e.clientX > canvas.width - 120 && e.clientX <= canvas.width - 70 && e.clientY < 50) {
            iniciarPruebaNivelDirecta();
            return;
        }

        // Si toca la barra inferior del catálogo
        if (e.clientY > canvas.height - 90) {
            if (e.clientX < 80) {
                bloqueSeleccionado = -1; // Cambiar a modo Mano/Arrastrar
            } else {
                let idxClic = Math.floor((e.clientX - 90) / 45);
                if (idxClic >= 0 && idxClic < 10) bloqueSeleccionado = idxClic * 100;
            }
            return;
        }

        // Acción en el lienzo del mapa
        if (bloqueSeleccionado === -1) {
            estaArrastrandoEditor = true;
            ultimoToqueEditorX = e.clientX;
        } else {
            let gridX = Math.floor((e.clientX + scrollEditorX) / 40);
            let gridY = Math.floor(e.clientY / 40);
            nivelEnEdicion.bloques = nivelEnEdicion.bloques.filter(b => b.gx !== gridX || b.gy !== gridY);
            nivelEnEdicion.bloques.push({ gx: gridX, gy: gridY, idBloque: bloqueSeleccionado });
        }
        return;
    }

    if (modoPruebaActivo) {
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -12 });
        return;
    }

    if (modoActual === "juego-original" && jefeFase !== "animacion_secreta") {
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -14 });
    }

    if (modoActual === "juego-ritmo") {
        ejecutarGiroDanceOfFire();
    }

    if (modoActual === "juego-shoot") {
        if (Math.sqrt(Math.pow(e.clientX - jugadorX, 2) + Math.pow(e.clientY - jugadorY, 2)) < 60) {
            cargandoTiroShoot = true;
            inicioToqueX = e.clientX; inicioToqueY = e.clientY;
            arrastreX = e.clientX; arrastreY = e.clientY;
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (modoActual === "editor_mapa" && estaArrastrandoEditor) {
        let deltaX = e.clientX - ultimoToqueEditorX;
        scrollEditorX = Math.max(0, scrollEditorX - deltaX);
        ultimoToqueEditorX = e.clientX;
        return;
    }

    if (modoActual === "juego-original" || modoActual === "juego-ritmo" || modoPruebaActivo) {
        jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    }

    if (modoActual === "juego-shoot" && cargandoTiroShoot) {
        arrastreX = e.clientX; arrastreY = e.clientY;
    }
});

window.addEventListener('pointerup', () => {
    estaArrastrandoEditor = false;
    if (modoActual === "juego-shoot" && cargandoTiroShoot) {
        cargandoTiroShoot = false;
        misBalas.push({ x: jugadorX, y: jugadorY - 15, vx: (inicioToqueX - arrastreX) * 0.15, vy: (inicioToqueY - arrastreY) * 0.15, tipo: "shoot" });
    }
});

// --- OPERATORIA DANCE OF FIRE AND ICE RESTAURADA ---
function generarCaminoBloquesRitmo() {
    bloquesRitmo = []; indiceBloqueActual = 0; 
    let cx = window.innerWidth / 2 - 100; let cy = window.innerHeight / 2 + 100;
    for(let i=0; i<25; i++) { 
        bloquesRitmo.push({ x: cx, y: cy }); 
        cx += 110; 
        if(i % 5 === 0 && i > 0) cy += (Math.random() > 0.5 ? 90 : -90); 
    }
    fuegoX = bloquesRitmo[0].x; fuegoY = bloquesRitmo[0].y; 
    hieloX = fuegoX + 60; hieloY = fuegoY; pivoteFuego = true; anguloPlaneta = 0;
}

function ejecutarGiroDanceOfFire() {
    let proximo = bloquesRitmo[indiceBloqueActual + 1];
    if (proximo) {
        let esfx = pivoteFuego ? hieloX : fuegoX;
        let esfy = pivoteFuego ? hieloY : fuegoY;
        let dist = Math.sqrt(Math.pow(esfx - proximo.x, 2) + Math.pow(esfy - proximo.y, 2));

        if (dist <= 65) {
            indiceBloqueActual++;
            puntosPartida += 20;
            if (pivoteFuego) { fuegoX = proximo.x; fuegoY = proximo.y; pivoteFuego = false; }
            else { hieloX = proximo.x; hieloY = proximo.y; pivoteFuego = true; }
            anguloPlaneta = Math.PI;
            if (indiceBloqueActual >= bloquesRitmo.length - 1) {
                alert("¡Nivel Ritmo Completado!");
                volverAlMenuPrincipal();
            }
        } else {
            alert("¡Fallo de ritmo catastrófico!");
            volverAlMenuPrincipal();
        }
    }
}

function actualizarModoRitmo() {
    anguloPlaneta += 0.07;
    let centroX = pivoteFuego ? fuegoX : hieloX;
    let centroY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroX + Math.cos(anguloPlaneta) * 55;
        hieloY = centroY + Math.sin(anguloPlaneta) * 55;
    } else {
        fuegoX = centroX + Math.cos(anguloPlaneta) * 55;
        fuegoY = centroY + Math.sin(anguloPlaneta) * 55;
    }

    let focoX = pivoteFuego ? hieloX : fuegoX;
    let focoY = pivoteFuego ? hieloY : fuegoY;
    camaraScrollX += (focoX - camaraScrollX - canvas.width / 2) * 0.1;
    camaraScrollY += (focoY - camaraScrollY - canvas.height / 2) * 0.1;

    ctx.save(); ctx.translate(-camaraScrollX, -camaraScrollY);
    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx <= indiceBloqueActual) ? "#4a127a" : "#222233";
        ctx.fillRect(bl.x - 20, bl.y - 20, 40, 40);
    });
    ctx.fillStyle = "#ff2200"; ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(hieloX, hieloY, 10, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// --- OPERATORIA SHOOT THE BOX RESTAURADA ---
function actualizarModoShoot() {
    if (Date.now() - tiempoUltimaCajaShoot > 1400) {
        tiempoUltimaCajaShoot = Date.now();
        listaCajasShoot.push({ x: 60 + Math.random() * (canvas.width - 120), y: -40, w: 40, h: 40 });
    }

    // Dibujar resorte de apuntado táctil
    if (cargandoTiroShoot) {
        ctx.strokeStyle = "#ffaa00"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(jugadorX, jugadorY - 15); ctx.lineTo(jugadorX + (inicioToqueX - arrastreX), (jugadorY - 15) + (inicioToqueY - arrastreY)); ctx.stroke();
    }

    // Actualizar cajas
    ctx.fillStyle = "#ffcc00";
    listaCajasShoot.forEach((c, cIdx) => {
        c.y += 2.5;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        if (c.y > canvas.height) { listaCajasShoot.splice(cIdx, 1); jugadorHP -= 5; }
    });

    // Actualizar trayectorias físicas de las balas
    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let b = misBalas[i];
        if (b.tipo === "shoot") {
            b.x += b.vx; b.y += b.vy; b.vy += 0.2; // Gravedad simulada
            ctx.fillRect(b.x - 4, b.y - 4, 8, 8);

            listaCajasShoot.forEach((c, cIdx) => {
                if (b.x >= c.x && b.x <= c.x + c.w && b.y >= c.y && b.y <= c.y + c.h) {
                    listaCajasShoot.splice(cIdx, 1);
                    misBalas.splice(i, 1);
                    puntosPartida += 15;
                }
            });
        }
    }
}

// --- OPERATORIA MODO ORIGINAL: ENEMIGOS -> ANIMACIÓN -> JEFE SECRETO ---
function actualizarModoOriginal() {
    // FASE 1: Esbirros iniciales antes del Boss
    if (jefeFase === "oleada") {
        ctx.fillStyle = "#ffcc00";
        objetivosOriginales.forEach((obj, idx) => {
            ctx.fillRect(obj.x, obj.y, 30, 30);
            if (Math.random() < 0.005) balasCaendo.push({ x: obj.x, y: obj.y + 30, vy: 4 });
        });

        if (objetivosOriginales.length === 0) {
            jefeFase = "animacion_secreta";
            tiempoTransicionJefe = Date.now();
        }
    }

    // FASE 2: Animación cinemática del Despertar del Jefe Secreto Sukuna
    else if (jefeFase === "animacion_secreta") {
        let transcurrido = Date.now() - tiempoTransicionJefe;
        
        ctx.fillStyle = `rgba(255, 0, 85, ${Math.sin(transcurrido * 0.01)})`;
        ctx.font = "bold 22px Courier New";
        ctx.textAlign = "center";
        ctx.fillText("¡ALERTA DE ENERGÍA MALDITA SE CORTA EL CIELO!", canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillText("DOMINIO AUTO-INVOCADO: SANTUARIO MALDICIONES", canvas.width / 2, canvas.height / 2);

        // Rayos escarlata de ambientación cinemática
        if (Math.random() < 0.4) {
            ctx.strokeStyle = "#ff0055"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(Math.random()*canvas.width, 0); ctx.lineTo(canvas.width/2 + (Math.random()-0.5)*100, 150); ctx.stroke();
        }

        if (transcurrido > 3500) { // Dura 3.5 segundos exactos
            jefeFase = "boss_secreto";
            miniBossActivo = true;
            miniBossHP = 120; miniBossMaxHP = 120;
        }
    }

    // FASE 3: Batalla contra el Boss Secreto
    else if (jefeFase === "boss_secreto" && miniBossActivo) {
        let bx = canvas.width / 2;
        ctx.fillStyle = "#222"; ctx.fillRect(bx - 100, 40, 200, 14);
        ctx.fillStyle = jefeHitTimer > 0 ? "#fff" : "#ff0055";
        ctx.fillRect(bx - 100, 40, (miniBossHP / miniBossMaxHP) * 200, 14);
        if (jefeHitTimer > 0) jefeHitTimer--;

        miniBossX += miniBossVX;
        if (miniBossX < 60 || miniBossX > canvas.width - 60) miniBossVX *= -1;

        ctx.fillStyle = jefeHitTimer > 0 ? "#fff" : "#ff3c3c";
        ctx.fillRect(miniBossX - 35, miniBossY, 70, 70);

        if (Math.random() < 0.05) {
            balasCaendo.push({ x: miniBossX + (Math.random() - 0.5) * 50, y: miniBossY + 70, vy: 6 });
        }
    }

    // Control estructural de proyectiles y colisiones en Modo Original
    ctx.fillStyle = "#a333ff";
    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; mb.y += mb.vy;
        ctx.fillRect(mb.x - 3, mb.y, 6, 16);

        if (jefeFase === "oleada") {
            objetivosOriginales.forEach((obj, oIdx) => {
                if (mb.x >= obj.x && mb.x <= obj.x + 30 && mb.y >= obj.y && mb.y <= obj.y + 30) {
                    objetivosOriginales.splice(oIdx, 1);
                    misBalas.splice(i, 1);
                    puntosPartida += 10;
                }
            });
        }

        if (jefeFase === "boss_secreto" && miniBossActivo && mb.x >= miniBossX - 35 && mb.x <= miniBossX + 35 && mb.y >= miniBossY && mb.y <= miniBossY + 70) {
            miniBossHP -= 6; jefeHitTimer = 3;
            misBalas.splice(i, 1);
            if (miniBossHP <= 0) {
                miniBossActivo = false;
                puntosAcumulados += 200;
                alert("¡Santuario destruido! Jefe Secreto Derrotado.");
                volverAlMenuPrincipal();
            }
        }
    }

    // Proyectiles enemigos cayendo dañan al gato
    ctx.fillStyle = "#00ffff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy; ctx.fillRect(bc.x - 2, bc.y, 4, 12);
        if (bc.y >= jugadorY - 20 && bc.y <= jugadorY + 20 && bc.x >= jugadorX - 20 && bc.x <= jugadorX + 20) {
            balasCaendo.splice(idx, 1); jugadorHP -= 3;
            if (jugadorHP <= 0) { alert("Tu Gato cayó en batalla."); volverAlMenuPrincipal(); }
        }
    });
}

// --- LIENZO DEL EDITOR DE NIVELES AVANZADO ---
function dibujarPantallaEditorCompleto() {
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height - 100); ctx.stroke();
    }
    for (let y = 0; y < canvas.height - 100; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Renderizar bloques colocados en el mapa con scroll
    nivelEnEdicion.bloques.forEach(b => {
        let blDef = catalogoBloques[b.idBloque] || catalogoBloques[0];
        let rx = b.gx * 40 - scrollEditorX;
        let ry = b.gy * 40;
        if (rx >= -40 && rx <= canvas.width) {
            ctx.fillStyle = blDef.color; ctx.fillRect(rx + 2, ry + 2, 36, 36);
            ctx.fillStyle = "#fff"; ctx.font = "12px Arial"; ctx.textAlign = "center";
            ctx.fillText(blDef.simbolo, rx + 20, ry + 24);
        }
    });

    // Barra inferior de paleta
    ctx.fillStyle = "#09090e"; ctx.fillRect(0, canvas.height - 90, canvas.width, 90);
    ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 1; ctx.strokeRect(0, canvas.height - 90, canvas.width, 1);

    // Botón de Modo Mano / Arrastrar
    ctx.fillStyle = bloqueSeleccionado === -1 ? "#00ff82" : "#222";
    ctx.fillRect(10, canvas.height - 75, 70, 60);
    ctx.fillStyle = bloqueSeleccionado === -1 ? "#000" : "#fff";
    ctx.font = "bold 11px Courier New"; ctx.textAlign = "center";
    ctx.fillText("✋ ARRASTRAR", 45, canvas.height - 40);

    // Muestra los representantes iniciales de las 10 secciones
    for(let i=0; i<10; i++) {
        let bl = catalogoBloques[i * 100];
        let bx = 95 + i * 45; let by = canvas.height - 75;
        ctx.fillStyle = bl.color; ctx.fillRect(bx, by, 38, 38);
        if (bloqueSeleccionado === i * 100) {
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(bx - 2, by - 2, 42, 42);
        }
    }

    // Botones de Comando en esquina superior derecha del Editor Nativos
    ctx.fillStyle = "#ff3c3c"; ctx.fillRect(canvas.width - 55, 10, 45, 30); // Botón Pausa
    ctx.fillStyle = "#fff"; ctx.font = "11px Arial"; ctx.textAlign = "center"; ctx.fillText("II", canvas.width - 32, 28);

    ctx.fillStyle = "#00ff82"; ctx.fillRect(canvas.width - 110, 10, 45, 30); // Botón Triángulo Probar
    ctx.fillStyle = "#000"; ctx.font = "14px Arial"; ctx.fillText("▶", canvas.width - 87, 30);
}

// --- INFRAESTRUCTURA PARA PROBAR MAPAS DESDE CUALQUIER LADO ---
function iniciarPruebaNivelDirecta() {
    nivelAProbar = JSON.parse(JSON.stringify(nivelEnEdicion)); // Clonación profunda tipo JSON
    modoPruebaActivo = true;
    modoActual = "jugando_prueba";
    jugadorX = 100; jugadorY = canvas.height - 150;
    misBalas = [];
}

function ejecutarModoPruebaGrafica() {
    // Dibujar bloques fijos del nivel creado
    nivelAProbar.bloques.forEach(b => {
        let blDef = catalogoBloques[b.idBloque] || catalogoBloques[0];
        ctx.fillStyle = blDef.color; ctx.fillRect(b.gx * 40, b.gy * 40, 40, 40);
    });

    // Dibujar Gato
    dibujarGatoEstilizado(jugadorX, jugadorY, skinEquipada);

    ctx.fillStyle = "#00ff82"; ctx.font = "12px Courier New"; ctx.textAlign = "left";
    ctx.fillText("▶ MODO PRUEBA ACTIVO | PRESIONA EL BOTÓN DE ARRIBA PARA VOLVER", 20, 30);

    // Botón Salir de Prueba
    ctx.fillStyle = "#ff3c3c"; ctx.fillRect(canvas.width - 120, 10, 100, 30);
    ctx.fillStyle = "#fff"; ctx.font = "11px Arial"; ctx.textAlign = "center"; ctx.fillText("SALIR PRUEBA", canvas.width - 70, 28);
}

// Interceptar toques en modo prueba para salir
window.addEventListener('pointerdown', (e) => {
    if (modoPruebaActivo && e.clientX > canvas.width - 120 && e.clientY < 45) {
        modoPruebaActivo = false;
        modoActual = "editor_mapa";
    }
});

function guardarYSalirEditorTotal() {
    if (nivelEnEdicion.bloques.length > 0) {
        nivelesCreados.push(nivelEnEdicion);
        guardarDatosSistema();
    }
    cambiarPantalla('menu_construccion');
}

// --- ELEMENTOS ASOCIADOS AL CANVAS BASE ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.15)"; estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "carga") {
        dibujarPantallaCargaNeon();
    } else if (modoActual === "menu") {
        dibujarGatoEnBancaMenu(); animarLineasConstruccionMenu(); dibujarBotonConstruccionCircular();
    } else if (modoActual === "juego-original") {
        actualizarModoOriginal();
    } else if (modoActual === "juego-ritmo") {
        actualizarModoRitmo();
    } else if (modoActual === "juego-shoot") {
        actualizarModoShoot();
    } else if (modoActual === "editor_mapa") {
        dibujarPantallaEditorCompleto();
    } else if (modoActual === "jugando_prueba" && modoPruebaActivo) {
        ejecutarModoPruebaGrafica();
    }
    requestAnimationFrame(buclePrincipal);
}

function dibujarPantallaCargaNeon() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;
    if (progresoCarga < 100) progresoCarga += 1.5;
    ctx.strokeStyle = "rgba(0, 255, 130, 0.2)"; ctx.strokeRect(cx - 130, cy + 80, 260, 15);
    ctx.fillStyle = "#00ff82"; ctx.fillRect(cx - 130, cy + 80, 2.6 * progresoCarga, 15);
    if (progresoCarga >= 100) cambiarPantalla('menu');
}

function animarLineasConstruccionMenu() {
    let transcurrido = Date.now() - tiempoInicioMenu;
    let pct = Math.min(1, transcurrido / 800); 
    botonesMenu.forEach((btn) => {
        let anchoAnimado = btn.w * pct;
        ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 2; ctx.strokeRect(btn.x + (btn.w - anchoAnimado)/2, btn.y, anchoAnimado, btn.h);
        if (pct >= 1) {
            ctx.fillStyle = "#00ff82"; ctx.font = "bold 13px Courier New"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(btn.texto, btn.x + btn.w / 2, btn.y + btn.h / 2);
        }
    });
}

function dibujarBotonConstruccionCircular() {
    let transcurrido = Date.now() - tiempoInicioMenu; if (transcurrido < 800) return;
    let bc = botonConstruccionCirc;
    ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 3; ctx.fillStyle = "rgba(0, 255, 130, 0.05)";
    ctx.beginPath(); ctx.arc(bc.cx, bc.cy, bc.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bc.cx - 10, bc.cy + 10); ctx.lineTo(bc.cx + 10, bc.cy - 10); ctx.stroke();
    ctx.fillStyle = "#00ff82"; ctx.font = "bold 10px Courier New"; ctx.textAlign = "center"; ctx.fillText("CONSTRUCCIÓN", bc.cx, bc.cy + bc.r + 15);
}

function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2; let cy = canvas.height / 2 - 140; 
    ctx.fillStyle = "#7a431d"; ctx.fillRect(cx - 70, cy + 30, 140, 10); 
    ctx.fillStyle = "#5c3214"; ctx.fillRect(cx - 70, cy, 140, 12);      
    dibujarGatoEstilizado(cx, cy + 25, skinEquipada);
}

function dibujarGatoEstilizado(x, y, nombreSkin) {
    let data = SKINS_GATOS[nombreSkin] || SKINS_GATOS["Default Cat"];
    ctx.save(); ctx.fillStyle = data.principal;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 20); ctx.lineTo(x - 18, y - 35); ctx.lineTo(x - 4, y - 24); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 14, y - 20); ctx.lineTo(x + 18, y - 35); ctx.lineTo(x + 4, y - 24); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 14, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = data.pecho; ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = data.ojos; ctx.fillRect(x - 6, y - 16, 3, 5); ctx.fillRect(x + 3, y - 16, 3, 5);
    ctx.restore();
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `<div class="item-habilidad" style="cursor:pointer;" onclick="skinEquipada='${name}'; guardarDatosSistema(); cambiarPantalla('menu');">${name}</div>`).join('');
}

function renderTienda() {
    let div = document.getElementById("contenedor-tienda"); if (!div) return;
    document.getElementById("txt-saldo-tienda").innerText = puntosAcumulados;
    div.innerHTML = HABILIDADES_TIENDA.map((h, index) => `
        <div class="item-tienda">
            <div><strong>${h.nombre}</strong><br><small style="color:#aaa;">${h.desc}</small></div>
            <button class="btn-comprar" onclick="comprarHabilidad(${index})" ${h.comprado ? 'disabled' : ''}>${h.comprado ? 'ADQUIRIDO' : h.costo + ' PTS'}</button>
        </div>
    `).join('');
}

function comprarHabilidad(idx) {
    if (puntosAcumulados >= HABILIDADES_TIENDA[idx].costo) {
        puntosAcumulados -= HABILIDADES_TIENDA[idx].costo; HABILIDADES_TIENDA[idx].comprado = true;
        guardarDatosSistema(); renderTienda();
    }
}

function accionarLupa() { let b = prompt("Busca nombre de nivel:"); if(b) { busquedaFiltro = b.toLowerCase(); actualizarListaNivelesHTML(); } }
function mostrarRecientes() { busquedaFiltro = "reciente"; actualizarListaNivelesHTML(); }
function volverAlMenuPrincipal() { guardarDatosSistema(); cambiarPantalla('menu'); }

function actualizarListaNivelesHTML() {
    let listado = document.getElementById("lista-proyectos"); if (!listado) return;
    let base = [{ nombre: "SpaceX Rocket Landing", bloquesCount: 420, autor: "Creador Gato" }, { nombre: "Geometry Core V2", bloquesCount: 890, autor: "GeodeModder" }];
    let combinados = [...nivelesCreados.map(n => ({ nombre: n.nombre, bloquesCount: n.bloques.length, autor: "Tú" })), ...base];
    if (busquedaFiltro !== "" && busquedaFiltro !== "reciente") combinados = combinados.filter(n => n.nombre.toLowerCase().includes(busquedaFiltro));
    listado.innerHTML = combinados.map(n => `<div style="background:rgba(255,255,255,0.05); padding:10px; border-left:3px solid #00ff82; font-size:12px;"><strong>${n.nombre}</strong> — ${n.bloquesCount} bloques<br><small style="color:#888;">Autor: ${n.autor}</small></div>`).join('');
}

function cerrarOverlayPausaEditor() { document.getElementById("editor-pausa-overlay").style.display = "none"; }

window.onload = () => { inicializarCatalogoBloques(); cargarDatosSistema(); redimensionar(); generarEstrellas(); buclePrincipal(); };
