MENÚ HOY - WEB APP PARA IPHONE

ARCHIVOS:
- index.html: pantalla principal.
- style.css: diseño visual.
- app.js: lógica para leer el menú.
- menu.json: menú semanal editable.
- manifest.webmanifest: configuración para instalar como app.
- icon-192.png / icon-512.png: iconos.

CÓMO PROBARLO:
1. Sube todos estos archivos a un hosting público.
2. Abre index.html desde Safari en iPhone.
3. Pulsa Compartir > Añadir a pantalla de inicio.

CÓMO ACTUALIZAR EL MENÚ:
Edita menu.json manteniendo las claves:
lunes, martes, miercoles, jueves, viernes, sabado, domingo.

IMPORTANTE:
En app.js, MENU_URL está puesto como "menu.json" para funcionar si todo está en la misma carpeta.
Si quieres tener el menú en otra URL, cambia:
const MENU_URL = "menu.json";
por:
const MENU_URL = "https://tu-url.com/menu.json";
