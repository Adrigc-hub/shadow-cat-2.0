// --- VARIABLES GLOBALES DEL JUEGO ---
let puntosActuales = 100; 
let juegoEnProgreso = false;
let juegoPausado = false;
let skinSeleccionada = "Gojo Satoru"; // Skin inicial
let musicaIniciada = false;

// Configuración de Habilidades (Tienda)
const LISTA_HABILIDADES = [
    { id: 1, nombre: "Destello Negro", precio: 50, comprado: false },
    { id: 2, nombre: "Vacío Inconmensurable", precio: 150, comprado: false },
    { id: 3, nombre: "Puño Divergente", precio: 40, comprado: false },
    { id: 4, nombre: "Nuevitas Sombras", precio: 60, comprado: false },
    { id: 5, nombre: "Corte / Desmantelar", precio: 100, comprado: false },
    { id: 6, nombre: "Flecha de Fuego", precio: 120, comprado: false },
    { id: 7, nombre: "Azul Máximo", precio: 80, comprado: false },
    { id: 8, nombre: "Rojo Resplandor", precio: 85, comprado: false },
    { id: 9, nombre: "Púrpura Imaginario", precio: 200, comprado: false },
    { id: 10, nombre: "Quimera Sombría", precio: 110, comprado: false }
];

// Configuración de Skins (Colores para el círculo y su aura)
const DATOS_HECHICEROS = {
    "Gojo Satoru": { colorCuerpo: "#1a0033", colorAura: "#00d2ff", ojos: "white" },
    "Yuji Itadori": { colorCuerpo: "#3a0d0d", colorAura: "#ff3c3c", ojos: "black" },
    "Megumi Fushiguro": { colorCuerpo: "#0a2214", colorAura: "#00ff88", ojos: "white" },
    "Nobara Kugisaki": { colorCuerpo: "#2b1810", colorAura: "#ff0077", ojos: "white" },
    "Ryomen Sukuna": { colorCuerpo: "#4a0011", colorAura: "#ba000d", ojos: "red" }
};

// --- NAVEGACIÓN ENTRE PANTALLAS ---
function cambiarPantalla(pantallaDestino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("pantalla-juego").classList.remove("activa");
    
    if (document.getElementById("hud-partida")) {
        document.getElementById("hud-partida").style.display = "none";
    }

    if (pantallaDestino === 'menu') {
        document.getElementById("pantalla-menu").classList.add("activa");
        juegoEnProgreso = false;
    } else if (pantallaDestino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderizarHechiceros(); // Actualiza la lista al abrir
    } else if (pantallaDestino === 'tienda') {
        document.getElementById("pantalla-tienda").classList.add("activa");
        renderizarTienda();
    } else if (pantallaDestino === 'juego') {
        document.getElementById("pantalla-juego").classList.add("activa");
        if (document.getElementById("hud-partida")) {
            document.getElementById("hud-partida").style.display = "block";
        }
        iniciarPartidaCombate();
    }
    
    intentarReproducirMusica();
}

// --- GESTIÓN DE AUDIO (GEOMETRY DASH MODO PRÁCTICA) ---
function intentarReproducirMusica() {
    let audio = document.getElementById("musica-menu");
    if (audio && !musicaIniciada) {
        audio.volume = 0.25;
        audio.play().then(() => {
            musicaIniciada = true;
        }).catch(() => {
            console.log("Esperando toque inicial del usuario...");
        });
    }
}

// --- TIENDA DE HABILIDADES ---
function renderizarTienda() {
    let contenedor = document.getElementById("contenedor-tienda");
    if (!contenedor) return;
    
    contenedor.innerHTML = LISTA_HABILIDADES.map((h, index) => `
        <div class="item-habilidad">
            <div>
                <div style="font-weight:bold;">${h.nombre}</div>
                <div style="font-size:11px; color:#aaa;">Costo: $${h.precio} PTS</div>
            </div>
            <button class="btn-comprar ${h.comprado ? 'adquirido' : ''}" onclick="comprarHabilidad(${index})">
                ${h.comprado ? 'ADQUIRIDO' : 'COMPRAR'}
            </button>
        </div>
    `).join('');
}

function comprarHabilidad(index) {
    let hab = LISTA_HABILIDADES[index];
    if (!hab.comprado) {
        if (puntosActuales >= hab.precio) {
            puntosActuales -= hab.precio;
            hab.comprado = true;
            
            document.getElementById("txt-puntos").innerText = puntosActuales;
            renderizarTienda();
        } else {
            alert("¡No tienes suficientes puntos!");
        }
    }
}

// --- SELECCIÓN REAL DE HECHICEROS ---
function renderizarHechiceros() {
    let contenedor = document.getElementById("contenedor-hechiceros");
    if (!contenedor) return;

    let nombresSkins = Object.keys(DATOS_HECHICEROS);

    contenedor.innerHTML = nombresSkins.map(nombre => {
        let esActivo = skinSeleccionada === nombre;
        return `
            <div class="item-habilidad" style="cursor:pointer;" onclick="seleccionarHechicero('${nombre}')">
                <div>
                    <div style="font-weight:bold; color: ${esActivo ? '#00ff66' : '#fff'}">${nombre}</div>
                    <div style="font-size:11px; color:#888;">Toca para equipar esta apariencia en combate.</div>
                </div>
                ${esActivo ? '<span style="color:#00ff66; font-size:11px; font-weight:bold;">EQUIPADO</span>' : '<button class="btn-comprar" style="background:#555; color:white;">USAR</button>'}
            </div>
        `;
    }).join('');
}

function seleccionarHechicero(nombre) {
    skinSeleccionada = nombre;
    renderizarHechiceros(); // Refresca la interfaz para marcar el "EQUIPADO"
}

// --- PAUSA ---
function presionarPausa() { juegoPausado = true; document.getElementById("menu-pausa").style.display = "flex"; }
function reanudarJuego() { juegoPausado = false; document.getElementById("menu-pausa").style.display = "none"; }
function regresarAlMenu() { juegoPausado = false; document.getElementById("menu-pausa").style.display = "none"; cambiarPantalla('menu'); }

// --- MOTOR GRÁFICO DEL JUEGO (CANVAS ASOCIADO A TU SKIN) ---
let canvas = document.getElementById("lienzoJuego");
let ctx = canvas.getContext("2d");
let enemigoX = 150, enemigoY = 80, dirEnemigo = 3;

function iniciarPartidaCombate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    juegoEnProgreso = true;
    juegoPausado = false;
    requestAnimationFrame(bucleJuego);
}

function bucleJuego() {
    if (!juegoEnProgreso) return;

    if (!juegoPausado) {
        enemigoX += dirEnemigo;
        if (enemigoX > canvas.width - 40 || enemigoX < 40) dirEnemigo *= -1;
    }

    // Limpiar pantalla
    ctx.fillStyle = "#05050d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Obtener los estilos visuales de tu personaje según la skin que elegiste
    let apariencia = DATOS_HECHICEROS[skinSeleccionada] || DATOS_HECHICEROS["Gojo Satoru"];

    // 1. Dibujar el Aura Cósmica (El círculo brillante exterior)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 120, 48, 0, Math.PI * 2);
    ctx.fillStyle = apariencia.colorAura + "33"; // Transparencia sutil
    ctx.fill();

    // 2. Dibujar el Cuerpo Principal (Tu círculo de juego)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 120, 35, 0, Math.PI * 2);
    ctx.fillStyle = apariencia.colorCuerpo;
    ctx.fill();
    ctx.strokeStyle = apariencia.colorAura;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Dibujar los Ojitos del Gato/Hechicero
    ctx.fillStyle = apariencia.ojos;
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 11, canvas.height - 125, 5, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 11, canvas.height - 125, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar Enemigo (Maldición)
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(enemigoX - 20, enemigoY, 40, 40);

    // Texto HUD superior
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Hechicero: " + skinSeleccionada.toUpperCase(), 20, 40);
    ctx.fillText("Munición Especial: 8", 20, 65);

    requestAnimationFrame(bucleJuego);
}

// Iniciar eventos globales
window.onload = () => {
    renderizarTienda();
    renderizarHechiceros();
    document.body.addEventListener('click', intentarReproducirMusica, { once: true });
    document.body.addEventListener('touchstart', intentarReproducirMusica, { once: true });
};

