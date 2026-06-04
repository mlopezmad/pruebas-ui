const MENU_URL = "menu.json";

const GITHUB_COMMITS_URL =
  "https://api.github.com/repos/mlopezmad/Menu-comedor/commits?path=menu.json&per_page=1";

const HORA_CAMBIO_MANANA = 16;

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

    if (!respuesta.ok) throw new Error("No se pudo consultar GitHub");

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

function mensajeSinMenu(fecha, menu) {
  if (esFinDeSemana(fecha)) {
    return "🍴 El comedor permanece cerrado ese día.";
  }

  if (menu && menu.festivo) {
    return "🎉 Es festivo. No hay servicio de comedor.";
  }

  return "⚠️ El menú no está cargado.";
}

function buscarSiguienteDiaConMenu(datos, desdeFecha, incluirDesde = false) {
  for (let i = incluirDesde ? 0 : 1; i <= 10; i++) {
    const fecha = new Date(desdeFecha);
    fecha.setDate(desdeFecha.getDate() + i);

    if (esFinDeSemana(fecha)) continue;

    const clave = fechaClave(fecha);
    const menu = datos.dias?.[clave];

    if (!menu) continue;
    if (menu.festivo) continue;

    return { fecha, menu };
  }

  return null;
}

function obtenerMenuPrincipal(datos) {
  const ahora = new Date();
  const hora = ahora.getHours();

  if (hora >= HORA_CAMBIO_MANANA) {
    const siguiente = buscarSiguienteDiaConMenu(datos, ahora, false);

    if (siguiente) {
      return {
        tipo: "mañana",
        fecha: siguiente.fecha,
        menu: siguiente.menu
      };
    }
  }

  const claveHoy = fechaClave(ahora);
  const menuHoy = datos.dias?.[claveHoy];

  return {
    tipo: "hoy",
    fecha: ahora,
    menu: menuHoy
  };
}

function proximosDias(datos, desdeFecha) {
  const resultado = [];

  for (let i = 1; i <= 7; i++) {
    const fecha = new Date(desdeFecha);
    fecha.setDate(desdeFecha.getDate() + i);

    if (esFinDeSemana(fecha)) continue;

    const clave = fechaClave(fecha);
    const menu = datos.dias?.[clave];

    if (!menu) continue;
    if (menu.festivo) continue;

    resultado.push({ fecha, menu });
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

    const principal = obtenerMenuPrincipal(datos);

    if (principal.tipo === "mañana") {
      $("fecha").textContent = `Hoy es ${fechaBonita()}`;
      $("dia").textContent = `Menú de mañana · ${formatearFecha(principal.fecha)}`;
    } else {
      $("fecha").textContent = fechaBonita();
      $("dia").textContent = `Menú de hoy · ${formatearFecha(principal.fecha)}`;
    }

    if (!principal.menu || principal.menu.festivo) {
      $("contenido-hoy").innerHTML = mensajeSinMenu(principal.fecha, principal.menu);
    } else {
      $("contenido-hoy").innerHTML = pintarBloque(principal.menu);
    }

    const semana = $("semana");
    const seccionSemana = document.querySelector(".week");
    const diasFuturos = proximosDias(datos, principal.fecha);

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