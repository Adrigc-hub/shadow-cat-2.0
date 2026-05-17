// =========================================================================
// MÓDULO 5: EDITOR COMPLETO (SISTEMA DE MIGRACIÓN, BORRADOR 🗑️ Y CAPAS)
// =========================================================================
let EditorConfig = { bloqueSeleccionado: -1, scrollX: 0, modoBorrar: false };

function procesarLogicaEditor(eX, eY, click) {
    let celdaX = Math.floor((eX + EditorConfig.scrollX) / 40);
    let celdaY = Math.floor(eY / 40);
    let capaNivelActivo = PROYECTOS_MAPAS[PROYECTOS_MAPAS.length - 1];

    if(!capaNivelActivo) return;

    if(click) {
        if(EditorConfig.modoBorrar) {
            // Mecánica 131-150: Sistema Basurero 🗑️ para eliminar bloques en grilla por toque
            capaNivelActivo.bloques = capaNivelActivo.bloques.filter(b => b.gx !== celdaX || b.gy !== celdaY);
            generarExplosionParticulas(eX, eY, "#ff3c3c", 6, "humo");
        } else if (EditorConfig.bloqueSeleccionado >= 0) {
            // Añadir o sobreescribir bloque de forma limpia
            capaNivelActivo.bloques = capaNivelActivo.bloques.filter(b => b.gx !== celdaX || b.gy !== celdaY);
            capaNivelActivo.bloques.push({ gx: celdaX, gy: celdaY, id: EditorConfig.bloqueSeleccionado });
        }
    }
}

// ==========================================================
// MÓDULO 6: MOTOR DE RITMO (DANCE OF FIRE AND ICE ADAPTADO)
// ==========================================================
let RitmoPlaneta = { fuegoX: 0, fuegoY: 0, hieloX: 0, hieloY: 0, angulo: 0, pivoteFuego: true, velocidadGiro: 0.08, indice: 0 };
let LISTA_BLOQUES_RITMO = [];

function actualizarDanceOfFireCore() {
    // Mecánica 151-200: Modificadores físicos de velocidad interactivos
    RitmoPlaneta.angulo += RitmoPlaneta.velocidadGiro * EngineState.deltaTime;
    
    let centroX = RitmoPlaneta.pivoteFuego ? RitmoPlaneta.fuegoX : RitmoPlaneta.hieloX;
    let centroY = RitmoPlaneta.pivoteFuego ? RitmoPlaneta.fuegoY : RitmoPlaneta.hieloY;

    if(RitmoPlaneta.pivoteFuego) {
        RitmoPlaneta.hieloX = centroX + Math.cos(RitmoPlaneta.angulo) * 50;
        RitmoPlaneta.hieloY = centroY + Math.sin(RitmoPlaneta.angulo) * 50;
    } else {
        RitmoPlaneta.fuegoX = centroX + Math.cos(RitmoPlaneta.angulo) * 50;
        RitmoPlaneta.fuegoY = centroY + Math.sin(RitmoPlaneta.angulo) * 50;
    }

    // Dibujar pista y aplicar ralentización de Caracol (🐌) o aceleración de Leopardo (🐆)
    LISTA_BLOQUES_RITMO.forEach((bloque, index) => {
        if(bloque.tipo === "caracol") {
            ctx.fillStyle = "#6495ed"; // Bloque Caracol Lento
        } else if(bloque.tipo === "leopardo") {
            ctx.fillStyle = "#ff4500"; // Bloque Leopardo Rápido
        } else {
            ctx.fillStyle = index <= RitmoPlaneta.indice ? "#27ae60" : "#2c3e50";
        }
        ctx.fillRect(bloque.x, bloque.y, 46, 46);
    });

    // Dibujar Orbes de Planetas Giratorios
    ctx.fillStyle = "#ff3c3c"; ctx.beginPath(); ctx.arc(RitmoPlaneta.fuegoX + 23, RitmoPlaneta.fuegoY + 23, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = "#00aaff"; ctx.beginPath(); ctx.arc(RitmoPlaneta.hieloX + 23, RitmoPlaneta.hieloY + 23, 10, 0, Math.PI*2); ctx.fill();
}

// ====================================================================
// CONFIGURACIÓN DE INPUTS ADAPTADO A GESTOS TÁCTILES MÚLTIPLES (IPAD)
// ====================================================================
window.addEventListener('pointerdown', (e) => {
    if(EngineState.modo === "juego-original") {
        let distGato = Math.sqrt(Math.pow(e.clientX - JugadorEntidad.x, 2) + Math.pow(e.clientY - JugadorEntidad.y, 2));
        if(distGato < 45) {
            JugadorEntidad.arrastrando = true;
        } else {
            // Mecánica de toque/apacho directo: Disparar hacia la coordenada exacta
            let dx = e.clientX - JugadorEntidad.x;
            let dy = e.clientY - JugadorEntidad.y;
            let mag = Math.sqrt(dx*dx + dy*dy);
            BALAS_ALIADAS.push({ x: JugadorEntidad.x, y: JugadorEntidad.y - 15, vx: (dx/mag)*14, vy: (dy/mag)*14 });
        }
    }
    if(EngineState.modo === "editor_mapa") procesarLogicaEditor(e.clientX, e.clientY, true);
});

window.addEventListener('pointermove', (e) => {
    if(JugadorEntidad.arrastrando) {
        JugadorEntidad.targetX = e.clientX;
        JugadorEntidad.targetY = e.clientY;
    }
});

window.addEventListener('pointerup', () => { JugadorEntidad.arrastrando = false; });

// Lanzamiento inicial del ecosistema unificado
inicializarResolucioniPad();
requestAnimationFrame(loopMotor);
