const API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '') ? 'http://localhost:3000' : '';

function updateDateTime() {
    const now = new Date();
    const dateEl = document.getElementById('heroDate');
    const timeEl = document.getElementById('heroTime');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}
updateDateTime();
setInterval(updateDateTime, 1000);

function openModal(id) { 
    const el = document.getElementById(id); 
    if (el) el.classList.add('active'); 
}
function closeModal(id) { 
    const el = document.getElementById(id); 
    if (el) el.classList.remove('active'); 
}
function switchModal(from, to) { 
    closeModal(from); 
    openModal(to); 
    
    // If we are on the standalone login.html, update the tab highlights
    const tab = document.querySelector(`.auth-tab[onclick*="${to}"]`);
    if (tab) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    }
}

document.addEventListener('click', function(e) {
    ['loginModal','registerModal'].forEach(function(id) {
        const m = document.getElementById(id);
        // Only close if it's an actual overlay modal, not a panel on the dedicated login page
        if (m && m.classList.contains('auth-overlay') && e.target === m) closeModal(id);
    });
});

function togglePass(id, icon) {
    const el = document.getElementById(id);
    if (el.type === 'password') { el.type = 'text'; icon.classList.replace('fa-eye','fa-eye-slash'); }
    else { el.type = 'password'; icon.classList.replace('fa-eye-slash','fa-eye'); }
}

function setErr(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

function setFieldState(inputId, ok) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.style.border     = ok ? '2px solid #16a34a' : '2px solid #ef4444';
    el.style.background = ok ? '#f0fdf4'           : '#fff5f5';
}

// ── Login Dropdown ──
function toggleLoginDropdown() {
    document.getElementById('loginDropMenu').classList.toggle('open');
}
function openLoginAs(role) {
    document.getElementById('loginDropMenu').classList.remove('open');
    openModal(role === 'admin' ? 'adminLoginModal' : 'loginModal');
}
document.addEventListener('click', function(e) {
    const dd = document.querySelector('.login-dropdown');
    if (dd && !dd.contains(e.target)) document.getElementById('loginDropMenu').classList.remove('open');
});

// ── Admin Login ──
async function handleAdminLogin() {
    const email = document.getElementById('adminEmail').value.trim();
    const pass  = document.getElementById('adminPass').value;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr('adminEmailErr', emailOk ? '' : 'Enter a valid email.');
    setFieldState('adminEmail', emailOk);
    const passOk = pass.length >= 6;
    setErr('adminPassErr', passOk ? '' : 'Password must be at least 6 characters.');
    setFieldState('adminPass', passOk);
    if (!emailOk || !passOk) return;

    const btn = document.querySelector('#adminLoginModal .auth-submit, #adminLoginModal .ecom-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
        const res = await fetch(API + '/api/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();
        
        if (data.success) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            closeModal('adminLoginModal');
            window.location.href = 'admin.html';
        } else {
            const err = document.getElementById('adminErr');
            err.style.display = 'block';
            err.textContent = data.error || 'Invalid admin credentials.';
        }
    } catch (e) {
        const err = document.getElementById('adminErr');
        err.style.display = 'block';
        err.textContent = 'Server error during admin login.';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ── Resend cooldown timer ──
let regResendTimer = null;
function startRegResendCooldown() {
    let secs = 30;
    const link = document.getElementById('regResendLink');
    if (!link) return;
    link.style.pointerEvents = 'none'; link.style.color = '#9ca3af';
    link.textContent = 'Resend OTP (' + secs + 's)';
    regResendTimer = setInterval(function() {
        secs--;
        if (secs <= 0) {
            clearInterval(regResendTimer);
            link.style.pointerEvents = ''; link.style.color = '#6d28d9';
            link.textContent = 'Resend OTP';
        } else {
            link.textContent = 'Resend OTP (' + secs + 's)';
        }
    }, 1000);
}

async function resendRegisterOTP() {
    const email = document.getElementById('regEmail').value.trim();
    if (!email) return;
    try {
        const res  = await fetch(API + '/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, purpose: 'register' }) });
        const data = await res.json();
        const alert = document.getElementById('regOtpAlert');
        alert.style.display = 'block';
        alert.style.color = data.success ? '#16a34a' : '#ef4444';
        alert.textContent = data.success ? 'OTP resent to ' + email : (data.error || 'Failed to resend.');
        if (data.success) startRegResendCooldown();
    } catch(e) {
        const alert = document.getElementById('regOtpAlert');
        alert.style.display = 'block'; alert.textContent = 'Server error.';
    }
}

// ── Register Step 1: validate form + send OTP ──
async function handleRegisterStep1() {
    const name    = document.getElementById('regName').value.trim();
    const email   = document.getElementById('regEmail').value.trim();
    const phone   = document.getElementById('regPhone').value.trim();
    const pass    = document.getElementById('regPass').value;
    const confirm = document.getElementById('regConfirm').value;
    let valid = true;
    const checks = [
        { ok: name.length >= 3 && /^[a-zA-Z\s]+$/.test(name), errId: 'regNameErr',    inId: 'regName',    msg: 'Enter a valid full name (letters only, min 3 chars).' },
        { ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),        errId: 'regEmailErr',   inId: 'regEmail',   msg: 'Enter a valid email address.' },
        { ok: /^[6-9]\d{9}$/.test(phone),                      errId: 'regPhoneErr',   inId: 'regPhone',   msg: 'Enter a valid 10-digit Indian mobile number.' },
        { ok: pass.length >= 6,                                 errId: 'regPassErr',    inId: 'regPass',    msg: 'Password must be at least 6 characters.' },
        { ok: confirm === pass && pass.length >= 6,             errId: 'regConfirmErr', inId: 'regConfirm', msg: 'Passwords do not match.' },
    ];
    checks.forEach(function(c) { setErr(c.errId, c.ok ? '' : c.msg); setFieldState(c.inId, c.ok); if (!c.ok) valid = false; });
    if (!valid) return;

    const btn = document.querySelector('#regStep1 .auth-submit, #regStep1 .ecom-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
    try {
        const res  = await fetch(API + '/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, purpose: 'register' }) });
        const data = await res.json();
        if (!data.success) {
            const errEl = document.getElementById('regErr');
            errEl.style.cssText = 'display:block;background:#fee2e2;border:1.5px solid #ef4444;color:#b91c1c;padding:0.7rem 1rem;border-radius:8px;font-size:0.85rem;font-weight:600;';
            errEl.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right:6px;"></i>' + data.error;
            setFieldState('regEmail', false);
        } else {
            document.getElementById('regErr').style.display = 'none';
            document.getElementById('regOtpEmail').textContent = email;
            document.getElementById('regStep1').style.display = 'none';
            document.getElementById('regStep2').style.display = 'block';
            document.getElementById('regOtp').value = '';
            document.getElementById('regOtpAlert').style.display = 'none';
            startRegResendCooldown();
        }
    } catch(e) {
        console.error("Register Error:", e);
        document.getElementById('regErr').style.display = 'block';
        document.getElementById('regErr').textContent = 'Server error. Please try again.';
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
}

// ── Register Step 2: verify OTP + create account ──
async function handleRegisterStep2() {
    const otp   = document.getElementById('regOtp').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    if (otp.length !== 6) { setErr('regOtpErr', 'Enter the 6-digit OTP.'); return; }
    setErr('regOtpErr', '');
    if (regResendTimer) clearInterval(regResendTimer);
    const btn = document.querySelector('#regStep2 .auth-submit, #regStep2 .ecom-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Verifying...';
    try {
        const vRes  = await fetch(API + '/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, purpose: 'register' }) });
        const vData = await vRes.json();
        if (!vData.success) {
            document.getElementById('regOtpAlert').style.display = 'block';
            document.getElementById('regOtpAlert').textContent = vData.error;
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }
        const name  = document.getElementById('regName').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const pass  = document.getElementById('regPass').value;
        const res   = await fetch(API + '/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, phone, password: pass }) });
        const data  = await res.json();
        if (!data.success) {
            document.getElementById('regOtpAlert').style.display = 'block';
            document.getElementById('regOtpAlert').textContent = data.error;
        } else {
            document.getElementById('regOtpAlert').style.display = 'none';
            const suc = document.getElementById('regSuccess');
            suc.style.display = 'block';
            suc.textContent = 'Account verified! Logging you in...';
            
            // Auto login after registration
            const loginRes = await fetch(API + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
            const loginData = await loginRes.json();
            
            if (loginData.success) {
                localStorage.setItem('cth_loggedIn', JSON.stringify({ id: loginData.user.id, name: loginData.user.name, email: loginData.user.email, phone: loginData.user.phone }));
                
                if (window.location.pathname.includes('login.html')) {
                    if (typeof updateLoginDashboard === 'function') updateLoginDashboard();
                    else window.location.href = 'index.html';
                } else {
                    window.location.reload();
                }
            } else {
                setTimeout(function() {
                    suc.style.display = 'none';
                    document.getElementById('regStep1').style.display = 'block';
                    document.getElementById('regStep2').style.display = 'none';
                    switchModal('registerModal', 'loginModal');
                }, 1800);
            }
        }
    } catch(e) {
        console.error("OTP Verification Error:", e);
        document.getElementById('regOtpAlert').style.display = 'block';
        document.getElementById('regOtpAlert').textContent = 'Server error. Please try again.';
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
}

// ── Auto-submit OTP when 6 digits entered ──
document.addEventListener('DOMContentLoaded', function() {
    const regOtpInput = document.getElementById('regOtp');
    if (regOtpInput) {
        regOtpInput.addEventListener('input', function() {
            if (this.value.replace(/\D/g,'').length === 6) {
                this.value = this.value.replace(/\D/g,'');
                handleRegisterStep2();
            }
        });
    }
    const regEmailInput = document.getElementById('regEmail');
    if (regEmailInput) {
        regEmailInput.addEventListener('input', function() {
            document.getElementById('regErr').style.display = 'none';
            setFieldState('regEmail', true);
        });
    }
});

// ── Login Step 1: verify credentials + send OTP ──
async function handleLoginStep1() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    let valid = true;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setErr('loginEmailErr', emailOk ? '' : 'Enter a valid email address.');
    setFieldState('loginEmail', emailOk);
    if (!emailOk) valid = false;
    const passOk = pass.length >= 6;
    setErr('loginPassErr', passOk ? '' : 'Password must be at least 6 characters.');
    setFieldState('loginPass', passOk);
    if (!passOk) valid = false;
    if (!valid) return;

    const btn = document.querySelector('#loginStep1 .auth-submit, #loginStep1 .ecom-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
    try {
        const res  = await fetch(API + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
        const data = await res.json();
        if (!data.success) {
            document.getElementById('loginErr').style.display = 'block';
            document.getElementById('loginErr').textContent = data.error;
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }
        const otpRes  = await fetch(API + '/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, purpose: 'login' }) });
        const otpData = await otpRes.json();
        if (!otpData.success) {
            document.getElementById('loginErr').style.display = 'block';
            document.getElementById('loginErr').textContent = otpData.error;
        } else {
            document.getElementById('loginErr').style.display = 'none';
            document.getElementById('loginOtpEmail').textContent = email;
            document.getElementById('loginStep1').style.display = 'none';
            document.getElementById('loginStep2').style.display = 'block';
        }
    } catch(e) {
        console.error("Login Error:", e);
        document.getElementById('loginErr').style.display = 'block';
        document.getElementById('loginErr').textContent = 'Server error. Please try again.';
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
}

// ── Login Step 2: verify OTP + complete login ──
async function handleLoginStep2() {
    const otp   = document.getElementById('loginOtp').value.trim();
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    if (otp.length !== 6) { setErr('loginOtpErr', 'Enter the 6-digit OTP.'); return; }
    setErr('loginOtpErr', '');
    const btn = document.querySelector('#loginStep2 .auth-submit, #loginStep2 .ecom-btn');
    const originalText = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Verifying...';
    try {
        const vRes  = await fetch(API + '/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, purpose: 'login' }) });
        const vData = await vRes.json();
        if (!vData.success) {
            document.getElementById('loginOtpAlert').style.display = 'block';
            document.getElementById('loginOtpAlert').textContent = vData.error;
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }
        const res  = await fetch(API + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pass }) });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('cth_loggedIn', JSON.stringify({ id: data.user.id, name: data.user.name, email: data.user.email, phone: data.user.phone }));
            document.getElementById('loginStep1').style.display = 'block';
            document.getElementById('loginStep2').style.display = 'none';
            
            if (window.location.pathname.includes('login.html')) {
                if (typeof updateLoginDashboard === 'function') {
                    updateLoginDashboard();
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                window.location.reload();
                closeModal('loginModal');
                updateAuthUI();
            }
        }
    } catch(e) {
        console.error("Login Verify Error:", e);
        document.getElementById('loginOtpAlert').style.display = 'block';
        document.getElementById('loginOtpAlert').textContent = 'Server error. Please try again.';
    }
    btn.disabled = false;
    btn.innerHTML = originalText;
}

// ── Logout ──
function logout() {
    localStorage.removeItem('cth_loggedIn');
    updateAuthUI();
}

// ── Update UI based on login state ──
function updateAuthUI() {
    const user      = JSON.parse(localStorage.getItem('cth_loggedIn') || 'null');
    const authBtns  = document.getElementById('authBtns');
    const userInfo  = document.getElementById('userInfo');
    const userGreet = document.getElementById('userGreet');
    if (user) {
        if (authBtns) authBtns.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        if (userGreet) userGreet.textContent  = 'Hi, ' + user.name.split(' ')[0] + '!';
        
        document.querySelectorAll('.mob-link').forEach(el => el.style.display = 'none');
    } else {
        if (authBtns) authBtns.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
        
        document.querySelectorAll('.mob-link').forEach(el => el.style.display = 'block');
    }
}

updateAuthUI();
