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
  return y + '-' + m + '-' + day;
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
      if (b.getAttribute('onclick') && b.getAttribute('onclick').includes(pageId)) b.classList.add('active');
    });
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');

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

  const todayPending = orders.filter(o => o.date === today && o.status === 'Pending');
  const totalBags = todayPending.reduce((sum, o) => sum + o.qty, 0);
  document.getElementById('todayLoadBadge').textContent = totalBags + ' bags';

  const list = document.getElementById('todayLoadList');
  if (todayPending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Aaj ke liye koi pending order nahi.</div>';
    return;
  }

  const byProduct = {};
  todayPending.forEach(o => {
    byProduct[o.product] = (byProduct[o.product] || 0) + o.qty;
  });

  list.innerHTML = Object.keys(byProduct).map(p => 
    '<div class="shop-order-line">' +
      '<span class="product-name">📦 ' + p + '</span>' +
      '<span class="qty">' + byProduct[p] + ' bags</span>' +
    '</div>'
  ).join('');
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
    shopkeepers.push({ id: Date.now(), name: name, mobile: mobile, address: address });
  }

  saveData();
  resetShopForm();
  renderShopkeepers();
  renderDashboard();
  alert('Shopkeeper save ho gaya!');
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
    return '<div class="item">' +
      '<div class="item-info">' +
        '<h4><i class="fa fa-store"></i> ' + s.name + '</h4>' +
        '<p><i class="fa fa-phone"></i> ' + s.mobile + '</p>' +
        (s.address ? '<p><i class="fa fa-map-marker-alt"></i> ' + s.address + '</p>' : '') +
        '<p><small>' + orderCount + ' total orders • ' + pendingCount + ' pending</small></p>' +
      '</div>' +
      '<div class="item-actions">' +
        '<button class="btn small" onclick="viewShopHistory(' + s.id + ')"><i class="fa fa-history"></i> History</button>' +
        '<button class="btn small" onclick="editShopkeeper(' + s.id + ')"><i class="fa fa-edit"></i> Edit</button>' +
        '<button class="btn small danger" onclick="deleteShopkeeper(' + s.id + ')"><i class="fa fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ================== NEW ORDER ==================
function prepareOrderForm() {
  const select = document.getElementById('orderShop');
  if (shopkeepers.length === 0) {
    select.innerHTML = '<option value="">Pehle shopkeeper add karein</option>';
  } else {
    select.innerHTML = '<option value="">-- Select Shopkeeper --</option>' +
      shopkeepers.map(s => '<option value="' + s.id + '">' + s.name + ' (' + s.mobile + ')</option>').join('');
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
    product: product,
    qty: parseInt(qty),
    date: date,
    notes: notes,
    status: 'Pending',
    createdAt: new Date().toISOString()
  });

  saveData();
  const shop = shopkeepers.find(s => s.id == shopId);
  alert('Order save ho gaya!\n' + shop.name + ' - ' + product + ' ' + qty + ' bags');
  document.getElementById('orderQty').value = '';
  document.getElementById('orderNotes').value = '';
}

// ================== ORDERS ==================
function renderOrders() {
  const search = document.getElementById('searchOrders').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;

  let filtered = orders.slice().reverse();

  if (search) {
    filtered = filtered.filter(o => {
      const shop = shopkeepers.find(s => s.id == o.shopId);
      const shopName = shop ? shop.name.toLowerCase() : '';
      return shopName.includes(search) || o.product.toLowerCase().includes(search);
    });
  }

  if (status) filtered = filtered.filter(o => o.status === status);

  const list = document.getElementById('ordersList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-box-open"></i>Koi order nahi mila.</div>';
    return;
  }

  list.innerHTML = filtered.map(o => {
    const shop = shopkeepers.find(s => s.id == o.shopId);
    const shopName = shop ? shop.name : 'Unknown';
    return '<div class="item ' + (o.status === 'Pending' ? 'pending-item' : 'delivered-item') + '">' +
      '<div class="item-info">' +
        '<h4>' + shopName + '</h4>' +
        '<p><i class="fa fa-box"></i> ' + o.product + ' — <b>' + o.qty + ' bags</b></p>' +
        '<p class="date-line"><i class="fa fa-calendar"></i> ' + formatDate(o.date) + '</p>' +
        (o.notes ? '<p class="notes"><i class="fa fa-sticky-note"></i> ' + o.notes + '</p>' : '') +
        '<span class="badge ' + o.status.toLowerCase() + '">' + o.status + '</span>' +
      '</div>' +
      '<div class="item-actions">' +
        (o.status === 'Pending' ? '<button class="btn small success" onclick="markDelivered(' + o.id + ')"><i class="fa fa-check"></i> Delivered</button>' : '') +
        '<button class="btn small danger" onclick="deleteOrder(' + o.id + ')"><i class="fa fa-trash"></i></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function markDelivered(id) {
  const o = orders.find(x => x.id == id);
  if (o) o.status = 'Delivered';
  saveData();
  renderOrders();
  renderDelivery();
  renderDashboard();
  renderHistory();
  renderLoading();
}

function deleteOrder(id) {
  if (!confirm('Order delete karein?')) return;
  orders = orders.filter(x => x.id != id);
  saveData();
  renderOrders();
  renderDelivery();
  renderDashboard();
  renderHistory();
  renderLoading();
}

// ================== DELIVERY ==================
function renderDelivery() {
  const pending = orders.filter(o => o.status === 'Pending');
  const list = document.getElementById('deliveryList');

  if (pending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Koi pending order nahi. Sab deliver ho gaya!</div>';
    return;
  }

  const grouped = {};
  pending.forEach(o => {
    if (!grouped[o.shopId]) grouped[o.shopId] = [];
    grouped[o.shopId].push(o);
  });

  list.innerHTML = Object.keys(grouped).map(shopId => {
    const shop = shopkeepers.find(s => s.id == shopId);
    const shopName = shop ? shop.name : 'Unknown';
    const shopOrders = grouped[shopId];
    const totalBags = shopOrders.reduce((sum, o) => sum + o.qty, 0);

    return '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div>' +
          '<h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          (shop ? '<p><i class="fa fa-phone"></i> ' + shop.mobile + '</p>' : '') +
        '</div>' +
        '<span class="shop-group-total">' + totalBags + ' bags</span>' +
      '</div>' +
      shopOrders.map(o => 
        '<div class="shop-order-line">' +
          '<div>' +
            '<span class="product-name">' + o.product + '</span> — ' +
            '<span class="qty">' + o.qty + ' bags</span>' +
            '<br><small>' + formatDate(o.date) + (o.notes ? ' • ' + o.notes : '') + '</small>' +
          '</div>' +
          '<button class="btn small success" onclick="markDelivered(' + o.id + ')"><i class="fa fa-check"></i> Delivered</button>' +
        '</div>'
      ).join('') +
    '</div>';
  }).join('');
}

// ================== LOADING (Truck View) ==================
function renderLoading() {
  const dateVal = document.getElementById('loadingDate').value || todayStr();
  const statusFilter = document.getElementById('loadingStatus').value;

  let filtered = orders.filter(o => o.date === dateVal);
  if (statusFilter === 'Pending') filtered = filtered.filter(o => o.status === 'Pending');

  const list = document.getElementById('loadingList');
  const summary = document.getElementById('loadSummary');

  if (filtered.length === 0) {
    summary.innerHTML = '<div><p>Aaj ka load</p><div class="big-num">0 bags</div></div>';
    list.innerHTML = '<div class="empty"><i class="fa fa-truck"></i>Is din koi order nahi.</div>';
    return;
  }

  const totalBags = filtered.reduce((sum, o) => sum + o.qty, 0);
  const byProduct = {};
  filtered.forEach(o => {
    byProduct[o.product] = (byProduct[o.product] || 0) + o.qty;
  });

  summary.innerHTML = 
    '<div>' +
      '<p>' + formatDate(dateVal) + ' ka total load</p>' +
      '<div class="big-num">' + totalBags + ' bags</div>' +
    '</div>' +
    '<div style="text-align:right;">' +
      Object.keys(byProduct).map(p => '<p>📦 ' + p + ': <b>' + byProduct[p] + ' bags</b></p>').join('') +
    '</div>';

  const grouped = {};
  filtered.forEach(o => {
    if (!grouped[o.shopId]) grouped[o.shopId] = [];
    grouped[o.shopId].push(o);
  });

  list.innerHTML = Object.keys(grouped).map(shopId => {
    const shop = shopkeepers.find(s => s.id == shopId);
    const shopName = shop ? shop.name : 'Unknown';
    const shopOrders = grouped[shopId];
    const shopTotal = shopOrders.reduce((sum, o) => sum + o.qty, 0);

    return '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div>' +
          '<h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          (shop ? '<p><i class="fa fa-map-marker-alt"></i> ' + (shop.address || 'Address nahi') + ' • <i class="fa fa-phone"></i> ' + shop.mobile + '</p>' : '') +
        '</div>' +
        '<span class="shop-group-total">' + shopTotal + ' bags</span>' +
      '</div>' +
      shopOrders.map(o => 
        '<div class="shop-order-line">' +
          '<div>' +
            '<span class="product-name">' + o.product + '</span> — ' +
            '<span class="qty">' + o.qty + ' bags</span>' +
            (o.notes ? '<br><small>' + o.notes + '</small>' : '') +
          '</div>' +
          '<span class="badge ' + o.status.toLowerCase() + '">' + o.status + '</span>' +
        '</div>'
      ).join('') +
    '</div>';
  }).join('');
}

// ================== HISTORY ==================
function renderHistory() {
  const search = document.getElementById('historySearch').value.toLowerCase();
  const dateFilter = document.getElementById('historyDate').value;

  let filtered = orders.filter(o => o.status === 'Delivered');

  if (search) {
    filtered = filtered.filter(o => {
      const shop = shopkeepers.find(s => s.id == o.shopId);
      return shop && shop.name.toLowerCase().includes(search);
    });
  }

  if (dateFilter) filtered = filtered.filter(o => o.date === dateFilter);
  filtered.reverse();

  const list = document.getElementById('historyList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-clock"></i>Koi delivered order nahi mila.</div>';
    return;
  }

  list.innerHTML = filtered.map(o => {
    const shop = shopkeepers.find(s => s.id == o.shopId);
    return '<div class="item delivered-item">' +
      '<div class="item-info">' +
        '<h4>' + (shop ? shop.name : 'Unknown') + '</h4>' +
        '<p><i class="fa fa-box"></i> ' + o.product + ' — ' + o.qty + ' bags</p>' +
        '<p class="date-line"><i class="fa fa-calendar"></i> ' + formatDate(o.date) + '</p>' +
        (o.notes ? '<p class="notes">' + o.notes + '</p>' : '') +
        '<span class="badge delivered">Delivered</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function clearHistoryFilter() {
  document.getElementById('historySearch').value = '';
  document.getElementById('historyDate').value = '';
  renderHistory();
}

// ================== MODAL ==================
function viewShopHistory(shopId) {
  const shop = shopkeepers.find(s => s.id == shopId);
  const shopOrders = orders.filter(o => o.shopId == shopId).reverse();

  document.getElementById('modalTitle').textContent = shop.name + ' - Orders';
  const body = document.getElementById('modalBody');

  if (shopOrders.length === 0) {
    body.innerHTML = '<div class="empty">Abhi koi order nahi.</div>';
  } else {
    body.innerHTML = shopOrders.map(o => 
      '<div class="item ' + (o.status === 'Pending' ? 'pending-item' : 'delivered-item') + '" style="margin-bottom:8px;">' +
        '<div class="item-info">' +
          '<p><b>' + o.product + '</b> — ' + o.qty + ' bags</p>' +
          '<p><small>' + formatDate(o.date) + '</small></p>' +
          '<span class="badge ' + o.status.toLowerCase() + '">' + o.status + '</span>' +
        '</div>' +
      '</div>'
    ).join('');
  }

  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// ================== INIT ==================
window.onload = function() {
  renderDashboard();
  renderShopkeepers();
  prepareOrderForm();
  renderOrders();
  renderDelivery();
  renderHistory();
};
