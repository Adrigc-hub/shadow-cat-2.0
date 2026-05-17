// --- VARIABLES DEL MOTOR ---
let puntosAcumulados = 100;
let modoActual = "menu";
let juegoPausado = false;
let skinEquipada = "Gojo Satoru";
let musicaSonando = false;

// Datos de Configuración
const HABILIDADES = [
    { nombre: "Escudo Temporal", precio: 50, comprado: false },
    { nombre: "Escudo Automático", precio: 30, comprado: false },
    { nombre: "Auto-Aim Legendario", precio: 1000, comprado: false }
];

const SKINS_HECHICEROS = {
    "Gojo Satoru": { cuerpo: "#110022", aura: "#00d2ff", cuernos: true },
    "Yuji Itadori": { cuerpo: "#2b0a0a", aura: "#ff3c3c", cuernos: true },
    "Megumi Fushiguro": { cuerpo: "#05160e", aura: "#00ff88", cuernos: false },
    "Nobara Kugisaki": { cuerpo: "#1c100b", aura: "#ff0077", cuernos: false }
};

// Variables de Físicas y Entidades
let jugadorX = 200, jugadorY = 400;
let misBalas = [], objetivosOriginales = [], balasCaendo = [];
let estrellasFondo = [];
let energiaMaldita = 0;
let puntosPartida = 0;

// Variables de Boss y Transiciones Reales (Viejo Prototipo)
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 120, miniBossVX = 3;
let tiempoUltimoBossCheck = 0;
let animacionSecretaContador = 0;
let faseJefeSecreto = false;
let jefeSecretoHP = 100;

// Variables Dance of Fire and Ice (Físicas Reales de Pivote Rítmico)
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0;
let anguloPlaneta = 0;
let pivoteFuego = true; // Define cuál esfera está estática sirviendo de eje
let velocidadAngular = 0.06;

// Variables Shoot the Box con Gravedad Física
let cajaShoot = { x: 100, y: 100, vx: 4, vy: 2, gravedad: 0.15, tamaño: 65 };

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionar);

// --- INICIALIZADOR DE ESTRELLAS (ESTILO ESPACIAL VIEJO) ---
function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<60; i++) {
        estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, s: Math.random()*2 });
    }
}

// --- NAVEGACIÓN ---
function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";

    juegoPausado = false;
    miniBossActivo = false;
    faseJefeSecreto = false;
    animacionSecretaContador = 0;
    energiaMaldita = 0;
    puntosPartida = 0;

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
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2;
        jugadorY = canvas.height - 120;
        misBalas = []; objetivosOriginales = []; balasCaendo = [];
        tiempoUltimoBossCheck = Date.now();

        if (destino === 'juego-original') {
            modoActual = "original";
        }
        if (destino === 'juego-ritmo') {
            modoActual = "ritmo";
            fuegoX = canvas.width / 2;
            fuegoY = canvas.height / 2;
            anguloPlaneta = 0;
            pivoteFuego = true;
        }
        if (destino === 'juego-shoot') {
            modoActual = "shoot";
            reajustarCajaShoot();
        }
    }
    encenderMusicaGD();
}

function activarPausa(estado) {
    juegoPausado = estado;
    document.getElementById("menu-pausa").style.display = estado ? "flex" : "none";
}

function volverAlMenuPrincipal() {
    puntosAcumulados += puntosPartida;
    document.getElementById("txt-puntos").innerText = puntosAcumulados;
    activarPausa(false);
    cambiarPantalla('menu');
}

// --- CLICS Y TOCADOS ---
window.addEventListener('pointerdown', (e) => {
    encenderMusicaGD();
    if (juegoPausado || modoActual === "menu") return;

    if (modoActual === "original" || modoActual === "jefe_secreto") {
        // Disparo idéntico al viejo prototipo (Orbes morados encadenados)
        misBalas.push({ x: jugadorX, y: jugadorY - 25 });
    }
    
    if (modoActual === "ritmo") {
        // FÍSICA DANCE OF FIRE AND ICE: El planeta que orbitaba se vuelve el centro estable
        if (pivoteFuego) {
            fuegoX = centroRotacionX();
            fuegoY = centroRotacionY();
            pivoteFuego = false;
        } else {
            hieloX = centroRotacionX();
            hieloY = centroRotacionY();
            pivoteFuego = true;
        }
        anguloPlaneta += Math.PI; // Invierte el cuadrante de rotación de forma matemática
        puntosPartida += 5;
    }

    if (modoActual === "shoot") {
        // Validación de hit dentro del perímetro real de la caja rebotadora
        if (e.clientX >= cajaShoot.x && e.clientX <= cajaShoot.x + cajaShoot.tamaño &&
            e.clientY >= cajaShoot.y && e.clientY <= cajaShoot.y + cajaShoot.tamaño) {
            puntosPartida += 10;
            reajustarCajaShoot();
        }
    }
});

// Arrastre suave del dedo
window.addEventListener('pointermove', (e) => {
    if ((modoActual === "original" || modoActual === "jefe_secreto") && !juegoPausado) {
        jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    }
});

function centroRotacionX() { return pivoteFuego ? fuegoX : hieloX; }
function centroRotacionY() { return pivoteFuego ? fuegoY : hieloY; }

function reajustarCajaShoot() {
    cajaShoot.x = 60 + Math.random() * (canvas.width - 150);
    cajaShoot.y = 80 + Math.random() * 150;
    cajaShoot.vx = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
    cajaShoot.vy = -3 - Math.random() * 3; // Impulso inicial hacia arriba
}

// --- BUCLE CENTRAL DEL MOTOR ---
function buclePrincipal() {
    // Fondo espacial
    ctx.fillStyle = "#030308";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.s, st.s); });

    if (modoActual !== "menu" && !juegoPausado) {
        if(modoActual === "original" || modoActual === "jefe_secreto") {
            document.getElementById("txt-hud-stats").innerText = `PUNTOS: ${puntosPartida} | ENERGÍA MALDITA: ${Math.floor(energiaMaldita)}/100`;
        } else {
            document.getElementById("txt-hud-stats").innerText = `MODO: ${modoActual.toUpperCase()} | PUNTOS: ${puntosPartida}`;
        }

        if (modoActual === "original") actualizarModoOriginal();
        if (modoActual === "jefe_secreto") actualizarModoJefeSecreto();
        if (modoActual === "ritmo") actualizarModoRitmo();
        if (modoActual === "shoot") actualizarModoShoot();
    }

    if (modoActual !== "menu") {
        if (modoActual !== "ritmo") dibujarPersonajeSkin(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- MODO ORIGINAL ACTUALIZADO ---
function actualizarModoOriginal() {
    // Generación aleatoria de amenazas
    if (Math.random() < 0.02) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -20, h: 25 });
    if (Math.random() < 0.05) balasCaendo.push({ x: Math.random() * canvas.width, y: -10, vy: 5 });

    // Evaluación del Mini Boss (Cada 10 segundos, probabilidad de 1 en 5)
    if (Date.now() - tiempoUltimoBossCheck > 10000 && !miniBossActivo) {
        tiempoUltimoBossCheck = Date.now();
        if (Math.random() < 0.20) { 
            miniBossActivo = true;
            miniBossHP = 20;
            miniBossX = canvas.width / 2;
            miniBossY = 100;
        }
    }

    // Dibujar objetivos
    ctx.fillStyle = "#ff2255";
    objetivosOriginales.forEach((obj, i) => {
        obj.y += 2.5;
        ctx.fillRect(obj.x, obj.y, 30, 30);
        if (obj.y > canvas.height) objetivosOriginales.splice(i, 1);
    });

    // Dibujar líneas/balas enemigas verticales cayendo (Como el juego viejo)
    ctx.fillStyle = "#00d2ff";
    balasCaendo.forEach((bc, i) => {
        bc.y += bc.vy;
        ctx.fillRect(bc.x, bc.y, 3, 16);
        if (bc.y > canvas.height) balasCaendo.splice(i, 1);
    });

    // Control de proyectiles del Hechicero (Gato)
    misBalas.forEach((mb, i) => {
        mb.y -= 9;
        
        // Estilo visual del disparo morado original
        ctx.fillStyle = "#a333ff";
        ctx.beginPath(); ctx.arc(mb.x, mb.y, 7, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(mb.x, mb.y, 3, 0, Math.PI*2); ctx.fill();

        if(mb.y < -20) misBalas.splice(i, 1);

        // Impacto a objetivos comunes
        objetivosOriginales.forEach((obj, oi) => {
            if(mb.x >= obj.x && mb.x <= obj.x+30 && mb.y >= obj.y && mb.y <= obj.y+30) {
                objetivosOriginales.splice(oi, 1);
                misBalas.splice(i, 1);
                puntosPartida += 10;
                if(energiaMaldita < 100) energiaMaldita += 8;
            }
        });

        // Impacto al Mini Boss
        if (miniBossActivo && mb.x >= miniBossX - 25 && mb.x <= miniBossX + 25 && mb.y >= miniBossY && mb.y <= miniBossY + 40) {
            misBalas.splice(i, 1);
            miniBossHP--;
            if (miniBossHP <= 0) {
                miniBossActivo = false;
                animacionSecretaContador = 90; // Activa disparo de flashes
                modoActual = "jefe_secreto";
            }
        }
    });

    if (miniBossActivo) {
        miniBossX += miniBossVX;
        if(miniBossX < 30 || miniBossX > canvas.width - 30) miniBossVX *= -1;
        
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(miniBossX - 25, miniBossY, 50, 35);
        
        ctx.fillStyle = "white";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(`MINI BOSS: ${miniBossHP} HP`, miniBossX - 30, miniBossY - 10);
    }
}

// --- ANIMACIÓN SECRETA Y JEFE SUKUNA (IGUAL AL VIEJO) ---
function actualizarModoJefeSecreto() {
    if (animacionSecretaContador > 0) {
        animacionSecretaContador--;
        // EFECTO VISUAL: Inversión de flashes estroboscópicos psicodélicos del juego original
        ctx.fillStyle = animacionSecretaContador % 4 === 0 ? "rgba(255,255,255,0.8)" : "rgba(144,0,199,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "black";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText("¡PORTAL ABRIÉNDOSE!", canvas.width/2 - 120, canvas.height/2);
        
        if(animacionSecretaContador === 0) {
            faseJefeSecreto = true;
            jefeSecretoHP = 100;
            balasCaendo = [];
        }
        return;
    }

    // Interfaz de Sukuna Arena
    ctx.strokeStyle = "#ff0044";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 150, canvas.width - 40, canvas.height - 300);

    // Dibujar Jefe Sukuna (Un cubo con ojos malvados del viejo motor)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(canvas.width / 2 - 40, 60, 80, 60);
    ctx.strokeStyle = "#ff0000";
    ctx.strokeRect(canvas.width / 2 - 40, 60, 80, 60);

    // Ojos rojos de Sukuna
    ctx.fillStyle = "red";
    ctx.fillRect(canvas.width / 2 - 25, 80, 10, 6);
    ctx.fillRect(canvas.width / 2 + 15, 80, 10, 6);

    // HUD del Jefe
    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.fillText(`SUKUNA HP: ${jefeSecretoHP}/100`, canvas.width/2 - 45, 45);

    // Ataque de cortes
    if(Math.random() < 0.07) {
        balasCaendo.push({ x: Math.random() * canvas.width, y: 120, vy: 6 });
    }

    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy;
        ctx.fillStyle = "#ff0044";
        ctx.fillRect(bc.x, bc.y, 2, 20); // Cortes lineales rojos
        if(bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });

    // Validar disparos al jefe
    misBalas.forEach((mb, i) => {
        mb.y -= 9;
        ctx.fillStyle = "#ffff00";
        ctx.fillRect(mb.x - 2, mb.y, 4, 12);

        if (mb.y < 120 && mb.x >= canvas.width/2 - 40 && mb.x <= canvas.width/2 + 40) {
            misBalas.splice(i, 1);
            jefeSecretoHP -= 4;
            if(jefeSecretoHP <= 0) {
                puntosPartida += 1000;
                volverAlMenuPrincipal();
            }
        }
    });
}

// --- MODO DANCE OF FIRE AND ICE ---
function actualizarModoRitmo() {
    anguloPlaneta += velocidadAngular;

    let radioOrbita = 85;
    let ejeX = centroRotacionX();
    let ejeY = centroRotacionY();

    // El planeta libre calcula su posición física por trigonometría exacta en base al radio
    if (pivoteFuego) {
        hieloX = ejeX + Math.cos(anguloPlaneta) * radioOrbita;
        hieloY = ejeY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = ejeX + Math.cos(anguloPlaneta) * radioOrbita;
        fuegoY = ejeY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    // Dibujar línea de enlace rítmica
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fuegoX, fuegoY);
    ctx.lineTo(hieloX, hieloY);
    ctx.stroke();

    // Renderizar Esfera Fire (Fuego - Roja)
    ctx.shadowBlur = 15; ctx.shadowColor = "#ff3300";
    ctx.fillStyle = "#ff4400";
    ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 24, 0, Math.PI*2); ctx.fill();

    // Renderizar Esfera Ice (Hielo - Azul)
    ctx.shadowColor = "#00ccff";
    ctx.fillStyle = "#00eeff";
    ctx.beginPath(); ctx.arc(hieloX, hieloY, 24, 0, Math.PI*2); ctx.fill();
    
    // Limpiar sombreado para no alentar el canvas
    ctx.shadowBlur = 0;
}

// --- MODO SHOOT THE BOX CON GRAVEDAD ---
function actualizarModoShoot() {
    // Aplicación de físicas reales (Velocidad y caída por gravedad)
    cajaShoot.vy += cajaShoot.gravedad;
    cajaShoot.x += cajaShoot.vx;
    cajaShoot.y += cajaShoot.vy;

    // Rebotes contra bordes laterales del Canvas
    if (cajaShoot.x <= 0 || cajaShoot.x + cajaShoot.tamaño >= canvas.width) {
        cajaShoot.vx *= -1;
    }
    // Rebote inferior contra el suelo simulado
    if (cajaShoot.y + cajaShoot.tamaño >= canvas.height - 40) {
        cajaShoot.vy = -Math.abs(cajaShoot.vy) * 0.85; // Absorción elástica del rebote
    }

    // Render de la caja naranja idéntica a tu video
    ctx.fillStyle = "#ff9900";
    ctx.fillRect(cajaShoot.x, cajaShoot.y, cajaShoot.tamaño, cajaShoot.tamaño);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(cajaShoot.x, cajaShoot.y, cajaShoot.tamaño, cajaShoot.tamaño);
}

// --- DIBUJO DE SKIN ORIGINAL (CÍRCULO CON OJOS BLANCOS) ---
function dibujarPersonajeSkin(x, y) {
    let style = SKINS_HECHICEROS[skinEquipada] || SKINS_HECHICEROS["Gojo Satoru"];

    // Aura exterior
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fillStyle = style.aura + "33";
    ctx.fill();

    // Cuerpo base circular
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = style.cuerpo;
    ctx.fill();
    ctx.strokeStyle = style.aura;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ojitos blancos del gato/hechicero original del video
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - 9, y - 4, 4, 0, Math.PI * 2);
    ctx.arc(x + 9, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();
}

// --- COMPONENTES DE INTERFAZ ---
function renderTienda() {
    let div = document.getElementById("contenedor-tienda");
    if (!div) return;
    div.innerHTML = HABILIDADES.map((h, i) => `
        <div class="item-habilidad">
            <div style="text-align:left;">
                <div style="font-weight:bold;">${h.nombre}</div>
                <div style="font-size:11px; color:#ffcc00;">Costo: $${h.precio} PTS</div>
            </div>
            <button class="btn-comprar ${h.comprado ? 'adquirido' : ''}" onclick="comprarItem(${i})">
                ${h.comprado ? 'ADQUIRIDO' : 'COMPRAR'}
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
            <div style="text-align:left; font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
            ${skinEquipada === name ? '<span style="color:#00ff66; font-size:12px; font-weight:bold;">USANDO</span>' : '<button class="btn-comprar" style="background:#333; color:white;">USAR</button>'}
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
        audio.volume = 0.18;
        audio.play().then(() => { musicaSonando = true; }).catch(() => {});
    }
}

window.onload = () => {
    redimensionar();
    generarEstrellas();
    buclePrincipal();
};
