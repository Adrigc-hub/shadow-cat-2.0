// ==========================================================
// MÓDULO 4: FÍSICAS VECTORIALES Y ARCADE (MODO NORMAL REPARADO)
// ==========================================================
let SansBoss = { x: 300, y: 120, hp: 300, maxHp: 300, activo: false, fase: "oleada", vx: 4, timerHit: 0, angulo: 0 };

function procesarFisicasModoNormal() {
    // Mecánica 61-90: Disparos vectoriales calculados desde cualquier ángulo tocado
    for(let i = BALAS_ALIADAS.length - 1; i >= 0; i--) {
        let b = BALAS_ALIADAS[i];
        b.x += b.vx * EngineState.deltaTime; b.y += b.vy * EngineState.deltaTime;
        
        // Dibujar proyectil con estela de luz
        ctx.fillStyle = "#a333ff"; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI*2); ctx.fill();

        // Colisión contra naves flotantes normales
        ENEMIGOS.forEach((en, eIdx) => {
            if(b.x >= en.x && b.x <= en.x + en.w && b.y >= en.y && b.y <= en.y + en.h) {
                generarExplosionParticulas(en.x + en.w/2, en.y + en.h/2, "#ffaa00", 12, "fuego");
                
                // Mecánica 91-110: Generación de Drops Dinámicos con Gravedad
                DROPS.push({
                    x: en.x + en.w/2, y: en.y + en.h, 
                    vy: 2.0, tipo: Math.random() > 0.5 ? "moneda" : "energia"
                });

                ENEMIGOS.splice(eIdx, 1); BALAS_ALIADAS.splice(i, 1);
                EngineState.score += 25; EngineState.puntos += 5;
                REGISTRO_MODS.forEach(m => { if(m.onEliminarEnemigo) m.onEliminarEnemigo(); });
            }
        });

        // Colisión contra la hitbox de Sans Boss
        if(SansBoss.activo && b.x >= SansBoss.x - 30 && b.x <= SansBoss.x + 30 && b.y >= SansBoss.y - 20 && b.y <= SansBoss.y + 60) {
            SansBoss.hp -= 8; SansBoss.timerHit = 4; BALAS_ALIADAS.splice(i, 1);
            generarExplosionParticulas(b.x, b.y, "#00ffff", 8, "neon");
            if(SansBoss.hp <= 0) {
                SansBoss.activo = false; EngineState.puntos += 500;
                alert("⚔️ SANS HA SIDO DERROTADO ⚔️");
                EngineState.modo = "menu";
            }
        }
    }

    // Mecánica 111-130: Caída de Monedas y Energía con recolección magnética
    for(let d = DROPS.length - 1; d >= 0; d--) {
        let dr = DROPS[d];
        dr.y += dr.vy * EngineState.deltaTime; // Caída por física de gravedad

        // Dibujo estético de drops
        if(dr.tipo === "moneda") {
            ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(dr.x, dr.y, 8, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillStyle = "#00ff82"; ctx.fillRect(dr.x - 6, dr.y - 6, 12, 12);
        }

        // Detección de colisión por radio de cercanía con el gato
        let dist = Math.sqrt(Math.pow(dr.x - JugadorEntidad.x, 2) + Math.pow(dr.y - JugadorEntidad.y, 2));
        if(dist < 30) {
            if(dr.tipo === "moneda") EngineState.puntos += 15;
            else JugadorEntidad.hp = Math.min(JugadorEntidad.maxHp, JugadorEntidad.hp + 10);
            DROPS.splice(d, 1);
        } else if (dr.y > canvas.height) {
            DROPS.splice(d, 1);
        }
    }

    // Ejecutar IA Avanzada de Batalla de Sans Boss (Megalovania Phase)
    if(SansBoss.activo) {
        SansBoss.angulo += 0.05 * EngineState.deltaTime;
        SansBoss.x += SansBoss.vx * EngineState.deltaTime;
        if(SansBoss.x < 50 || SansBoss.x > canvas.width - 50) SansBoss.vx *= -1;
        
        let dynamicallyY = SansBoss.y + Math.sin(SansBoss.angulo) * 15;

        // Renderizado del Sprite estilizado de Sans
        ctx.fillStyle = "#ffffff"; ctx.fillRect(SansBoss.x - 20, dynamicallyY - 20, 40, 30);
        ctx.fillStyle = "#0000ff"; ctx.fillRect(SansBoss.x - 25, dynamicallyY + 10, 50, 40);
        // Ojo megalovania cian parpadeante
        ctx.fillStyle = (Math.floor(performance.now() / 70) % 2 === 0) ? "#00ffff" : "#000000";
        ctx.fillRect(SansBoss.x + 4, dynamicallyY - 10, 6, 6);

        // Disparar proyectiles de huesos/rayos de energía cian de forma aleatoria
        if(Math.random() < 0.07) {
            BALAS_ENEMIGAS.push({ x: SansBoss.x, y: dynamicallyY + 40, vy: 6 });
        }
    }
}
