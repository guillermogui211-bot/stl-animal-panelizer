# STL Animal Panelizer

Aplicación web sencilla para cargar un STL, ajustar su escala y generar una primera colección de paneles triangulares numerados.

## Usarla sin instalar nada

1. Abre `index.html` en un navegador moderno (Chrome, Edge o Firefox).
2. Pulsa **¿Cómo funciona?** dentro de la aplicación.
3. Arrastra tu archivo `.stl` al recuadro.
4. Indica la altura final, el nivel de detalle y si deseas el espejo.
5. Pulsa **Generar piezas**.
6. Descarga el SVG y la lista CSV.

También se puede publicar este repositorio con GitHub Pages: en GitHub entra en **Settings → Pages**, selecciona la rama `main` y la carpeta `/ (root)`.

## Importante sobre esta primera versión

El programa convierte las caras triangulares del STL en paneles planos de referencia y las dibuja en SVG con su número. Es un prototipo para comprobar el flujo, el escalado y el despiece. Antes de cortar acero:

- prueba el SVG impreso al 100 % en cartón;
- verifica el orden y el encaje;
- comprueba la escala y las tolerancias de corte;
- usa protección y procedimientos adecuados para cortar y soldar.

El desarrollo siguiente debe añadir desplegado geométrico real, uniones entre paneles, pestañas, anidado DXF y una guía de plegado/soldadura.
