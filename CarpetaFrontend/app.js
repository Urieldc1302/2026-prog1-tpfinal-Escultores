const API_GESTION = "http://localhost:5001/api";
const API_VALIDACION = "http://localhost:5002/api";

const state = {
  usuarios: [],
  usuarioActivo: null,
  eventos: [],
  eventoSeleccionado: null,
  compraActual: null,
  historialValidaciones: [],
  leafletMap: null,
  mapMarker: null,
  mapaCrearEvento: null,
  markerCrearEvento: null
};

document.addEventListener("DOMContentLoaded", async () => {
  await cargarUsuarios();
  setupComun();

  if (document.getElementById("eventsGrid")) {
    cargarEventos();
  }
  if (document.getElementById("panelCompraComprador")) {
    cargarDetalleDesdeUrl();
  }
  if (document.getElementById("btnBuscarCompra")) {
    inicializarConsultaCompra();
  }
  if (document.getElementById("doorTicketInput")) {
    inicializarPuerta();
  }
  if (document.getElementById("formCrearEvento")) {
    inicializarGestionEventos();
  }
  if (document.getElementById("reporteTableBody")) {
    cargarReporteRecaudacion();
  }
});

async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_GESTION}/usuarios`);
    if (!res.ok) throw new Error("No se pudo cargar la lista de usuarios.");
    state.usuarios = await res.json();

    const select = document.getElementById("userSelect");
    if (!select) return;

    select.innerHTML = "";
    state.usuarios.forEach(u => {
      const opt = document.createElement("option");
      opt.value = u.dni;
      opt.textContent = `${u.nombre} (${u.rol}) - DNI: ${u.dni}`;
      select.appendChild(opt);
    });

    const savedDni = localStorage.getItem("ticketflow_user_dni");
    const userToSelect = state.usuarios.find(u => u.dni.toString() === savedDni) || state.usuarios[0];

    if (userToSelect) {
      select.value = userToSelect.dni;
      seleccionarUsuario(userToSelect);
    }

    select.addEventListener("change", (e) => {
      const selected = state.usuarios.find(u => u.dni.toString() === e.target.value);
      if (selected) {
        seleccionarUsuario(selected);
      }
    });

  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    const select = document.getElementById("userSelect");
    if (select) {
      select.innerHTML = "<option>Error al conectar con ApiGestion (:5001)</option>";
    }
  }
}

function seleccionarUsuario(usuario) {
  state.usuarioActivo = usuario;
  localStorage.setItem("ticketflow_user_dni", usuario.dni);

  const badge = document.getElementById("userRoleBadge");
  if (badge) {
    badge.textContent = usuario.rol;
    badge.className = `role-badge role-${usuario.rol.toLowerCase()}`;
  }

  const organizadorElements = document.querySelectorAll(".role-organizador-only");
  const compradorElements = document.querySelectorAll(".role-comprador-only");

  if (usuario.rol === "Organizador") {
    organizadorElements.forEach(el => el.style.display = "");
    compradorElements.forEach(el => el.style.display = "none");
  } else {
    organizadorElements.forEach(el => el.style.display = "none");
    compradorElements.forEach(el => el.style.display = "");

    const path = window.location.pathname.toLowerCase();
    if (path.includes("control-acceso") || path.includes("gestion-eventos") || path.includes("reporte-recaudacion")) {
      alert("Acceso denegado: Esta seccion es exclusiva para organizadores.");
      window.location.href = "index.html";
      return;
    }
  }

  if (document.getElementById("eventsGrid")) {
    renderizarCatalogo();
  }
  if (document.getElementById("misComprasBotones")) {
    actualizarMisComprasRapidas();
  }
  if (document.getElementById("selectModalidad")) {
    actualizarInfoModalidadSeleccionada();
  }
}

function setupComun() {
  document.getElementById("btnRefrescarEventos")?.addEventListener("click", cargarEventos);
}

async function cargarEventos() {
  const container = document.getElementById("eventsGrid");
  if (!container) return;

  container.innerHTML = "<p class='loading-state'>Cargando eventos...</p>";

  try {
    const res = await fetch(`${API_GESTION}/eventos`);
    if (!res.ok) throw new Error("Error al obtener eventos.");
    state.eventos = await res.json();
    renderizarCatalogo();
  } catch (err) {
    console.error("Error al cargar eventos:", err);
    container.innerHTML = `
      <div style="grid-column: 1/-1; padding: 2rem; text-align: center; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
        <h3 style="color: #be123c;">No se pudo conectar con ApiGestion</h3>
        <p style="color: #4b5563; margin-top: 0.5rem;">Asegurese de que ApiGestion este ejecutandose en http://localhost:5001.</p>
        <button onclick="cargarEventos()" class="btn btn-outline" style="margin-top: 1rem;">Reintentar</button>
      </div>`;
  }
}

function renderizarCatalogo() {
  const container = document.getElementById("eventsGrid");
  if (!container) return;

  container.innerHTML = "";

  if (state.eventos.length === 0) {
    container.innerHTML = "<p class='text-muted'>No hay eventos disponibles en este momento.</p>";
    return;
  }

  state.eventos.forEach(ev => {
    const fecha = new Date(ev.fecha);
    const fechaFormat = fecha.toLocaleDateString("es-AR", { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const esPasado = fecha < new Date();

    let statusBadge = `<span class="badge badge-success">Disponible</span>`;
    if (ev.cancelado) {
      statusBadge = `<span class="badge badge-danger">Cancelado</span>`;
    } else if (esPasado) {
      statusBadge = `<span class="badge badge-secondary">Finalizado</span>`;
    }

    let modalidadesHtml = "";
    if (ev.modalidades && ev.modalidades.length > 0) {
      modalidadesHtml = `
        <div class="modalities-preview">
          <div class="modalities-preview-title">Modalidades disponibles</div>
          ${ev.modalidades.map(m => `
            <div class="modality-tag">
              <span>${m.nombre} (Cupo: ${m.cupoDisponible})</span>
              <strong>$${m.precio.toLocaleString('es-AR')}</strong>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      modalidadesHtml = `<p style="font-size: 0.825rem; color: var(--slate-500); font-style: italic;">Sin modalidades cargadas aun.</p>`;
    }

    const card = document.createElement("div");
    card.className = "event-card";

    let textoBoton = "Ver Detalle";
    if (state.usuarioActivo?.rol === "Comprador") {
      if (ev.cancelado) textoBoton = "Evento Cancelado";
      else if (esPasado) textoBoton = "Evento Finalizado";
      else textoBoton = "Comprar Entradas";
    }

    card.innerHTML = `
      <div class="event-card-header">
        <div class="event-card-top-row">
          <h3 class="event-card-title">${ev.nombre}</h3>
          ${statusBadge}
        </div>
        <div class="event-info-row">
          <span class="event-info-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <span>${fechaFormat}</span>
        </div>
      </div>
      <div class="event-card-body">
        <div class="event-info-row">
          <span class="event-info-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </span>
          <span>${ev.lugar}</span>
        </div>
        <p class="event-description">${ev.descripcion || "Sin descripcion adicional."}</p>
        ${modalidadesHtml}
      </div>
      <div class="event-card-footer" style="display: flex; gap: 0.5rem;">
        <a href="comprar-entrada.html?id=${ev.id}" class="btn ${ev.cancelado || esPasado ? 'btn-outline' : 'btn-primary'} btn-block">
          ${textoBoton}
        </a>
        ${state.usuarioActivo?.rol === "Organizador" && !ev.cancelado ? `
          <button type="button" class="btn btn-danger btn-sm btn-cancelar-card" data-id="${ev.id}" data-nombre="${ev.nombre}" title="Cancelar Evento">
            Cancelar
          </button>
        ` : ''}
      </div>
    `;

    const btnCanc = card.querySelector(".btn-cancelar-card");
    if (btnCanc) {
      btnCanc.addEventListener("click", () => cancelarEvento(ev.id, ev.nombre));
    }

    container.appendChild(card);
  });
}

async function cargarDetalleDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const eventoId = params.get("id");

  if (!eventoId) {
    alert("No se especifico el ID del evento.");
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch(`${API_GESTION}/eventos/${eventoId}`);
    if (!res.ok) throw new Error("Evento no encontrado.");
    const evento = await res.json();
    state.eventoSeleccionado = evento;
    renderDetalleEvento(evento);
  } catch (err) {
    alert(`Error: ${err.message}`);
    window.location.href = "index.html";
  }
}

function renderDetalleEvento(evento) {
  const fecha = new Date(evento.fecha);
  const fechaFormat = fecha.toLocaleDateString("es-AR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const esPasado = fecha < new Date();

  document.getElementById("detalleTitulo").textContent = evento.nombre;
  document.getElementById("detalleDescripcion").textContent = evento.descripcion || "Sin descripcion.";
  document.getElementById("detalleFecha").textContent = fechaFormat;
  document.getElementById("detalleLugar").textContent = evento.lugar;

  const badge = document.getElementById("detalleStatusBadge");
  if (evento.cancelado) {
    badge.textContent = "Cancelado";
    badge.className = "badge badge-danger";
  } else if (esPasado) {
    badge.textContent = "Finalizado";
    badge.className = "badge badge-secondary";
  } else {
    badge.textContent = "Disponible";
    badge.className = "badge badge-success";
  }

  const btnCancEv = document.getElementById("btnCancelarEventoDetalle");
  if (btnCancEv) {
    if (state.usuarioActivo?.rol === "Organizador" && !evento.cancelado) {
      btnCancEv.style.display = "inline-flex";
      btnCancEv.onclick = () => cancelarEvento(evento.id, evento.nombre);
    } else {
      btnCancEv.style.display = "none";
    }
  }

  const aviso = document.getElementById("avisoEventoNoDisponible");
  if (aviso) {
    if (evento.cancelado) {
      aviso.style.display = "block";
      aviso.style.background = "#fee2e2";
      aviso.style.color = "#991b1b";
      aviso.style.border = "1px solid #f87171";
      aviso.innerHTML = "<strong>Evento cancelado:</strong> La venta de entradas se encuentra cerrada.";
    } else if (esPasado) {
      aviso.style.display = "block";
      aviso.style.background = "#f1f5f9";
      aviso.style.color = "#475569";
      aviso.style.border = "1px solid #cbd5e1";
      aviso.innerHTML = "<strong>Evento finalizado:</strong> La fecha de este evento ya paso. No se pueden comprar entradas.";
    } else {
      aviso.style.display = "none";
    }
  }

  const selectMod = document.getElementById("selectModalidad");
  selectMod.innerHTML = "";

  if (evento.modalidades && evento.modalidades.length > 0) {
    evento.modalidades.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      const estadoTxt = m.cancelada ? ' [CANCELADA]' : ` (Disponibles: ${m.cupoDisponible})`;
      opt.textContent = `${m.nombre} - $${m.precio.toLocaleString('es-AR')}${estadoTxt}`;
      if ((m.cancelada || esPasado || evento.cancelado) && state.usuarioActivo?.rol === "Comprador") {
        opt.disabled = true;
      }
      selectMod.appendChild(opt);
    });
    actualizarInfoModalidadSeleccionada();
  } else {
    selectMod.innerHTML = "<option value=''>No hay modalidades disponibles</option>";
    document.getElementById("modalidadInfoBox").style.display = "none";
  }

  selectMod.disabled = (evento.cancelado || esPasado) && state.usuarioActivo?.rol === "Comprador";
  const inputCant = document.getElementById("inputCantidad");
  if (inputCant) {
    inputCant.disabled = (evento.cancelado || esPasado) && state.usuarioActivo?.rol === "Comprador";
  }

  const btnGmaps = document.getElementById("btnAbrirGoogleMapsExt");
  if (btnGmaps) {
    const lat = evento.latitud || -34.6037;
    const lng = evento.longitud || -58.3816;
    btnGmaps.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  renderizarMapa(evento.latitud, evento.longitud, evento.nombre, evento.lugar);

  selectMod.onchange = actualizarInfoModalidadSeleccionada;
  if (inputCant) inputCant.oninput = calcularPrecioCompra;

  const btnConfirmar = document.getElementById("btnConfirmarCompra");
  if (btnConfirmar) btnConfirmar.onclick = procesarCompra;

  calcularPrecioCompra();
}

function renderizarMapa(lat, lng, titulo, lugar) {
  const defaultLat = -34.6037;
  const defaultLng = -58.3816;
  const finalLat = (lat !== null && lat !== undefined && !isNaN(lat)) ? lat : defaultLat;
  const finalLng = (lng !== null && lng !== undefined && !isNaN(lng)) ? lng : defaultLng;

  setTimeout(() => {
    const mapDiv = document.getElementById("mapContainer");
    if (!mapDiv) return;

    if (!state.leafletMap) {
      state.leafletMap = L.map('mapContainer', { attributionControl: false }).setView([finalLat, finalLng], 15);

      const googleCalles = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });
      const googleSatelite = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });

      googleCalles.addTo(state.leafletMap);
      L.control.layers({ "Google Maps (Calles)": googleCalles, "Google Maps (Satelite)": googleSatelite }, null, { position: 'topright' }).addTo(state.leafletMap);
    } else {
      state.leafletMap.invalidateSize();
      state.leafletMap.setView([finalLat, finalLng], 15);
    }

    if (state.mapMarker) {
      state.leafletMap.removeLayer(state.mapMarker);
    }

    const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${finalLat},${finalLng}`;
    state.mapMarker = L.marker([finalLat, finalLng]).addTo(state.leafletMap);
    state.mapMarker.bindPopup(`
      <div style="min-width: 180px; padding: 2px;">
        <strong>${titulo}</strong><br>
        <span style="color: #64748b; font-size: 0.825rem; display: block; margin: 0.25rem 0;">${lugar}</span>
        <a href="${gmapsLink}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; font-weight: 600; font-size: 0.8rem; text-decoration: underline;">
          Abrir en Google Maps
        </a>
      </div>
    `).openPopup();
  }, 100);
}

function actualizarInfoModalidadSeleccionada() {
  const selectMod = document.getElementById("selectModalidad");
  if (!selectMod) return;

  const modId = selectMod.value;
  const modalidad = state.eventoSeleccionado?.modalidades?.find(m => m.id === modId);
  const box = document.getElementById("modalidadInfoBox");

  if (!modalidad) {
    if (box) box.style.display = "none";
    return;
  }

  if (box) box.style.display = "block";
  document.getElementById("modInfoNombre").textContent = modalidad.nombre;
  document.getElementById("modInfoBeneficios").textContent = modalidad.beneficios || "Sin beneficios especiales.";
  document.getElementById("modInfoCupo").textContent = modalidad.cupoDisponible;
  document.getElementById("modInfoPrecio").textContent = `$${modalidad.precio.toLocaleString('es-AR')}`;

  const badgeEstado = document.getElementById("modInfoBadgeEstado");
  if (badgeEstado) {
    badgeEstado.textContent = modalidad.cancelada ? "Cancelada" : "Activa";
    badgeEstado.className = modalidad.cancelada ? "badge badge-danger" : "badge badge-success";
  }

  const boxCancMod = document.getElementById("boxCancelarModalidadDetalle");
  const btnCancMod = document.getElementById("btnCancelarModalidadDetalle");
  if (boxCancMod && btnCancMod) {
    if (state.usuarioActivo?.rol === "Organizador" && !modalidad.cancelada && !state.eventoSeleccionado?.cancelado) {
      boxCancMod.style.display = "block";
      btnCancMod.onclick = () => cancelarModalidad(state.eventoSeleccionado.id, modalidad.id, modalidad.nombre);
    } else {
      boxCancMod.style.display = "none";
    }
  }

  const esPasado = state.eventoSeleccionado && new Date(state.eventoSeleccionado.fecha) < new Date();
  const btnConfirmar = document.getElementById("btnConfirmarCompra");
  if (btnConfirmar) {
    if (state.eventoSeleccionado?.cancelado) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Evento Cancelado";
    } else if (esPasado) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Evento Finalizado";
    } else if (modalidad.cancelada) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Modalidad Cancelada";
    } else if (modalidad.cupoDisponible <= 0) {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Cupo Agotado";
    } else {
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = "Comprar Entradas";
    }
  }

  const inputCant = document.getElementById("inputCantidad");
  if (inputCant) {
    inputCant.max = Math.max(1, modalidad.cupoDisponible);
  }

  calcularPrecioCompra();
}

function calcularPrecioCompra() {
  const selectMod = document.getElementById("selectModalidad");
  if (!selectMod) return;

  const modId = selectMod.value;
  const modalidad = state.eventoSeleccionado?.modalidades?.find(m => m.id === modId);
  const inputCant = document.getElementById("inputCantidad");
  const cantidad = parseInt(inputCant?.value, 10) || 1;

  if (!modalidad) return;

  const subtotal = modalidad.precio * cantidad;
  let total = subtotal;
  let tieneDescuento = false;
  let montoDescuento = 0;

  if (cantidad >= 5) {
    tieneDescuento = true;
    montoDescuento = Math.round(subtotal * 0.15);
    total = subtotal - montoDescuento;
  }

  const bannerDesc = document.getElementById("discountBanner");
  const filaDesc = document.getElementById("filaDescuento");
  if (bannerDesc) bannerDesc.style.display = tieneDescuento ? "flex" : "none";
  if (filaDesc) filaDesc.style.display = tieneDescuento ? "flex" : "none";

  document.getElementById("resumenSubtotal").textContent = `$${subtotal.toLocaleString('es-AR')}`;
  document.getElementById("resumenDescuento").textContent = `-$${montoDescuento.toLocaleString('es-AR')}`;
  document.getElementById("resumenTotal").textContent = `$${total.toLocaleString('es-AR')}`;
}
