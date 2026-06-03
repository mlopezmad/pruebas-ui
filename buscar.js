const MENU_URL = "menu.json";

const $ = (id) => document.getElementById(id);

function fechaDesdeClave(clave) {
  const [year, month, day] = clave.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatearFecha(fecha) {
  const texto = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(fecha);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buscarPlatos(dias, termino) {
  const resultados = [];
  const busqueda = normalizar(termino);

  Object.keys(dias)
    .sort()
    .reverse()
    .forEach(clave => {
      const menu = dias[clave];

      if (menu.festivo) return;

      const grupos = [
        { nombre: "Primeros", platos: menu.primeros || [] },
        { nombre: "Segundos", platos: menu.segundos || [] },
        { nombre: "Dieta y plancha", platos: menu.dieta || [] }
      ];

      grupos.forEach(grupo => {
        grupo.platos.forEach(plato => {
          if (normalizar(plato).includes(busqueda)) {
            resultados.push({
              fecha: fechaDesdeClave(clave),
              grupo: grupo.nombre,
              plato
            });
          }
        });
      });
    });

  return resultados;
}

function pintarResultados(resultados, termino) {
  const contenedor = $("resultados");
  contenedor.innerHTML = "";

  if (!termino.trim()) {
    contenedor.innerHTML = `
      <div class="card">
        Escribe un plato para buscar en el historial.
      </div>
    `;
    return;
  }

  if (resultados.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        No se encontraron platos con “${termino}”.
      </div>
    `;
    return;
  }

  resultados.forEach(resultado => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${resultado.plato}</h2>
      <p class="menu-text">
        ${resultado.grupo}
        <br>
        ${formatearFecha(resultado.fecha)}
      </p>
    `;

    contenedor.appendChild(card);
  });
}

async function iniciarBuscador() {
  const input = $("busqueda");
  const contenedor = $("resultados");

  try {
    const respuesta = await fetch(`${MENU_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el menú");
    }

    const datos = await respuesta.json();
    const dias = datos.dias || {};

    pintarResultados([], "");

    input.addEventListener("input", () => {
      const termino = input.value;
      const resultados = buscarPlatos(dias, termino);
      pintarResultados(resultados, termino);
    });

  } catch (error) {
    contenedor.innerHTML = `
      <div class="card">
        No se ha podido cargar el buscador.
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", iniciarBuscador);