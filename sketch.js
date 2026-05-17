// --- VARIABLES GLOBALES DEL JUEGO ---
let puntosActuales = 100; // Puntos iniciales para canjear en la tienda
let juegoEnProgreso = false;
let juegoPausado = false;
let skinSeleccionada = "Gojo Satoru";

// Configuración de Elementos de la Tienda
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

const LISTA_HECHICEROS = [
    { nombre: "Gojo Satoru", desc: "Desata los Seis Ojos e Infinito." },
    { nombre: "Yuji Itadori", desc: "Fuerza física y puño divergente." },
    { nombre: "Megumi Fushiguro", desc: "Técnica de Diez Sombras." },
    { nombre: "Nobara Kugisaki", desc: "Muñeco de paja y resonancia." },
    { nombre: "Maki Zenin", desc: "Herramientas malditas de grado especial." }
];

// --- SISTEMA DE NAVEGACIÓN (EVITA QUE SE TRABE) ---
function cambiarPantalla(pantallaDestino) {
    // Apagar todas las pantallas
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("pantalla-juego").classList.remove("activa");
    
    // Ocultar HUD de partida por defecto
    document.getElementById("hud-partida").style.display = "none";

    // Encender la seleccionada
    if (pantallaDestino === 'menu') {
        document.getElementById("pantalla-menu").classList.add("activa");
        juegoEnProgreso = false;
        intentarReproducirMusica();
    } else if (pantallaDestino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
    } else if (pantallaDestino === 'tienda') {
        document.getElementById("pantalla-tienda").classList.add("activa");
    } else if (pantallaDestino === 'juego') {
        document.getElementById("pantalla-juego").classList.add("activa");
        document.getElementById("hud-partida").style.display = "block"; // Mostrar botón de pausa
        iniciarPartidaCombate();
    }
}

// --- GESTIÓN DE AUDIO LO-FI ---
function intentarReproducirMusica() {
    let audio = document.getElementById("musica-menu");
    if (audio) {
        audio.volume = 0.25; // Volumen moderado y relajante
        audio.play().catch(err => {
            console.log("Esperando toque del usuario para iniciar música.");
        });
    }
}

// --- CONTROLADOR DE PAUSA REAL ---
function presionarPausa() {
    juegoPausado = true;
    document.getElementById("menu-pausa").style.display = "flex";
}

function reanudarJuego() {
    juegoPausado = false;
    document.getElementById("menu-pausa").style.display = "none";
}

function regresarAlMenu() {
    juegoPausado = false;
    document.getElementById("menu-pausa").style.display = "none";
    cambiarPantalla('menu');
}

// --- LÓGICA DE COMPRA DE LA TIENDA DE HABILIDADES ---
function renderizarTienda() {
    let contenedor = document.getElementById("contenedor-tienda");
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
            
            // Actualizar interfaz visual
            document.getElementById("txt-puntos").innerText = puntosActuales;
            renderizarTienda();
        } else {
            alert("¡No tienes suficientes puntos para esta habilidad!");
        }
    }
}

// --- RENDERIZAR SELECCIÓN DE PERSONAJES ---
function renderizarHechiceros() {
    let contenedor = document.getElementById("contenedor-hechiceros");
    contenedor.innerHTML = LISTA_HECHICEROS.map(p => `
        <div class="item-habilidad" style="cursor:pointer;" onclick="seleccionarHechicero('${p.nombre}')">
            <div>
                <div style="font-weight:bold; color: ${skinSeleccionada === p.nombre ? '#00ff66' : '#fff'}">${p.nombre}</div>
                <div style="font-size:11px; color:#888;">${p.desc}</div>
            </div>
            ${skinSeleccionada === p.nombre ? '<span style="color:#00ff66; font-size:11px;">ACTIVO</span>' : ''}
        </div>
    `).join('');
}

function seleccionarHechicero(nombre) {
    skinSeleccionada = nombre;
    renderizarHechiceros();
}

// --- MOTOR GRÁFICO DEL COMBATE (CANVAS REALISTA DE FONDO) ---
let canvas = document.getElementById("lienzoJuego");
let ctx = canvas.getContext("2d");
let enemigoX = 150, enemigoY = 80, dirEnemigo = 2;

function iniciarPartidaCombate() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    juegoEnProgreso = true;
    juegoPausado = false;
    
    // Arrancar bucle de animación básico
    requestAnimationFrame(bucleJuego);
}

function bucleJuego() {
    if (!juegoEnProgreso) return;

    if (!juegoPausado) {
        // Actualizar movimientos físicos del enemigo de la arena
        enemigoX += dirEnemigo;
        if (enemigoX > canvas.width - 40 || enemigoX < 40) dirEnemigo *= -1;
    }

    // Dibujar la escena
    ctx.fillStyle = "#05050d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Renderizar al Hechicero (Estilo realista circular con aura cósmica como tu video)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 100, 35, 0, Math.PI * 2);
    ctx.fillStyle = "#1a0033";
    ctx.fill();
    ctx.strokeStyle = "#9000c7";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dibujar ojos blancos característicos del gato/personaje
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(canvas.width / 2 - 10, canvas.height - 105, 5, 0, Math.PI * 2);
    ctx.arc(canvas.width / 2 + 10, canvas.height - 105, 5, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar al enemigo (Maldición flotante)
    ctx.fillStyle = "#ff0055";
    ctx.fillRect(enemigoX - 20, enemigoY, 40, 40);

    // Datos del HUD del Canvas
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("Personaje: " + skinSeleccionada, 20, 40);
    ctx.fillText("Munición: 8", 20, 65);

    requestAnimationFrame(bucleJuego);
}

// Inicializar elementos al cargar el repositorio
window.onload = () => {
    renderTienda();
    renderHechiceros();
    
    // Iniciar audio al primer toque de pantalla por seguridad del navegador
    document.body.addEventListener('click', () => {
        intentarReproducirMusica();
    }, { once: true });
};

function renderTienda() { renderizarTienda(); }
