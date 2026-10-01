# KowikScrapping


## Tecnologías seleccionadas

### Bots y automatización

* **Puppeteer:** Para comprobar la veracidad de estas empresas se empleará Puppeteer como librería para entrar en sus webs y contrastar los datos.

### APIs

* **Google Maps Platform / Google Places API:** Se utilizarán para obtener información sobre empresas y establecimientos dentro del radio seleccionado en el mapa.

### Frontend

* **Angular con TypeScript:** Me resulta muy cómodo trabajar con él porque llevo utilizándolo durante todo el año.

### Backend

* **Express con Node.js:** Es la mejor opción por la facilidad para consumir las APIs de Google y al mismo tiempo utilizar la librería Puppeteer.

### BBDD

* **MySQL:** Es la opción más sencilla, aunque me gustaría poder añadir una función para exportar los datos a CSV en caso de que me dé tiempo. De esta forma, la IA podría consumirlos y realizar el resumen de una manera más sencilla.

### Sprints y tareas

* **Plane:** Una herramienta web más para detallar las tareas y subtareas. Básica para la organización.

### Documentación

* **Swagger UI Express:** Nada que añadir. Swagger es una herramienta sencilla y de confianza.



## PASOS DE INSTALACIÓN DEL PROYECTO


1. Entra al documento .env y cambia las credenciales por las de tu preferencia, haz esto mismo con el .env de la carpeta Backend

### WINDOWS

2. Instala git bash y docker desktop desde el navegador

### LINUX


2. Ejecuta el siguiente comando en tu consola "sudo docker compose up". En caso de no tener docker compose instalado ejecuta "curl -fsSL https://get.docker.com | sudo sh"

3. La instalación de overpass durará un rato, así que si quieres puedes ir a por un café... o tres

*IMPORTANTE: Si estás haciendo esto desde una máquina virtual asegúrate de que tienes al menos unos 15Gb libres (si, son bastantes pero abajo aclaro el por que)*

