// public/app.js
console.log("app.js cargado");

const API_BASE = "/api";

window.addEventListener("DOMContentLoaded", () => {
  // ===================== SESIÓN DE CLIENTE (CARRITO) =====================
  function getSessionId() {
    let sid = localStorage.getItem("verdevivo_session");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2) + Date.now();
      localStorage.setItem("verdevivo_session", sid);
    }
    return sid;
  }

  const sessionId = getSessionId();

  // ===================== REFERENCIAS DOM =====================
  const productosList = document.getElementById("productos-list");
  const carritoList = document.getElementById("carrito-list");
  const carritoTotalEl = document.getElementById("carrito-total");
  const pedidoForm = document.getElementById("pedido-form");
  const pedidoConfirmacion = document.getElementById("pedido-confirmacion");
  const seguimientoForm = document.getElementById("seguimiento-form");
  const seguimientoResultado = document.getElementById("seguimiento-resultado");
  const vaciarCarritoBtn = document.getElementById("vaciar-carrito");

  // Modal
  const modal = document.getElementById("product-modal");
  const modalClose = document.getElementById("modal-close");
  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalDescription = document.getElementById("modal-description");
  const modalPrice = document.getElementById("modal-price");
  const modalStock = document.getElementById("modal-stock");
  const modalQuantity = document.getElementById("modal-quantity");
  const modalAdd = document.getElementById("modal-add");

  // Auth / admin
  let adminToken = localStorage.getItem("verdevivo_adminToken") || null;
  let adminUser = null;
  try {
    const storedUser = localStorage.getItem("verdevivo_adminUser");
    if (storedUser) adminUser = JSON.parse(storedUser);
  } catch (e) {
    adminUser = null;
  }

  const loginForm = document.getElementById("login-form");
  const loginStatus = document.getElementById("login-status");
  const logoutBtn = document.getElementById("logout-btn");
  const adminPanel = document.getElementById("admin-panel");
  const crearDemoBtn = document.getElementById("crear-demo-btn");

  // ===================== ESTADO EN MEMORIA =====================
  let productosCache = [];
  let carritoCache = null;
  let productoSeleccionado = null;

  function getPlaceholderImage(seed) {
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;
  }

  // ===================== PRODUCTOS =====================
  async function fetchProductos() {
    if (!productosList) return;
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) {
        console.error("Error HTTP al pedir productos:", res.status, res.statusText);
        productosList.innerHTML = "<p>No se pudieron cargar los productos.</p>";
        return;
      }

      const data = await res.json();
      console.log("Productos desde API:", data);
      productosCache = Array.isArray(data) ? data : [];
      renderProductos(productosCache);
    } catch (err) {
      console.error("Error de red al pedir productos:", err);
      productosList.innerHTML = "<p>Error de conexión al cargar el menú.</p>";
    }
  }

  function abrirModalProducto(producto) {
    productoSeleccionado = producto;
    modalTitle.textContent = producto.name;
    modalDescription.textContent = producto.description || "Sin descripción";
    modalPrice.textContent = `Precio: $${producto.price.toFixed(0)}`;

    const enStock =
      (producto.isAvailable ?? true) &&
      (producto.stock === undefined || producto.stock > 0);

    modalStock.textContent = enStock
      ? `En stock: ${producto.stock ?? "Disponible"}`
      : "Sin stock";
    modalStock.className = enStock ? "" : "out";
    modalQuantity.value = 1;

    const imgSrc =
      producto.imageUrl && producto.imageUrl.trim().length > 0
        ? producto.imageUrl
        : getPlaceholderImage(producto.name);
    modalImage.src = imgSrc;
    modalImage.alt = producto.name;

    modal.classList.remove("hidden");
    modalAdd.disabled = !enStock;
  }

  function cerrarModal() {
    modal.classList.add("hidden");
    productoSeleccionado = null;
  }

  function renderProductos(productos) {
    if (!productosList) return;
    productosList.innerHTML = "";

    if (!productos || productos.length === 0) {
      productosList.innerHTML =
        "<p>No hay productos disponibles en este momento.</p>";
      return;
    }

    productos.forEach((p) => {
      const card = document.createElement("article");
      card.className = "product-card";

      const enStock =
        (p.isAvailable ?? true) && (p.stock === undefined || p.stock > 0);
      const stockLabel = enStock
        ? `En stock (${p.stock ?? "Disponible"})`
        : "Sin stock";

      const imgSrc =
        p.imageUrl && p.imageUrl.trim().length > 0
          ? p.imageUrl
          : getPlaceholderImage(p.name);

      card.innerHTML = `
        <img src="${imgSrc}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p class="price">$${p.price.toFixed(0)}</p>
        <p class="stock ${enStock ? "" : "out"}">${stockLabel}</p>
      `;

      card.addEventListener("click", () => abrirModalProducto(p));

      productosList.appendChild(card);
    });
  }

  // ===================== CARRITO =====================
  async function cargarCarrito() {
    if (!carritoList || !carritoTotalEl) return;
    try {
      const res = await fetch(
        `${API_BASE}/cart?sessionId=${encodeURIComponent(sessionId)}`
      );
      if (!res.ok) {
        console.error("Error al cargar carrito:", res.status);
        return;
      }
      const data = await res.json();
      carritoCache = data;
      renderCarrito(data);
    } catch (err) {
      console.error("Error de red al cargar carrito:", err);
    }
  }

  function renderCarrito(cart) {
    carritoList.innerHTML = "";
    if (!cart || !Array.isArray(cart.items)) {
      carritoTotalEl.textContent = "Total: $0";
      return;
    }

    let total = 0;

    cart.items.forEach((item) => {
      const li = document.createElement("li");
      const subtotal = item.product.price * item.quantity;
      total += subtotal;

      li.innerHTML = `
        <div class="cart-info">
          <div>${item.product.name}</div>
          <div>$${item.product.price.toFixed(
            0
          )} x ${item.quantity} = $${subtotal.toFixed(0)}</div>
        </div>
        <div class="cart-actions">
          <input type="number" min="1" value="${item.quantity}" />
          <button class="secondary btn-actualizar">Actualizar</button>
          <button class="secondary btn-eliminar">X</button>
        </div>
      `;

      const qtyInput = li.querySelector('input[type="number"]');
      const btnActualizar = li.querySelector(".btn-actualizar");
      const btnEliminar = li.querySelector(".btn-eliminar");

      btnActualizar.addEventListener("click", () => {
        const newQty = parseInt(qtyInput.value, 10);
        if (isNaN(newQty) || newQty <= 0) return;
        actualizarCantidadEnCarrito(item.product._id, newQty);
      });

      btnEliminar.addEventListener("click", () => {
        eliminarDelCarrito(item.product._id);
      });

      carritoList.appendChild(li);
    });

    carritoTotalEl.textContent = `Total: $${total.toFixed(0)}`;
  }

  async function actualizarCantidadEnCarrito(productId, quantity) {
    try {
      await fetch(`${API_BASE}/cart/item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, productId, quantity }),
      });

      await cargarCarrito();
    } catch (err) {
      console.error("Error al actualizar carrito:", err);
    }
  }

  async function eliminarDelCarrito(productId) {
    try {
      await fetch(
        `${API_BASE}/cart/item?sessionId=${encodeURIComponent(
          sessionId
        )}&productId=${encodeURIComponent(productId)}`,
        {
          method: "DELETE",
        }
      );

      await cargarCarrito();
    } catch (err) {
      console.error("Error al eliminar del carrito:", err);
    }
  }

  async function vaciarCarrito() {
    try {
      await fetch(`${API_BASE}/cart`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      await cargarCarrito();
    } catch (err) {
      console.error("Error al vaciar carrito:", err);
    }
  }

  if (vaciarCarritoBtn) {
    vaciarCarritoBtn.addEventListener("click", vaciarCarrito);
  }

  // Añadir desde modal
  if (modalAdd) {
    modalAdd.addEventListener("click", async () => {
      if (!productoSeleccionado) return;
      const qty = parseInt(modalQuantity.value, 10);
      if (isNaN(qty) || qty <= 0) return;

      let existingQty = 0;
      if (carritoCache && Array.isArray(carritoCache.items)) {
        const found = carritoCache.items.find(
          (i) => i.product._id === productoSeleccionado._id
        );
        if (found) existingQty = found.quantity;
      }

      const newQuantity = existingQty + qty;
      await actualizarCantidadEnCarrito(productoSeleccionado._id, newQuantity);
      cerrarModal();
    });
  }

  // ===================== PEDIDO =====================
  if (pedidoForm) {
    pedidoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (pedidoConfirmacion) pedidoConfirmacion.textContent = "";

      const customerName = document.getElementById("nombre").value;
      const customerPhone = document.getElementById("telefono").value;
      const customerAddress = document.getElementById("direccion").value;

      try {
        const res = await fetch(`${API_BASE}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            customerName,
            customerPhone,
            customerAddress,
          }),
        });

        const order = await res.json();

        if (!res.ok) {
          if (pedidoConfirmacion) {
            pedidoConfirmacion.textContent =
              order.message || "No se pudo crear el pedido";
          }
          return;
        }

        // Redirigir al portal de pagos simulado
        window.location.href = `/pago.html?id=${order._id}`;
      } catch (err) {
        console.error("Error al crear pedido:", err);
        if (pedidoConfirmacion) {
          pedidoConfirmacion.textContent =
            "Error de conexión al intentar crear el pedido.";
        }
      }
    });
  }

  // ===================== SEGUIMIENTO =====================
  if (seguimientoForm) {
    seguimientoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!seguimientoResultado) return;
      seguimientoResultado.textContent = "";

      const id = document.getElementById("pedido-id").value.trim();
      if (!id) return;

      try {
        const res = await fetch(
          `${API_BASE}/orders/${encodeURIComponent(id)}`
        );
        if (!res.ok) {
          seguimientoResultado.textContent =
            "No se encontró un pedido con ese ID.";
          return;
        }

        const order = await res.json();
        seguimientoResultado.textContent = `Estado: ${
          order.status
        } | Total: $${order.total.toFixed(0)}`;
      } catch (err) {
        console.error("Error al consultar pedido:", err);
        seguimientoResultado.textContent =
          "Error de conexión al consultar el pedido.";
      }
    });
  }

  // ===================== MODAL =====================
  if (modalClose) {
    modalClose.addEventListener("click", cerrarModal);
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) cerrarModal();
    });
  }

  // ===================== AUTH / PANEL ADMIN =====================
  function updateAuthUI() {
    if (!loginForm || !loginStatus || !logoutBtn || !adminPanel || !crearDemoBtn)
      return;

    if (adminToken && adminUser && adminUser.role === "admin") {
      loginForm.classList.add("hidden");
      logoutBtn.classList.remove("hidden");
      adminPanel.classList.remove("hidden");
      crearDemoBtn.disabled = false;
      loginStatus.textContent = `Sesión iniciada como ${adminUser.name} (rol: ${adminUser.role})`;
    } else {
      adminToken = null;
      adminUser = null;
      localStorage.removeItem("verdevivo_adminToken");
      localStorage.removeItem("verdevivo_adminUser");
      logoutBtn.classList.add("hidden");
      adminPanel.classList.add("hidden");
      crearDemoBtn.disabled = true;
      loginForm.classList.remove("hidden");
      loginStatus.textContent = "No hay sesión iniciada.";
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!loginStatus) return;

      loginStatus.textContent = "Autenticando...";

      const email = document.getElementById("login-email").value;
      const password = document.getElementById("login-password").value;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          loginStatus.textContent = `Error: ${
            err.error || "Credenciales inválidas"
          }`;
          adminToken = null;
          adminUser = null;
          updateAuthUI();
          return;
        }

        const data = await res.json();
        adminToken = data.token;
        adminUser = data.user;

        if (adminUser.role !== "admin") {
          loginStatus.textContent = "No tienes permisos de administrador.";
          adminToken = null;
          adminUser = null;
          updateAuthUI();
          return;
        }

        localStorage.setItem("verdevivo_adminToken", adminToken);
        localStorage.setItem(
          "verdevivo_adminUser",
          JSON.stringify(adminUser)
        );

        updateAuthUI();
      } catch (err) {
        console.error("Error de login:", err);
        loginStatus.textContent = "Error de conexión con el servidor.";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      adminToken = null;
      adminUser = null;
      localStorage.removeItem("verdevivo_adminToken");
      localStorage.removeItem("verdevivo_adminUser");
      updateAuthUI();
    });
  }

  if (crearDemoBtn) {
    crearDemoBtn.addEventListener("click", async () => {
      if (!adminToken || !adminUser || adminUser.role !== "admin") {
        if (loginStatus) {
          loginStatus.textContent =
            "Debes iniciar sesión como administrador.";
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: "Bowl demo admin",
            price: 4990,
            stock: 10,
            description:
              "Plato de prueba creado desde el panel de administrador.",
            imageUrl: "",
            isAvailable: true,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (loginStatus) {
            loginStatus.textContent = `Error al crear producto: ${
              err.error || res.status
            }`;
          }
          return;
        }

        if (loginStatus) {
          loginStatus.textContent =
            "✅ Producto de prueba creado correctamente.";
        }
        await fetchProductos();
      } catch (err) {
        console.error("Error creando producto demo:", err);
        if (loginStatus) {
          loginStatus.textContent =
            "Error de conexión al crear producto.";
        }
      }
    });
  }

  // ===================== INICIALIZAR =====================
  fetchProductos();
  cargarCarrito();
  updateAuthUI();
});
