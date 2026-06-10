const recommendations = [
    { name: 'Almonds',        price: 1299, img: 'images/Almond.webp' },
    { name: 'Walnuts',        price: 1499, img: 'images/Wulnuts.webp' },
    { name: 'Raisins',        price: 549,  img: 'images/Kishmish.webp' },
    { name: 'Peanuts',        price: 549,  img: 'images/Pea.webp' },
    { name: 'Chia Seeds',     price: 799,  img: 'images/Chia Seeds.webp' },
    { name: 'Dried Apricots', price: 699,  img: 'images/Dried Appricot.webp' },
];
let savedItems = JSON.parse(localStorage.getItem('savedItems')) || [];
let selectedPayment = null;
let upiVerified = false;

function getImg(name) {
    const map = {
        'Almonds':'images/Almond.webp','Premium Almonds':'images/Almond.webp',
        'Walnuts':'images/Wulnuts.webp','Fresh Walnuts':'images/Wulnuts.webp',
        'Raisins':'images/Kishmish.webp','Golden Raisins':'images/Kishmish.webp',
        'Peanuts':'images/Pea.webp','Chia Seeds':'images/Chia Seeds.webp',
        'Dried Apricots':'images/Dried Appricot.webp','Cashews':'images/Cashews.webp',
        'Pumpkin Seeds':'images/Pumpkin Seeds.webp','Brazil Nuts':'images/Brazil Nuts.webp'
    };
    return map[name] || 'https://via.placeholder.com/80';
}

function animateVal(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = val;
    el.classList.remove('updated');
    void el.offsetWidth;
    el.classList.add('updated');
}

function updateSummary(subtotal) {
    const district  = document.getElementById('delDistrict');
    const freeDistrict = 'Pulwama';
    const inDistrict   = district && district.value === freeDistrict;
    const shipping  = subtotal > 0 ? (inDistrict ? 0 : 99) : 0;
    const tax       = Math.round(subtotal * 0.05);
    const total     = subtotal + shipping + tax;
    animateVal('summarySubtotal', '&#8377;' + subtotal.toLocaleString('en-IN'));
    animateVal('summaryShipping', shipping === 0 ? 'Free' : '&#8377;' + shipping);
    animateVal('summaryTax',      '&#8377;' + tax.toLocaleString('en-IN'));
    animateVal('summaryTotal',    '&#8377;' + total.toLocaleString('en-IN'));
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const bd = document.getElementById('summaryItemBreakdown');
    if (bd) bd.innerHTML = cart.map(i =>
        '<div style="display:flex;justify-content:space-between;font-size:0.85rem;color:rgba(255,255,255,0.55);padding:0.45rem 0;border-bottom:1px solid rgba(239,68,68,0.12);">' +
        '<span>' + i.name + ' x' + i.quantity + '</span>' +
        '<span style="font-weight:700;color:#fca5a5;">&#8377;' + (i.price * i.quantity).toLocaleString('en-IN') + '</span></div>'
    ).join('');
    const sm = document.getElementById('shippingMsg');
    if (sm) {
        if (subtotal === 0) {
            sm.textContent = 'Add items to see shipping info';
            sm.parentElement.style.background = '#f0fdf4';
            sm.parentElement.style.borderColor = '#86efac';
            sm.parentElement.style.color = '#166534';
        } else if (inDistrict) {
            sm.textContent = 'Free delivery within Pulwama district!';
            sm.parentElement.style.background = '#f0fdf4';
            sm.parentElement.style.borderColor = '#86efac';
            sm.parentElement.style.color = '#166534';
        } else if (district && district.value) {
            sm.textContent = 'Shipping charge Rs.99 applies to ' + district.value + ' district.';
            sm.parentElement.style.background = '#fff7ed';
            sm.parentElement.style.borderColor = '#fed7aa';
            sm.parentElement.style.color = '#9a3412';
        } else {
            sm.textContent = 'Select district to see shipping info.';
            sm.parentElement.style.background = '#f0fdf4';
            sm.parentElement.style.borderColor = '#86efac';
            sm.parentElement.style.color = '#166534';
        }
    }
    const btn = document.getElementById('checkoutBtnText');
    if (btn) btn.textContent = total > 0 ? 'Pay Rs.' + total.toLocaleString('en-IN') : 'Proceed to Pay';
}

function renderCart() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const list  = document.getElementById('cartItemsList');
    const badge = document.getElementById('cartBadge');
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    if (badge) badge.textContent = count || '';
    const lbl = document.getElementById('itemCountLabel');
    if (lbl) lbl.textContent = count + ' item' + (count !== 1 ? 's' : '');
    const ps = document.getElementById('paymentSection');
    if (!cart.length) {
        list.innerHTML = '<div class="empty-cart-box"><i class="fas fa-shopping-cart"></i><h4>Your cart is empty</h4><p style="color:#9ca3af;font-size:0.9rem;">Nothing added yet.</p><a href="products.html"><i class="fas fa-shopping-bag"></i> Shop Now</a></div>';
        updateSummary(0);
        if (ps) ps.style.display = 'none';
        const ds = document.getElementById('deliverySection');
        if (ds) ds.style.display = 'none';
        return;
    }
    list.innerHTML = cart.map((item, i) =>
        '<div class="cart-item-card">' +
        '<img class="cart-item-img" src="' + getImg(item.name) + '" alt="' + item.name + '" onerror="this.src=\'https://via.placeholder.com/80\'">' +
        '<div class="cart-item-details"><h4>' + item.name + '</h4>' +
        '<div class="item-price">&#8377;' + item.price.toLocaleString('en-IN') + '</div>' +
        '<div class="item-unit">per 500g pack</div>' +
        '<div class="qty-controls">' +
        '<button class="qty-btn" onclick="changeQty(' + i + ',-1)"><i class="fas fa-minus"></i></button>' +
        '<span class="qty-num">' + item.quantity + '</span>' +
        '<button class="qty-btn" onclick="changeQty(' + i + ',1)"><i class="fas fa-plus"></i></button>' +
        '</div></div>' +
        '<div class="cart-item-actions">' +
        '<span class="item-total">&#8377;' + (item.price * item.quantity).toLocaleString('en-IN') + '</span>' +
        '<button class="btn-save" onclick="saveForLater(' + i + ')"><i class="fas fa-bookmark"></i> Save</button>' +
        '<button class="btn-remove" onclick="removeItem(' + i + ')"><i class="fas fa-trash"></i> Remove</button>' +
        '</div></div>'
    ).join('');
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    updateSummary(subtotal);
    if (ps) ps.style.display = 'none';
    const ds = document.getElementById('deliverySection');
    if (ds) ds.style.display = 'block';
    const cb = document.getElementById('checkoutBtn');
    if (cb) { cb.style.display = 'none'; }
    const ab = document.getElementById('addressConfirmBtn');
    if (ab) ab.style.display = 'block';
}

function selectPayment(method, el) {
    selectedPayment = method;
    upiVerified = false;
    document.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
    ['upiBox','cardBox','netbankBox','codBox'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.style.display = 'none';
    });
    const map = { upi:'upiBox', card:'cardBox', netbank:'netbankBox', cod:'codBox' };
    const show = document.getElementById(map[method]);
    if (show) show.style.display = 'block';
}

function verifyUPI() {
    const upi    = document.getElementById('upiId').value.trim();
    const status = document.getElementById('upiStatus');
    if (!upi || !upi.includes('@')) {
        status.innerHTML = '<span style="color:#ef4444;"><i class="fas fa-times-circle"></i> Invalid UPI ID</span>';
        upiVerified = false; return;
    }
    status.innerHTML = '<span style="color:#f97316;"><i class="fas fa-spinner fa-spin"></i> Verifying...</span>';
    setTimeout(() => {
        upiVerified = true;
        status.innerHTML = '<span style="color:#16a34a;"><i class="fas fa-check-circle"></i> UPI ID verified!</span>';
    }, 1500);
}

function formatCard(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 16);
    el.value = v.replace(/(\d{4})/g, '$1 ').trim();
}
function formatExpiry(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
    el.value = v;
}

function validatePayment() {
    if (!selectedPayment) { alert('Please select a payment method.'); return false; }
    if (selectedPayment === 'upi' && !upiVerified) { alert('Please verify your UPI ID.'); return false; }
    if (selectedPayment === 'card') {
        const num  = document.getElementById('cardNum').value.replace(/\s/g, '');
        const exp  = document.getElementById('cardExp').value;
        const cvv  = document.getElementById('cardCvv').value;
        const name = document.getElementById('cardName').value.trim();
        if (num.length !== 16)           { alert('Enter a valid 16-digit card number.'); return false; }
        if (!/^\d{2}\/\d{2}$/.test(exp)){ alert('Enter valid expiry MM/YY.'); return false; }
        if (cvv.length !== 3)            { alert('Enter valid 3-digit CVV.'); return false; }
        if (!name)                       { alert('Enter name on card.'); return false; }
    }
    if (selectedPayment === 'netbank' && !document.getElementById('bankSelect').value) {
        alert('Please select a bank.'); return false;
    }
    return true;
}

function validateDelivery() {
    const name     = document.getElementById('delName').value.trim();
    const phone    = document.getElementById('delPhone').value.trim();
    const address  = document.getElementById('delAddress').value.trim();
    const district = document.getElementById('delDistrict').value.trim();
    const pin      = document.getElementById('delPin').value.trim();
    const state    = document.getElementById('delState').value.trim();

    const fields = [
        { val: name,     test: name.length >= 3 && /^[a-zA-Z\s]+$/.test(name), err: 'Enter a valid full name (letters only, min 3 chars).' },
        { val: phone,    test: /^[6-9]\d{9}$/.test(phone),                     err: 'Enter a valid 10-digit Indian mobile number.' },
        { val: address,  test: address.length >= 5,                             err: 'Enter a complete delivery address (min 5 chars).' },
        { val: district, test: district !== '',                                 err: 'Please select your district.' },
        { val: pin,      test: /^\d{6}$/.test(pin),                            err: 'Enter a valid 6-digit pincode.' },
        { val: state,    test: state !== '',                                    err: 'State is required.' },
    ];

    const ids = ['delName','delPhone','delAddress','delDistrict','delPin','delState'];

    let valid = true;
    fields.forEach((f, i) => {
        const el = document.getElementById(ids[i]);
        if (!f.test) {
            el.style.border = '2px solid #ef4444';
            el.style.background = '#fff5f5';
            if (valid) { alert(f.err); el.focus(); }
            valid = false;
        } else {
            el.style.border = '2px solid #16a34a';
            el.style.background = '#f0fdf4';
        }
    });
    return valid;
}

function confirmAddress() {
    if (!validateDelivery()) return;
    const ps = document.getElementById('paymentSection');
    if (ps) ps.style.display = 'block';
    const cb = document.getElementById('checkoutBtn');
    if (cb) cb.style.display = 'flex';
    const ab = document.getElementById('addressConfirmBtn');
    if (ab) ab.style.display = 'none';
    document.getElementById('summaryBox').scrollIntoView({ behavior: 'smooth' });
}

function handleCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (!cart.length) { alert('Your cart is empty!'); return; }
    if (!validatePayment()) return;
    if (!validateDelivery()) return;
    const btn = document.getElementById('checkoutBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';
    btn.disabled = true;

    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const district = document.getElementById('delDistrict').value;
    const shipping = district === 'Pulwama' ? 0 : 99;
    const tax      = Math.round(subtotal * 0.05);
    const total    = subtotal + shipping + tax;
    const orderId  = 'CTH-' + Date.now().toString().slice(-8).toUpperCase();

    const orderData = {
        order_id:       orderId,
        customer_name:  document.getElementById('delName').value.trim(),
        customer_phone: document.getElementById('delPhone').value.trim(),
        address:        document.getElementById('delAddress').value.trim(),
        district,
        pincode:        document.getElementById('delPin').value.trim(),
        items:          cart,
        subtotal, shipping, tax, total,
        payment:        selectedPayment
    };

    const API = 'https://comictradehub-api.onrender.com';
    fetch(API + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    }).catch(() => {});

    setTimeout(() => {
        document.getElementById('orderIdDisplay').textContent = 'Order ID: ' + orderId;
        document.getElementById('successModal').classList.add('active');
        localStorage.setItem('cart', JSON.stringify([]));
        btn.innerHTML = '<i class="fas fa-lock"></i> <span id="checkoutBtnText">Proceed to Pay</span>';
        btn.disabled = false;
        renderCart(); renderRecommendations();
    }, 2500);
}

function closeSucess() {
    document.getElementById('successModal').classList.remove('active');
    window.location.href = 'index.html';
}

function renderSaved() {
    const sec  = document.getElementById('savedSection');
    const list = document.getElementById('savedItemsList');
    if (!savedItems.length) { if (sec) sec.style.display = 'none'; return; }
    if (sec) sec.style.display = 'block';
    list.innerHTML = savedItems.map((item, i) =>
        '<div class="saved-item-card">' +
        '<img src="' + getImg(item.name) + '" alt="' + item.name + '">' +
        '<div class="saved-details"><h4>' + item.name + '</h4>' +
        '<span>&#8377;' + item.price.toLocaleString('en-IN') + '</span></div>' +
        '<button class="btn-move-cart" onclick="moveToCart(' + i + ')"><i class="fas fa-cart-plus"></i> Move to Cart</button>' +
        '</div>'
    ).join('');
}

function renderRecommendations() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartNames = cart.map(i => i.name);
    const recs = recommendations.filter(r => !cartNames.includes(r.name)).slice(0, 4);
    const grid = document.getElementById('recGrid');
    if (!grid) return;
    grid.innerHTML = recs.map(r =>
        '<div class="rec-card">' +
        '<img src="' + r.img + '" alt="' + r.name + '" onerror="this.src=\'https://via.placeholder.com/180x120\'">' +
        '<div class="rec-card-body"><h4>' + r.name + '</h4>' +
        '<div class="rec-price">&#8377;' + r.price.toLocaleString('en-IN') + '</div>' +
        '<button class="rec-add-btn" onclick="addToCart(\'' + r.name + '\',' + r.price + ')"><i class="fas fa-cart-plus"></i> Add to Cart</button>' +
        '</div></div>'
    ).join('');
}

function changeQty(index, delta) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart(); renderRecommendations();
}
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart(); renderRecommendations();
}
function saveForLater(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    savedItems.push(cart[index]); cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    renderCart(); renderSaved(); renderRecommendations();
}
function moveToCart(index) {
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

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push({ ...savedItems[index], quantity: 1 }); savedItems.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
    renderCart(); renderSaved(); renderRecommendations();
}

renderCart();
renderSaved();
renderRecommendations();

function onDistrictChange() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    updateSummary(subtotal);
}

// Real-time delivery field validation on blur
document.addEventListener('DOMContentLoaded', function () {

    const rules = {
        delName:     { test: v => v.length >= 3 && /^[a-zA-Z\s]+$/.test(v), err: 'Valid full name required (letters only, min 3 chars).' },
        delPhone:    { test: v => /^[6-9]\d{9}$/.test(v),                   err: 'Enter a valid 10-digit Indian mobile number.' },
        delAddress:  { test: v => v.length >= 5,                             err: 'Address must be at least 5 characters.' },
        delDistrict: { test: v => v !== '',                                  err: 'Please select your district.' },
        delPin:      { test: v => /^\d{6}$/.test(v),                        err: 'Enter a valid 6-digit pincode.' },
        delState:    { test: v => v !== '',                                  err: 'State is required.' },
    };

    Object.keys(rules).forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;

        function validate() {
            const v = el.value.trim();
            const ok = rules[id].test(v);
            el.style.border     = ok ? '2px solid #16a34a' : '2px solid #ef4444';
            el.style.background = ok ? '#f0fdf4'           : '#fff5f5';
            let msg = el.parentElement.querySelector('.del-err');
            if (!msg) {
                msg = document.createElement('span');
                msg.className = 'del-err';
                msg.style.cssText = 'font-size:0.72rem;color:#ef4444;margin-top:0.25rem;display:block;';
                el.parentElement.appendChild(msg);
            }
            msg.textContent = ok ? '' : rules[id].err;
        }

        el.addEventListener('blur',   validate);
        el.addEventListener('change', validate);
        el.addEventListener('input',  function () {
            if (el.style.borderColor === 'rgb(239, 68, 68)') validate();
        });
    });
});
