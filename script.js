// ================== DATA STORAGE ==================
let shopkeepers = JSON.parse(localStorage.getItem('shopkeepers')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

function saveData() {
  localStorage.setItem('shopkeepers', JSON.stringify(shopkeepers));
  localStorage.setItem('orders', JSON.stringify(orders));
}

// ================== HELPERS ==================
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateLong(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ================== NAVIGATION ==================
function showPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.nav-btn').forEach(b => {
      if (b.getAttribute('onclick')?.includes(pageId)) b.classList.add('active');
    });
  }

  // Mobile: close sidebar
  document.getElementById('sidebar').classList.remove('open');

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'shopkeepers') renderShopkeepers();
  if (pageId === 'neworder') prepareOrderForm();
  if (pageId === 'orders') renderOrders();
  if (pageId === 'delivery') renderDelivery();
  if (pageId === 'history') renderHistory();
  if (pageId === 'loading') {
    if (!document.getElementById('loadingDate').value) {
      document.getElementById('loadingDate').value = todayStr();
    }
    renderLoading();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================== DASHBOARD ==================
function renderDashboard() {
  const today = todayStr();
  document.getElementById('todayDateLabel').textContent = formatDateLong(today);

  document.getElementById('totalShopkeepers').textContent = shopkeepers.length;
  document.getElementById('todayOrders').textContent = orders.filter(o => o.date === today).length;
  document.getElementById('pendingOrders').textContent = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('deliveredOrders').textContent = orders.filter(o => o.status === 'Delivered').length;

  // Aaj ka load
  const todayPending = orders.filter(o => o.date === today && o.status === 'Pending');
  const totalBags = todayPending.reduce((sum, o) => sum + o.qty, 0);
  document.getElementById('todayLoadBadge').textContent = totalBags + ' bags';

  const list = document.getElementById('todayLoadList');
  if (todayPending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Aaj ke liye koi pending order nahi.</div>';
    return;
  }

  // Group by product
  const byProduct = {};
  todayPending.forEach(o => {
    byProduct[o.product] = (byProduct[o.product] || 0) + o.qty;
  });

  list.innerHTML = Object.keys(byProduct).map(p => `
    <div class="shop-order-line">
      <span class="product-name">📦 ${p}</span>
      <span class="qty">${byProduct[p]} bags</span>
    </div>
  `).join('');
}

// ================== SHOPKEEPERS ==================
function saveShopkeeper() {
  const id = document.getElementById('shopId').value;
  const name = document.getElementById('shopName').value.trim();
  const mobile = document.getElementById('shopMobile').value.trim();
  const address = document.getElementById('shopAddress').value.trim();

  if (!name || !mobile) { alert('Naam aur mobile number zaroori hai!'); return; }

  if (id) {
    const s = shopkeepers.find(x => x.id == id);
    s.name = name; s.mobile = mobile; s.address = address;
  } else {
    shopkeepers.push({ id: Date.now(), name, mobile, address });
  }

  saveData();
  resetShopForm();
  renderShopkeepers();
  renderDashboard();
  alert('Shopkeeper save ho gaya! ✅');
}

function resetShopForm() {
  document.getElementById('shopId').value = '';
  document.getElementById('shopName').value = '';
  document.getElementById('shopMobile').value = '';
  document.getElementById('shopAddress').value = '';
  document.getElementById('shopFormTitle').textContent = 'Naya Shopkeeper Add Karein';
}

function editShopkeeper(id) {
  const s = shopkeepers.find(x => x.id == id);
  document.getElementById('shopId').value = s.id;
  document.getElementById('shopName').value = s.name;
  document.getElementById('shopMobile').value = s.mobile;
  document.getElementById('shopAddress').value = s.address || '';
  document.getElementById('shopFormTitle').textContent = 'Shopkeeper Edit Karein';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteShopkeeper(id) {
  if (!confirm('Pakka delete karna hai?')) return;
  shopkeepers = shopkeepers.filter(x => x.id != id);
  saveData();
  renderShopkeepers();
  renderDashboard();
}

function renderShopkeepers() {
  const list = document.getElementById('shopkeepersList');
  if (shopkeepers.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-users"></i>Koi shopkeeper nahi. Upar form se add karein.</div>';
    return;
  }

  list.innerHTML = shopkeepers.map(s => {
    const orderCount = orders.filter(o => o.shopId == s.id).length;
    const pendingCount = orders.filter(o => o.shopId == s.id && o.status === 'Pending').length;
    return `
      <div class="item">
        <div class="item-info">
          <h4><i class="fa fa-store"></i> ${s.name}</h4>
          <p><i class="fa fa-phone"></i> ${s.mobile}</p>
          ${s.address ? `<p><i class="fa fa-map-marker-alt"></i> ${s.address}</p>` : ''}
          <p><small>${orderCount} total orders • ${pendingCount} pending</small></p>
        </div>
        <div class="item-actions">
          <button class="btn small" onclick="viewShopHistory(${s.id})"><i class="fa fa-history"></i> History</button>
          <button class="btn small" onclick="editShopkeeper(${s.id})"><i class="fa fa-edit"></i> Edit</button>
          <button class="btn small danger" onclick="deleteShopkeeper(${s.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

// ================== NEW ORDER ==================
function prepareOrderForm() {
  const select = document.getElementById('orderShop');
  if (shopkeepers.length === 0) {
    select.innerHTML = '<option value="">Pehle shopkeeper add karein</option>';
  } else {
    select.innerHTML = '<option value="">-- Select Shopkeeper --</option>' +
      shopkeepers.map(s => `<option value="${s.id}">${s.name} (${s.mobile})</option>`).join('');
  }
  document.getElementById('orderDate').value = todayStr();
}

function saveOrder() {
  const shopId = document.getElementById('orderShop').value;
  const product = document.getElementById('orderProduct').value;
  const qty = document.getElementById('orderQty').value;
  const date = document.getElementById('orderDate').value;
  const notes = document.getElementById('orderNotes').value.trim();

  if (!shopId) { alert('Shopkeeper chunein!'); return; }
  if (!qty || qty <= 0) { alert('Sahi quantity daalein!'); return; }
  if (!date) { alert('Date chunein!'); return; }

  orders.push({
    id: Date.now(),
    shopId: parseInt(shopId),
    product, qty: parseInt(qty), date, notes,
    status: 'Pending',
    createdAt: new Date().toISOString()
  });

  saveData();
  alert('Order save ho gaya! ✅');
  document.getElementById('orderQty').value = '';
  document.getElementById('orderNotes').value = '';

  const shop = shopkeepers.find(s => s.id == shopId);
  if (shop) alert(`${shop.name} ka ${product} ${qty} bags save ho gaya.`);
}

// ================== LOADING (Truck View) ==================
function renderLoading() {
  const dateVal = document.getElementById('loadingDate').value || todayStr();
  const statusFilter =
