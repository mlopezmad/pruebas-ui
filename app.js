const MENU_URL = "menu.json";

const GITHUB_COMMITS_URL =
  "https://api.github.com/repos/mlopezmad/Menu-comedor/commits?path=menu.json&per_page=1";

const $ = (id) => document.getElementById(id);

function fechaClave(fecha) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function esFinDeSemana(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function formatearFecha(fecha) {
  const texto = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(fecha);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFechaCorta(fecha) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(fecha);
}

function fechaBonita() {
  return formatearFecha(new Date());
}

function pintarFecha() {
  $("fecha").textContent = fechaBonita();
}

async function cargarFechaActualizacion() {
  const actualizado = $("actualizado");

  if (!actualizado) return;

  try {
    const respuesta = await fetch(`${GITHUB_COMMITS_URL}&t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo consultar GitHub");
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos) || datos.length === 0) {
      throw new Error("Sin datos de actualización");
    }

    const fechaCommit = new Date(datos[0].commit.committer.date);

    actualizado.textContent =
      `Menú semanal actualizado el ${formatearFechaCorta(fechaCommit)}`;

  } catch (error) {
    actualizado.textContent =
      "No se pudo comprobar la fecha de actualización.";
  }
}

function pintarBloque(menu) {
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

function mensajeSinMenu(fecha, menuHoy) {
  if (esFinDeSemana(fecha)) {
    return "🍴 El comedor permanece cerrado hoy.";
  }

  if (menuHoy && menuHoy.festivo) {
    return "🎉 Hoy es festivo. No hay servicio de comedor.";
  }

  return "⚠️ El menú de hoy no está cargado.";
}

function proximosDias(datos) {
  const resultado = [];
  const hoy = new Date();

  for (let i = 1; i <= 7; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);

    if (esFinDeSemana(fecha)) continue;

    const clave = fechaClave(fecha);
    const menu = datos.dias?.[clave];

    if (!menu) continue;
    if (menu.festivo) continue;

    resultado.push({
      fecha,
      menu
    });
  }

  return resultado;
}

async function cargarMenu() {
  pintarFecha();
  cargarFechaActualizacion();

  try {
    const respuesta = await fetch(`${MENU_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el menú");
    }

    const datos = await respuesta.json();

    const hoyFecha = new Date();
    const hoyClave = fechaClave(hoyFecha);
    const menuHoy = datos.dias?.[hoyClave];

    if (!menuHoy || menuHoy.festivo) {
      $("dia").textContent = fechaBonita();
      $("contenido-hoy").innerHTML = mensajeSinMenu(hoyFecha, menuHoy);

      const seccionSemana = document.querySelector(".week");
      const diasFuturos = proximosDias(datos);

      if (diasFuturos.length === 0) {
        seccionSemana.style.display = "none";
        return;
      }

      seccionSemana.style.display = "block";

      const semana = $("semana");
      semana.innerHTML = "";

      diasFuturos.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <h2>${formatearFecha(item.fecha)}</h2>
          ${pintarBloque(item.menu)}
        `;

        semana.appendChild(card);
      });

      return;
    }

    $("dia").textContent = fechaBonita();
    $("contenido-hoy").innerHTML = pintarBloque(menuHoy);

    const semana = $("semana");
    const seccionSemana = document.querySelector(".week");
    const diasFuturos = proximosDias(datos);

    semana.innerHTML = "";

    if (diasFuturos.length === 0) {
      seccionSemana.style.display = "none";
      return;
    }

    seccionSemana.style.display = "block";

    diasFuturos.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h2>${formatearFecha(item.fecha)}</h2>
        ${pintarBloque(item.menu)}
      `;

      semana.appendChild(card);
    });

  } catch (error) {
    $("dia").textContent = "Hoy";
    $("contenido-hoy").innerHTML = "No se ha podido cargar el menú.";

    const seccionSemana = document.querySelector(".week");
    seccionSemana.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", cargarMenu);

document
  .getElementById("recargar")
  .addEventListener("click", cargarMenu);