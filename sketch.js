// --- CONFIGURACIÓN GENERAL Y MARCADORES ---
let puntosAcumulados = 100; 
let modoActual = "menu"; // menu, original, ritmo, shoot
let juegoPausado = false;
let skinEquipada = "Gojo Satoru";
let musicaSonando = false;

// Datos de la Tienda y Personajes
const HABILIDADES = [
    { id: 1, nombre: "Destello Negro", precio: 50, comprado: false },
    { id: 2, nombre: "Vacío Inconmensurable", precio: 150, comprado: false },
    { id: 3, nombre: "Puño Divergente", precio: 40, comprado: false },
    { id: 4, nombre: "Nuevitas Sombras", precio: 60, comprado: false },
    { id: 5, nombre: "Corte / Desmantelar", precio: 100, comprado: false }
];

const SKINS_HECHICEROS = {
    "Gojo Satoru": { cuerpo: "#1a0033", aura: "#00d2ff" },
    "Yuji Itadori": { cuerpo: "#3a0d0d", aura: "#ff3c3c" },
    "Megumi Fushiguro": { cuerpo: "#0a2214", aura: "#00ff88" },
    "Nobara Kugisaki": { cuerpo: "#2b1810", aura: "#ff0077" }
};

// --- CONFIGURACIÓN DE LOS ENTORNOS DE LOS MINIJUEGOS ---
let jugadorX = 200, jugadorY = 400;
let balasEnemigas = [], objetivos = [], misBalas = [];
let cajasShoot = [];
let anguloRitmo = 0, sentidoRitmo = 1;
let puntosPartidaActual = 0;

// Variables del Mini Boss y Jefe Secreto
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 0, miniBossY = 100, dirMiniBoss = 2;
let jefeSecretoActivo = false;
let jefeHP = 100;
let tiempoUltimoChequeoBoss = 0;
let animacionSecretaContador = 0;

// --- MOTOR GRÁFICO (CANVAS NATIVO) ---
const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if(modoActual !== "menu") {
        jugadorX = canvas.width / 2;
        jugadorY = canvas.height - 100;
    }
}
window.addEventListener('resize', redimensionar);

// --- NAVEGADOR DE PANTALLAS ---
function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";

    juegoPausado = false;
    miniBossActivo = false;
    jefeSecretoActivo = false;
    animacionSecretaContador = 0;

    if (destino === 'menu') {
        modoActual = "menu";
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else if (destino === 'tienda') {
        document.getElementById("pantalla-tienda").classList.add("activa");
        renderTienda();
    } else {
        // Inicializar marcadores de partida
        puntosPartidaActual = 0;
        balasEnemigas = []; objetivos = []; misBalas = []; cajasShoot = [];
        tiempoUltimoChequeoBoss = Date.now();
        
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2;
        jugadorY = canvas.height - 120;

        if (destino === 'juego-original') { modoActual = "original"; }
        if (destino === 'juego-ritmo') { modoActual = "ritmo"; anguloRitmo = 0; }
        if (destino === 'juego-shoot') { modoActual = "shoot"; generarCajasShoot(); }
    }
    encenderMusicaGD();
}

// --- CONTROLES DE PAUSA ---
function activarPausa(estado) {
    juegoPausado = estado;
    document.getElementById("menu-pausa").style.display = estado ? "flex" : "none";
}
function volverAlMenuPrincipal() {
    puntosAcumulados += puntosPartidaActual;
    document.getElementById("txt-puntos").innerText = puntosAcumulados;
    activarPausa(false);
    cambiarPantalla('menu');
}

// --- SISTEMA DE TOQUES E INTERACCIÓN (IPAD / ANDROID) ---
window.addEventListener('pointerdown', (e) => {
    encenderMusicaGD();
    if (juegoPausado || modoActual === "menu") return;

    // Control de disparo o acción según el minijuego
    if (modoActual === "original" || modoActual === "jefe") {
        misBalas.push({ x: jugadorX, y: jugadorY - 35 });
    }
    if (modoActual === "ritmo") {
        sentidoRitmo *= -1; // Cambia de dirección estilo Dance of Fire
        puntosPartidaActual += 5;
    }
    if (modoActual === "shoot") {
        // Revisar si se tocó una caja
        for (let i = cajasShoot.length - 1; i >= 0; i--) {
            let c = cajasShoot[i];
            if (e.clientX >= c.x && e.clientX <= c.x + 50 && e.clientY >= c.y && e.clientY <= c.y + 50) {
                cajasShoot.splice(i, 1);
                puntosPartidaActual += 10;
                if (cajasShoot.length === 0) generarCajasShoot();
                break;
            }
        }
    }
});

// Movimiento del dedo en pantalla para arrastrar al personaje (Modo Original)
window.addEventListener('pointermove', (e) => {
    if (modoActual === "original" || modoActual === "jefe") {
        if (!juegoPausado) {
            jugadorX = e.clientX;
        }
    }
});

// --- LÓGICA GENERAL DE LOS 3 MINIJUEGOS ---
function buclePrincipal() {
    ctx.fillStyle = "#040409";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (modoActual !== "menu" && !juegoPausado) {
        document.getElementById("txt-hud-stats").innerText = `Modo: ${modoActual.toUpperCase()} | Puntos: ${puntosPartidaActual}`;
        
        if (modoActual === "original") actualizarModoOriginal();
        if (modoActual === "ritmo") actualizarModoRitmo();
        if (modoActual === "shoot") actualizarModoShoot();
        if (modoActual === "jefe") actualizarModoJefeSecreto();
    }

    // Siempre dibujar al personaje si no estamos en los menús puros
    if (modoActual !== "menu") {
        dibujarPersonajeSkin(jugadorX, jugadorY);
    } else {
        // Decoración de fondo en el menú
        ctx.fillStyle = "rgba(144, 0, 199, 0.05)";
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, 200, 0, Math.PI*2);
        ctx.fill();
    }

    requestAnimationFrame(buclePrincipal);
}

// MODO 1: ORIGINAL (Balas, Objetivos y Probabilidad de Boss cada 10s)
function actualizarModoOriginal() {
    // Generación periódica
    if (Math.random() < 0.03) objetivos.push({ x: Math.random() * canvas.width, y: 0, v: 2 });
    if (Math.random() < 0.04) balasEnemigas.push({ x: Math.random() * canvas.width, y: 0, v: 4 });

    // Cada 10 segundos evaluar probabilidad de Mini Boss (1 de 5)
    if (Date.now() - tiempoUltimoChequeoBoss > 10000 && !miniBossActivo && !jefeSecretoActivo) {
        tiempoUltimoChequeoBoss = Date.now();
        if (Math.floor(Math.random() * 5) === 0) {
            miniBossActivo = true;
            miniBossHP = 20;
            miniBossX = canvas.width / 2;
        }
    }

    // Dibujar y mover objetivos
    ctx.fillStyle = "#00ffd5";
    objetivos.forEach((obj, index) => {
        obj.y += obj.v;
        ctx.fillRect(obj.x, obj.y, 20, 20);
        if (obj.y > canvas.height) objetivos.splice(index, 1);
    });

    // Dibujar y mover balas enemigas
    ctx.fillStyle = "#ff0055";
    balasEnemigas.forEach((b, index) => {
        b.y += b.v;
        ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();
        if (b.y > canvas.height) balasEnemigas.splice(index, 1);
    });

    // Mover mis balas
    ctx.fillStyle = "#ffff00";
    misBalas.forEach((mb, mIndex) => {
        mb.y -= 7;
        ctx.fillRect(mb.x - 3, mb.y, 6, 15);

        // Colisión con objetivos
        objetivos.forEach((obj, oIndex) => {
            if (mb.x >= obj.x && mb.x <= obj.x + 20 && mb.y >= obj.y && mb.y <= obj.y + 20) {
                objetivos.splice(oIndex, 1);
                misBalas.splice(mIndex, 1);
                puntosPartidaActual += 10;
            }
        });

        // Colisión con Mini Boss
        if (miniBossActivo && mb.x >= miniBossX - 30 && mb.x <= miniBossX + 30 && mb.y >= miniBossY && mb.y <= miniBossY + 40) {
            misBalas.splice(mIndex, 1);
            miniBossHP--;
            if (miniBossHP <= 0) {
                miniBossActivo = false;
                modoActual = "jefe"; // Activa transicion
                animacionSecretaContador = 120; // 2 segundos de animación
            }
        }
    });

    // Render del Mini Boss si está vivo
    if (miniBossActivo) {
        miniBossX += dirMiniBoss;
        if (miniBossX > canvas.width - 40 || miniBossX < 40) dirMiniBoss *= -1;

        ctx.fillStyle = "#ffaa00";
        ctx.fillRect(miniBossX - 30, miniBossY, 60, 40);
        ctx.fillStyle = "white";
        ctx.font = "12px sans-serif";
        ctx.fillText(`MINI BOSS HP: ${miniBossHP}`, miniBossX - 35, miniBossY - 10);
    }
}

// TRANSICIÓN Y MODO JEFE SECRETO
function actualizarModoJefeSecreto() {
    if (animacionSecretaContador > 0) {
        animacionSecretaContador--;
        ctx.fillStyle = `rgba(163, 51, 255, ${Math.random()})`;
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("¡ANIMACIÓN SECRETA: PORTAL ABIERTO!", canvas.width / 2 - 180, canvas.height / 2);
        if (animacionSecretaContador === 0) {
            jefeSecretoActivo = true;
            jefeHP = 100;
        }
        return;
    }

    // Batalla de jefe real
    ctx.fillStyle = "#e60067";
    ctx.fillRect(canvas.width / 2 - 80, 50, 160, 60);
    ctx.fillStyle = "white";
    ctx.fillText(`JEFE SECRETO TOTAL HP: ${jefeHP}`, canvas.width / 2 - 70, 40);

    // Ataque del jefe
    if (Math.random() < 0.08) balasEnemigas.push({ x: canvas.width / 2 + (Math.random() * 100 - 50), y: 110, v: 5 });

    // Render de balas del jefe
    ctx.fillStyle = "#ff0055";
    balasEnemigas.forEach((b, idx) => {
        b.y += b.v;
        ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI*2); ctx.fill();
        if (b.y > canvas.height) balasEnemigas.splice(idx, 1);
    });

    // Mis disparos contra el jefe
    ctx.fillStyle = "#ffff00";
    misBalas.forEach((mb, mIdx) => {
        mb.y -= 7;
        ctx.fillRect(mb.x - 3, mb.y, 6, 15);
        if (mb.y < 110 && mb.x >= canvas.width/2 - 80 && mb.x <= canvas.width/2 + 80) {
            misBalas.splice(mIdx, 1);
            jefeHP -= 2;
            if (jefeHP <= 0) {
                puntosPartidaActual += 500; // Bonus especial
                volverAlMenuPrincipal();
            }
        }
    });
}

// MODO 2: DANCE OF FIRE (Ritmo circular)
function actualizarModoRitmo() {
    anguloRitmo += 0.04 * sentidoRitmo;
    let radio = 100;
    let centroX = canvas.width / 2;
    let centroY = canvas.height / 2;

    // El jugador orbita la pantalla al ritmo
    jugadorX = centroX + Math.cos(anguloRitmo) * radio;
    jugadorY = centroY + Math.sin(anguloRitmo) * radio;

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(centroX, centroY, radio, 0, Math.PI*2); ctx.stroke();
}

// MODO 3: SHOOT THE BOX (Romper cajas estáticas)
function actualizarModoShoot() {
    ctx.fillStyle = "#ffaa00";
    cajasShoot.forEach(c => {
        ctx.fillRect(c.x, c.y, 50, 50);
    });
}
function generarCajasShoot() {
    for (let i = 0; i < 4; i++) {
        cajasShoot.push({
            x: 50 + Math.random() * (canvas.width - 100),
            y: 100 + Math.random() * (canvas.height - 300)
        });
    }
}

// --- PINTAR SKIN SELECCIONADA EN EL CIRCULO ---
function dibujarPersonajeSkin(x, y) {
    let conf = SKINS_HECHICEROS[skinEquipada] || SKINS_HECHICEROS["Gojo Satoru"];

    // Aura expandida
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fillStyle = conf.aura + "44";
    ctx.fill();

    // Cuerpo base
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fillStyle = conf.cuerpo;
    ctx.fill();
    ctx.strokeStyle = conf.aura;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ojos blancos del video original
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - 9, y - 5, 4, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
}

// --- INTERFACES DINÁMICAS (TIENDA Y SKINS) ---
function renderTienda() {
    let div = document.getElementById("contenedor-tienda");
    if (!div) return;
    div.innerHTML = HABILIDADES.map((h, i) => `
        <div class="item-habilidad">
            <div class="info-txt">
                <div style="font-weight:bold;">${h.nombre}</div>
                <div style="font-size:11px; color:#ffcc00;">$${h.precio} PTS</div>
            </div>
            <button class="btn-comprar ${h.comprado ? 'adquirido' : ''}" onclick="comprarItem(${i})">
                ${h.comprado ? 'EQUIPADO' : 'COMPRAR'}
            </button>
        </div>
    `).join('');
}

function comprarItem(i) {
    let h = HABILIDADES[i];
    if (!h.comprado && puntosAcumulados >= h.precio) {
        puntosAcumulados -= h.precio;
        h.comprado = true;
        document.getElementById("txt-puntos").innerText = puntosAcumulados;
        renderTienda();
    }
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros");
    if (!div) return;
    div.innerHTML = Object.keys(SKINS_HECHICEROS).map(name => `
        <div class="item-habilidad" style="cursor:pointer;" onclick="equiparSkin('${name}')">
            <div class="info-txt">
                <div style="font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
            </div>
            ${skinEquipada === name ? '<span style="color:#00ff66; font-size:12px;">USANDO</span>' : '<button class="btn-comprar" style="background:#444; color:white;">USAR</button>'}
        </div>
    `).join('');
}

function equiparSkin(name) {
    skinEquipada = name;
    renderSkins();
}

function encenderMusicaGD() {
    let audio = document.getElementById("musica-gd");
    if (audio && !musicaSonando) {
        audio.volume = 0.20;
        audio.play().then(() => { musicaSonando = true; }).catch(() => {});
    }
}

// Inicialización
window.onload = () => {
    redimensionar();
    buclePrincipal();
};

