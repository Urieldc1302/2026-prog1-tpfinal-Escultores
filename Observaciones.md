# Observaciones — 1ra entrega TP Final (Web APIs)

**Equipo:** Escultores
**Integrantes:** Uriel Callebaut, Faustino Trivelli, Marcos Weppler
**Fecha de corrección:** 03/10/2026

## Estado general

Las dos soluciones compilan sin errores y los 19 tests unitarios pasan (12 de Gestión y 7 de Validación). La estructura del repositorio respeta lo pedido: dos carpetas de API, cada una con su proyecto de API, su proyecto de lógica y su proyecto de tests NUnit, más la carpeta del frontend. Por código, están todos los endpoints de la sección 7, incluido el `DELETE /api/entradas/{codigo}`, y están implementadas las reglas de negocio de la sección 5.

Las dos APIs se levantaron y se probaron con curl. La API de Validación respondió bien en todos los casos. En la API de Gestión funcionaron todos los endpoints, con sus rechazos por rol, cupo, evento cancelado y fecha pasada, salvo el contenido del reporte de recaudación, que tiene un defecto (ver Reglas de negocio). Una entrada vendida desde Gestión se pudo validar de inmediato desde Validación, y los datos persisten después de reiniciar cualquiera de las dos APIs. Swagger responde en Gestión. El detalle está en `pruebas-profesor.md`.

## Entrega fuera de término

Lo que se evalúa es lo entregado hasta el 02/10/2026 a las 23:59. Después de ese horario hay cuatro commits:

- 03/10 00:02, Faustino Trivelli: "Corregido los puertos" (cambia los puertos que usa el frontend).
- 03/10 00:05, Faustino Trivelli: "Agregada la carpeta Data" (agrega `usuarios.json`, `eventos.json` y `compras.json`).
- 03/10 00:23, Marcos Weppler: "Video" (agrega un archivo de video de unos 21 MB).
- 03/10 00:25, Uriel Callebaut: "README actualizado".

El más importante es el de la carpeta de datos. Al cierre del plazo el repositorio no tenía el archivo de usuarios precargados, así que ningún endpoint restringido (crear, editar o cancelar eventos, agregar modalidades, comprar, ver el reporte, cancelar entradas) podía funcionar: la validación de rol no encontraba ningún usuario y rechazaba todos los pedidos. En sentido estricto, la entrega al 02/10 no estaba completa ni funcional, y eso **compromete la posibilidad de promoción de Marcos Weppler**, que es el integrante del grupo en esa condición. Para mantener la promoción, todos los puntos que no funcionan y todas las observaciones de este documento tienen que estar corregidos para la entrega final. La corrección que sigue se hizo sobre el estado actual.

Además, todo el código del sistema (más de 5.000 líneas entre las dos APIs, los tests y el frontend) entró al repositorio entre las 22:30 y las 23:55 del 02/10. Antes de eso solo estaban las carpetas vacías del 20/08. Esto se retoma en el apartado de Git.

## Puntos pendientes

### Estructura y compilación

- En la solución de Validación, el controller (`ValidacionesController`) está dentro del proyecto de lógica (`Clases`) y no en el proyecto `Api`. Por eso el proyecto de lógica se declaró como proyecto Web, y la lógica de negocio queda atada a ASP.NET Core. El controller tiene que vivir en el proyecto de la API y la lógica tiene que ser una biblioteca de clases común, como en Gestión.
- Los archivos `Api.http` de las dos APIs siguen con el ejemplo `weatherforecast` de la plantilla, que no existe.
- El repositorio incluye un video de unos 21 MB. Los binarios pesados no deberían versionarse en Git: alcanza con un enlace en el README.

### Endpoints

- Están todos los de la sección 7 en las rutas sugeridas, más algunos extra: cancelación de modalidad y listado de compras por DNI.
- Los endpoints devuelven directamente las entidades del dominio (`Evento`, `Compra`, `Entrada`) y no DTOs de respuesta, que es como lo trabajamos en la unidad 6.
- `GET /api/usuarios` devuelve el DNI repetido en dos campos (`dniRaw` y `dni`). Hay que dejar uno solo.
- `GET /api/compras` sin parámetros devuelve todas las compras de todos los usuarios con sus códigos de entrada. Conviene que exija el DNI o que lo restrinja al organizador.
- `GET /api/eventos` devuelve también los eventos cancelados y los que ya pasaron. Para el catálogo conviene filtrarlos o, al menos, decidirlo y poder justificarlo.

### Reglas de negocio

- **Reporte de recaudación:** cuando se cancela una entrada, la cantidad vendida baja pero la recaudación sigue sumando el total original de la compra. El reporte queda inconsistente: en las pruebas informó 4 entradas vendidas con la recaudación de las 5 originales, tanto en el evento precargado como en uno creado durante la corrección. Hay que definir cómo impacta una cancelación en lo recaudado, teniendo en cuenta también el descuento por volumen, y corregirlo.
- **Cancelación de entradas con descuento:** si se compraron 5 entradas con descuento y se cancela una, la compra queda con 4 entradas pagadas al precio de 5 con descuento. El análisis de este caso es parte de lo que se pide a quienes promocionan, y hay que poder explicarlo.
- **Validación de una entrada cancelada:** se rechaza bien, pero el estado que devuelve es "no existe" cuando el motivo real es "cancelada". El estado tiene que corresponder al motivo.
- **Validación sin evento:** si no se envía el evento, la API de Validación no controla que la entrada sea del evento en curso. La regla "una entrada solo es válida para el evento con el que se compró" queda cubierta solo si el cliente manda el evento. Conviene que el evento sea obligatorio o justificar la decisión.
- En `eventos.json` hay un evento con fecha ya pasada (30/09/2026). Está bien para probar el rechazo, pero hay que tenerlo en cuenta para la demo.

### Persistencia

- Las rutas son relativas y compartidas (`data/` en la raíz), lo que cumple el requisito. Pero la ruta depende del directorio desde el que se lance cada API: funciona desde la carpeta `Api` o desde la raíz, y falla desde la carpeta de la solución. Hay que dejarlo documentado en el README o resolverlo de forma más robusta.
- La API de Validación no tiene repositorio ni clases del dominio: lee y modifica el JSON de compras como texto, buscando las propiedades por nombre. Funciona, pero se aparta del patrón Repositorio y Servicio de la unidad 5. Además, deja a Validación atada a los nombres exactos de las propiedades que serializa Gestión, sin ninguna clase que lo exprese.
- Los bloqueos para evitar escrituras simultáneas solo funcionan dentro de un mismo proceso. Como son dos APIs que escriben el mismo archivo, una venta y una validación simultáneas pueden pisarse. No se exige resolverlo, pero sí poder explicar el riesgo.

### Roles

- La validación por rol está bien resuelta: se recibe el DNI por header o query, se busca en `usuarios.json` y se rechaza con 403 si el rol no corresponde o el DNI no existe.
- Para la compra, el DNI se toma del body y, si no viene, del header. Conviene unificar el criterio para todos los endpoints.

### Tests

- Están los dos proyectos NUnit y pasan todos los tests. Cubren descuento, cupo agotado, evento cancelado, fecha pasada, códigos de 6 caracteres sin repetición dentro de una compra, roles, cancelación de entradas, reporte, y en Validación: válida, ya usada, inexistente, de otro evento, cancelada y evento cancelado.
- Faltan casos de borde de la sección 5 que hay que agregar: compra con DNI inexistente, organizador intentando comprar, comprador cancelando una entrada de otro comprador, compra de exactamente 4 entradas a través del servicio (sin descuento), unicidad de los códigos entre compras distintas y reporte después de cancelar una entrada (que hoy fallaría por el defecto de arriba).
- Varios tests verifican más de una cosa a la vez. Conviene separarlos para que cada test pruebe un solo comportamiento, como vimos en la unidad 4.

### Calidad POO y capas

- Las entidades tienen todas sus propiedades con setter público (por ejemplo, el cupo disponible o el estado de usada), así que cualquier capa puede saltearse los métodos que validan las reglas. Hay que encapsular mejor.
- Hay un enum para los roles y otro para los estados de validación, y se usan excepciones del framework para cada situación. No hay excepciones propias del dominio. Para los permisos se usa una excepción de .NET pensada para permisos de archivos, y conviene definir excepciones propias.
- Los servicios reciben sus repositorios por constructor, pero si no los reciben crean instancias propias. Ese doble mecanismo convive con la inyección de dependencias de `Program.cs` y conviene unificarlo.
- El DTO del reporte de recaudación está en el proyecto de lógica. Según lo visto en la unidad 6, los DTOs van en el proyecto de la API.
- `ModalidadService` y `EntradaRepository` no se usan desde ningún lado.

### Git y trabajo en equipo

- Los tres integrantes tienen commits, pero todos se concentran en una hora y media de la noche del 02/10 (más los cuatro fuera de término). El enunciado pide commits distribuidos a lo largo de las seis semanas.
- Varios commits suben fragmentos de un mismo archivo ya terminado ("primer parte", "segundo tercio", "la mitad del test"), repartidos entre integrantes. Eso no refleja trabajo incremental. Además, los datos de prueba incluyen una compra del 04/09, cuando el repositorio todavía no tenía código. Todo indica que el sistema se desarrolló fuera de este repositorio. En el coloquio cada integrante tiene que poder explicar y modificar cualquier parte del código.
- Hay commits con identidades distintas para la misma persona y un commit con el autor "Ucse". Cada integrante tiene que configurar su nombre y su mail.

### README

- Las instrucciones usan rutas con una carpeta `programacionTrabajo/` que no existe en este repositorio.
- Los puertos del README (5001 y 5002) no coinciden con los de `launchSettings.json` (5092 y 5291), que son los que hoy usa el frontend.
- El README describe Google Maps, pero el frontend usa otra librería de mapas. El frontend y el mapa se evalúan en la próxima entrega, pero el README tiene que describir lo que realmente está hecho.

## Nota

**Aprobada con reentrega**

La base técnica está completa, compila, las dos APIs funcionan y comparten los datos. Pero al cierre del plazo faltaban los datos de usuarios, sin los cuales Gestión no funcionaba (esto compromete la promoción). Además, hay que corregir el reporte de recaudación, la capa de la API de Validación y el README, completar los tests, y que todo el equipo demuestre en el coloquio que domina el código entregado.

**Condición para mantener la promoción:** los puntos que hoy no funcionan y todas las observaciones de este documento deben estar corregidos para la entrega final. Si en esa instancia queda alguno pendiente, se pierde la posibilidad de promoción.
