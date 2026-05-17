// --- VARIABLES GLOBALES DEL MOTOR ---
let puntosAcumulados = 100;
let modoActual = "menu";
let juegoPausado = false;
let skinEquipada = "Gojo Satoru";
let musicaSonando = false;

const HABILIDADES = [
    { nombre: "Escudo de Vacío", precio: 50, comprado: false },
    { nombre: "Automático", precio: 30, comprado: false }
];

const SKINS_HECHICEROS = {
    "Gojo Satoru": { cuerpo: "#0c0214", aura: "#00d2ff" },
    "Yuji Itadori": { cuerpo: "#210505", aura: "#ff3c3c" },
    "Megumi Fushiguro": { cuerpo: "#030f0a", aura: "#00ff88" }
};

// Sistema de Entidades
let jugadorX = 200, jugadorY = 400, jugadorHP = 10;
let misBalas = [], objetivosOriginales = [], balasCaendo = [], particulasChispas = [];
let estrellasFondo = [], energiaMaldita = 0, puntosPartida = 0;

// Configuración de Ataques y Estados Especiales
let purpuraActivoContador = 0;
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 3;
let tiempoUltimoBossCheck = 0;

// Variables de la Arena de Sans (Jefe Secreto)
let faseJefeSecreto = 1; 
let jefeSecretoHP = 100;
let cuadroSans = { x: 0, y: 0, w: 260, h: 260 }; 
let temporizadorAtaqueFase = 0;
let listaAtaquesFase = []; 
let textoRefusedContador = 0;

// Variables Dance of Fire and Ice
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true, velocidadAngular = 0.06;

// Variables Shoot the Box
let cajaShoot = { x: 100, y: 100, vx: 4, vy: 2, gravedad: 0.16, tamaño: 60 };

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
        estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, s: Math.random()*1.5 });
    }
}

// --- NAVEGADOR DE PANTALLAS ---
function cambiarPantalla(destino) {
    document.getElementById("pantalla-menu").classList.remove("activa");
    document.getElementById("pantalla-hechiceros").classList.remove("activa");
    document.getElementById("pantalla-tienda").classList.remove("activa");
    document.getElementById("hud-juego").style.display = "none";
    document.getElementById("btn-purpura").style.display = "none";

    juegoPausado = false;
    miniBossActivo = false;
    textoRefusedContador = 0;
    energiaMaldita = 0;
    puntosPartida = 0;
    jugadorHP = 10;
    purpuraActivoContador = 0;
    faseJefeSecreto = 1;

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
        jugadorY = canvas.height - 140;
        misBalas = []; objetivosOriginales = []; balasCaendo = []; particulasChispas = [];
        tiempoUltimoBossCheck = Date.now();

        if (destino === 'juego-original') modoActual = "original";
        if (destino === 'juego-ritmo') { modoActual = "ritmo"; fuegoX = canvas.width/2; fuegoY = canvas.height/2; anguloPlaneta = 0; pivoteFuego = true; }
        if (destino === 'juego-shoot') { modoActual = "shoot"; reajustarCajaShoot(); }
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

// --- GESTIÓN DE ENTRADAS TÁCTILES ---
window.addEventListener('pointerdown', (e) => {
    encenderMusicaGD();
    if (juegoPausado || modoActual === "menu" || textoRefusedContador > 0) return;

    // SISTEMA ORIGINAL: Presionar directamente el bloque objetivo para dispararle
    if (modoActual === "original") {
        let presionoObjetivo = false;
        
        objetivosOriginales.forEach(obj => {
            if (e.clientX >= obj.x && e.clientX <= obj.x + 35 && e.clientY >= obj.y && e.clientY <= obj.y + 35) {
                presionoObjetivo = true;
                // Disparar orbe directo hacia la posición del objetivo clickeado
                misBalas.push({ x: jugadorX, y: jugadorY - 20, targetX: obj.x + 17, targetY: obj.y + 17 });
            }
        });

        if (miniBossActivo && e.clientX >= miniBossX - 40 && e.clientX <= miniBossX + 40 && e.clientY >= miniBossY && e.clientY <= miniBossY + 60) {
            presionoObjetivo = true;
            misBalas.push({ x: jugadorX, y: jugadorY - 20, targetX: miniBossX, targetY: miniBossY + 30 });
        }
    }
    
    // RITMO
    if (modoActual === "ritmo") {
        let radioOrbita = 80;
        if (pivoteFuego) { fuegoX = hieloX + Math.cos(anguloPlaneta)*radioOrbita; fuegoY = hieloY + Math.sin(anguloPlaneta)*radioOrbita; pivoteFuego = false; }
        else { hieloX = fuegoX + Math.cos(anguloPlaneta)*radioOrbita; hieloY = fuegoY + Math.sin(anguloPlaneta)*radioOrbita; pivoteFuego = true; }
        anguloPlaneta += Math.PI;
        puntosPartida += 5;
    }

    // SHOOT THE BOX
    if (modoActual === "shoot") {
        if (e.clientX >= cajaShoot.x && e.clientX <= cajaShoot.x + cajaShoot.tamaño && e.clientY >= cajaShoot.y && e.clientY <= cajaShoot.y + cajaShoot.tamaño) {
            puntosPartida += 10;
            reajustarCajaShoot();
        }
    }
});

// Movimiento por arrastre controlado (Sujeto a límites de las líneas en modo Sans)
window.addEventListener('pointermove', (e) => {
    if (juegoPausado || modoActual === "menu" || textoRefusedContador > 0) return;

    if (modoActual === "original") {
        jugadorX = Math.max(30, Math.min(canvas.width - 30, e.clientX));
    }
    
    if (modoActual === "jefe_secreto") {
        // MOVIMIENTO LIBRE 4 DIRECCIONES BLOQUEADO DENTRO DEL CUADRO SANS
        jugadorX = Math.max(cuadroSans.x + 15, Math.min(cuadroSans.x + cuadroSans.w - 15, e.clientX));
        jugadorY = Math.max(cuadroSans.y + 15, Math.min(cuadroSans.y + cuadroSans.h - 15, e.clientY));
    }
});

// --- ACTIVACIÓN DEL PODER ILIMITADO MORADO ---
function detonarIlimitadoPurpura() {
    if (energiaMaldita >= 100 && purpuraActivoContador === 0) {
        energiaMaldita = 0;
        purpuraActivoContador = 180; // Dura 3 segundos a 60fps
        document.getElementById("btn-purpura").style.display = "none";
    }
}

function crearChispas(x, y) {
    for(let i=0; i<8; i++) {
        particulasChispas.push({ x: x, y: y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, alpha: 1 });
    }
}

function reajustarCajaShoot() {
    cajaShoot.x = 50 + Math.random() * (canvas.width - 120);
    cajaShoot.y = 100;
    cajaShoot.vx = (Math.random() > 0.5 ? 2 : -2) * (3 + Math.random()*3);
    cajaShoot.vy = -4;
}

// --- BUCLE PRINCIPAL ---
function buclePrincipal() {
    ctx.fillStyle = "#020204";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render de estrellas fijas de fondo
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.s, st.s); });

    // Actualizar partículas de chispas
    ctx.fillStyle = "#ffaa00";
    for (let i = particulasChispas.length - 1; i >= 0; i--) {
        let p = particulasChispas[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.04;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, 3, 3);
        if(p.alpha <= 0) particulasChispas.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    if (modoActual !== "menu" && !juegoPausado) {
        if(modoActual === "original") {
            document.getElementById("txt-hud-stats").innerText = `VIDAS: ${jugadorHP} | PUNTOS: ${puntosPartida} | ENERGÍA: ${Math.floor(energiaMaldita)}%`;
            if (energiaMaldita >= 100 && purpuraActivoContador === 0) document.getElementById("btn-purpura").style.display = "flex";
            actualizarModoOriginal();
        } else if (modoActual === "jefe_secreto") {
            document.getElementById("txt-hud-stats").innerText = `FASE SANS: ${faseJefeSecreto}/10 | TU HP: ${jugadorHP}`;
            actualizarModoSans();
        } else {
            document.getElementById("txt-hud-stats").innerText = `MODO: ${modoActual.toUpperCase()} | PUNTOS: ${puntosPartida}`;
            if (modoActual === "ritmo") actualizarModoRitmo();
            if (modoActual === "shoot") actualizarModoShoot();
        }

        // Condición de Muerte Unificada
        if (jugadorHP <= 0) {
            alert(`FIN DEL JUEGO. Sumaste +${puntosPartida} puntos.`);
            volverAlMenuPrincipal();
        }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo") {
        dibujarPersonajeSkin(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- MODO 1: ARENA ORIGINAL ---
function actualizarModoOriginal() {
    if (Math.random() < 0.02) objetivosOriginales.push({ x: Math.random() * (canvas.width - 40), y: -30 });
    if (Math.random() < 0.04) balasCaendo.push({ x: Math.random() * canvas.width, y: -10, vy: 4.5 });

    if (Date.now() - tiempoUltimoBossCheck > 10000 && !miniBossActivo) {
        tiempoUltimoBossCheck = Date.now();
        if (Math.random() < 0.20) { miniBossActivo = true; miniBossHP = 20; miniBossX = canvas.width/2; miniBossY = 90; }
    }

    // Dibujar objetivos normales
    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 2;
        ctx.fillRect(obj.x, obj.y, 35, 35);
        // Si el bloque objetivo toca el suelo, se pierde
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    // Balas enemigas cayendo
    ctx.fillStyle = "#00d2ff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy;
        ctx.fillRect(bc.x, bc.y, 4, 15);

        // Impacto directo al Hechicero
        if (bc.y > jugadorY - 20 && bc.y < jugadorY + 20 && bc.x > jugadorX - 25 && bc.x < jugadorX + 25) {
            balasCaendo.splice(idx, 1);
            jugadorHP--;
        }
        if (bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });

    // Habilidad del Púrpura destructor masivo
    if (purpuraActivoContador > 0) {
        purpuraActivoContador--;
        ctx.fillStyle = "rgba(163, 51, 255, 0.85)";
        ctx.fillRect(jugadorX - 45, 0, 90, canvas.height); // Borrado lineal vertical masivo
        
        // Destruye todo a su paso
        objetivosOriginales = [];
        balasCaendo = [];
        if (miniBossActivo) {
            miniBossHP -= 0.5;
            if(miniBossHP <= 0) { miniBossActivo = false; iniciarTransicionSans(); }
        }
    }

    // Lógica física de nuestras balas disparadas a objetivos
    misBalas.forEach((mb, i) => {
        let dx = mb.targetX - mb.x;
        let dy = mb.targetY - mb.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist > 5) {
            mb.x += (dx / dist) * 10;
            mb.y += (dy / dist) * 10;
        } else {
            misBalas.splice(i, 1);
            return;
        }

        ctx.fillStyle = "#a333ff";
        ctx.beginPath(); ctx.arc(mb.x, mb.y, 7, 0, Math.PI*2); ctx.fill();

        // CHOQUE FÍSICO CONTRA BALAS ENEMIGAS (CHISPAS)
        balasCaendo.forEach((bc, bIdx) => {
            if (Math.abs(mb.x - bc.x) < 12 && Math.abs(mb.y - bc.y) < 12) {
                crearChispas(mb.x, mb.y);
                balasCaendo.splice(bIdx, 1);
                misBalas.splice(i, 1);
            }
        });
    });

    if (miniBossActivo) {
        miniBossX += miniBossVX;
        if(miniBossX < 50 || miniBossX > canvas.width - 50) miniBossVX *= -1;
        ctx.fillStyle = "#e60067";
        ctx.fillRect(miniBossX - 40, miniBossY, 80, 50); // Cubo gigante
        ctx.fillStyle = "white";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText(`MINI BOSS: ${Math.floor(miniBossHP)} HP`, miniBossX - 35, miniBossY - 10);
    }
}

function iniciarTransicionSans() {
    modoActual = "jefe_secreto";
    faseJefeSecreto = 1;
    jugadorHP = 10;
    cuadroSans.x = canvas.width/2 - 130;
    cuadroSans.y = canvas.height/2 - 60;
    jugadorX = canvas.width/2;
    jugadorY = canvas.height/2 + 40;
    generarAtaquesFaseSans();
}

// --- MODO 2: JEFE SECRETO ESTILO SANS TRADUCIDO ---
function actualizarModoSans() {
    // Escena Intermedia "But it Refused"
    if (textoRefusedContador > 0) {
        textoRefusedContador--;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0044";
        ctx.font = "bold 26px Courier New";
        ctx.fillText("But it refused...", canvas.width/2 - 110, canvas.height/2);
        if(textoRefusedContador === 0) {
            faseJefeSecreto = 10;
            temporizadorAtaqueFase = 0;
            generarAtaquesFaseSans();
        }
        return;
    }

    // Dibujar caja límite obligatoria de Sans
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.strokeRect(cuadroSans.x, cuadroSans.y, cuadroSans.w, cuadroSans.h);

    // Dibujar al Oponente Sans (Caja con aura de fuego)
    ctx.fillStyle = "#111";
    ctx.fillRect(canvas.width/2 - 30, cuadroSans.y - 70, 60, 50);
    ctx.strokeStyle = "#a333ff";
    ctx.strokeRect(canvas.width/2 - 30, cuadroSans.y - 70, 60, 50);

    // Sistema de Temporizadores de la fase activa
    temporizadorAtaqueFase++;
    if (temporizadorAtaqueFase > 300) { // Cada fase dura 5 segundos
        temporizadorAtaqueFase = 0;
        faseJefeSecreto++;
        if (faseJefeSecreto === 10) {
            textoRefusedContador = 150; // Detona animación de muerte y renacimiento
        } else if (faseJefeSecreto > 10) {
            puntosPartida += 2000;
            alert("¡FELICIDADES! DESTROZASTE AL JEFE SECRETO.");
            volverAlMenuPrincipal();
        } else {
            generarAtaquesFaseSans();
        }
    }

    // Renderizar ataques de la fase (Puestas aleatorias sin patrón repetible)
    listaAtaquesFase.forEach(atk => {
        if (atk.tipo === "hueso") {
            ctx.fillStyle = "#fff";
            ctx.fillRect(atk.x, atk.y, atk.w, atk.h);
            // Colisión por hitbox estricta
            if (jugadorX > atk.x && jugadorX < atk.x + atk.w && jugadorY > atk.y && jugadorY < atk.y + atk.h) {
                jugadorHP--;
            }
        }
        
        if (atk.tipo === "blaster_triangulo") {
            atk.timer++;
            // Dibujar Blaster Triangular
            ctx.strokeStyle = "#00ffcc";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(atk.x, atk.y - 15);
            ctx.lineTo(atk.x - 15, atk.y + 15);
            ctx.lineTo(atk.x + 15, atk.y + 15);
            ctx.closePath();
            ctx.stroke();

            // Disparo del rayo láser continuo al pasar 1.5 segundos
            if (atk.timer > 45) {
                ctx.fillStyle = "rgba(0, 255, 200, 0.75)";
                ctx.fillRect(atk.x - 6, atk.y + 15, 12, canvas.height);
                
                // Colisión con rayo láser triangular
                if (Math.abs(jugadorX - atk.x) < 12 && jugadorY > atk.y + 15) {
                    jugadorHP--;
                }
            }
        }
    });
}

// PRODUCCIÓN ALEATORIA DE 20 AMENAZAS SIN REPETIR PATRÓN
function generarAtaquesFaseSans() {
    listaAtaquesFase = [];
    let cantidadAtaquesMax = 12 + faseJefeSecreto * 2; // Sube la densidad por fase

    for (let i = 0; i < cantidadAtaquesMax; i++) {
        let randTipo = Math.random() > 0.4 ? "hueso" : "blaster_triangulo";
        
        if (randTipo === "hueso") {
            listaAtaquesFase.push({
                tipo: "hueso",
                x: cuadroSans.x + Math.random() * (cuadroSans.w - 20),
                y: cuadroSans.y + Math.random() * (cuadroSans.h - 40),
                w: 12, h: 45
            });
        } else {
            listaAtaquesFase.push({
                tipo: "blaster_triangulo",
                x: cuadroSans.x + Math.random() * cuadroSans.w,
                y: cuadroSans.y + 20,
                timer: 0
            });
        }
    }
}

// --- MODO 3: DANCE OF FIRE AND ICE ---
function actualizarModoRitmo() {
    anguloPlaneta += velocidadAngular;
    let radioOrbita = 80;
    let ejeX = pivoteFuego ? fuegoX : hieloX;
    let ejeY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = ejeX + Math.cos(anguloPlaneta) * radioOrbita;
        hieloY = ejeY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = ejeX + Math.cos(anguloPlaneta) * radioOrbita;
        fuegoY = ejeY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(fuegoX, fuegoY); ctx.lineTo(hieloX, hieloY); ctx.stroke();

    ctx.fillStyle = "#ff3300";
    ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 20, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00bfff";
    ctx.beginPath(); ctx.arc(hieloX, hieloY, 20, 0, Math.PI*2); ctx.fill();
}

// --- MODO 4: SHOOT THE BOX ---
function actualizarModoShoot() {
    cajaShoot.vy += cajaShoot.gravedad;
    cajaShoot.x += cajaShoot.vx;
    cajaShoot.y += cajaShoot.vy;

    if (cajaShoot.x <= 0 || cajaShoot.x + cajaShoot.tamaño >= canvas.width) cajaShoot.vx *= -1;
    if (cajaShoot.y + cajaShoot.tamaño >= canvas.height - 30) {
        cajaShoot.vy = -Math.abs(cajaShoot.vy) * 0.85;
    }

    ctx.fillStyle = "#ff6600";
    ctx.fillRect(cajaShoot.x, cajaShoot.y, cajaShoot.tamaño, cajaShoot.tamaño);
    ctx.strokeStyle = "white";
    ctx.strokeRect(cajaShoot.x, cajaShoot.y, cajaShoot.tamaño, cajaShoot.tamaño);
}

// --- PINTADO DEL GATO CON SUS COMPONENTES ---
function dibujarPersonajeSkin(x, y) {
    let style = SKINS_HECHICEROS[skinEquipada] || SKINS_HECHICEROS["Gojo Satoru"];

    // Aura mística expandida
    ctx.fillStyle = style.aura + "22";
    ctx.beginPath(); ctx.arc(x, y, 35, 0, Math.PI*2); ctx.fill();

    // Cabeza del Gato
    ctx.fillStyle = style.cuerpo;
    ctx.strokeStyle = style.aura;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Orejas/Cuernos blancos del Gato
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 12); ctx.lineTo(x - 12, y - 32); ctx.lineTo(x - 2, y - 20); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 22, y - 12); ctx.lineTo(x + 12, y - 32); ctx.lineTo(x + 2, y - 20); ctx.fill();

    // Ojos blancos rectos
    ctx.fillStyle = "white";
    ctx.fillRect(x - 11, y - 4, 6, 6);
    ctx.fillRect(x + 5, y - 4, 6, 6);
}

function renderTienda() {
    let div = document.getElementById("contenedor-tienda"); if (!div) return;
    div.innerHTML = HABILIDADES.map((h, i) => `
        <div class="item-habilidad">
            <div style="text-align:left;">
                <div style="font-weight:bold;">${h.nombre}</div>
                <div style="font-size:11px; color:#ffcc00;">$${h.precio} PTS</div>
            </div>
            <button class="btn-comprar ${h.comprado ? 'adquirido' : ''}" onclick="comprarItem(${i})">${h.comprado ? 'USANDO' : 'COMPRAR'}</button>
        </div>
    `).join('');
}

function comprarItem(i) {
    let h = HABILIDADES[i];
    if (!h.comprado && puntosAcumulados >= h.precio) { puntosAcumulados -= h.precio; h.comprado = true; document.getElementById("txt-puntos").innerText = puntosAcumulados; renderTienda(); }
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_HECHICEROS).map(name => `
        <div class="item-habilidad" onclick="equiparSkin('${name}')">
            <div style="text-align:left; font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
            ${skinEquipada === name ? '<span style="color:#00ff66; font-size:11px; font-weight:bold;">PUESTA</span>' : '<button class="btn-comprar" style="background:#222; color:white;">USAR</button>'}
        </div>
    `).join('');
}

function equiparSkin(name) { skinEquipada = name; renderSkins(); }

function encenderMusicaGD() {
    let audio = document.getElementById("musica-gd");
    if (audio && !musicaSonando) { audio.volume = 0.15; audio.play().then(() => { musicaSonando = true; }).catch(() => {}); }
}

window.onload = () => { redimensionar(); generarEstrellas(); buclePrincipal(); };

