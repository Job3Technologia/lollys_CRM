let cart = JSON.parse(localStorage.getItem('lollys_cart')) || [];

function addToCart(id, name, price, qty = 1) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += qty;
    } else {
        cart.push({ id, name, price, quantity: qty });
    }
    updateCart();
    showToast(`${name} added to cart!`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCart();
    // Dispatch event for UI updates
    window.dispatchEvent(new Event('cart-updated'));
}

function updateItemQuantity(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            updateCart();
            window.dispatchEvent(new Event('cart-updated'));
        }
    }
}

function getCartTotal() {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

function updateCart() {
    localStorage.setItem('lollys_cart', JSON.stringify(cart));
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    const countEl = document.getElementById('cart-count');
    const floatCountEl = document.getElementById('cart-count-float');
    
    if (countEl) countEl.textContent = count;
    if (floatCountEl) floatCountEl.textContent = count;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'glass-panel';
    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 30px;
        padding: 15px 25px; color: var(--text-dark); background: white; z-index: 3000;
        border-left: 4px solid var(--accent-orange);
        box-shadow: var(--shadow-lg);
        animation: slideIn 0.3s ease-out;
        font-weight: 500;
        display: flex; align-items: center;
    `;
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initial update
document.addEventListener('DOMContentLoaded', updateCart);
