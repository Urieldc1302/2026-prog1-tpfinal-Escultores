# Pruebas del profesor — 1ra entrega TP Final (Escultores)

Fecha de prueba: 03/10/2026 (Validación) y 04/10/2026 (Gestión e integración). Estado probado: último commit del repositorio (`c800e7b`, 03/10/2026 00:25).

Puertos usados para la corrección: API de Gestión en `http://localhost:5130`, API de Validación en `http://localhost:5131`. Cada API se ejecutó con el directorio de trabajo en su carpeta `Api/`, como indica el README, para que la ruta relativa `../../data/` apunte a la carpeta `data/` de la raíz.

## Notas sobre el entorno de corrección

- El equipo de corrección tiene instalado el runtime de ASP.NET Core 10 y no el 8. Para ejecutar se usó roll-forward de versión (`DOTNET_ROLL_FORWARD=Major`). No es un problema del grupo.
- En un primer intento, una restricción de seguridad del equipo de corrección bloqueó la carga de `ApiGestion/Api/bin/.../Api.dll` (error `0x800711C7`). Una vez levantada esa restricción, la API se ejecutó sin modificar nada y se probaron todos sus endpoints. Ese bloqueo inicial no tiene que ver con el grupo.

## Compilación y tests

| Solución | `dotnet build` | `dotnet test` |
|---|---|---|
| `ApiGestion/Solucion.sln` | OK (0 errores, 0 advertencias) | 12/12 superados |
| `ApiValidacion/Solucion.sln` | OK (0 errores, 0 advertencias) | 7/7 superados (con roll-forward de runtime, ver nota) |

También se compiló el estado al cierre del plazo (commit `ae07ba7`, 02/10 23:55) a partir de una copia exportada con `git archive`: ambas soluciones compilan. En ese commit **no existía la carpeta `data/`** (incluido `usuarios.json`), que se agregó el 03/10 a las 00:05.

## Datos

- `data/usuarios.json`: contiene los 10 usuarios del anexo (2 organizadores, 8 compradores), con DNI, nombre, username y rol. Agregado fuera de término (ver arriba).
- `data/eventos.json`: 3 eventos precargados. "Noche de Jazz & Blues" tiene fecha 30/09/2026, que ya pasó.
- `data/compras.json`: 1 compra de 5 entradas (con fecha 04/09/2026) con una entrada usada (`6Q3R1Z`), una cancelada (`G4BXEZ`) y tres sin usar (`OMJ4YL`, `8TMHAP`, `UQ853M`).

---

## API de Validación (`http://localhost:5131`)

### 1. Validar una entrada válida (sin indicar evento)
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"OMJ4YL"}'
```
Respuesta: HTTP 200
```json
{"exitoso":true,"estado":"Valida","mensaje":"Ingreso autorizado para 'Festival Primavera Sound 2026' — Modalidad: Entrada General.","codigo":"OMJ4YL","nombreEvento":"Festival Primavera Sound 2026","nombreModalidad":"Entrada General","fechaUso":"2026-10-03T18:35:31.5524233-03:00"}
```
Resultado: OK.

### 2. Revalidar la misma entrada
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"OMJ4YL"}'
```
Respuesta: HTTP 400
```json
{"exitoso":false,"estado":"YaFueUsada","mensaje":"La entrada ya fue utilizada el 03/10/2026 18:35:31.", ...}
```
Resultado: OK (rechazo esperado).

### 3. Código inexistente
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"ZZZ999"}'
```
Respuesta: HTTP 400
```json
{"exitoso":false,"estado":"NoExiste","mensaje":"La entrada con código 'ZZZ999' no existe en el sistema.", ...}
```
Resultado: OK (rechazo esperado).

### 4. Entrada de otro evento
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"8TMHAP","idEvento":"a2222222-2222-2222-2222-222222222222"}'
```
Respuesta: HTTP 400
```json
{"exitoso":false,"estado":"EventoIncorrecto","mensaje":"La entrada no corresponde a este evento (es para 'Festival Primavera Sound 2026').", ...}
```
Resultado: OK (rechazo esperado).

### 5. Entrada válida para el evento correcto (código en minúsculas)
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"8tmhap","idEvento":"a1111111-1111-1111-1111-111111111111"}'
```
Respuesta: HTTP 200
```json
{"exitoso":true,"estado":"Valida","mensaje":"Ingreso autorizado para 'Festival Primavera Sound 2026' — Modalidad: Entrada General.","codigo":"8TMHAP", ...}
```
Resultado: OK.

### 6. Entrada cancelada por el comprador
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"G4BXEZ"}'
```
Respuesta: HTTP 400
```json
{"exitoso":false,"estado":"NoExiste","mensaje":"La entrada 'G4BXEZ' fue cancelada previamente por el comprador.", ...}
```
Resultado: OK con observación. Se rechaza bien, pero el estado devuelto es `NoExiste` aunque la entrada existe y está cancelada: el estado no coincide con el mensaje.

### 7. Entrada usada previamente (dato precargado)
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"6Q3R1Z"}'
```
Respuesta: HTTP 400, `"estado":"YaFueUsada"`. Resultado: OK.

### 8. Código vacío / body sin código
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":""}'
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{}'
```
Respuesta: HTTP 400 en ambos casos (mensaje propio en el primero, validación automática de `[ApiController]` en el segundo). Resultado: OK.

### 9. Persistencia tras reiniciar la API de Validación
Se detuvo y se volvió a levantar la API, y se revalidó `8TMHAP` (validada en la prueba 5):
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"8TMHAP"}'
```
Respuesta: HTTP 400, `"estado":"YaFueUsada"`, con la fecha de uso de la prueba anterior. Resultado: OK, el uso quedó persistido en `data/compras.json`.

### 10. Swagger de Validación
`GET http://localhost:5131/swagger/index.html` → HTTP 200. Resultado: OK.

---

## API de Gestión (`http://localhost:5130`)

Variables usadas en los curl: `E=7fc7e9c8-e7b4-49c1-b2fa-a95f5789f5d6` (evento creado en G4), `M=afbc1699-1376-45f2-baf6-be955e5e44f9` (modalidad creada en G8, precio 1000, cupo 6), `CP=1bfb4466-f379-4604-b135-19365090229d` (compra creada en G9).

### G1. Listar usuarios
```bash
curl http://localhost:5130/api/usuarios
```
HTTP 200. Devuelve los 10 usuarios del anexo. Resultado: OK, con observación: cada usuario aparece con el DNI repetido en dos campos (`dniRaw` y `dni`), consecuencia de las dos propiedades de `Usuario`.

### G2. Listar eventos
```bash
curl http://localhost:5130/api/eventos
```
HTTP 200. Devuelve los 3 eventos, incluido el de fecha pasada. Resultado: OK.

### G3. Detalle de un evento / evento inexistente
```bash
curl http://localhost:5130/api/eventos/a1111111-1111-1111-1111-111111111111
curl http://localhost:5130/api/eventos/00000000-0000-0000-0000-000000000001
```
HTTP 200 con las modalidades / HTTP 404 `{"mensaje":"Evento con ID '...' no encontrado."}`. Resultado: OK.

### G4. Crear evento (organizador)
```bash
curl -X POST http://localhost:5130/api/eventos -H "Content-Type: application/json" -H "X-Dni: 30111222" -d '{"nombre":"Recital Prueba","descripcion":"x","fecha":"2026-12-01T21:00:00","lugar":"Club","latitud":null,"longitud":null}'
```
HTTP 201 `{"id":"7fc7e9c8-...","nombre":"Recital Prueba",...,"cancelado":false,"modalidades":[]}`. Resultado: OK.

### G5. Crear evento: comprador / sin DNI / DNI inexistente / fecha pasada
```bash
curl -X POST http://localhost:5130/api/eventos -H "Content-Type: application/json" -H "X-Dni: 40123456" -d '{"nombre":"X","descripcion":"x","fecha":"2026-12-01T21:00:00","lugar":"L"}'
curl -X POST http://localhost:5130/api/eventos -H "Content-Type: application/json" -d '{"nombre":"X","descripcion":"x","fecha":"2026-12-01T21:00:00","lugar":"L"}'
curl -X POST http://localhost:5130/api/eventos -H "Content-Type: application/json" -H "X-Dni: 11111111" -d '{"nombre":"X","descripcion":"x","fecha":"2026-12-01T21:00:00","lugar":"L"}'
curl -X POST http://localhost:5130/api/eventos -H "Content-Type: application/json" -H "X-Dni: 30111222" -d '{"nombre":"X","descripcion":"x","fecha":"2020-01-01T21:00:00","lugar":"L"}'
```
HTTP 403 "el usuario Sofía Gómez tiene rol 'Comprador' pero se requiere rol 'Organizador'" / 403 "Se requiere especificar el DNI" / 403 "No existe ningún usuario registrado con el DNI '11111111'" / 400 "La fecha del evento no puede ser anterior a la fecha y hora actual". Resultado: OK (rechazos esperados).

### G6. Editar evento (organizador / comprador)
```bash
curl -X PUT http://localhost:5130/api/eventos/$E -H "Content-Type: application/json" -H "X-Dni: 30111222" -d '{"nombre":"Recital Editado","descripcion":"y","fecha":"2026-12-02T21:00:00","lugar":"Club 2"}'
curl -X PUT http://localhost:5130/api/eventos/$E -H "Content-Type: application/json" -H "X-Dni: 40123456" -d '{"nombre":"Z","descripcion":"y","fecha":"2026-12-02T21:00:00","lugar":"Club 2"}'
```
HTTP 200 con el evento editado / HTTP 403. Resultado: OK.

### G8. Agregar modalidad (organizador / comprador)
```bash
curl -X POST http://localhost:5130/api/eventos/$E/modalidades -H "Content-Type: application/json" -H "X-Dni: 30111222" -d '{"nombre":"VIP","precio":1000,"beneficios":"Barra","cupoMaximo":6}'
curl -X POST http://localhost:5130/api/eventos/$E/modalidades -H "Content-Type: application/json" -H "X-Dni: 40123456" -d '{"nombre":"VIP2","precio":1000,"beneficios":"Barra","cupoMaximo":6}'
```
HTTP 201 `{"id":"afbc1699-...","nombre":"VIP","precio":1000,"cupoMaximo":6,"cupoDisponible":6,...}` / HTTP 403. Resultado: OK.

### G9. Compra de 5 entradas (descuento)
```bash
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"40123456","idEvento":"<E>","idModalidad":"<M>","cantidad":5}'
```
HTTP 201. `"total":4250.00` (5 x 1000 con 15% de descuento), 5 entradas con códigos `AP62MV`, `WQJ1Z0`, `RWQGU0`, `E2QL4S`, `37GZT1` (6 caracteres alfanuméricos, distintos) y `precioUnitario` 850 cada una. Resultado: OK.

### G9b. Compra de 4 entradas (sin descuento), con DNI por header
```bash
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -H "X-Dni: 38456789" -d '{"idEvento":"a2222222-2222-2222-2222-222222222222","idModalidad":"b3333333-3333-3333-3333-333333333333","cantidad":4}'
```
HTTP 201, `"total":32000.0` (4 x 8000, sin descuento). Resultado: OK.

### G10 / G11. Compra hecha por un organizador / con DNI inexistente
```bash
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"30111222","idEvento":"<E>","idModalidad":"<M>","cantidad":1}'
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"11111111","idEvento":"<E>","idModalidad":"<M>","cantidad":1}'
```
HTTP 403 "el usuario Lucía Fernández tiene rol 'Organizador' pero se requiere rol 'Comprador'" / HTTP 403 "No existe ningún usuario registrado con el DNI '11111111'". Resultado: OK (rechazos esperados).

### G12. Cupo agotado
```bash
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"38456789","idEvento":"<E>","idModalidad":"<M>","cantidad":2}'
```
HTTP 400 "No hay suficiente cupo disponible en 'VIP'. Cupo restante: 1." Resultado: OK (rechazo esperado).

### G14. Evento con fecha pasada
```bash
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"38456789","idEvento":"a3333333-3333-3333-3333-333333333333","idModalidad":"b5555555-5555-5555-5555-555555555555","cantidad":1}'
```
HTTP 400 "No se pueden comprar entradas para un evento cuya fecha ya pasó." Resultado: OK (rechazo esperado).

### G18. Entrada vendida desde Gestión, validada inmediatamente desde Validación
```bash
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"AP62MV","idEvento":"<E>"}'
```
HTTP 200 `{"exitoso":true,"estado":"Valida","mensaje":"Ingreso autorizado para 'Recital Editado' — Modalidad: VIP.",...}`. Resultado: OK, los datos se comparten.

### G15. Detalle de compra / compra inexistente
```bash
curl http://localhost:5130/api/compras/<CP>
curl http://localhost:5130/api/compras/00000000-0000-0000-0000-000000000009
```
HTTP 200, y la entrada `AP62MV` aparece con `"usada":true` y la fecha de uso registrada por Validación / HTTP 404. Resultado: OK.

### G17. Cancelar entrada (DELETE, promoción)
```bash
curl -X DELETE http://localhost:5130/api/entradas/AP62MV -H "X-Dni: 40123456"   # ya usada
curl -X DELETE http://localhost:5130/api/entradas/WQJ1Z0 -H "X-Dni: 38456789"   # de otro comprador
curl -X DELETE http://localhost:5130/api/entradas/WQJ1Z0 -H "X-Dni: 30111222"   # organizador
curl -X DELETE http://localhost:5130/api/entradas/WQJ1Z0 -H "X-Dni: 40123456"   # válida
curl -X DELETE http://localhost:5130/api/entradas/WQJ1Z0 -H "X-Dni: 40123456"   # repetida
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"WQJ1Z0"}'
```
HTTP 400 "No se puede cancelar una entrada que ya fue utilizada" / 403 "No tiene permiso para cancelar una entrada que no le pertenece" / 403 rol / 200 "Entrada cancelada con éxito. El cupo ha sido restablecido." (el cupo de VIP pasó de 1 a 2) / 400 "La entrada ya se encuentra cancelada" / Validación rechaza con HTTP 400 y `"estado":"NoExiste"`. Resultado: OK, con la observación del estado en Validación.

### G16. Reporte de recaudación
```bash
curl http://localhost:5130/api/reportes/recaudacion -H "X-Dni: 30111222"
curl http://localhost:5130/api/reportes/recaudacion -H "X-Dni: 40123456"
curl http://localhost:5130/api/reportes/recaudacion
```
HTTP 200 / 403 / 403. **ERROR en el contenido**: para "Recital Editado" informa `"entradasVendidas":4` y `"recaudacionTotal":4250.0`, que es el total de las 5 entradas aunque una fue cancelada. Lo mismo pasa con el evento precargado "Festival Primavera Sound 2026": `"entradasVendidas":4` con `"recaudacionTotal":63750.0`, el total de 5. La recaudación no descuenta las entradas canceladas, así que el reporte es inconsistente. Resultado: FALLA (regla de negocio del reporte).

### G7. Cancelar evento (comprador / organizador) y compra o validación posterior
```bash
curl -X PUT http://localhost:5130/api/eventos/$E/cancelar -H "X-Dni: 40123456"
curl -X PUT http://localhost:5130/api/eventos/$E/cancelar -H "X-Dni: 30111222"
curl -X POST http://localhost:5130/api/compras -H "Content-Type: application/json" -d '{"dniComprador":"40123456","idEvento":"<E>","idModalidad":"<M>","cantidad":1}'
curl -X POST http://localhost:5131/api/validaciones -H "Content-Type: application/json" -d '{"codigo":"RWQGU0"}'
```
HTTP 403 / 200 "Evento cancelado exitosamente." / 400 "No se pueden comprar entradas para un evento cancelado." / 400 `"estado":"EventoCancelado"`. Resultado: OK.

### G19. Swagger de Gestión
`GET http://localhost:5130/swagger/index.html` → HTTP 200. `GET /swagger/v1/swagger.json` → HTTP 200. Resultado: OK.

### G20. Listado de compras sin DNI
`curl http://localhost:5130/api/compras` → HTTP 200 con todas las compras de todos los usuarios y sus códigos de entrada. Resultado: funciona, pero expone los códigos de todas las entradas sin ninguna restricción (ver Observaciones).

### G21. Persistencia tras reiniciar la API de Gestión
Se detuvo y se volvió a levantar la API. `GET /api/eventos/<E>` siguió devolviendo "Recital Editado" y `GET /api/compras/<CP>` mostró `WQJ1Z0` con `"cancelada":true`. Resultado: OK.

Al terminar, se restauraron `data/compras.json` y `data/eventos.json` a su estado original.

---

## Resumen

**API de Validación: 10/10 OK.** Validación correcta, revalidación rechazada, código inexistente, entrada de otro evento, evento correcto, entrada cancelada (rechaza, pero con el estado `NoExiste`), ya usada, código vacío, persistencia tras reiniciar y Swagger.

**API de Gestión: 18 de 19 grupos de pruebas OK.** Usuarios, listado y detalle de eventos, alta, edición y cancelación de eventos, alta de modalidad (con todos los rechazos por rol, DNI inexistente o faltante), compra con descuento, compra sin descuento, organizador comprando, DNI inexistente, cupo agotado, evento cancelado, fecha pasada, detalle de compra, DELETE de entradas con todos sus rechazos, listado de compras, Swagger y persistencia.

**Integración:** una entrada vendida desde Gestión se validó inmediatamente desde Validación, y el uso se vio reflejado en el detalle de la compra en Gestión. OK.

**Fallaron:**
- `GET /api/reportes/recaudacion`: la recaudación no descuenta las entradas canceladas (informa 4 vendidas y el monto de 5).
- Observaciones menores, sin falla funcional: el estado `NoExiste` para una entrada cancelada en Validación, el DNI duplicado (`dniRaw`/`dni`) en `/api/usuarios` y `GET /api/compras` sin restricción.
