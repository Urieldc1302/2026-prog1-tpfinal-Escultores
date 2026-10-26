# TP Integrador — Sistema de Venta y Validación de Entradas para Eventos

**Materia:** Programación 1 — UCSE  
**Tecnologías:** C# / .NET 8, ASP.NET Core Web API, NUnit (81 pruebas en verde: 64 en Gestión y 17 en Validación), Persistencia JSON compartida en disco, HTML5, CSS3, JavaScript nativo (sin frameworks, varias páginas HTML), mapa de Google Maps embebido.

---

## Descripción General

El sistema reemplaza la gestión tradicional de venta de entradas con Excel y WhatsApp por una solución moderna compuesta por **dos APIs REST independientes que comparten la misma información persistida en disco (sin base de datos central)** y una **aplicación web frontend**:

1. **API de Gestión (`ApiGestion` - Puerto 5001):**
   - Catálogo y administración de eventos y sus modalidades de entrada.
   - Venta de entradas asociadas al DNI del comprador, con cálculo automático de **descuento por volumen del 15% para compras de 5 o más entradas** de la misma modalidad.
   - Generación de **entradas individuales con códigos únicos alfanuméricos de 6 dígitos** (sin colisiones).
   - Reportes de recaudación y entradas vendidas por evento con desglose por modalidad y listado de compradores.
   - Endpoint de promoción: **Cancelación de entradas individuales** (`DELETE /api/entradas/{codigo}`) restaurando el cupo de la modalidad.
   - Endpoint de cancelación de modalidades y eventos completos por organizadores.
   - Documentación interactiva con **Swagger UI**.

2. **API de Validación en Puerta (`ApiValidacion` - Puerto 5002):**
   - Utilizada en el acceso el día del evento.
   - Recibe el código de una entrada y valida si puede ingresar, registrando inmediatamente su uso (`Usada = true`, fecha y hora) o rechazándola con causa explícita (inexistente, ya usada, corresponde a otro evento, evento cancelado).
   - Sincronización inmediata contra los mismos archivos en disco.

3. **Frontend Web (`CarpetaFrontend`):**
   - Aplicación construida con HTML5, CSS3 y JavaScript nativo (sin frameworks), formada por **seis páginas HTML independientes** que comparten `app.js` y `styles.css`. Las páginas se pasan datos por *query string* (por ejemplo `comprar-entrada.html?id={idEvento}`); no hay SPA ni *hash routing*.
   - Selector de usuario activo basado en DNI (guardado en `localStorage`) y menú según el rol (**Organizador** vs. **Comprador**). El DNI se envía a la API en el header `X-Dni`.
   - **Catálogo** de eventos disponibles y **detalle del evento** con compra de entradas, resumen de precio con descuento y ubicación en un **mapa de Google Maps** (iframe `maps.google.com/maps?q=latitud,longitud&output=embed`, sin API key) con un botón "Ver en Google Maps". Si un evento no tiene coordenadas, se muestra "Ubicación no disponible" en lugar de un mapa.
   - Pantalla de **Control de Acceso (Puerta)**: se elige el evento, se ingresa el código y se muestra "Acceso autorizado" o "Entrada rechazada" con el motivo, más un historial de la sesión.
   - **Consulta de compra**: estado de cada entrada (disponible, usada con fecha y hora, o cancelada) y cancelación de entradas sin usar.
   - **Gestión de eventos** (organizador): alta de eventos, alta de modalidades y cancelación de eventos o modalidades. Para ubicar un evento hay que escribir la dirección y pulsar "Buscar en Mapa" (la búsqueda usa Nominatim de OpenStreetMap y devuelve latitud y longitud); sin esa búsqueda el evento no se puede crear.
   - **Reporte de recaudación** (organizador) por evento y modalidad, con el listado de compradores.

---

## Estructura del Repositorio

```text
.
├── ApiGestion/                 # Solución 1: API de Gestión y Ventas
│   ├── Api/                    # Web API ASP.NET Core (.NET 8, Swagger en :5001)
│   ├── Clases/                 # Lógica de dominio, servicios, repositorios, generador de códigos
│   ├── Testing/                # Pruebas unitarias NUnit de ApiGestion (64 tests en verde)
│   └── Solucion.sln            # Solución Visual Studio de Gestión
│
├── ApiValidacion/              # Solución 2: API de Validación en Puerta
│   ├── Api/                    # Web API ASP.NET Core (.NET 8, Swagger en :5002)
│   ├── Clases/                 # Biblioteca de clases: dominio, repositorios y validador de entradas
│   ├── Testing/                # Pruebas unitarias NUnit de ApiValidacion (17 tests en verde)
│   └── Solucion.sln            # Solución Visual Studio de Validación
│
├── CarpetaFrontend/            # Frontend Web (HTML/CSS/JS sin frameworks)
│   ├── index.html              # Catálogo de eventos
│   ├── comprar-entrada.html    # Detalle del evento y compra
│   ├── consultar-compra.html   # Consulta de compra y cancelación de entradas
│   ├── control-acceso.html     # Control de acceso (puerta)
│   ├── gestion-eventos.html    # Alta y cancelación de eventos y modalidades
│   ├── reporte-recaudacion.html# Reporte de recaudación
│   ├── styles.css              # Estilos
│   └── app.js                  # Lógica cliente compartida por todas las páginas
│
├── data/                       # Almacenamiento compartido en disco (rutas relativas)
│   ├── usuarios.json           # 10 usuarios precargados (2 Organizadores, 8 Compradores)
│   ├── eventos.json            # Eventos, coordenadas (latitud y longitud) y modalidades
│   └── compras.json            # Compras y entradas individuales generadas
│
└── README.md                   # Documentación del proyecto
```


---

## Cómo Ejecutar el Proyecto

### Requisitos Previos
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) instalado.
- Navegador web moderno (Chrome, Edge, Firefox).

---

### Paso 1: Ejecutar las Pruebas Unitarias (NUnit)

Para verificar que toda la lógica de negocio y las reglas están en verde:

```bash
dotnet test ApiGestion/Solucion.sln

dotnet test ApiValidacion/Solucion.sln
```

---

### Paso 2: Iniciar las APIs

Abra dos terminales separadas en la raíz del proyecto:

#### Terminal 1 — API de Gestión (Puerto 5001):
```bash
cd ApiGestion/Api
dotnet run
```
> Swagger UI disponible en: **http://localhost:5001/swagger**

#### Terminal 2 — API de Validación (Puerto 5002):
```bash
cd ApiValidacion/Api
dotnet run
```
> Swagger UI disponible en: **http://localhost:5002/swagger**

---

### Paso 3: Abrir el Frontend

Abra directamente el archivo `CarpetaFrontend/index.html` en su navegador (haciendo doble clic o con una extensión como Live Server), o acceda a **http://localhost:5001**, que sirve los archivos estáticos automáticamente. Las dos APIs tienen que estar levantadas.

---

## Usuarios Precargados (`usuarios.json`)

El sistema incluye los 10 usuarios requeridos en el anexo, identificados por su DNI (sin contraseñas):

| DNI | Nombre | Rol | Acciones Permitidas |
|---|---|---|---|
| **30111222** | Lucía Fernández | **Organizador** | Crear/editar/cancelar eventos y modalidades, ver recaudación. |
| **29888777** | Martín Aguirre | **Organizador** | Crear/editar/cancelar eventos y modalidades, ver recaudación. |
| **40123456** | Sofía Gómez | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **38456789** | Nicolás Pereyra | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **41234567** | Valentina Ríos | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **37654321** | Tomás Ibáñez | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **42345678** | Camila Suárez | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **39876543** | Agustín Molina | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **43456789** | Julieta Torres | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |
| **36765432** | Bruno Acosta | **Comprador** | Comprar entradas, ver sus compras, cancelar entradas no usadas. |

---

## Endpoints de las APIs REST

### API de Gestión (`http://localhost:5001`)

| Método | Endpoint | Rol Requerido | Descripción |
|---|---|---|---|
| `GET` | `/api/usuarios` | — | Lista todos los usuarios precargados. |
| `GET` | `/api/eventos` | — (con `?incluirNoDisponibles=true`: **Organizador**) | Lista los eventos disponibles (no cancelados ni pasados) con sus modalidades. |
| `GET` | `/api/eventos/{id}` | — | Detalle de un evento y sus modalidades. |
| `POST` | `/api/eventos` | **Organizador** (`X-Dni`) | Crea un nuevo evento (soporta coordenadas y dirección). |
| `PUT` | `/api/eventos/{id}` | **Organizador** (`X-Dni`) | Edita los datos de un evento. |
| `PUT` | `/api/eventos/{id}/cancelar` | **Organizador** (`X-Dni`) | Cancela un evento completo (bloquea ventas futuras). |
| `POST` | `/api/eventos/{id}/modalidades` | **Organizador** (`X-Dni`) | Agrega una modalidad con precio, cupo y beneficios. |
| `PUT` | `/api/eventos/{id}/modalidades/{idModalidad}/cancelar` | **Organizador** (`X-Dni`) | Cancela una modalidad específica (bloquea ventas para dicha modalidad). |
| `POST` | `/api/compras` | **Comprador** (`X-Dni`) | Registra compra, descuenta cupo y genera entradas individuales. |
| `GET` | `/api/compras/{id}` | — | Consulta detalle de compra y estado de cada entrada. |
| `GET` | `/api/compras` | `X-Dni` | Comprador: lista sus compras. Organizador: lista todas. Sin DNI responde `403`. |
| `GET` | `/api/reportes/recaudacion` | **Organizador** (`X-Dni`) | Reporte de recaudación y entradas vendidas por evento y modalidad. |
| `DELETE` | `/api/entradas/{codigo}` | **Comprador** (`X-Dni`) | *(Promoción)* Cancela una entrada no usada y devuelve el cupo. |

### API de Validación (`http://localhost:5002`)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/validaciones` | Recibe `{ "codigo": "...", "idEvento": "..." }`. Valida y marca como usada la entrada o rechaza con motivo exacto. |

---

## Reglas de Negocio Implementadas y Verificadas

1. **Cupo Máximo:** No se puede comprar si la cantidad solicitada supera el `cupoDisponible`.
2. **Eventos y Modalidades Cancelados:** Se rechaza cualquier intento de compra para eventos cancelados o modalidades canceladas.
3. **Eventos Pasados:** Se rechaza cualquier intento de compra para eventos cuya fecha ya pasó.
4. **Cancelación por Organizador:** Exclusivamente los usuarios con rol `Organizador` pueden cancelar eventos completos o modalidades individuales.
5. **Descuento por Volumen:** Si se compran **5 o más entradas** de la misma modalidad en una sola operación, se aplica un **15% de descuento** sobre el total.
6. **Validación Individual:** Cada entrada posee un **código alfanumérico único de 6 caracteres** generado mediante algoritmo criptoseguro que garantiza 0 repeticiones. Cada entrada se valida por separado en la puerta.
7. **Uso Único en Puerta:** Una vez que una entrada fue validada para ingresar, se registra su fecha de uso y no puede volver a ser utilizada (`YaFueUsada`).
8. **Validación de Evento:** Una entrada solo es válida para el evento con el que fue comprada. Si se intenta validar en otro evento, es rechazada (`EventoIncorrecto`).
9. **Control de Acceso por Roles:** Los endpoints administrativos (`POST /api/eventos`, `PUT /cancelar`, `/modalidades`, `/reportes/recaudacion`) exigen DNI de un usuario con rol `Organizador` (vía Header `X-Dni`). Si se envía el DNI de un `Comprador`, el servidor responde `403 Forbidden`.

---

## Link al Video Demo (https://drive.google.com/file/d/1-2FuJ2cG8K09oveOL-iZXee2Gz38XIQQ/view?usp=drive_link) 