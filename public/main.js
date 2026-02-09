let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.getElementById('year').textContent = new Date().getFullYear();
async function loadProducts() {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '<p class="text-center">Loading products...</p>';

  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');

    const products = await res.json();
    if (!products.length) {
      productList.innerHTML = '<p class="text-center text-muted">No products available.</p>';
      return;
    }

    productList.innerHTML = '';
    products.forEach((product) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-3';

      col.innerHTML = `
        <div class="card h-100 product-card">
          ${product.image_url
            ? `<img src="${product.image_url}" class="card-img-top" alt="${product.name}" />`
            : '<div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 180px;"><span class="text-muted">No Image</span></div>'
          }
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text mb-2">${product.description || ''}</p>
            <p class="card-text text-muted small mb-3">
              <strong>Ingredients:</strong> ${product.ingredients || ''}
            </p>
            <div class="mt-auto">
              <button class="btn btn-primary btn-sm w-100 add-to-cart-btn" data-product-id="${product.id}" data-product='${JSON.stringify(product).replace(/'/g, "\\'")}'>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      `;

      productList.appendChild(col);
    });

    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', handleAddToCart);
    });

    updateCartCount();
  } catch (error) {
    console.error(error);
    productList.innerHTML = '<p class="text-center text-danger">Error loading products. Please try again later.</p>';
  }
}

function handleAddToCart(e) {
  const product = JSON.parse(e.target.dataset.product);
  const productId = parseInt(e.target.dataset.productId);
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, id: productId, quantity: 1 });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  
  e.target.textContent = 'Added!';
  e.target.classList.add('btn-success');
  setTimeout(() => {
    e.target.textContent = 'Add to Cart';
    e.target.classList.remove('btn-success');
  }, 1000);
}
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountEl = document.getElementById('cart-count');
  
  if (cartCountEl) {
    if (totalItems > 0) {
      cartCountEl.textContent = totalItems;
      cartCountEl.style.display = 'inline-block';
    } else {
      cartCountEl.style.display = 'none';
    }
  }
}
function scrollToProducts() {
  const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
  if (cartModal) cartModal.hide();
  
  setTimeout(() => {
    document.getElementById('products').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }, 300);
}
function showCheckout() {
  renderCheckout();
  const checkoutModal = new bootstrap.Modal(document.getElementById('checkoutModal'));
  checkoutModal.show();
  
  setTimeout(() => {
    const checkoutModalEl = document.getElementById('checkoutModal');
    const closeBtn = checkoutModalEl.querySelector('.btn-close');
    if (closeBtn) closeBtn.click();
    scrollToProducts();
  }, 10000);
}
function renderCheckout() {
  const checkoutItemsEl = document.getElementById('checkout-items');
  const checkoutTotalEl = document.getElementById('checkout-total');
  
  if (cart.length === 0) {
    checkoutItemsEl.innerHTML = '<p class="text-muted">No items in cart</p>';
    checkoutTotalEl.innerHTML = '';
    return;
  }
  
  const basePrice = 25;
  
  checkoutItemsEl.innerHTML = cart.map(item => {
    const itemTotal = basePrice * item.quantity;
    return `
      <div class="d-flex justify-content-between align-items-center mb-3 p-2 border-bottom">
        <div>
          <h6>${item.name} <span class="badge bg-light text-dark">${item.quantity}x</span></h6>
          <small class="text-muted">${item.ingredients || ''}</small>
        </div>
        <div>
          <strong>$${itemTotal.toFixed(2)}</strong>
          <br><small class="text-muted">($${basePrice.toFixed(2)} each)</small>
        </div>
      </div>
    `;
  }).join('');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (basePrice * item.quantity), 0);
  
  checkoutTotalEl.innerHTML = `
    <div class="d-flex justify-content-between fs-5 fw-bold">
      <span>Total (${totalItems} items):</span>
      <span class="text-success">$${totalAmount.toFixed(2)}</span>
    </div>
  `;
  
  let countdown = 10;
  const countdownEl = document.getElementById('countdown');
  const timer = setInterval(() => {
    countdown--;
    if (countdownEl) countdownEl.textContent = countdown;
    if (countdown <= 0) clearInterval(timer);
  }, 1000);
}

function renderCartModal() {
  const modalBody = document.getElementById('cart-items');
  const cartTotalEl = document.getElementById('cart-total');
  const emptyCartEl = document.getElementById('empty-cart');
  
  if (cart.length === 0) {
    modalBody.innerHTML = '';
    if (emptyCartEl) emptyCartEl.classList.remove('d-none');
    if (cartTotalEl) cartTotalEl.innerHTML = '';
    return;
  }
  
  if (emptyCartEl) emptyCartEl.classList.add('d-none');
  
  modalBody.innerHTML = cart.map(item => `
    <div class="cart-item" data-product-id="${item.id}">
      <img src="${item.image_url || ''}" class="cart-item-image" alt="${item.name}" 
           style="${!item.image_url ? 'display:none;' : ''}">
      <div class="cart-item-details flex-grow-1">
        <h6>${item.name}</h6>
        <p class="text-muted mb-1">${item.description || ''}</p>
        <small class="text-muted">Ingredients: ${item.ingredients || 'N/A'}</small>
      </div>
      <div class="quantity-controls">
        <button class="quantity-btn quantity-decrease" data-id="${item.id}">-</button>
        <span class="quantity">${item.quantity}</span>
        <button class="quantity-btn quantity-increase" data-id="${item.id}">+</button>
      </div>
    </div>
  `).join('');
  
  setTimeout(() => {
    document.querySelectorAll('.quantity-increase').forEach(btn => {
      btn.onclick = function() { handleQuantityChange({ target: this }); };
    });
    document.querySelectorAll('.quantity-decrease').forEach(btn => {
      btn.onclick = function() { handleQuantityChange({ target: this }); };
    });
  }, 100);
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartTotalEl) cartTotalEl.innerHTML = `<strong>${totalItems} items</strong>`;
}

function handleQuantityChange(e) {
  const productId = parseInt(e.target.dataset.id);
  const item = cart.find(item => item.id === productId);
  
  if (!item) return;
  
  if (e.target.classList.contains('quantity-increase')) {
    item.quantity += 1;
  } else if (e.target.classList.contains('quantity-decrease')) {
    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart = cart.filter(cartItem => cartItem.id !== productId);
    }
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  renderCartModal();
}

async function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
    showAlert('Please fill out all fields.', 'danger');
    return;
  }

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    showAlert(data.message || 'Message sent successfully!', 'success');
    e.target.reset();
  } catch (err) {
    console.error(err);
    showAlert(err.message || 'Failed to send message.', 'danger');
  }
}

function showAlert(message, type) {
  const alertBox = document.getElementById('contact-alert');
  if (alertBox) {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove('d-none');
    setTimeout(() => alertBox.classList.add('d-none'), 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  const contactForm = document.getElementById('contact-form');
  if (contactForm) contactForm.addEventListener('submit', handleContactSubmit);
  
  const cartModal = document.getElementById('cartModal');
  if (cartModal) cartModal.addEventListener('show.bs.modal', renderCartModal);
});
const animatedSections = document.querySelectorAll('[data-animate]');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('section-show');
  });
}, { threshold: 0.15 });

animatedSections.forEach(section => {
  section.classList.add('section-hidden');
  revealObserver.observe(section);
});
