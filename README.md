# KowikScrapping


## Tecnologías seleccionadas

### Bots y automatización

* **Puppeteer:** Para comprobar la veracidad de estas empresas se empleará Puppeteer como librería para entrar en sus webs y contrastar los datos.

### APIs

* **OpenStreetMap / Overpass turbo:** Se utilizarán para obtener información sobre empresas y establecimientos dentro del radio seleccionado en el mapa.

### Frontend

* **Angular con TypeScript:** Me resulta muy cómodo trabajar con él porque llevo utilizándolo durante todo el año.

### Backend

* **Express con Node.js:** Es la mejor opción por la facilidad para consumir las APIs de Google y al mismo tiempo utilizar la librería Puppeteer.

### BBDD

* **MySQL:** Es la opción más sencilla, aunque me gustaría poder añadir una función para exportar los datos a CSV en caso de que me dé tiempo. De esta forma, la IA podría consumirlos y realizar el resumen de una manera más sencilla.

### Sprints y tareas

* **Plane:** Una herramienta web más para detallar las tareas y subtareas. Básica para la organización.


## Decisiones

Bueno aquí vengo a explicar un poco el por que de cada decisión controversial que he tomado durante este proyecto:

- Overpass: Aquí he hecho un poco el terrorista para poder usar un mapa (dockericé el mapa de la comunidad valenciana entero) pero fue la única opción opensource que me quedaba, si utilizaba google place api (aunque con más información y mejores resultados) podía llegar al límite y que me cobraran, HERE tenía aún más límites. Entonces aún sabiendo que muchos comercios tenían información antigua o habían comercios que incluso habían cerrado entendí que la prueba era de saber resolver problemas no de tener las mejores herramientas de tu lado.

- Docker: He decidido dockerizarlo todo por que es la mejor forma de que con unos pocos comandos puedas ejecutar la aplicación desde cualquier entorno


## Errores

- Durante este proyecto me he parado demasiado a pensar en como hacer algo perfecto que es algo de lo que suelo pecar: "Que si no tengo una api que me devuelve los datos necesarios", "que si el estilo no es perfecto por que no funciona de manera nativa para teléfonos"

- Otro fallo del cual ahora soy consciente es que debería haber adaptado mejor la estructura al tiempo que le podía dedicar al proyecto, me explico:
Siendo consciente de que tenía 2 trabajos y otras responsabilidades que atender debería de haber delegado más a la IA desde un principio ya que esta herramienta realmente es una prueba, no es una infraestructura real y aunque busque un buen resultado como ya he dicho antes no tiene que ser perfecto


## Future Features

Alguna de las cosas que me hubiera gustado implantar pero que no he podido por el tiempo son:
- Swagger como documentación: Soy muy fan a documentar el backend y tener los endpoints de manera visual
- Login y Register: Efectivamente y para vuestra decepción no he puesto algo tan básico y lo siento mucho, en la v1.1 lo añado ;)
- Frontend amigable para dispositivos móviles
- No he podido hacer un buscador por signals que buscara automáticamente según escribes por que saturaba la api


## Cosas que me llevo de este proyecto

La verdad es que muchas gracias por haberme dejado participar, me lo he pasado muy bien y he aprendido muchas cosas: 
- Como funcionan los mapas en las páginas web
- He mejorado mi frontend que ya llevaba desde junio oxidadillo
- He aprendido un poco de express y de node.js
- Pero sobretodo he aprendido a como organizar un proyecto y como dividir bien las responsabilidades para que cada fragmento sea 100% reutilizable


## PASOS DE INSTALACIÓN DEL PROYECTO

1. Crea un documento .env igual al .env.example y cambia las credenciales por las de tu preferencia, haz esto mismo con el .env.example de la carpeta KowiikScrapping-Backend

### LINUX

2. Ejecuta el siguiente comando en tu consola "sudo docker compose up -d --build". En caso de no tener docker compose instalado ejecuta "curl -fsSL https://get.docker.com | sudo sh"

3. La instalación de overpass durará un rato, así que si quieres puedes ir a por un café... o tres

*IMPORTANTE: Si estás haciendo esto desde una máquina virtual asegúrate de que tienes al menos unos 15Gb de espacio libres (si, son bastantes pero abajo aclaro el por que) y bastante RAM sobrante*

4. Arranca todo con docker compose up -d --build

5. Abre http://localhost:8000


### WINDOWS

2. Instala git bash y docker desktop desde el navegador


## EN CASO DE ERROR

- Mirar el puerto del .env "DB_PORT" a veces cambiarlo a un puerto que no esté siendo utilizado puede funcionar

