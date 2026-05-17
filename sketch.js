// --- CONFIGURACIÓN PRINCIPAL ---
let puntosAcumulados = 150; // Saldo inicial basado en tu menú
let modoActual = "carga"; 
let juegoPausado = false;
let skinEquipada = "Default Cat";
let audioCtx = null;
let nodoMusicaMenu = null;

// Configuración de Skins Gato
const SKINS_GATOS = {
    "Default Cat": { principal: "#d2691e", pecho: "#ffffff", ojos: "#00ff00", tipo: "default" },
    "Gojo Satoru": { principal: "#ffffff", pecho: "#121214", ojos: "#00d2ff", tipo: "gojo" },
    "Yuji Itadori": { principal: "#ff9494", pecho: "#260606", ojos: "#black", tipo: "yuji" }
};

// --- LAS 10 HABILIDADES DE LA TIENDA DE MEJORAS ---
const HABILIDADES_TIENDA = [
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

// Atributos del Jugador y Boss
let jugadorX = 200, jugadorY = 400, jugadorHP = 30;
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [], puntosPartida = 0;
let miniBossActivo = true, miniBossHP = 100, miniBossMaxHP = 100, miniBossX = 200, miniBossY = 90, miniBossVX = 2, jefeHitTimer = 0;

// Carga y Construcción
let progresoCarga = 0;
let rayosConstruccion = [];
let botonesMenu = [];
let botonConstruccionCirc = {};
let tiempoInicioMenu = 0;

// --- VARIABLES DEL MOTOR DE CONSTRUCCIÓN ---
let nivelesCreados = [];
let busquedaFiltro = "";
let catalogoBloques = [];
let bloqueSeleccionado = 0;
let nivelEnEdicion = { nombre: "Nuevo Nivel", bloques: [] };
let scrollEditorX = 0;

// Inicializar bloques del catálogo (1,000 bloques divididos en 10 secciones temáticas de 100 cada una)
const SECCIONES_CONSTRUCCION = [
    "Energía Maldita", "Ladrillos Escuela", "Trampas Espinas", "Plataformas Neón", 
    "Suelos Metálicos", "Cajas de Madera", "Cristales Vacío", "Bancas Descanso", 
    "Portales Espacio", "Paredes Fortaleza"
];
function inicializarCatalogoBloques() {
    catalogoBloques = [];
    let idGlobal = 0;
    SECCIONES_CONSTRUCCION.forEach((seccion, sIdx) => {
        let colores = ["#ff0055", "#4a4a4a", "#ffaa00", "#00ff82", "#00ffff", "#7a431d", "#a333ff", "#5c3214", "#0022ff", "#222"];
        for(let i = 1; i <= 100; i++) {
            catalogoBloques.push({
                id: idGlobal++,
                seccion: seccion,
                nombre: `${seccion} B${i}`,
                color: colores[sIdx],
                simbolo: sIdx === 2 ? "^" : "■"
            });
        }
    });
}

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
    
    // Botones del menú principal adaptados a tu estructura
    botonesMenu = [
        { id: "juego-original", texto: "MODO ORIGINAL", x: cx - 130, y: cy - 70, w: 260, h: 45, escala: 0 },
        { id: "juego-ritmo", texto: "DANCE OF FIRE", x: cx - 130, y: cy - 10, w: 260, h: 45, escala: 0 },
        { id: "juego-shoot", texto: "SHOOT THE BOX", x: cx - 130, y: cy + 50, w: 260, h: 45, escala: 0 },
        { id: "hechiceros", texto: "SELECCIÓN DE SKINS", x: cx - 130, y: cy + 110, w: 260, h: 45, escala: 0 },
        { id: "tienda_mejoras", texto: "TIENDA DE MEJORAS", x: cx - 130, y: cy + 170, w: 260, h: 45, escala: 0 }
    ];

    // Botón circular de construcción a la derecha del menú
    botonConstruccionCirc = { cx: cx + 180, cy: cy + 50, r: 35 };
}

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<40; i++) estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, size: Math.random()*2+1 });
}

// --- MANEJO DE PANTALLAS Y CAMBIOS ---
function cambiarPantalla(destino) {
    document.getElementById("pantalla-hechiceros").style.display = "none";
    document.getElementById("pantalla-tienda").style.display = "none";
    document.getElementById("pantalla-construccion-raiz").style.display = "none";
    document.getElementById("hud-juego").style.display = "none";

    juegoPausado = false; puntosPartida = 0; jugadorHP = 30;

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
        scrollEditorX = 0;
    } else {
        modoActual = destino;
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2; jugadorY = canvas.height - 130;
        misBalas = []; balasCaendo = []; miniBossHP = 100; miniBossActivo = true;
    }
}

// --- DETECCIÓN DE ENTRADAS ---
window.addEventListener('pointerdown', (e) => {
    // Inicializar Audio Context en el primer toque
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

    if (modoActual === "carga" && progresoCarga >= 100) { cambiarPantalla('menu'); return; }

    if (modoActual === "menu") {
        // Clic en botones rectangulares
        botonesMenu.forEach(btn => {
            if (e.clientX >= btn.x && e.clientX <= btn.x + btn.w && e.clientY >= btn.y && e.clientY <= btn.y + btn.h) {
                cambiarPantalla(btn.id);
            }
        });
        // Clic en el botón circular de construcción
        let distConst = Math.sqrt(Math.pow(e.clientX - botonConstruccionCirc.cx, 2) + Math.pow(e.clientY - botonConstruccionCirc.cy, 2));
        if (distConst <= botonConstruccionCirc.r) {
            cambiarPantalla('menu_construccion');
        }
        return;
    }

    if (modoActual === "editor_mapa") {
        // Si clickea en la barra inferior del catálogo de bloques del editor
        if (e.clientY > canvas.height - 80) {
            let itemW = 50;
            let idxClic = Math.floor((e.clientX - 20) / itemW);
            if (idxClic >= 0 && idxClic < 10) {
                bloqueSeleccionado = idxClic; // Cambiar tipo de bloque activo de la sección
            }
        } else {
            // Colocar bloque en la grilla del mapa
            let gridX = Math.floor((e.clientX + scrollEditorX) / 40);
            let gridY = Math.floor(e.clientY / 40);
            // Evitar duplicados
            nivelEnEdicion.bloques = nivelEnEdicion.bloques.filter(b => b.gx !== gridX || b.gy !== gridY);
            nivelEnEdicion.bloques.push({ gx: gridX, gy: gridY, idBloque: bloqueSeleccionado });
        }
        return;
    }

    if (modoActual === "juego-original") {
        misBalas.push({ x: jugadorX, y: jugadorY - 30, vy: -14 });
    }
});

// Desplazamiento del mapa en el editor con teclas de flecha
window.addEventListener('keydown', (e) => {
    if (modoActual === "editor_mapa") {
        if (e.key === "ArrowRight") scrollEditorX += 40;
        if (e.key === "ArrowLeft") scrollEditorX = Math.max(0, scrollEditorX - 40);
        if (e.key === "Escape") {
            // Guardar y salir
            if (nivelEnEdicion.bloques.length > 0) nivelesCreados.push(nivelEnEdicion);
            cambiarPantalla('menu_construccion');
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (modoActual === "juego-original") jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
});

// --- RENDER DE TIENDA Y MEJORAS ---
function renderTienda() {
    let div = document.getElementById("contenedor-tienda"); if (!div) return;
    document.getElementById("txt-saldo-tienda").innerText = puntosAcumulados;
    div.innerHTML = HABILIDADES_TIENDA.map((h, index) => `
        <div class="item-tienda">
            <div>
                <strong>${h.nombre}</strong><br>
                <small style="color:#aaa;">${h.desc}</small>
            </div>
            <button class="btn-comprar" onclick="comprarHabilidad(${index})" ${h.comprado ? 'disabled' : ''}>
                ${h.comprado ? 'ADQUIRIDO' : h.costo + ' PTS'}
            </button>
        </div>
    `).join('');
}

function comprarHabilidad(idx) {
    let h = HABILIDADES_TIENDA[idx];
    if (puntosAcumulados >= h.costo && !h.comprado) {
        puntosAcumulados -= h.costo;
        h.comprado = true;
        renderTienda();
    } else if (!h.comprado) {
        alert("Puntos insuficientes para adquirir esta mejora de energía.");
    }
}

// --- SECCIÓN CONSTRUCCIÓN / BUSCADOR ---
function accionarLupa() {
    let busq = prompt("Ingresa el nombre o letras del nivel a buscar:");
    if (busq !== null) {
        busquedaFiltro = busq.toLowerCase();
        actualizarListaNivelesHTML();
    }
}

function mostrarRecientes() {
    busquedaFiltro = "reciente";
    actualizarListaNivelesHTML();
}

function actualizarListaNivelesHTML() {
    let listado = document.getElementById("lista-proyectos"); if (!listado) return;
    let baseFicticia = [
        { nombre: "SpaceX Rocket Landing", bloquesCount: 420, autor: "Creador Gato" },
        { nombre: "Geometry Core V2", bloquesCount: 890, autor: "GeodeModder" },
        { nombre: "Jujutsu Domain Expansion", bloquesCount: 1100, autor: "SukunaFan" }
    ];

    let combinados = [...nivelesCreados.map(n => ({ nombre: n.nombre, bloquesCount: n.bloques.length, autor: "Tú" })), ...baseFicticia];

    // Filtrado por Lupa o Recientes
    if (busquedaFiltro === "reciente") {
        // Mostrar todo ordenado por los últimos
    } else if (busquedaFiltro !== "") {
        combinados = combinados.filter(n => n.nombre.toLowerCase().includes(busquedaFiltro));
    }

    listado.innerHTML = combinados.map(n => `
        <div style="background:rgba(255,255,255,0.05); padding:10px; border-left:3px solid #00ff82; font-size:12px;">
            <strong>${n.nombre}</strong> — ${n.bloquesCount} bloques <br>
            <small style="color:#888;">Por: ${n.autor}</small>
        </div>
    `).join('');
}

// --- BUCLE DE RENDERIZADO PRINCIPAL ---
function buclePrincipal() {
    ctx.fillStyle = "#020205"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas estables
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.size, st.size); });

    if (modoActual === "carga") {
        dibujarPantallaCargaNeon();
    } else if (modoActual === "menu") {
        dibujarGatoEnBancaMenu();
        animarLineasConstruccionMenu(); 
        dibujarBotonConstruccionCircular();
    } else if (modoActual === "juego-original") {
        actualizarModoOriginal();
    } else if (modoActual === "editor_mapa") {
        dibujarPantallaEditorCompleto();
    }

    if (modoActual === "juego-original") {
        dibujarGatoEstilizado(jugadorX, jugadorY, skinEquipada);
    }

    requestAnimationFrame(buclePrincipal);
}

function dibujarPantallaCargaNeon() {
    let cx = canvas.width / 2; let cy = canvas.height / 2;
    if (progresoCarga < 100) progresoCarga += 1.5;

    if (Math.random() < 0.2 && progresoCarga < 100) {
        let dest = botonesMenu[Math.floor(Math.random() * botonesMenu.length)];
        rayosConstruccion.push({ x1: Math.random() * canvas.width, y1: 0, x2: dest.x + Math.random() * dest.w, y2: dest.y + Math.random() * dest.h, alfa: 1.0 });
    }

    rayosConstruccion.forEach((r, idx) => {
        ctx.strokeStyle = `rgba(0, 255, 130, ${r.alfa})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke();
        r.alfa -= 0.08; if(r.alfa <= 0) rayosConstruccion.splice(idx, 1);
    });

    ctx.strokeStyle = "rgba(0, 255, 130, 0.2)"; ctx.strokeRect(cx - 130, cy + 80, 260, 15);
    ctx.fillStyle = "#00ff82"; ctx.fillRect(cx - 130, cy + 80, 2.6 * progresoCarga, 15);

    ctx.fillStyle = "#fff"; ctx.font = "bold 16px Courier New"; ctx.textAlign = "center";
    ctx.fillText(`COMPILING GEOMETRY_CORE`, cx, cy + 20);
    if (progresoCarga >= 100) cambiarPantalla('menu');
}

function animarLineasConstruccionMenu() {
    let transcurrido = Date.now() - tiempoInicioMenu;
    let pct = Math.min(1, transcurrido / 800); 
    botonesMenu.forEach((btn) => {
        let anchoAnimado = btn.w * pct;
        ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + (btn.w - anchoAnimado)/2, btn.y, anchoAnimado, btn.h);
        if (pct >= 1) {
            ctx.fillStyle = "#00ff82"; ctx.font = "bold 13px Courier New"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(btn.texto, btn.x + btn.w / 2, btn.y + btn.h / 2);
        }
    });
}

// Dibujo del Botón Circular de Construcción pedido
function dibujarBotonConstruccionCircular() {
    let transcurrido = Date.now() - tiempoInicioMenu;
    if (transcurrido < 800) return; // Espera que los rayos terminen

    let bc = botonConstruccionCirc;
    ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 3;
    ctx.fillStyle = "rgba(0, 255, 130, 0.05)";
    ctx.beginPath(); ctx.arc(bc.cx, bc.cy, bc.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Dibujo del Martillo y Destornillador cruzados adentro en vectores planos
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bc.cx - 12, bc.cy + 12); ctx.lineTo(bc.cx + 12, bc.cy - 12); ctx.stroke(); // Destornillador
    ctx.fillStyle = "#ff3c3c"; ctx.fillRect(bc.cx + 4, bc.cy - 15, 10, 6); // Cabeza martillo

    ctx.fillStyle = "#00ff82"; ctx.font = "bold 11px Courier New"; ctx.textAlign = "center";
    ctx.fillText("CONSTRUCCIÓN", bc.cx, bc.cy + bc.r + 18);
}

// --- EDITOR DE MAPA CON SUS 10 SECCIONES ---
function dibujarPantallaEditorCompleto() {
    // Dibujar Grilla de fondo del editor
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height - 100); ctx.stroke();
    }
    for (let y = 0; y < canvas.height - 100; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Dibujar bloques colocados
    nivelEnEdicion.bloques.forEach(b => {
        let blDef = catalogoBloques[b.idBloque] || catalogoBloques[0];
        let rx = b.gx * 40 - scrollEditorX;
        let ry = b.gy * 40;
        if (rx >= -40 && rx <= canvas.width) {
            ctx.fillStyle = blDef.color;
            ctx.fillRect(rx + 2, ry + 2, 36, 36);
            ctx.fillStyle = "#fff"; ctx.font = "14px Arial"; ctx.textAlign = "center";
            ctx.fillText(blDef.simbolo, rx + 20, ry + 24);
        }
    });

    // Barra inferior de paleta de bloques activa
    ctx.fillStyle = "#09090e"; ctx.fillRect(0, canvas.height - 90, canvas.width, 90);
    ctx.strokeStyle = "#00ff82"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, canvas.height - 90); ctx.lineTo(canvas.width, canvas.height - 90); ctx.stroke();

    ctx.fillStyle = "#fff"; ctx.font = "11px Courier New"; ctx.textAlign = "left";
    ctx.fillText(`EDITOR: ${nivelEnEdicion.nombre} | Flechas para Scroll [X: ${scrollEditorX}] | Presiona ESC para Guardar`, 20, canvas.height - 70);

    // Muestra 10 bloques muestra de las 10 secciones de la paleta distributiva
    let startX = 20;
    for(let i=0; i<10; i++) {
        let bl = catalogoBloques[i * 100]; // Toma el primer bloque representante de cada una de las 10 secciones
        let bx = startX + i * 50;
        let by = canvas.height - 50;

        ctx.fillStyle = bl.color; ctx.fillRect(bx, by, 35, 35);
        if (bloqueSeleccionado === i * 100) {
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(bx - 2, by - 2, 39, 39);
        }
        ctx.fillStyle = "#fff"; ctx.font = "9px Arial"; ctx.fillText(bl.simbolo, bx + 14, by + 20);
    }
}

function dibujarGatoEnBancaMenu() {
    let cx = canvas.width / 2; let cy = canvas.height / 2 - 140; 
    ctx.fillStyle = "#7a431d"; ctx.fillRect(cx - 70, cy + 30, 140, 10); 
    ctx.fillStyle = "#5c3214"; ctx.fillRect(cx - 60, cy + 40, 8, 25); ctx.fillRect(cx + 52, cy + 40, 8, 25);   
    ctx.fillRect(cx - 70, cy, 140, 12);      
    dibujarGatoEstilizado(cx, cy + 25, skinEquipada);
}

function dibujarGatoEstilizado(x, y, nombreSkin) {
    let data = SKINS_GATOS[nombreSkin] || SKINS_GATOS["Default Cat"];
    ctx.save();
    ctx.fillStyle = data.principal;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 20); ctx.lineTo(x - 18, y - 35); ctx.lineTo(x - 4, y - 24); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 14, y - 20); ctx.lineTo(x + 18, y - 35); ctx.lineTo(x + 4, y - 24); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - 14, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = data.pecho; ctx.beginPath(); ctx.ellipse(x, y + 4, 10, 14, 0, 0, Math.PI * 2); ctx.fill();
    if (data.tipo === "gojo") {
        ctx.fillStyle = "#16161a"; ctx.fillRect(x - 14, y - 18, 28, 7);
        ctx.fillStyle = "#00ffff"; ctx.fillRect(x - 8, y - 11, 4, 3); ctx.fillRect(x + 4, y - 11, 4, 3);
    } else {
        ctx.fillStyle = data.ojos; ctx.fillRect(x - 7, y - 16, 3, 5); ctx.fillRect(x + 4, y - 16, 3, 5);
    }
    ctx.restore();
}

function actualizarModoOriginal() {
    if (miniBossActivo) {
        let bx = canvas.width / 2;
        ctx.fillStyle = "#222"; ctx.fillRect(bx - 100, 40, 200, 14);
        ctx.fillStyle = jefeHitTimer > 0 ? "#fff" : "#ff0055"; ctx.fillRect(bx - 100, 40, (miniBossHP / miniBossMaxHP) * 200, 14);
        if (jefeHitTimer > 0) jefeHitTimer--;
        miniBossX += miniBossVX; if (miniBossX < 60 || miniBossX > canvas.width - 60) miniBossVX *= -1;
        ctx.fillStyle = "#ff3c3c"; ctx.fillRect(miniBossX - 30, miniBossY, 60, 60);
        if (Math.random() < 0.04) balasCaendo.push({ x: miniBossX, y: miniBossY + 60, vy: 5 });
    }

    for (let i = misBalas.length - 1; i >= 0; i--) {
        let mb = misBalas[i]; mb.y += mb.vy; ctx.fillStyle = "#a333ff"; ctx.fillRect(mb.x - 3, mb.y, 6, 16);
        if (miniBossActivo && mb.x >= miniBossX - 30 && mb.x <= miniBossX + 30 && mb.y >= miniBossY && mb.y <= miniBossY + 60) {
            miniBossHP -= 5; jefeHitTimer = 3; misBalas.splice(i, 1);
            if (miniBossHP <= 0) { miniBossActivo = false; puntosAcumulados += 150; cambiarPantalla('menu'); }
        }
    }
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_GATOS).map(name => `<div class="item-habilidad" style="cursor:pointer;" onclick="skinEquipada='${name}'; cambiarPantalla('menu');">${name}</div>`).join('');
}

window.onload = () => { inicializarCatalogoBloques(); redimensionar(); generarEstrellas(); buclePrincipal(); };
