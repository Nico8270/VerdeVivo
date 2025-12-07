const API_BASE = '/api';

// Generar/recuperar sessionId para el carrito
function getSessionId() {
  let sid = localStorage.getItem('verdevivo_session');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem('verdevivo_session', sid);
  }
  return sid;
}

const sessionId = getSessionId();
const productosList = document.getElementById('productos-list');
const carritoList = document.getElementById('carrito-list');
const carritoTotalEl = document.getElementById('carrito-total');
const pedidoForm = document.getElementById('pedido-form');
const pedidoConfirmacion = document.getElementById('pedido-confirmacion');
const seguimientoForm = document.getElementById('seguimiento-form');
const seguimientoResultado = document.getElementById('seguimiento-resultado');
const vaciarCarritoBtn = document.getElementById('vaciar-carrito');

// Modal
const modal = document.getElementById('product-modal');
const modalClose = document.getElementById('modal-close');
const modalImage = document.getElementById('modal-image');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalPrice = document.getElementById('modal-price');
const modalStock = document.getElementById('modal-stock');
const modalQuantity = document.getElementById('modal-quantity');
const modalAdd = document.getElementById('modal-add');

let productosCache = [];
let carritoCache = null;
let productoSeleccionado = null;

function getPlaceholderImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/400`;
}

async function fetchProductos() {
  const res = await fetch(`${API_BASE}/products`);
  const data = await res.json();
  productosCache = data;
  renderProductos(data);
}

function abrirModalProducto(producto) {
  productoSeleccionado = producto;
  modalTitle.textContent = producto.name;
  modalDescription.textContent = producto.description || 'Sin descripción';
  modalPrice.textContent = `Precio: $${producto.price.toFixed(0)}`;
  const enStock = producto.isAvailable && (producto.stock === undefined || producto.stock > 0);
  modalStock.textContent = enStock
    ? `En stock: ${producto.stock ?? 'Disponible'}`
    : 'Sin stock';
  modalStock.className = enStock ? '' : 'out';
  modalQuantity.value = 1;

  const imgSrc = producto.imageUrl && producto.imageUrl.trim().length > 0
    ? producto.imageUrl
    : getPlaceholderImage(producto.name);
  modalImage.src = imgSrc;
  modalImage.alt = producto.name;

  modal.classList.remove('hidden');

  // deshabilitar botón si no hay stock
  modalAdd.disabled = !enStock;
}

function cerrarModal() {
  modal.classList.add('hidden');
  productoSeleccionado = null;
}

function renderProductos(productos) {
  productosList.innerHTML = '';

  productos.forEach((p) => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const enStock = p.isAvailable && (p.stock === undefined || p.stock > 0);
    const stockLabel = enStock ? `En stock (${p.stock ?? 'Disponible'})` : 'Sin stock';

    const imgSrc = p.imageUrl && p.imageUrl.trim().length > 0
      ? p.imageUrl
      : getPlaceholderImage(p.name);

    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">$${p.price.toFixed(0)}</p>
      <p class="stock ${enStock ? '' : 'out'}">${stockLabel}</p>
    `;

    card.addEventListener('click', () => abrirModalProducto(p));

    productosList.appendChild(card);
  });
}

async function cargarCarrito() {
  const res = await fetch(`${API_BASE}/cart?sessionId=${encodeURIComponent(sessionId)}`);
  const data = await res.json();
  carritoCache = data;
  renderCarrito(data);
}

function renderCarrito(cart) {
  carritoList.innerHTML = '';
  let total = 0;

  cart.items.forEach((item) => {
    const li = document.createElement('li');
    const subtotal = item.product.price * item.quantity;
    total += subtotal;

    li.innerHTML = `
      <div class="cart-info">
        <div>${item.product.name}</div>
        <div>$${item.product.price.toFixed(0)} x ${item.quantity} = $${subtotal.toFixed(0)}</div>
      </div>
      <div class="cart-actions">
        <input type="number" min="1" value="${item.quantity}" />
        <button class="secondary btn-actualizar">Actualizar</button>
        <button class="secondary btn-eliminar">X</button>
      </div>
    `;

    const qtyInput = li.querySelector('input[type="number"]');
    const btnActualizar = li.querySelector('.btn-actualizar');
    const btnEliminar = li.querySelector('.btn-eliminar');

    btnActualizar.addEventListener('click', () => {
      const newQty = parseInt(qtyInput.value, 10);
      if (isNaN(newQty) || newQty <= 0) return;
      actualizarCantidadEnCarrito(item.product._id, newQty);
    });

    btnEliminar.addEventListener('click', () => {
      eliminarDelCarrito(item.product._id);
    });

    carritoList.appendChild(li);
  });

  carritoTotalEl.textContent = `Total: $${total.toFixed(0)}`;
}

async function actualizarCantidadEnCarrito(productId, quantity) {
  await fetch(`${API_BASE}/cart/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, productId, quantity })
  });

  await cargarCarrito();
}

async function eliminarDelCarrito(productId) {
  await fetch(`${API_BASE}/cart/item`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, productId })
  });

  await cargarCarrito();
}

async function vaciarCarrito() {
  await fetch(`${API_BASE}/cart`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });

  await cargarCarrito();
}

// Añadir al carrito desde el modal
modalAdd.addEventListener('click', async () => {
  if (!productoSeleccionado) return;
  const qty = parseInt(modalQuantity.value, 10);
  if (isNaN(qty) || qty <= 0) return;

  // Si ya existe en el carrito, sumamos
  let existingQty = 0;
  if (carritoCache) {
    const found = carritoCache.items.find(
      (i) => i.product._id === productoSeleccionado._id
    );
    if (found) existingQty = found.quantity;
  }

  const newQuantity = existingQty + qty;
  await actualizarCantidadEnCarrito(productoSeleccionado._id, newQuantity);
  cerrarModal();
});

// Enviar pedido
pedidoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pedidoConfirmacion.textContent = '';

  const customerName = document.getElementById('nombre').value;
  const customerPhone = document.getElementById('telefono').value;
  const customerAddress = document.getElementById('direccion').value;

  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, customerName, customerPhone, customerAddress })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    pedidoConfirmacion.textContent = `Error: ${err.message || 'No se pudo crear el pedido'}`;
    return;
  }

  const order = await res.json();
  pedidoConfirmacion.textContent = `✅ Pedido creado. ID: ${order._id}. Guarda este código para seguimiento.`;

  pedidoForm.reset();
  await cargarCarrito();
});

// Consultar estado de pedido
seguimientoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  seguimientoResultado.textContent = '';

  const id = document.getElementById('pedido-id').value.trim();
  if (!id) return;

  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}`);
  if (!res.ok) {
    seguimientoResultado.textContent = 'No se encontró un pedido con ese ID.';
    return;
  }

  const order = await res.json();
  seguimientoResultado.textContent = `Estado: ${order.status} | Total: $${order.total.toFixed(
    0
  )}`;
});

// Botones del modal
modalClose.addEventListener('click', cerrarModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) cerrarModal();
});

// Vaciar carrito
if (vaciarCarritoBtn) {
  vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
}

// Inicializar
fetchProductos();
cargarCarrito();
