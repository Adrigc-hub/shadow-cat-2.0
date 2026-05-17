// --- PARAMETRAJE GENERAL ---
let puntosAcumulados = 100;
let modoActual = "menu";
let juegoPausado = false;
let skinEquipada = "Gojo Satoru";
let musicaSonando = false;

const SKINS_HECHICEROS = {
    "Gojo Satoru": { cuerpo: "#0b0214", aura: "#00d2ff" },
    "Yuji Itadori": { cuerpo: "#1f0303", aura: "#ff3c3c" },
    "Megumi Fushiguro": { cuerpo: "#020a07", aura: "#00ff88" }
};

// Entidades Físicas
let jugadorX = 200, jugadorY = 400, jugadorHP = 10;
let misBalas = [], objetivosOriginales = [], balasCaendo = [], particulasChispas = [];
let estrellasFondo = [], energiaMaldita = 0, puntosPartida = 0;

// Timers y Estado del Jefe
let purpuraActivoContador = 0;
let miniBossActivo = false;
let miniBossHP = 20;
let miniBossX = 200, miniBossY = 90, miniBossVX = 3;
let tiempoInicioPartida = 0;
let faseJefeSecreto = 1;
let cuadroSans = { x: 0, y: 0, w: 260, h: 260 };
let temporizadorAtaqueFase = 0;
let listaAtaquesFase = [];
let textoRefusedContador = 0;

// Variables Dance of Fire and Ice con Caminos de Bloques Reales
let bloquesRitmo = [];
let indiceBloqueActual = 0;
let fuegoX = 0, fuegoY = 0, hieloX = 0, hieloY = 0, anguloPlaneta = 0;
let pivoteFuego = true, velocidadAngular = 0.05;

// Variables Shoot the Box Avanzado (Poderes, Multiplicadores, Desaparición de Caída)
let listaCajasShoot = [];
let duracionSlowMo = 0;
let factorMultiplicador = 1;
let tiempoUltimaCajaShoot = 0;

const canvas = document.getElementById("canvasJuego");
const ctx = canvas.getContext("2d");

function redimensionar() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', redimensionar);

function generarEstrellas() {
    estrellasFondo = [];
    for(let i=0; i<45; i++) {
        estrellasFondo.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, s: Math.random()*1.5 });
    }
}

// --- SELECTOR Y CONTROLADOR DE PANTALLAS ---
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
    duracionSlowMo = 0;
    factorMultiplicador = 1;

    if (destino === 'menu') {
        modoActual = "menu";
        document.getElementById("pantalla-menu").classList.add("activa");
    } else if (destino === 'hechiceros') {
        document.getElementById("pantalla-hechiceros").classList.add("activa");
        renderSkins();
    } else if (destino === 'tienda') {
        document.getElementById("pantalla-tienda").classList.add("activa");
    } else {
        document.getElementById("hud-juego").style.display = "flex";
        jugadorX = canvas.width / 2;
        jugadorY = canvas.height - 150;
        misBalas = []; objetivosOriginales = []; balasCaendo = []; particulasChispas = [];
        tiempoInicioPartida = Date.now();

        if (destino === 'juego-original') modoActual = "original";
        if (destino === 'juego-ritmo') {
            modoActual = "ritmo";
            generarCaminoBloquesRitmo();
        }
        if (destino === 'juego-shoot') {
            modoActual = "shoot";
            listaCajasShoot = [];
            tiempoUltimaCajaShoot = Date.now();
            lanzarCajaShootPro();
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

// --- MANEJO EXCLUSIVO DEL ARRASTRE FLUIDO (SOLUCIÓN DEL DEDO) ---
function procesarMoverDedo(clientX, clientY) {
    if (juegoPausado || modoActual === "menu" || textoRefusedContador > 0) return;

    if (modoActual === "original") {
        // Mueve al gato libremente de izquierda a derecha por arrastrar en cualquier lado
        jugadorX = Math.max(30, Math.min(canvas.width - 30, clientX));
        
        // DISPARO AUTOMÁTICO AL MOVERSE: Detecta el bloque más cercano y le tira orbe morado
        if (Math.random() < 0.12 && objetivosOriginales.length > 0) {
            let objetivoCercano = objetivosOriginales[0];
            misBalas.push({ x: jugadorX, y: jugadorY - 20, targetX: objetivoCercano.x + 15, targetY: objetivoCercano.y + 15 });
        }
        if (Math.random() < 0.08 && miniBossActivo) {
            misBalas.push({ x: jugadorX, y: jugadorY - 20, targetX: miniBossX, targetY: miniBossY + 25 });
        }
    }

    if (modoActual === "jefe_secreto") {
        // MOVIMIENTO LIBRE EN 4 DIRECCIONES SIN SALIRSE DE LAS LÍNEAS DE SANS
        jugadorX = Math.max(cuadroSans.x + 15, Math.min(cuadroSans.x + cuadroSans.w - 15, clientX));
        jugadorY = Math.max(cuadroSans.y + 15, Math.min(cuadroSans.y + cuadroSans.h - 15, clientY));
    }
}

// Eventos unificados para iPad, Android y Mouse
window.addEventListener('pointerdown', (e) => {
    encenderMusicaGD();
    procesarMoverDedo(e.clientX, e.clientY);

    // MECÁNICA PRECISA DE ACCIÓN POR TOQUE (DANCE OF FIRE AND SHOOT THE BOX)
    if (modoActual === "ritmo" && !juegoPausado) {
        let proximoBloque = bloquesRitmo[indiceBloqueActual + 1];
        if (proximoBloque) {
            let esferaLibreX = pivoteFuego ? hieloX : fuegoX;
            let esferaLibreY = pivoteFuego ? hieloY : fuegoY;

            // Medir distancia de la esfera al centro del bloque objetivo
            let distABloque = Math.sqrt(Math.pow(esferaLibreX - proximoBloque.x, 2) + Math.pow(esferaLibreY - proximoBloque.y, 2));

            if (distABloque < 38) { // Hitbox rítmica generosa para pantallas táctiles
                indiceBloqueActual++;
                puntosPartida += 15;
                if (pivoteFuego) { fuegoX = proximoBloque.x; fuegoY = proximoBloque.y; pivoteFuego = false; }
                else { hieloX = proximoBloque.x; hieloY = proximoBloque.y; pivoteFuego = true; }
                
                if (indiceBloqueActual >= bloquesRitmo.length - 1) {
                    puntosPartida += 100;
                    alert("¡Llegaste al final del camino rítmico!");
                    volverAlMenuPrincipal();
                }
            } else {
                puntosPartida = Math.max(0, puntosPartida - 5); // Penalización por fallar el compás
            }
        }
    }

    if (modoActual === "shoot" && !juegoPausado) {
        for(let i = listaCajasShoot.length - 1; i >= 0; i--) {
            let caja = listaCajasShoot[i];
            if (e.clientX >= caja.x && e.clientX <= caja.x + caja.w && e.clientY >= caja.y && e.clientY <= caja.y + caja.h) {
                
                if (caja.tipo === "trampa") {
                    puntosPartida = Math.max(0, puntosPartida - 15);
                } else if (caja.tipo === "slow") {
                    duracionSlowMo = 180; // 3 segundos de cámara lenta
                    puntosPartida += 10 * factorMultiplicador;
                } else if (caja.tipo === "mult") {
                    factorMultiplicador = 2; // Duplica puntaje
                    setTimeout(() => { factorMultiplicador = 1; }, 4000);
                    puntosPartida += 10 * factorMultiplicador;
                } else {
                    puntosPartida += 10 * factorMultiplicador;
                }
                
                crearChispas(caja.x + 25, caja.y + 25);
                listaCajasShoot.splice(i, 1);
                break;
            }
        }
    }
});

window.addEventListener('pointermove', (e) => {
    procesarMoverDedo(e.clientX, e.clientY);
});

function detonarIlimitadoPurpura() {
    if (energiaMaldita >= 100 && purpuraActivoContador === 0) {
        energiaMaldita = 0;
        purpuraActivoContador = 180;
        document.getElementById("btn-purpura").style.display = "none";
    }
}

function crearChispas(x, y) {
    for(let i=0; i<8; i++) {
        particulasChispas.push({ x: x, y: y, vx: (Math.random()-0.5)*7, vy: (Math.random()-0.5)*7, alpha: 1 });
    }
}

// --- GENERADORES COMPLETOS DE CAMINOS ---
function generarCaminoBloquesRitmo() {
    bloquesRitmo = [];
    indiceBloqueActual = 0;
    let currX = canvas.width / 2 - 100;
    let currY = canvas.height / 2 + 100;

    // Crea un trazo de 20 bloques lineales ordenados
    for(let i=0; i<25; i++) {
        bloquesRitmo.push({ x: currX, y: currY });
        if (i % 2 === 0) currX += 75; 
        else currY -= 75;
    }
    
    // Posicionar esferas iniciales
    fuegoX = bloquesRitmo[0].x;
    fuegoY = bloquesRitmo[0].y;
    hieloX = fuegoX + 75;
    hieloY = fuegoY;
    pivoteFuego = true;
    anguloPlaneta = 0;
}

function lanzarCajaShootPro() {
    let tipos = ["normal", "normal", "trampa", "slow", "mult"];
    let tipoElegido = tipos[Math.floor(Math.random() * tipos.length)];
    
    listaCajasShoot.push({
        x: 60 + Math.random() * (canvas.width - 140),
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 5,
        vy: -7 - Math.random() * 5, // Impulso vertical hacia arriba
        w: 50, h: 50,
        tipo: tipoElegido
    });
}

// --- MOTOR GRÁFICO ---
function buclePrincipal() {
    ctx.fillStyle = "#020204";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    estrellasFondo.forEach(st => { ctx.fillRect(st.x, st.y, st.s, st.s); });

    // Render de Chispas
    ctx.fillStyle = "#ffcc00";
    for (let i = particulasChispas.length - 1; i >= 0; i--) {
        let p = particulasChispas[i]; p.x += p.vx; p.y += p.vy; p.alpha -= 0.04;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillRect(p.x, p.y, 3, 3);
        if(p.alpha <= 0) particulasChispas.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    if (modoActual !== "menu" && !juegoPausado) {
        if(modoActual === "original") {
            document.getElementById("txt-hud-stats").innerText = `HP: ${jugadorHP}/10 | PTS: ${puntosPartida} | PODER: ${Math.floor(energiaMaldita)}%`;
            if (energiaMaldita >= 100 && purpuraActivoContador === 0) document.getElementById("btn-purpura").style.display = "flex";
            actualizarModoOriginal();
        } else if (modoActual === "jefe_secreto") {
            document.getElementById("txt-hud-stats").innerText = `SANS FASE: ${faseJefeSecreto}/10 | TU HP: ${jugadorHP}`;
            actualizarModoSans();
        } else if (modoActual === "ritmo") {
            document.getElementById("txt-hud-stats").innerText = `BLOQUE: ${indiceBloqueActual + 1}/25 | PTS: ${puntosPartida}`;
            actualizarModoRitmo();
        } else if (modoActual === "shoot") {
            document.getElementById("txt-hud-stats").innerText = `MULT: x${factorMultiplicador} | PTS: ${puntosPartida} ${duracionSlowMo > 0 ? '[SLOWMO]' : ''}`;
            actualizarModoShoot();
        }

        if (jugadorHP <= 0) {
            alert(`PARTIDA TERMINADA. Puntos obtenidos: +${puntosPartida}`);
            volverAlMenuPrincipal();
        }
    }

    if (modoActual !== "menu" && modoActual !== "ritmo") {
        dibujarPersonajeSkin(jugadorX, jugadorY);
    }

    requestAnimationFrame(buclePrincipal);
}

// --- MODO ORIGINAL RECALIBRADO ---
function actualizarModoOriginal() {
    if (Math.random() < 0.025) objetivosOriginales.push({ x: Math.random() * (canvas.width - 50), y: -30, activo: true });
    if (Math.random() < 0.045) balasCaendo.push({ x: Math.random() * canvas.width, y: -10, vy: 5 });

    // APARECE EL BOSS FIJO A LOS 10 SEGUNDOS EXACTOS
    if (Date.now() - tiempoInicioPartida > 10000 && !miniBossActivo && faseJefeSecreto === 1) {
        miniBossActivo = true;
        miniBossHP = 20;
        miniBossX = canvas.width / 2;
    }

    // Dibujar bloques amarillos de puntos
    ctx.fillStyle = "#ffcc00";
    objetivosOriginales.forEach((obj, idx) => {
        obj.y += 2.5;
        ctx.fillRect(obj.x, obj.y, 32, 32);
        
        // Si sale de la pantalla desaparece solo
        if (obj.y > canvas.height) objetivosOriginales.splice(idx, 1);
    });

    // Balas celestes cayendo
    ctx.fillStyle = "#00d2ff";
    balasCaendo.forEach((bc, idx) => {
        bc.y += bc.vy;
        ctx.fillRect(bc.x, bc.y, 3, 15);

        if (bc.y > jugadorY - 20 && bc.y < jugadorY + 20 && bc.x > jugadorX - 25 && bc.x < jugadorX + 25) {
            balasCaendo.splice(idx, 1);
            jugadorHP--;
        }
        if (bc.y > canvas.height) balasCaendo.splice(idx, 1);
    });

    // Vacío Púrpura activado
    if (purpuraActivoContador > 0) {
        purpuraActivoContador--;
        ctx.fillStyle = "rgba(163, 51, 255, 0.8)";
        ctx.fillRect(jugadorX - 50, 0, 100, canvas.height);
        
        objetivosOriginales = [];
        balasCaendo = [];
        if (miniBossActivo) {
            miniBossHP -= 0.4;
            if(miniBossHP <= 0) { miniBossActivo = false; iniciarTransicionSans(); }
        }
    }

    // Movimiento balístico de nuestros disparos
    misBalas.forEach((mb, i) => {
        let dx = mb.targetX - mb.x;
        let dy = mb.targetY - mb.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist > 6) {
            mb.x += (dx / dist) * 11;
            mb.y += (dy / dist) * 11;
        } else {
            // Llegó al objetivo: Rompe el bloque, da puntos y desaparece
            objetivosOriginales.forEach((obj, oIdx) => {
                if (Math.abs(mb.x - (obj.x + 15)) < 25 && Math.abs(mb.y - (obj.y + 15)) < 25) {
                    objetivosOriginales.splice(oIdx, 1);
                    puntosPartida += 10;
                    if(energiaMaldita < 100) energiaMaldita += 7;
                }
            });
            misBalas.splice(i, 1);
            return;
        }

        ctx.fillStyle = "#a333ff";
        ctx.beginPath(); ctx.arc(mb.x, mb.y, 6, 0, Math.PI*2); ctx.fill();

        // CHOQUE DE BALAS EN EL AIRE: Desaparecen con chispas
        balasCaendo.forEach((bc, bIdx) => {
            if (Math.abs(mb.x - bc.x) < 14 && Math.abs(mb.y - bc.y) < 14) {
                crearChispas(mb.x, mb.y);
                balasCaendo.splice(bIdx, 1);
                misBalas.splice(i, 1);
            }
        });
    });

    if (miniBossActivo) {
        miniBossX += miniBossVX;
        if(miniBossX < 40 || miniBossX > canvas.width - 40) miniBossVX *= -1;
        ctx.fillStyle = "#e60067";
        ctx.fillRect(miniBossX - 45, miniBossY, 90, 50);
        ctx.fillStyle = "white";
        ctx.fillText(`CUBOMASTER: ${Math.floor(miniBossHP)} HP`, miniBossX - 35, miniBossY - 10);
    }
}

function iniciarTransicionSans() {
    modoActual = "jefe_secreto";
    faseJefeSecreto = 1;
    jugadorHP = 10;
    cuadroSans.x = canvas.width/2 - 130;
    cuadroSans.y = canvas.height/2 - 80;
    jugadorX = canvas.width/2;
    jugadorY = canvas.height/2 + 30;
    generarAtaquesSansAleatorios();
}

// --- MODO SANS COMPLETO (10 FASES & BUT IT REFUSED) ---
function actualizarModoSans() {
    if (textoRefusedContador > 0) {
        textoRefusedContador--;
        ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff0044"; ctx.font = "bold 24px Courier New";
        ctx.fillText("But it refused...", canvas.width/2 - 100, canvas.height/2);
        if(textoRefusedContador === 0) { faseJefeSecreto = 10; temporizadorAtaqueFase = 0; generarAtaquesSansAleatorios(); }
        return;
    }

    ctx.strokeStyle = "white"; ctx.lineWidth = 4;
    ctx.strokeRect(cuadroSans.x, cuadroSans.y, cuadroSans.w, cuadroSans.h);

    temporizadorAtaqueFase++;
    if (temporizadorAtaqueFase > 250) { // Cambio de fase rápido
        temporizadorAtaqueFase = 0;
        faseJefeSecreto++;
        if (faseJefeSecreto === 10) { textoRefusedContador = 140; }
        else if (faseJefeSecreto > 10) { puntosPartida += 1500; alert("¡Destrozaste a Sans!"); volverAlMenuPrincipal(); }
        else { generarAtaquesSansAleatorios(); }
    }

    listaAtaquesFase.forEach(atk => {
        if (atk.tipo === "hueso") {
            ctx.fillStyle = "#fff"; ctx.fillRect(atk.x, atk.y, atk.w, atk.h);
            if (jugadorX > atk.x && jugadorX < atk.x + atk.w && jugadorY > atk.y && jugadorY < atk.y + atk.h) jugadorHP--;
        }
        if (atk.tipo === "blaster_triangulo") {
            atk.timer++;
            ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(atk.x, atk.y - 12); ctx.lineTo(atk.x - 12, atk.y + 12); ctx.lineTo(atk.x + 12, atk.y + 12);
            ctx.closePath(); ctx.stroke();

            if (atk.timer > 40) {
                ctx.fillStyle = "rgba(0, 255, 200, 0.7)";
                ctx.fillRect(atk.x - 5, atk.y + 12, 10, canvas.height);
                if (Math.abs(jugadorX - atk.x) < 10 && jugadorY > atk.y + 12) jugadorHP--;
            }
        }
    });
}

function generarAtaquesSansAleatorios() {
    listaAtaquesFase = [];
    let limite = 10 + faseJefeSecreto * 2;
    for(let i=0; i<limite; i++) {
        let esHueso = Math.random() > 0.4;
        if(esHueso) {
            listaAtaquesFase.push({ tipo: "hueso", x: cuadroSans.x + Math.random() * (cuadroSans.w - 15), y: cuadroSans.y + Math.random() * (cuadroSans.h - 40), w: 10, h: 40 });
        } else {
            listaAtaquesFase.push({ tipo: "blaster_triangulo", x: cuadroSans.x + Math.random() * cuadroSans.w, y: cuadroSans.y + 10, timer: 0 });
        }
    }
}

// --- MODO DANCE OF FIRE AND ICE CON CAMINOS ---
function actualizarModoRitmo() {
    // Dibujar el camino de bloques
    bloquesRitmo.forEach((bl, idx) => {
        ctx.fillStyle = (idx === indiceBloqueActual) ? "#333" : "#1c1c28";
        ctx.fillRect(bl.x - 20, bl.y - 20, 40, 40);
        ctx.strokeStyle = "#444";
        ctx.strokeRect(bl.x - 20, bl.y - 20, 40, 40);
    });

    // Física de la órbita de esferas
    anguloPlaneta += velocidadAngular;
    let radioOrbita = 75;
    let centroEjeX = pivoteFuego ? fuegoX : hieloX;
    let centroEjeY = pivoteFuego ? fuegoY : hieloY;

    if (pivoteFuego) {
        hieloX = centroEjeX + Math.cos(anguloPlaneta) * radioOrbita;
        hieloY = centroEjeY + Math.sin(anguloPlaneta) * radioOrbita;
    } else {
        fuegoX = centroEjeX + Math.cos(anguloPlaneta) * radioOrbita;
        fuegoY = centroEjeY + Math.sin(anguloPlaneta) * radioOrbita;
    }

    // Enlace
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath(); ctx.moveTo(fuegoX, fuegoY); ctx.lineTo(hieloX, hieloY); ctx.stroke();

    ctx.fillStyle = "#ff3300"; ctx.beginPath(); ctx.arc(fuegoX, fuegoY, 16, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00bfff"; ctx.beginPath(); ctx.arc(hieloX, hieloY, 16, 0, Math.PI*2); ctx.fill();
}

// --- MODO SHOOT THE BOX PRO (GRAVEDAD Y AUTO DESAPARICIÓN) ---
function actualizarModoShoot() {
    if (duracionSlowMo > 0) duracionSlowMo--;

    if (Date.now() - tiempoUltimaCajaShoot > 900) {
        tiempoUltimaCajaShoot = Date.now();
        lanzarCajaShootPro();
    }

    let speedFactor = (duracionSlowMo > 0) ? 0.4 : 1.0;

    for (let i = listaCajasShoot.length - 1; i >= 0; i--) {
        let caja = listaCajasShoot[i];
        caja.vy += 0.16 * speedFactor; // Gravedad real aplicada
        caja.x += caja.vx * speedFactor;
        caja.y += caja.vy * speedFactor;

        // Color según tipo de poder
        if (caja.tipo === "trampa") ctx.fillStyle = "#ff2222";
        else if (caja.tipo === "slow") ctx.fillStyle = "#00ff66";
        else if (caja.tipo === "mult") ctx.fillStyle = "#0099ff";
        else ctx.fillStyle = "#ff7700";

        ctx.fillRect(caja.x, caja.y, caja.w, caja.h);
        ctx.strokeStyle = "white"; ctx.strokeRect(caja.x, caja.y, caja.w, caja.h);

        // CONDICIÓN: Si cae de regreso abajo del canvas, desaparece sola de la lista
        if (caja.y > canvas.height + 40) {
            listaCajasShoot.splice(i, 1);
        }
    }
}

// --- SKIN DEL GATO (OREJAS Y OJOS RECTOS ORIGINALES) ---
function dibujarPersonajeSkin(x, y) {
    let style = SKINS_HECHICEROS[skinEquipada] || SKINS_HECHICEROS["Gojo Satoru"];
    ctx.fillStyle = style.aura + "22";
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = style.cuerpo; ctx.strokeStyle = style.aura; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Orejas de gato blancas
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.moveTo(x - 20, y - 10); ctx.lineTo(x - 12, y - 30); ctx.lineTo(x - 2, y - 18); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 20, y - 10); ctx.lineTo(x + 12, y - 30); ctx.lineTo(x + 2, y - 18); ctx.fill();

    // Ojos del viejo sprite
    ctx.fillStyle = "white";
    ctx.fillRect(x - 10, y - 4, 5, 5); ctx.fillRect(x + 5, y - 4, 5, 5);
}

function renderSkins() {
    let div = document.getElementById("contenedor-hechiceros"); if (!div) return;
    div.innerHTML = Object.keys(SKINS_HECHICEROS).map(name => `
        <div class="item-habilidad" onclick="equiparSkin('${name}')">
            <div style="font-weight:bold; color:${skinEquipada === name ? '#00ff66' : '#fff'}">${name}</div>
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
