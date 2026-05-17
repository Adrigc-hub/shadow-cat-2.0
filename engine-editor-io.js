/**
 * SHADOW CAT ENGINE v2.0 - ARCHIVO 2: ADVANCED GRID EDITOR & LAYER FILE IO
 * Sistema de almacenamiento en LocalStorage, empaquetado JSON y herramienta de borrado por capas.
 */
(function(global) {
    "use strict";

    class LevelEditorGrid {
        constructor(tamanoCelda = 40) {
            this.tamanoCelda = tamanoCelda;
            this.capasDeBloques = new Map(); // Almacenamiento indexado por coordenadas unificadas
            this.modoBorrarActivo = false;
        }

        colocarBloque(gx, gy, idBloque, capa = "principal") {
            const llaveCoordenada = `${gx},${gy}`;
            if (this.modoBorrarActivo) {
                // Mecánica del Basurero 🗑️: Elimina el bloque si coincide con el puntero táctil
                this.capasDeBloques.delete(llaveCoordenada);
                if(window.FXManagerInstance) window.FXManagerInstance.emitirExplosionExplosiva(gx * this.tamanoCelda, gy * this.tamanoCelda, "#ff2222", 5, 2);
            } else {
                this.capasDeBloques.set(llaveCoordenada, { gx, gy, id: idBloque, capa });
            }
        }

        activarHerramientaBasurero(estado) {
            this.modoBorrarActivo = estado;
            console.log(`[Editor] Herramienta Basurero 🗑️: ${estado ? "ACTIVADA" : "DESACTIVADA"}`);
        }

        /**
         * Convierte toda la grilla interactiva en una cadena cifrada JSON lista para subir a GitHub
         */
        exportarNivelAStringJSON(nombreNivel = "Mi Nivel SpaceX") {
            const arregloBloques = Array.from(this.capasDeBloques.values());
            const estructuraMeta = {
                versionEngine: "2.0-Hyper",
                nombre: nombreNivel,
                fechaExportacion: new Date().toISOString(),
                datosMapa: arregloBloques
            };
            return JSON.stringify(estructuraMeta);
        }

        importarNivelDesdeJSON(stringJSON) {
            try {
                const objetoEntrada = JSON.parse(stringJSON);
                this.capasDeBloques.clear();
                objetoEntrada.datosMapa.forEach(b => {
                    this.capasDeBloques.set(`${b.gx},${b.gy}`, b);
                });
                console.log(`[Editor] Nivel "${objetoEntrada.nombre}" cargado con éxito.`);
                return true;
            } catch(e) {
                console.error("Error crítico al procesar la carga del JSON estructural:", e);
                return false;
            }
        }
    }

    global.LevelEditorGrid = LevelEditorGrid;
})(typeof window !== "undefined" ? window : globalThis);

