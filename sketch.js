// --- DATOS Y VARIABLES ---
let puntosJugador = 100; // Inicias con 100 para probar las compras
let hechiceroActivo = "Gojo Satoru";
let musicaIniciada = false;

const CONFIG_TIENDA = [
    { id: 0, nombre: "Destello Negro", desc: "Golpe rítmico crítico físico.", precio: 150, comprado: false },
    { id: 1, nombre: "Vacío Inconmensurable", desc: "Congela la pantalla por completo.", precio: 1000, comprado: false },
    { id: 2, nombre: "Puño Divergente", desc: "Impacto con doble onda.", precio: 100, comprado: false },
    { id: 3, nombre: "Nuevitas Sombras", desc: "Aumenta la absorción.", precio: 200, comprado: false }
];

const CONFIG_HECHICEROS = [
    { nombre: "Gojo Satoru", desc: "Desata los Seis Ojos e Infinito." },
    { nombre: "Yuji Itadori", desc: "Fuerza física y puño divergente." },
    { nombre: "Megumi Fushiguro", desc: "Técnica de Diez Sombras." },
    { nombre: "Nobara Kugisaki", desc: "Muñeco de paja y resonancia." }
];

// --- SISTEMA DE CAMBIO DE PANTALLAS (SIN TRABARSE) ---
function cambiarA(pantallaDestino) {
    // Quitar la clase 'activa' de todas las pantallas HTML
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("pantalla-juego").classList.remove("activa");

    // Activar únicamente la pantalla seleccionada
    if (pantallaDestino === 'menu') {
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (pantallaDestino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderizarHechicerosHTML();
    } else if (pantallaDestino === 'tienda') {
        document.getElementById("pantalla-tienda").classList.add("activa");
        renderizarTiendaHTML();
    } else if (pantallaDestino === 'juego') {
        document.getElementById("pantalla-juego").classList.add("activa");
    }
    
    // Activa la canción al interactuar con cualquier botón
    reproducirMusicaGD();
}

// --- TIENDA DE HABILIDADES OPERATIVA ---
function renderizarTiendaHTML() {
    let tabla = document.getElementById("contenedor-tienda");
    if (!tabla) return;

    tabla.innerHTML = CONFIG_TIENDA.map(h => `
        <div class="item-habilidad">
            <div class="info-txt">
                <div style="font-weight: bold; color: white;">${h.nombre}</div>
                <div style="font-size: 11px; color: #888;">${h.desc}</div>
                <div style="font-size: 11px; color: #ffcc00;">Costo: $${h.precio} PTS</div>
            </div>
            <button class="btn-comprar ${h.comprado ? 'adquirido' : ''}" onclick="procesarCompra(${h.id})">
                ${h.comprado ? 'LISTO' : 'COMPRAR'}
            </button>
        </div>
    `).join('');
}

function procesarCompra(id) {
    let item = CONFIG_TIENDA.find(h => h.id === id);
    if (item && !item.comprado) {
        if (puntosJugador >= item.precio) {
            puntosJugador -= item.precio;
            item.comprado = true;
            
            // Actualizar textos en tiempo real
            document.getElementById("txt-puntos").innerText = puntosJugador;
            renderizarTiendaHTML();
        } else {
            alert("¡No tienes suficientes puntos acumulados!");
        }
    }
}

// --- SELECCIÓN DE SKINS DE HECHICEROS ---
function renderizarHechicerosHTML() {
    let tabla = document.getElementById("contenedor-hechiceros");
    if (!tabla) return;

    tabla.innerHTML = CONFIG_HECHICEROS.map(p => `
        <div class="item-habilidad" style="cursor: pointer;" onclick="cambiarSkin('${p.nombre}')">
            <div class="info-txt">
                <div style="font-weight: bold; color: ${hechiceroActivo === p.nombre ? '#00ff66' : '#fff'}">${p.nombre}</div>
                <div style="font-size: 11px; color: #666;">${p.desc}</div>
            </div>
            ${hechiceroActivo === p.nombre ? '<span style="color:#00ff66; font-size:11px; font-weight:bold;">ACTIVO</span>' : ''}
        </div>
    `).join('');
}

function cambiarSkin(nombre) {
    hechiceroActivo = nombre;
    renderizarHechicerosHTML();
}

// --- REPRODUCTOR DE MÚSICA (GEOMETRY DASH MODO PRÁCTICA) ---
function reproducirMusicaGD() {
    if (!musicaIniciada) {
        let pista = document.getElementById("musica-gd");
        if (pista) {
            pista.volume = 0.25; // Volumen idóneo de fondo
            pista.play().then(() => {
                musicaIniciada = true;
            }).catch(error => {
                console.log("Esperando interacción inicial para reproducir la canción...");
            });
        }
    }
}

// --- EFECTOS VISUALES EN CANVAS NATIVO (EL FONDO DEL VIDEO) ---
let canvas = document.getElementById("canvasFondo");
let ctx = canvas.getContext("2d");
let colorFondoActual = "#05050d";

function ajustarPantalla() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', ajustarPantalla);

// EVENTO DE TOQUE REPARADO: Ya no bloquea los botones del HTML
window.addEventListener('pointerdown', (e) => {
    // Cambia el tono del fondo de manera aleatoria al dar un toque sin congelarse
    let r = Math.floor(Math.random() * 15);
    let g = Math.floor(Math.random() * 15);
    let b = Math.floor(Math.random() * 25);
    colorFondoActual = `rgb(${r}, ${g}, ${b})`;
    
    reproducirMusicaGD(); // Asegura la música en iPad/Android
});

function animarFondoNativo() {
    ctx.fillStyle = colorFondoActual;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aquí puedes dejar tus bucles de caritas/hechiceros flotantes originales
    requestAnimationFrame(animarFondoNativo);
}

// Inicialización completa al cargar la página en GitHub Pages
window.onload = () => {
    ajustarPantalla();
    animarFondoNativo();
};

