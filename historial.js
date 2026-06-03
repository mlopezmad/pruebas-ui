const MENU_URL = "menu.json";

const $ = (id) => document.getElementById(id);

function fechaDesdeClave(clave) {
  const [year, month, day] = clave.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function fechaClave(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatearFecha(fecha) {
  const texto = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(fecha);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obtenerLunes(fecha) {
  const copia = new Date(fecha);
  const dia = copia.getDay();
  const diferencia = dia === 0 ? -6 : 1 - dia;

  copia.setDate(copia.getDate() + diferencia);
  copia.setHours(0, 0, 0, 0);

  return copia;
}

function formatearSemana(lunes) {
  const viernes = new Date(lunes);
  viernes.setDate(lunes.getDate() + 4);

  const inicio = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long"
  }).format(lunes);

  const fin = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(viernes);

  return `Semana del ${inicio} al ${fin}`;
}

function pintarBloque(menu) {
  if (menu.festivo) {
    return `
      <p class="menu-text">
        🎉 Festivo. No hay servicio de comedor.
      </p>
    `;
  }

  return `
    <div style="margin-top:10px">

      <h3 style="margin:0 0 8px 0;">Primeros</h3>
      <ul style="margin:0 0 16px 22px; padding:0;">
        ${(menu.primeros || []).map(x => `<li>${x}</li>`).join("")}
      </ul>

      <h3 style="margin:0 0 8px 0;">Segundos</h3>
      <ul style="margin:0 0 16px 22px; padding:0;">
        ${(menu.segundos || []).map(x => `<li>${x}</li>`).join("")}
      </ul>

      <h3 style="margin:0 0 8px 0;">Dieta y plancha</h3>
      <ul style="margin:0 0 8px 22px; padding:0;">
        ${(menu.dieta || []).map(x => `<li>${x}</li>`).join("")}
      </ul>

    </div>
  `;
}

function agruparPorSemanas(dias) {
  const semanas = {};

  Object.keys(dias)
    .sort()
    .forEach(clave => {
      const fecha = fechaDesdeClave(clave);
      const lunes = obtenerLunes(fecha);
      const claveSemana = fechaClave(lunes);

      if (!semanas[claveSemana]) {
        semanas[claveSemana] = {
          lunes,
          dias: {}
        };
      }

      semanas[claveSemana].dias[clave] = dias[clave];
    });

  return semanas;
}

function pintarSemana(semana) {
  const contenedor = $("historial-contenido");
  contenedor.innerHTML = "";

  const claves = Object.keys(semana.dias).sort();

  if (claves.length === 0) {
    contenedor.innerHTML = `
      <div class="card">
        No hay menús guardados para esta semana.
      </div>
    `;
    return;
  }

  claves.forEach(clave => {
    const fecha = fechaDesdeClave(clave);
    const menu = semana.dias[clave];

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${formatearFecha(fecha)}</h2>
      ${pintarBloque(menu)}
    `;

    contenedor.appendChild(card);
  });
}

async function cargarHistorial() {
  const selector = $("selector-semana");
  const contenedor = $("historial-contenido");

  try {
    const respuesta = await fetch(`${MENU_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el menú");
    }

    const datos = await respuesta.json();
    const dias = datos.dias || {};
    const semanas = agruparPorSemanas(dias);
    const clavesSemana = Object.keys(semanas).sort().reverse();

    selector.innerHTML = "";

    if (clavesSemana.length === 0) {
      selector.innerHTML = `
        <option value="">
          No hay semanas guardadas
        </option>
      `;

      contenedor.innerHTML = `
        <div class="card">
          No hay historial disponible.
        </div>
      `;

      return;
    }

    clavesSemana.forEach(claveSemana => {
      const option = document.createElement("option");
      option.value = claveSemana;
      option.textContent = formatearSemana(semanas[claveSemana].lunes);

      selector.appendChild(option);
    });

    const primeraSemana = clavesSemana[0];
    selector.value = primeraSemana;
    pintarSemana(semanas[primeraSemana]);

    selector.addEventListener("change", () => {
      const claveSeleccionada = selector.value;
      pintarSemana(semanas[claveSeleccionada]);
    });

  } catch (error) {
    selector.innerHTML = `
      <option value="">
        Error al cargar
      </option>
    `;

    contenedor.innerHTML = `
      <div class="card">
        No se ha podido cargar el historial.
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", cargarHistorial);