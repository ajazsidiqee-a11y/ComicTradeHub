﻿﻿﻿﻿﻿// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Add item to cart
function addToCart(name, price) {
    const sessionData = localStorage.getItem('cth_loggedIn');
    let isLoggedIn = false;
    if (sessionData) {
        try {
            const user = JSON.parse(sessionData);
            if (user && user.id) isLoggedIn = true;
        } catch(e) {}
    }
    
    if (!isLoggedIn) {
        alert('Please log in first to add items to your cart.');
        window.location.href = 'login.html';
        return;
    }

    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${name} added to cart!`);
    updateCartDisplay();
}

// Remove item from cart
function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Update item quantity
function updateQuantity(name, change) {
    const item = cart.find(item => item.name === name);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(name);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
}

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartSummary = document.getElementById('cartSummary');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="products.html">Continue shopping</a></p>';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    let cartHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        cartHTML += `
            <div class="cart-item">
                <img src="https://via.placeholder.com/80" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.name}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.name}', 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.name}')">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = cartHTML;
    
    if (cartSummary) {
        const tax = subtotal * 0.08;
        const shipping = 5.99;
        const total = subtotal + tax + shipping;
        
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
        
        cartSummary.style.display = 'block';
    }
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    alert('Thank you for your order! This is a demo checkout.');
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
}

// Product filtering
function filterProducts() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const products = document.querySelectorAll('.product-card');
    
    if (!categoryFilter || !priceFilter) return;
    
    const selectedCategory = categoryFilter.value;
    const selectedPrice = priceFilter.value;
    
    products.forEach(product => {
        const category = product.dataset.category;
        const price = parseFloat(product.dataset.price);
        
        let showProduct = true;
        
        // Category filter
        if (selectedCategory !== 'all' && category !== selectedCategory) {
            showProduct = false;
        }
        
        // Price filter
        if (selectedPrice !== 'all') {
            if (selectedPrice === '0-50' && price > 50) showProduct = false;
            if (selectedPrice === '50-100' && (price <= 50 || price > 100)) showProduct = false;
            if (selectedPrice === '100+' && price <= 100) showProduct = false;
        }
        
        product.style.display = showProduct ? 'block' : 'none';
    });
}

// â”€â”€ Contact Form Validation â”€â”€
const contactRules = {
    name:    { minLen: 2,  pattern: /^[a-zA-Z\s'-]+$/,           patternMsg: 'Name can only contain letters, spaces, hyphens, or apostrophes.' },
    email:   {             pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Enter a valid email address.' },
    subject: { minLen: 3 },
    message: { minLen: 10 }
};

function getError(field, value) {
    const v = value.trim();
    const rule = contactRules[field];
    if (!v) return field.charAt(0).toUpperCase() + field.slice(1) + ' is required.';
    if (rule.minLen && v.length < rule.minLen) return 'Must be at least ' + rule.minLen + ' characters.';
    if (rule.pattern && !rule.pattern.test(v)) return rule.patternMsg;
    return '';
}

function showFieldError(input, msg) {
    input.classList.toggle('input-error', !!msg);
    input.classList.toggle('input-valid', !msg);
    let span = input.parentElement.querySelector('.field-error');
    if (!span) {
        span = document.createElement('span');
        span.className = 'field-error';
        input.parentElement.appendChild(span);
    }
    span.textContent = msg;
}

async function handleContactForm(event) {
    event.preventDefault();
    const form = event.target;
    const fields = ['name', 'email', 'subject', 'message'];
    let valid = true;

    fields.forEach(function(f) {
        const input = form.querySelector('[name="' + f + '"]');
        const msg = getError(f, input.value);
        showFieldError(input, msg);
        if (msg) valid = false;
    });

    if (!valid) return;

    const name    = form.querySelector('[name="name"]').value.trim();
    const email   = form.querySelector('[name="email"]').value.trim();
    const subject = form.querySelector('[name="subject"]').value.trim();
    const message = form.querySelector('[name="message"]').value.trim();

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
        const API = 'https://comictradehub-api.onrender.com';
        const res  = await fetch(API + '/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, subject, message }) });
        const data = await res.json();

        let banner = form.querySelector('.success-banner');
        if (!banner) { banner = document.createElement('div'); banner.className = 'success-banner'; form.appendChild(banner); }

        if (data.success) {
            banner.textContent = 'Thank you, ' + name + '! Your message has been sent. We will reply to ' + email + ' shortly.';
            banner.style.display = 'block';
            form.reset();
            fields.forEach(function(f) {
                const input = form.querySelector('[name="' + f + '"]');
                input.classList.remove('input-valid', 'input-error');
                const span = input.parentElement.querySelector('.field-error');
                if (span) span.textContent = '';
            });
            setTimeout(function() { banner.style.display = 'none'; }, 5000);
        } else {
            banner.textContent = 'Failed to send message. Please try again.';
            banner.style.cssText += 'background:#fef2f2;border-color:#fca5a5;color:#b91c1c;';
            banner.style.display = 'block';
        }
    } catch(e) {
        let banner = form.querySelector('.success-banner');
        if (!banner) { banner = document.createElement('div'); banner.className = 'success-banner'; form.appendChild(banner); }
        banner.textContent = 'Server error. Please try again later.';
        banner.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Message';
    }
}

// Initialize page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update cart display on page load
    updateCartDisplay();
    
    // Add event listeners for product filters
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
    if (priceFilter) priceFilter.addEventListener('change', filterProducts);
    
    // Add event listener for contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);

        // Real-time validation on blur
        ['name', 'email', 'subject', 'message'].forEach(function(f) {
            const input = contactForm.querySelector('[name="' + f + '"]');
            if (input) {
                input.addEventListener('blur', function() {
                    showFieldError(input, getError(f, input.value));
                });
                input.addEventListener('input', function() {
                    if (input.classList.contains('input-error')) {
                        showFieldError(input, getError(f, input.value));
                    }
                });
            }
        });

        // Close drawer when clicking backdrop
        var overlay = document.getElementById('mobileNav');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === this) toggleMobileNav();
            });
        }
    }
});

// Mobile Nav Toggle
function toggleMobileNav() {
    var nav = document.getElementById('mobileNav');
    var btn = document.getElementById('hamburger');
    if (!nav || !btn) return;
    nav.classList.toggle('open');
    btn.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
}
