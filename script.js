// ================== STORAGE ==================
let shopkeepers = JSON.parse(localStorage.getItem('shopkeepers')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let products = JSON.parse(localStorage.getItem('products')) || ['Aata', 'Besan', 'Chawal ka Atta'];
let settings = JSON.parse(localStorage.getItem('settings')) || { bizName: 'Atta Chakki', mode: 'auto' };

function saveData() {
  localStorage.setItem('shopkeepers', JSON.stringify(shopkeepers));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('products', JSON.stringify(products));
  localStorage.setItem('settings', JSON.stringify(settings));
}

// ================== HELPERS ==================
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function formatDate(s) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateLong(s) {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ** MAUND + KG FORMAT **
// Ye function maund aur kg ko "2 maund 20 kg" format mein deta hai
function qtyText(maund, kg) {
  const m = parseInt(maund) || 0;
  const k = parseInt(kg) || 0;
  if (m === 0 && k === 0) return '0 kg';
  let parts = [];
  if (m > 0) parts.push(m + (m === 1 ? ' maund' : ' maund'));
  if (k > 0) parts.push(k + ' kg');
  return parts.join(' ');
}

// Total ko bhi "2 maund 20 kg" format mein dikhata hai
// Jaise 100 kg = "2 maund 20 kg"
function totalKgText(totalKg) {
  const total = parseInt(totalKg) || 0;
  const m = Math.floor(total / 40);
  const k = total % 40;
  return qtyText(m, k);
}

// Short version: "2m 20kg"
function qtyShort(maund, kg) {
  const m = parseInt(maund) || 0;
  const k = parseInt(kg) || 0;
  if (m === 0 && k === 0) return '0';
  let parts = [];
  if (m > 0) parts.push(m + 'm');
  if (k > 0) parts.push(k + 'kg');
  return parts.join(' ');
}

function totalKgShort(totalKg) {
  const total = parseInt(totalKg) || 0;
  const m = Math.floor(total / 40);
  const k = total % 40;
  return qtyShort(m, k);
}

// ================== NAVIGATION ==================
function showPage(pageId, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'shopkeepers') renderShopkeepers();
  if (pageId === 'neworder') prepareOrderForm();
  if (pageId === 'orders') {
    if (!document.getElementById('ordersDate').value) {
      document.getElementById('ordersDate').value = todayStr();
    }
    renderOrdersPage();
  }
  if (pageId === 'delivery') renderDelivery();
  if (pageId === 'history') renderHistory();
  if (pageId === 'settings') renderSettings();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================== SETTINGS / MODE ==================
function applySettings() {
  document.getElementById('topbarTitle').textContent = settings.bizName;
  document.getElementById('sidebarTitle').textContent = settings.bizName;
  document.title = settings.bizName + ' - Order Management';

  const body = document.body;
  body.classList.remove('mobile-mode', 'pc-mode');

  if (settings.mode === 'mobile') {
    body.classList.add('mobile-mode');
  } else if (settings.mode === 'pc') {
    body.classList.add('pc-mode');
  } else {
    // auto - based on screen width
    if (window.innerWidth < 768) body.classList.add('mobile-mode');
    else body.classList.add('pc-mode');
  }
}

function setMode(m) {
  settings.mode = m;
  saveData();
  applySettings();
  renderSettings();
  alert('Mode: ' + (m === 'mobile' ? 'Mobile' : 'PC'));
}

function toggleMode() {
  settings.mode = settings.mode === 'mobile' ? 'pc' : 'mobile';
  saveData();
  applySettings();
}

function saveBizName() {
  const name = document.getElementById('setBizName').value.trim();
  if (!name) { alert('Naam likhein'); return; }
  settings.bizName = name;
  saveData();
  applySettings();
  alert('Naam save ho gaya!');
}

function renderSettings() {
  document.getElementById('setBizName').value = settings.bizName;
  document.getElementById('modePC').classList.toggle('active', settings.mode === 'pc');
  document.getElementById('modeMobile').classList.toggle('active', settings.mode === 'mobile');
  renderProductsList();
}

function renderProductsList() {
  const list = document.getElementById('productsList');
  if (products.length === 0) {
    list.innerHTML = '<p class="hint">Koi product nahi.</p>';
    return;
  }
  list.innerHTML = products.map((p, i) => 
    '<div class="product-chip">' + p +
    '<button onclick="deleteProduct(' + i + ')">&times;</button></div>'
  ).join('');
}

function addProduct() {
  const name = document.getElementById('newProductName').value.trim();
  if (!name) { alert('Naam likhein'); return; }
  if (products.includes(name)) { alert('Already mojood hai'); return; }
  products.push(name);
  saveData();
  document.getElementById('newProductName').value = '';
  renderProductsList();
  prepareOrderForm();
}

function deleteProduct(i) {
  if (!confirm('Delete: ' + products[i] + '?')) return;
  products.splice(i, 1);
  saveData();
  renderProductsList();
  prepareOrderForm();
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
  const totalKg = todayPending.reduce((s, o) => s + (o.totalKg || 0), 0);
  
  // ** AAJ KA LOAD - "2 maund 20 kg" format **
  document.getElementById('todayLoadBadge').textContent = totalKgText(totalKg);

  const list = document.getElementById('todayLoadList');
  if (todayPending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Aaj koi pending order nahi.</div>';
    return;
  }

  // Group by product - show maund+kg format
  const byProduct = {};
  todayPending.forEach(o => {
    (o.items || []).forEach(it => {
      if (!byProduct[it.product]) byProduct[it.product] = { m: 0, kg: 0 };
      byProduct[it.product].m += it.maund;
      byProduct[it.product].kg += it.kg;
    });
  });

  // Normalize kg > 40
  Object.keys(byProduct).forEach(p => {
    while (byProduct[p].kg >= 40) {
      byProduct[p].m += 1;
      byProduct[p].kg -= 40;
    }
  });

  list.innerHTML = Object.keys(byProduct).map(p => 
    '<div class="shop-order-line">' +
      '<span class="product-name">📦 ' + p + '</span>' +
      '<span class="qty">' + qtyText(byProduct[p].m, byProduct[p].kg) + '</span>' +
    '</div>'
  ).join('');
}

// ================== SHOPKEEPERS ==================
function saveShopkeeper() {
  const id = document.getElementById('shopId').value;
  const name = document.getElementById('shopName').value.trim();
  const mobile = document.getElementById('shopMobile').value.trim();
  const address = document.getElementById('shopAddress').value.trim();

  if (!name || !mobile) { alert('Naam aur mobile zaroori!'); return; }

  if (id) {
    const s = shopkeepers.find(x => x.id == id);
    s.name = name; s.mobile = mobile; s.address = address;
  } else {
    shopkeepers.push({ id: Date.now(), name, mobile, address });
  }
  saveData(); resetShopForm(); renderShopkeepers(); renderDashboard();
  alert('Shopkeeper save!');
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
  document.getElementById('shopFormTitle').textContent = 'Edit Karein';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteShopkeeper(id) {
  if (!confirm('Pakka delete?')) return;
  shopkeepers = shopkeepers.filter(x => x.id != id);
  saveData(); renderShopkeepers(); renderDashboard();
}

function renderShopkeepers() {
  const list = document.getElementById('shopkeepersList');
  if (shopkeepers.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-users"></i>Koi shopkeeper nahi.</div>';
    return;
  }
  list.innerHTML = shopkeepers.map(s => {
    const total = orders.filter(o => o.shopId == s.id).length;
    const pending = orders.filter(o => o.shopId == s.id && o.status === 'Pending').length;
    return '<div class="item">' +
      '<div class="item-info">' +
        '<h4><i class="fa fa-store"></i> ' + s.name + '</h4>' +
        '<p><i class="fa fa-phone"></i> ' + s.mobile + '</p>' +
        (s.address ? '<p><i class="fa fa-map-marker-alt"></i> ' + s.address + '</p>' : '') +
        '<p><small>' + total + ' total • ' + pending + ' pending</small></p>' +
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
    select.innerHTML = '<option value="">-- Shopkeeper --</option>' +
      shopkeepers.map(s => '<option value="' + s.id + '">' + s.name + ' (' + s.mobile + ')</option>').join('');
  }
  document.getElementById('orderDate').value = todayStr();
  document.getElementById('productRows').innerHTML = '';
  addProductRow();
  updateSummary();
}

function addProductRow() {
  const container = document.getElementById('productRows');
  const idx = container.children.length;
  if (products.length === 0) { alert('Pehle Settings mein product add karein'); return; }

  const div = document.createElement('div');
  div.className = 'product-row';
  div.innerHTML = 
    '<div class="product-row-head">' +
      '<h4><i class="fa fa-box"></i> Product #' + (idx + 1) + '</h4>' +
      (idx > 0 ? '<button class="remove-btn" onclick="removeProductRow(this)"><i class="fa fa-trash"></i></button>' : '') +
    '</div>' +
    '<div class="form-group">' +
      '<label>Product</label>' +
      '<select class="prod-select" onchange="updateSummary()">' +
        products.map(p => '<option value="' + p + '">' + p + '</option>').join('') +
      '</select>' +
    '</div>' +
    '<div class="qty-row">' +
      '<div class="form-group">' +
        '<label>Maund</label>' +
        '<input type="number" class="maund-input" min="0" placeholder="0" oninput="updateSummary()" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Kg</label>' +
        '<input type="number" class="kg-input" min="0" max="39" placeholder="0" oninput="updateSummary()" />' +
      '</div>' +
      '<div class="form-group">' +
        '<label>Total</label>' +
        '<input type="text" class="total-input" readonly style="background:#f0fdf4; font-weight:700; color:#16a34a" />' +
      '</div>' +
    '</div>';
  container.appendChild(div);
  updateSummary();
}

function removeProductRow(btn) {
  btn.closest('.product-row').remove();
  document.querySelectorAll('.product-row').forEach((row, i) => {
    row.querySelector('h4').innerHTML = '<i class="fa fa-box"></i> Product #' + (i + 1);
  });
  updateSummary();
}

function updateSummary() {
  const rows = document.querySelectorAll('.product-row');
  let totalKg = 0;
  let lines = [];

  rows.forEach(row => {
    const prod = row.querySelector('.prod-select').value;
    const m = parseInt(row.querySelector('.maund-input').value) || 0;
    const k = parseInt(row.querySelector('.kg-input').value) || 0;
    const rowKg = m * 40 + k;
    row.querySelector('.total-input').value = qtyText(m, k);
    if (rowKg > 0) {
      totalKg += rowKg;
      lines.push({ product: prod, maund: m, kg: k, totalKg: rowKg });
    }
  });

  const summary = document.getElementById('orderSummary');
  if (lines.length === 0) {
    summary.innerHTML = '<h4><i class="fa fa-calculator"></i> Order Summary</h4><p style="color:#64748b; font-size:14px">Abhi koi quantity nahi daali</p>';
    return;
  }

  summary.innerHTML = 
    '<h4><i class="fa fa-calculator"></i> Order Summary</h4>' +
    lines.map(l => 
      '<div class="summary-line">' +
        '<span>' + l.product + '</span>' +
        '<span>' + qtyText(l.maund, l.kg) + '</span>' +
      '</div>'
    ).join('') +
    '<div class="summary-line">' +
      '<span>TOTAL</span>' +
      '<span>' + totalKgText(totalKg) + '</span>' +
    '</div>';
}

function saveMultiOrder() {
  const shopId = document.getElementById('orderShop').value;
  const date = document.getElementById('orderDate').value;
  const notes = document.getElementById('orderNotes').value.trim();

  if (!shopId) { alert('Shopkeeper chunein!'); return; }
  if (!date) { alert('Date chunein!'); return; }

  const rows = document.querySelectorAll('.product-row');
  const items = [];
  let totalKg = 0;

  rows.forEach(row => {
    const prod = row.querySelector('.prod-select').value;
    const m = parseInt(row.querySelector('.maund-input').value) || 0;
    const k = parseInt(row.querySelector('.kg-input').value) || 0;
    const rowKg = m * 40 + k;
    if (rowKg > 0) {
      items.push({ product: prod, maund: m, kg: k, totalKg: rowKg });
      totalKg += rowKg;
    }
  });

  if (items.length === 0) { alert('Kam az kam ek product ki quantity daalein!'); return; }

  orders.push({
    id: Date.now(),
    shopId: parseInt(shopId),
    items: items,
    totalKg: totalKg,
    date: date,
    notes: notes,
    status: 'Pending',
    createdAt: new Date().toISOString()
  });

  saveData();
  const shop = shopkeepers.find(s => s.id == shopId);
  alert('Order save!\n' + shop.name + '\n' + items.length + ' products • ' + totalKgText(totalKg));

  prepareOrderForm();
  document.getElementById('orderNotes').value = '';
}

// ================== ORDERS PAGE (Truck Loading) ==================
function renderOrdersPage() {
  const dateVal = document.getElementById('ordersDate').value || todayStr();
  const statusFilter = document.getElementById('ordersStatus').value;

  let filtered = orders.filter(o => o.date === dateVal);
  if (statusFilter === 'Pending') filtered = filtered.filter(o => o.status === 'Pending');
  if (statusFilter === 'Delivered') filtered = filtered.filter(o => o.status === 'Delivered');

  const list = document.getElementById('ordersList');
  const summary = document.getElementById('ordersSummary');

  if (filtered.length === 0) {
    summary.innerHTML = '<div><p>Is din ka load</p><div class="big-num">0 kg</div></div>';
    list.innerHTML = '<div class="empty"><i class="fa fa-truck"></i>Is din koi order nahi.</div>';
    return;
  }

  const totalKg = filtered.reduce((s, o) => s + (o.totalKg || 0), 0);
  const byProduct = {};
  filtered.forEach(o => {
    (o.items || []).forEach(it => {
      if (!byProduct[it.product]) byProduct[it.product] = { m: 0, kg: 0 };
      byProduct[it.product].m += it.maund;
      byProduct[it.product].kg += it.kg;
    });
  });
  Object.keys(byProduct).forEach(p => {
    while (byProduct[p].kg >= 40) { byProduct[p].m += 1; byProduct[p].kg -= 40; }
  });

  summary.innerHTML = 
    '<div>' +
      '<p>' + formatDate(dateVal) + ' ka total load</p>' +
      '<div class="big-num">' + totalKgText(totalKg) + '</div>' +
    '</div>' +
    '<div style="text-align:right;">' +
      Object.keys(byProduct).map(p => 
        '<p>📦 ' + p + ': <b>' + qtyText(byProduct[p].m, byProduct[p].kg) + '</b></p>'
      ).join('') +
    '</div>';

  const grouped = {};
  filtered.forEach(o => { if (!grouped[o.shopId]) grouped[o.shopId] = []; grouped[o.shopId].push(o); });

  list.innerHTML = Object.keys(grouped).map(shopId => {
    const shop = shopkeepers.find(s => s.id == shopId);
    const shopName = shop ? shop.name : 'Unknown';
    const sOrders = grouped[shopId];
    const shopKg = sOrders.reduce((sum, o) => sum + (o.totalKg || 0), 0);

    // Group products with maund+kg format
    const prodData = {};
    sOrders.forEach(o => {
      (o.items || []).forEach(it => {
        if (!prodData[it.product]) prodData[it.product] = { m: 0, kg: 0 };
        prodData[it.product].m += it.maund;
        prodData[it.product].kg += it.kg;
      });
    });
    Object.keys(prodData).forEach(p => {
      while (prodData[p].kg >= 40) { prodData[p].m += 1; prodData[p].kg -= 40; }
    });

    return '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div>' +
          '<h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          (shop ? '<p><i class="fa fa-map-marker-alt"></i> ' + (shop.address || '—') + ' • <i class="fa fa-phone"></i> ' + shop.mobile + '</p>' : '') +
        '</div>' +
        '<span class="shop-group-total">' + totalKgText(shopKg) + '</span>' +
      '</div>' +
      Object.keys(prodData).map(p => 
        '<div class="shop-order-line">' +
          '<span class="product-name">📦 ' + p + '</span>' +
          '<span class="qty">' + qtyText(prodData[p].m, prodData[p].kg) + '</span>' +
        '</div>'
      ).join('') +
    '</div>';
  }).join('');
}

// ================== DELIVERY ==================
function renderDelivery() {
  const pending = orders.filter(o => o.status === 'Pending');
  const list = document.getElementById('deliveryList');
  if (pending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Koi pending order nahi!</div>';
    return;
  }
  const grouped = {};
  pending.forEach(o => { if (!grouped[o.shopId]) grouped[o.shopId] = []; grouped[o.shopId].push(o); });

  list.innerHTML = Object.keys(grouped).map(shopId => {
    const shop = shopkeepers.find(s => s.id == shopId);
    const shopName = shop ? shop.name : 'Unknown';
    const sOrders = grouped[shopId];
    const totalKg = sOrders.reduce((sum, o) => sum + (o.totalKg || 0), 0);

    return '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div>' +
          '<h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          (shop ? '<p><i class="fa fa-phone"></i> ' + shop.mobile + '</p>' : '') +
        '</div>' +
        '<span class="shop-group-total">' + totalKgText(totalKg) + '</span>' +
      '</div>' +
      sOrders.map(o => 
        '<div class="shop-order-line">' +
          '<div style="flex:1">' +
            (o.items || []).map(i => 
              '<div><span class="product-name">' + i.product + '</span> — <span class="qty">' + qtyText(i.maund, i.kg) + '</span></div>'
            ).join('') +
            '<small>' + formatDate(o.date) + (o.notes ? ' • ' + o.notes : '') + '</small>' +
          '</div>' +
          '<button class="btn small success" onclick="markDelivered(' + o.id + ')"><i class="fa fa-check"></i> Delivered</button>' +
        '</div>'
      ).join('') +
    '</div>';
  }).join('');
}

function markDelivered(id) {
  const o = orders.find(x => x.id == id);
  if (o) o.status = 'Delivered';
  saveData();
  renderDelivery(); renderDashboard(); renderHistory(); renderOrdersPage();
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
    list.innerHTML = '<div class="empty"><i class="fa fa-clock"></i>Koi history nahi.</div>';
    return;
  }

  list.innerHTML = filtered.map(o => {
    const shop = shopkeepers.find(s => s.id == o.shopId);
    return '<div class="item delivered-item">' +
      '<div class="item-info">' +
        '<h4>' + (shop ? shop.name : 'Unknown') + '</h4>' +
        (o.items || []).map(i => 
          '<p>• ' + i.product + ' — <b>' + qtyText(i.maund, i.kg) + '</b></p>'
        ).join('') +
        '<p class="date-line"><i class="fa fa-calendar"></i> ' + formatDate(o.date) + '</p>' +
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
  const sOrders = orders.filter(o => o.shopId == shopId).reverse();
  document.getElementById('modalTitle').textContent = shop.name + ' - Orders';
  const body = document.getElementById('modalBody');

  if (sOrders.length === 0) {
    body.innerHTML = '<div class="empty">Abhi koi order nahi.</div>';
  } else {
    body.innerHTML = sOrders.map(o => 
      '<div class="item ' + (o.status === 'Pending' ? 'pending-item' : 'delivered-item') + '" style="margin-bottom:10px;">' +
        '<div class="item-info">' +
          (o.items || []).map(i => 
            '<p><b>' + i.product + '</b> — ' + qtyText(i.maund, i.kg) + '</p>'
          ).join('') +
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
  applySettings();
  renderDashboard();
  renderShopkeepers();
  prepareOrderForm();
  renderHistory();
  renderSettings();

  // Auto re-apply mode on resize
  window.addEventListener('resize', () => {
    if (settings.mode === 'auto') applySettings();
  });
};
