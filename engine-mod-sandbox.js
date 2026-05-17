/**
 * SHADOW CAT ENGINE v2.0 - ARCHIVO 5: SECURE COMMUNITY SCRIPTING & MOD SANDBOX
 * Gestor de eventos globales y ganchos de ejecución en tiempo de ejecución.
 */
(function(global) {
    "use strict";

    class ModSandboxRuntime {
        constructor() {
            this.modsInyectados = new Map();
            this.listaGanchosPermitidos = ["onPlayerUpdate", "onEnemyKill", "onBlockPlace", "onMusicBeat"];
        }

        /**
         * Permite a los usuarios inyectar modificaciones dinámicas desde la consola del navegador
         */
        inyectarCodigoComunidad(idMod, objetoConfig) {
            if (!objetoConfig.nombre) {
                console.error("[Sandbox] Error: El mod inyectado requiere un nombre descriptivo obligatoriamente.");
                return false;
            }

            this.modsInyectados.set(idMod, {
                nombre: objetoConfig.nombre,
                onPlayerUpdate: objetoConfig.onPlayerUpdate || null,
                onEnemyKill: objetoConfig.onEnemyKill || null,
                onMusicBeat: objetoConfig.onMusicBeat || null,
                datosLocales: objetoConfig.variablesIniciales || {}
            });

            console.log(`%c 🚀 Mod [${objetoConfig.nombre}] acoplado con éxito al Shadow Cat Engine.`, "color: #00ff88; font-weight: bold;");
            return true;
        }

        /**
         * Disparador interno que recorre todos los mods activos de forma asíncrona y segura
         */
        ejecutarGanchoEspecifico(nombreGancho, parametro1, parametro2) {
            this.modsInyectados.forEach((mod) => {
                if (mod[nombreGancho]) {
                    try {
                        // Ejecución segura envuelta en try-catch para que un mod roto no congele el juego principal
                        mod[nombreGancho](parametro1, parametro2, mod.datosLocales);
                    } catch (error) {
                        console.error(`[Sandbox Critical] Error de ejecución en el Mod [${mod.nombre}]:`, error);
                    }
                }
            });
        }
    }

    global.ModSandboxRuntime = ModSandboxRuntime;
})(typeof window !== "undefined" ? window : globalThis);

