/**
 * SISTEMA DE DETECCIÓN TÁCTIL PARA SELECCIÓN DE NIVELES GUARDADOS (SPACEX)
 * Agrega esto en tu archivo sketch.js para que al tocar los niveles carguen de verdad.
 */

// 1. Esta función se encarga de escuchar cuando tocas un elemento de la lista de niveles
function configurarSelectorDeNivelesDesdeLista() {
    // Buscamos el contenedor donde se muestran tus niveles creados de SpaceX
    const contenedorNiveles = document.querySelector('.lista-niveles, #listaNiveles, .modo-construccion'); 
    
    if (!contenedorNiveles) {
        // Si tus niveles se renderizan como botones individuales de HTML, les asignamos el evento directamente
        vincularEventosABotonesDeNivelDirectos();
        return;
    }

    // Escuchamos el clic o toque en todo el contenedor de la lista
    contenedorNiveles.addEventListener('click', function(evento) {
        // Buscamos si lo que tocaste es una de las filas de tus niveles guardados
        const elementoNivel = evento.target.closest('.item-nivel, li, button');
        
        if (elementoNivel) {
            let textoNivel = elementoNivel.innerText || elementoNivel.textContent;
            console.log("Has tocado el nivel: " + textoNivel);
            
            // Procesamos el nombre para saber qué sub-juego debe abrir de forma automática
            procesarYArrancarNivelSeleccionado(textoNivel);
        }
    });
}

// 2. Analiza el texto del nivel ("Mi Nivel SpaceX (DANCE)") y arranca el modo correcto
function procesarYArrancarNivelSeleccionado(nombreCompletoNivel) {
    let nombreLimpio = nombreCompletoNivel.toUpperCase();
    
    // Verificamos qué tipo de sub-juego tiene asignado en la lista
    if (nombreLimpio.includes("(DANCE)") || nombreLimpio.includes("DANCE OF FIRE")) {
        console.log("🚀 Cargando lógica de ritmo para: " + nombreCompletoNivel);
        
        // Apuntamos al estado global y cambiamos el modo en el monolito
        if (window.MasterShadowCatEngine) {
            window.MasterShadowCatEngine.cambiarModoDeSubJuego("DANCE_OF_FIRE");
            // Cerramos la ventana del menú del modo construcción si la tienes abierta
            cerrarVentanasModalesDeInterfaz();
        }
    } 
    else if (nombreLimpio.includes("(SHOOT)") || nombreLimpio.includes("SHOOT THE BOX")) {
        console.log("📦 Cargando lógica física destructiva para: " + nombreCompletoNivel);
        
        if (window.MasterShadowCatEngine) {
            window.MasterShadowCatEngine.cambiarModoDeSubJuego("SHOOT_THE_BOX");
            cerrarVentanasModalesDeInterfaz();
        }
    } 
    else {
        // Por defecto, si no especifica, abre tu Modo Normal de esquivar balas
        console.log("⚔️ Cargando Modo Original para: " + nombreCompletoNivel);
        if (window.MasterShadowCatEngine) {
            window.MasterShadowCatEngine.cambiarModoDeSubJuego("MODO_NORMAL");
            cerrarVentanasModalesDeInterfaz();
        }
    }
}

// 3. Función auxiliar para ocultar tus menús verdes de selección al entrar a jugar
function cerrarVentanasModalesDeInterfaz() {
    // Busca los bloques de tus menús de construcción (el cuadro verde de fondo) y los oculta
    const menuConstruccion = document.querySelector('.modo-construccion, #menuConstruccion');
    if (menuConstruccion) {
        menuConstruccion.style.display = 'none'; 
    }
    
    // Cambiamos el estado global para asegurarnos de que el juego ruede
    if (window.ENGINE_GLOBAL_STATE) {
        window.ENGINE_GLOBAL_STATE.running = true;
    }
}

// 4. Alternativa segura en caso de que tus niveles sean botones estáticos generados en el HTML
function vincularEventosABotonesDeNivelDirectos() {
    // Buscamos todos los elementos de texto que tengan la palabra "SpaceX" o "Nivel"
    const todosLosBotones = document.querySelectorAll('button, div');
    todosLosBotones.forEach(boton => {
        if (boton.innerText && boton.innerText.includes("SpaceX")) {
            // Le agregamos el evento táctil directo a cada caja verde de la lista
            boton.style.cursor = 'pointer'; // Para que sepa que se puede apachar
            boton.onclick = function() {
                procesarYArrancarNivelSeleccionado(boton.innerText);
            };
        }
    });
}

// ========================================================
// INICIALIZACIÓN: Aseguramos que corra al cargar sketch.js
// ========================================================
// Llama a esta función justo dentro de tu función setup() de p5.js o al final de tu archivo sketch.js
setTimeout(configurarSelectorDeNivelesDesdeLista, 500);

