// Data Storage
var shopkeepers = JSON.parse(localStorage.getItem('shopkeepers')) || [];
var orders = JSON.parse(localStorage.getItem('orders')) || [];
var products = JSON.parse(localStorage.getItem('products')) || ['Aata', 'Besan', 'Chawal ka Atta'];
var settings = JSON.parse(localStorage.getItem('settings')) || { bizName: 'Atta Chakki', mode: 'auto' };

// Deliver modal state
var currentDeliverOrderId = null;
var currentDeliverProduct = null;

function saveData() {
  localStorage.setItem('shopkeepers', JSON.stringify(shopkeepers));
  localStorage.setItem('orders', JSON.stringify(orders));
  localStorage.setItem('products', JSON.stringify(products));
  localStorage.setItem('settings', JSON.stringify(settings));
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatDate(s) {
  if (!s) return '';
  var d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateLong(s) {
  var d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}

function qtyText(maund, kg) {
  var m = parseInt(maund) || 0;
  var k = parseInt(kg) || 0;
  if (m === 0 && k === 0) return '0 kg';
  var parts = [];
  if (m > 0) parts.push(m + ' maund');
  if (k > 0) parts.push(k + ' kg');
  return parts.join(' ');
}

function totalKgText(totalKg) {
  var total = parseInt(totalKg) || 0;
  var m = Math.floor(total / 40);
  var k = total % 40;
  return qtyText(m, k);
}

// Product summary: maund jama, kg alag
function productQtySummary(items) {
  var totalMaund = 0;
  var kgList = [];
  for (var i = 0; i < items.length; i++) {
    var m = parseInt(items[i].maund) || 0;
    var k = parseInt(items[i].kg) || 0;
    totalMaund += m;
    if (k > 0) kgList.push(k);
  }
  var parts = [];
  if (totalMaund > 0) parts.push(totalMaund + ' maund');
  for (var i = 0; i < kgList.length; i++) parts.push(kgList[i] + ' kg');
  if (parts.length === 0) return '0 kg';
  return parts.join(' ');
}

// Get pending items of a product from order
function getPendingItemsForProduct(order, product) {
  var pending = [];
  for (var i = 0; i < order.items.length; i++) {
    var it = order.items[i];
    if (it.product !== product) continue;
    var m = parseInt(it.maund) || 0;
    var k = parseInt(it.kg) || 0;
    var dm = parseInt(it.deliveredMaund) || 0;
    var dk = parseInt(it.deliveredKg) || 0;
    var remM = m - dm;
    var remK = k - dk;
    if (remM > 0 || remK > 0) {
      pending.push({ item: it, index: i, maund: remM, kg: remK });
    }
  }
  return pending;
}

// Check if order fully delivered
function checkOrderDelivered(order) {
  for (var i = 0; i < order.items.length; i++) {
    var it = order.items[i];
    var m = parseInt(it.maund) || 0;
    var k = parseInt(it.kg) || 0;
    var dm = parseInt(it.deliveredMaund) || 0;
    var dk = parseInt(it.deliveredKg) || 0;
    if (dm < m || dk < k) return false;
  }
  return true;
}

function showPage(pageId, btn) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  var target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  var navBtns = document.querySelectorAll('.nav-btn');
  for (var j = 0; j < navBtns.length; j++) navBtns[j].classList.remove('active');
  if (btn) btn.classList.add('active');

  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.remove('open');

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'shopkeepers') renderShopkeepers();
  if (pageId === 'neworder') prepareOrderForm();
  if (pageId === 'orders') {
    var dEl = document.getElementById('ordersDate');
    if (dEl && !dEl.value) dEl.value = todayStr();
    renderOrdersPage();
  }
  if (pageId === 'delivery') renderDelivery();
  if (pageId === 'history') renderHistory();
  if (pageId === 'settings') renderSettings();

  window.scrollTo(0, 0);
}

function applySettings() {
  var t1 = document.getElementById('topbarTitle');
  var t2 = document.getElementById('sidebarTitle');
  if (t1) t1.textContent = settings.bizName;
  if (t2) t2.textContent = settings.bizName;
  document.title = settings.bizName;

  var body = document.body;
  body.classList.remove('mobile-mode', 'pc-mode');
  if (settings.mode === 'mobile') body.classList.add('mobile-mode');
  else if (settings.mode === 'pc') body.classList.add('pc-mode');
  else {
    if (window.innerWidth < 768) body.classList.add('mobile-mode');
    else body.classList.add('pc-mode');
  }
}

function setMode(m) {
  settings.mode = m;
  saveData(); applySettings(); renderSettings();
  alert('Mode: ' + (m === 'mobile' ? 'Mobile' : 'PC'));
}

function toggleMode() {
  settings.mode = settings.mode === 'mobile' ? 'pc' : 'mobile';
  saveData(); applySettings();
}

function saveBizName() {
  var el = document.getElementById('setBizName');
  var name = el.value.trim();
  if (!name) { alert('Naam likhein'); return; }
  settings.bizName = name;
  saveData(); applySettings();
  alert('Naam save ho gaya!');
}

function renderSettings() {
  var nameEl = document.getElementById('setBizName');
  if (nameEl) nameEl.value = settings.bizName;
  var pcBtn = document.getElementById('modePC');
  var mobBtn = document.getElementById('modeMobile');
  if (pcBtn) pcBtn.classList.toggle('active', settings.mode === 'pc');
  if (mobBtn) mobBtn.classList.toggle('active', settings.mode === 'mobile');
  renderProductsList();
}

function renderProductsList() {
  var list = document.getElementById('productsList');
  if (!list) return;
  if (products.length === 0) {
    list.innerHTML = '<p class="hint">Koi product nahi.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < products.length; i++) {
    html += '<div class="product-chip">' + products[i] +
      '<button onclick="deleteProduct(' + i + ')">&times;</button></div>';
  }
  list.innerHTML = html;
}

function addProduct() {
  var input = document.getElementById('newProductName');
  var name = input.value.trim();
  if (!name) { alert('Naam likhein'); return; }
  if (products.indexOf(name) !== -1) { alert('Already mojood hai'); return; }
  products.push(name);
  saveData();
  input.value = '';
  renderProductsList();
  prepareOrderForm();
}

function deleteProduct(i) {
  if (!confirm('Delete: ' + products[i] + '?')) return;
  products.splice(i, 1);
  saveData(); renderProductsList(); prepareOrderForm();
}

// DASHBOARD
function renderDashboard() {
  var today = todayStr();
  var dateLabel = document.getElementById('todayDateLabel');
  if (dateLabel) dateLabel.textContent = formatDateLong(today);

  document.getElementById('totalShopkeepers').textContent = shopkeepers.length;
  document.getElementById('todayOrders').textContent = orders.filter(function(o) { return o.date === today; }).length;
  document.getElementById('pendingOrders').textContent = orders.filter(function(o) { return o.status === 'Pending' || o.status === 'Partial'; }).length;
  document.getElementById('deliveredOrders').textContent = orders.filter(function(o) { return o.status === 'Delivered'; }).length;

  var todayPending = orders.filter(function(o) { return o.date === today && (o.status === 'Pending' || o.status === 'Partial'); });
  var totalKg = 0;
  for (var i = 0; i < todayPending.length; i++) {
    var o = todayPending[i];
    for (var j = 0; j < o.items.length; j++) {
      var it = o.items[j];
      var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
      var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
      totalKg += (remM * 40) + remK;
    }
  }

  document.getElementById('todayLoadBadge').textContent = totalKgText(totalKg);

  var list = document.getElementById('todayLoadList');
  if (todayPending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Aaj koi pending order nahi.</div>';
    return;
  }

  var byProduct = {};
  for (var i = 0; i < todayPending.length; i++) {
    var o = todayPending[i];
    for (var j = 0; j < o.items.length; j++) {
      var it = o.items[j];
      var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
      var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
      if (remM <= 0 && remK <= 0) continue;
      var p = it.product;
      if (!byProduct[p]) byProduct[p] = [];
      byProduct[p].push({ maund: remM, kg: remK });
    }
  }

  var rows = '';
  var keys = Object.keys(byProduct);
  for (var k = 0; k < keys.length; k++) {
    rows += '<div class="shop-order-line">' +
      '<span class="product-name">📦 ' + keys[k] + '</span>' +
      '<span class="qty">' + productQtySummary(byProduct[keys[k]]) + '</span>' +
    '</div>';
  }
  list.innerHTML = rows || '<div class="empty">Sab deliver ho gaya!</div>';
}

function saveShopkeeper() {
  var id = document.getElementById('shopId').value;
  var name = document.getElementById('shopName').value.trim();
  var mobile = document.getElementById('shopMobile').value.trim();
  var address = document.getElementById('shopAddress').value.trim();

  if (!name || !mobile) { alert('Naam aur mobile zaroori!'); return; }

  if (id) {
    for (var i = 0; i < shopkeepers.length; i++) {
      if (shopkeepers[i].id == id) {
        shopkeepers[i].name = name;
        shopkeepers[i].mobile = mobile;
        shopkeepers[i].address = address;
      }
    }
  } else {
    shopkeepers.push({ id: Date.now(), name: name, mobile: mobile, address: address });
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
  for (var i = 0; i < shopkeepers.length; i++) {
    if (shopkeepers[i].id == id) {
      var s = shopkeepers[i];
      document.getElementById('shopId').value = s.id;
      document.getElementById('shopName').value = s.name;
      document.getElementById('shopMobile').value = s.mobile;
      document.getElementById('shopAddress').value = s.address || '';
      document.getElementById('shopFormTitle').textContent = 'Edit Karein';
    }
  }
  window.scrollTo(0, 0);
}

function deleteShopkeeper(id) {
  if (!confirm('Pakka delete?')) return;
  var newList = [];
  for (var i = 0; i < shopkeepers.length; i++) {
    if (shopkeepers[i].id != id) newList.push(shopkeepers[i]);
  }
  shopkeepers = newList;
  saveData(); renderShopkeepers(); renderDashboard();
}

function renderShopkeepers() {
  var list = document.getElementById('shopkeepersList');
  if (shopkeepers.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-users"></i>Koi shopkeeper nahi.</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < shopkeepers.length; i++) {
    var s = shopkeepers[i];
    var total = 0, pending = 0;
    for (var j = 0; j < orders.length; j++) {
      if (orders[j].shopId == s.id) {
        total++;
        if (orders[j].status === 'Pending' || orders[j].status === 'Partial') pending++;
      }
    }
    html += '<div class="item">' +
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
  }
  list.innerHTML = html;
}

function prepareOrderForm() {
  var select = document.getElementById('orderShop');
  if (!select) return;
  if (shopkeepers.length === 0) {
    select.innerHTML = '<option value="">Pehle shopkeeper add karein</option>';
  } else {
    var html = '<option value="">-- Shopkeeper --</option>';
    for (var i = 0; i < shopkeepers.length; i++) {
      html += '<option value="' + shopkeepers[i].id + '">' + shopkeepers[i].name + ' (' + shopkeepers[i].mobile + ')</option>';
    }
    select.innerHTML = html;
  }
  var dEl = document.getElementById('orderDate');
  if (dEl) dEl.value = todayStr();
  var rows = document.getElementById('productRows');
  if (rows) { rows.innerHTML = ''; addProductRow(); }
  updateSummary();
}

function addProductRow() {
  var container = document.getElementById('productRows');
  if (!container) return;
  var idx = container.children.length;
  if (products.length === 0) { alert('Pehle Settings mein product add karein'); return; }
  var div = document.createElement('div');
  div.className = 'product-row';
  var productsHtml = '';
  for (var i = 0; i < products.length; i++) {
    productsHtml += '<option value="' + products[i] + '">' + products[i] + '</option>';
  }
  var removeBtn = idx > 0 ? '<button class="remove-btn" onclick="removeProductRow(this)"><i class="fa fa-trash"></i></button>' : '';
  div.innerHTML = '<div class="product-row-head">' +
      '<h4><i class="fa fa-box"></i> Product #' + (idx + 1) + '</h4>' + removeBtn +
    '</div>' +
    '<div class="form-group">' +
      '<label>Product</label>' +
      '<select class="prod-select" onchange="updateSummary()">' + productsHtml + '</select>' +
    '</div>' +
    '<div class="qty-row">' +
      '<div class="form-group"><label>Maund</label><input type="number" class="maund-input" min="0" placeholder="0" oninput="updateSummary()" /></div>' +
      '<div class="form-group"><label>Kg</label><input type="number" class="kg-input" min="0" max="39" placeholder="0" oninput="updateSummary()" /></div>' +
      '<div class="form-group"><label>Total</label><input type="text" class="total-input" readonly /></div>' +
    '</div>';
  container.appendChild(div);
  updateSummary();
}

function removeProductRow(btn) {
  btn.parentNode.parentNode.remove();
  var rows = document.querySelectorAll('.product-row');
  for (var i = 0; i < rows.length; i++) {
    rows[i].querySelector('h4').innerHTML = '<i class="fa fa-box"></i> Product #' + (i + 1);
  }
  updateSummary();
}

function updateSummary() {
  var rows = document.querySelectorAll('.product-row');
  var totalKg = 0, lines = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var prod = row.querySelector('.prod-select').value;
    var m = parseInt(row.querySelector('.maund-input').value) || 0;
    var k = parseInt(row.querySelector('.kg-input').value) || 0;
    var rowKg = m * 40 + k;
    row.querySelector('.total-input').value = qtyText(m, k);
    if (rowKg > 0) { totalKg += rowKg; lines.push({ product: prod, maund: m, kg: k }); }
  }
  var summary = document.getElementById('orderSummary');
  if (!summary) return;
  if (lines.length === 0) {
    summary.innerHTML = '<h4>Order Summary</h4><p style="color:#64748b;font-size:14px">Abhi koi quantity nahi daali</p>';
    return;
  }
  var html = '<h4>Order Summary</h4>';
  for (var i = 0; i < lines.length; i++) {
    html += '<div class="summary-line"><span>' + lines[i].product + '</span><span>' + qtyText(lines[i].maund, lines[i].kg) + '</span></div>';
  }
  html += '<div class="summary-line"><span>TOTAL</span><span>' + totalKgText(totalKg) + '</span></div>';
  summary.innerHTML = html;
}

function saveMultiOrder() {
  var shopId = document.getElementById('orderShop').value;
  var date = document.getElementById('orderDate').value;
  var notes = document.getElementById('orderNotes').value.trim();
  if (!shopId) { alert('Shopkeeper chunein!'); return; }
  if (!date) { alert('Date chunein!'); return; }
  var rows = document.querySelectorAll('.product-row');
  var items = [], totalKg = 0;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var prod = row.querySelector('.prod-select').value;
    var m = parseInt(row.querySelector('.maund-input').value) || 0;
    var k = parseInt(row.querySelector('.kg-input').value) || 0;
    var rowKg = m * 40 + k;
    if (rowKg > 0) {
      items.push({ product: prod, maund: m, kg: k, deliveredMaund: 0, deliveredKg: 0, totalKg: rowKg });
      totalKg += rowKg;
    }
  }
  if (items.length === 0) { alert('Kam az kam ek product ki quantity daalein!'); return; }
  orders.push({
    id: Date.now(), shopId: parseInt(shopId), items: items, totalKg: totalKg,
    date: date, notes: notes, status: 'Pending', createdAt: new Date().toISOString()
  });
  saveData();
  var shopName = '';
  for (var i = 0; i < shopkeepers.length; i++) {
    if (shopkeepers[i].id == shopId) shopName = shopkeepers[i].name;
  }
  alert('Order save!\n' + shopName + '\n' + items.length + ' products');
  prepareOrderForm();
  document.getElementById('orderNotes').value = '';
}

// ORDERS PAGE - Har product ke saath deliver button
function renderOrdersPage() {
  var dateVal = document.getElementById('ordersDate').value || todayStr();
  var statusFilter = document.getElementById('ordersStatus').value;

  var filtered = [];
  for (var i = 0; i < orders.length; i++) {
    var o = orders[i];
    if (o.date !== dateVal) continue;
    if (statusFilter === 'Pending' && o.status === 'Delivered') continue;
    if (statusFilter === 'Delivered' && o.status !== 'Delivered') continue;
    filtered.push(o);
  }

  var list = document.getElementById('ordersList');
  var summary = document.getElementById('ordersSummary');

  if (filtered.length === 0) {
    summary.innerHTML = '<div><p>' + formatDate(dateVal) + ' ka load</p><div class="big-num">0 kg</div></div>';
    list.innerHTML = '<div class="empty"><i class="fa fa-truck"></i>Is din koi order nahi.</div>';
    return;
  }

  var totalKg = 0;
  for (var i = 0; i < filtered.length; i++) {
    var o = filtered[i];
    for (var j = 0; j < o.items.length; j++) {
      var it = o.items[j];
      var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
      var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
      totalKg += (remM * 40) + remK;
    }
  }

  summary.innerHTML = '<div><p>' + formatDate(dateVal) + ' ka baqi load</p><div class="big-num">' + totalKgText(totalKg) + '</div></div>';

  var grouped = {};
  for (var i = 0; i < filtered.length; i++) {
    var sid = filtered[i].shopId;
    if (!grouped[sid]) grouped[sid] = [];
    grouped[sid].push(filtered[i]);
  }

  var html = '';
  var keys = Object.keys(grouped);
  for (var k = 0; k < keys.length; k++) {
    var shopId = keys[k];
    var shopName = 'Unknown', shopAddress = '—', shopMobile = '';
    for (var i = 0; i < shopkeepers.length; i++) {
      if (shopkeepers[i].id == shopId) {
        shopName = shopkeepers[i].name;
        shopAddress = shopkeepers[i].address || '—';
        shopMobile = shopkeepers[i].mobile;
      }
    }
    var sOrders = grouped[shopId];
    var shopKg = 0;
    for (var i = 0; i < sOrders.length; i++) {
      var o = sOrders[i];
      for (var j = 0; j < o.items.length; j++) {
        var it = o.items[j];
        var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
        var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
        shopKg += (remM * 40) + remK;
      }
    }

    // Ek shop ke andar, order-wise + product-wise lines
    var linesHtml = '';
    for (var i = 0; i < sOrders.length; i++) {
      var o = sOrders[i];
      for (var j = 0; j < o.items.length; j++) {
        var it = o.items[j];
        var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
        var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
        if (remM <= 0 && remK <= 0) continue;
        var deliveredText = '';
        if (it.deliveredMaund > 0 || it.deliveredKg > 0) {
          deliveredText = '<div class="p-delivered">✓ ' + qtyText(it.deliveredMaund, it.deliveredKg) + ' deliver ho chuka</div>';
        }
        linesHtml += '<div class="product-line">' +
          '<div class="product-line-info">' +
            '<span class="p-name">📦 ' + it.product + '</span>' +
            '<span class="p-qty">' + qtyText(remM, remK) + '</span>' +
            deliveredText +
          '</div>' +
          '<button class="btn small success" onclick="openDeliverModal(' + o.id + ', \'' + it.product.replace(/'/g, "\\'") + '\')">' +
            '<i class="fa fa-check"></i> Delivered' +
          '</button>' +
        '</div>';
      }
    }

    html += '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div>' +
          '<h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          '<p><i class="fa fa-map-marker-alt"></i> ' + shopAddress + ' • <i class="fa fa-phone"></i> ' + shopMobile + '</p>' +
        '</div>' +
        '<span class="shop-group-total">' + totalKgText(shopKg) + '</span>' +
      '</div>' +
      linesHtml +
    '</div>';
  }
  list.innerHTML = html;
}

// DELIVER MODAL - Product ke liye
function openDeliverModal(orderId, product) {
  currentDeliverOrderId = orderId;
  currentDeliverProduct = product;

  var order = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id == orderId) order = orders[i];
  }
  if (!order) return;

  var shopName = '';
  for (var i = 0; i < shopkeepers.length; i++) {
    if (shopkeepers[i].id == order.shopId) shopName = shopkeepers[i].name;
  }

  document.getElementById('deliverTitle').textContent = product + ' - ' + shopName;

  var pending = getPendingItemsForProduct(order, product);
  var body = document.getElementById('deliverBody');
  var html = '';

  for (var i = 0; i < pending.length; i++) {
    var p = pending[i];
    var totalText = qtyText(p.maund, p.kg);
    html += '<div class="deliver-row">' +
      '<div class="deliver-row-head">Baqi: ' + totalText + '</div>' +
      '<div class="deliver-row-sub">Kitna deliver ho raha hai? (khaali chhoro to poora)</div>' +
      '<div class="deliver-qty-row">' +
        '<div class="form-group"><label>Maund</label>' +
          '<input type="number" class="deliver-maund" min="0" max="' + p.maund + '" placeholder="' + p.maund + '" data-idx="' + p.index + '" />' +
        '</div>' +
        '<div class="form-group"><label>Kg</label>' +
          '<input type="number" class="deliver-kg" min="0" max="' + p.kg + '" placeholder="' + p.kg + '" data-idx="' + p.index + '" />' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  body.innerHTML = html;
  document.getElementById('deliverModal').classList.add('active');
}

function closeDeliverModal() {
  document.getElementById('deliverModal').classList.remove('active');
  currentDeliverOrderId = null;
  currentDeliverProduct = null;
}

function confirmDelivery() {
  if (!currentDeliverOrderId || !currentDeliverProduct) return;

  var order = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id == currentDeliverOrderId) order = orders[i];
  }
  if (!order) return;

  var maundInputs = document.querySelectorAll('.deliver-maund');
  var kgInputs = document.querySelectorAll('.deliver-kg');

  for (var i = 0; i < maundInputs.length; i++) {
    var idx = parseInt(maundInputs[i].getAttribute('data-idx'));
    var dm = parseInt(maundInputs[i].value);
    var dk = parseInt(kgInputs[i].value);

    var it = order.items[idx];
    var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
    var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);

    if (isNaN(dm)) dm = remM;
    if (isNaN(dk)) dk = remK;

    if (dm > remM) dm = remM;
    if (dk > remK) dk = remK;
    if (dm < 0) dm = 0;
    if (dk < 0) dk = 0;

    it.deliveredMaund = (parseInt(it.deliveredMaund) || 0) + dm;
    it.deliveredKg = (parseInt(it.deliveredKg) || 0) + dk;
  }

  // Update order status
  order.status = checkOrderDelivered(order) ? 'Delivered' : 'Partial';

  saveData();
  closeDeliverModal();
  renderOrdersPage();
  renderDashboard();
  renderDelivery();
  renderHistory();
  alert('Deliver ho gaya!');
}

function markAllDelivered() {
  if (!currentDeliverOrderId || !currentDeliverProduct) return;

  var order = null;
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id == currentDeliverOrderId) order = orders[i];
  }
  if (!order) return;

  for (var i = 0; i < order.items.length; i++) {
    var it = order.items[i];
    if (it.product === currentDeliverProduct) {
      it.deliveredMaund = parseInt(it.maund) || 0;
      it.deliveredKg = parseInt(it.kg) || 0;
    }
  }

  order.status = checkOrderDelivered(order) ? 'Delivered' : 'Partial';

  saveData();
  closeDeliverModal();
  renderOrdersPage();
  renderDashboard();
  renderDelivery();
  renderHistory();
  alert('Poora deliver ho gaya!');
}

function markDelivered(id) {
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].id == id) {
      var o = orders[i];
      for (var j = 0; j < o.items.length; j++) {
        o.items[j].deliveredMaund = parseInt(o.items[j].maund) || 0;
        o.items[j].deliveredKg = parseInt(o.items[j].kg) || 0;
      }
      o.status = 'Delivered';
    }
  }
  saveData();
  renderOrdersPage();
  renderDelivery();
  renderDashboard();
  renderHistory();
}

function renderDelivery() {
  var pending = [];
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].status === 'Pending' || orders[i].status === 'Partial') pending.push(orders[i]);
  }
  var list = document.getElementById('deliveryList');
  if (pending.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>Koi pending order nahi!</div>';
    return;
  }

  var grouped = {};
  for (var i = 0; i < pending.length; i++) {
    var sid = pending[i].shopId;
    if (!grouped[sid]) grouped[sid] = [];
    grouped[sid].push(pending[i]);
  }

  var html = '';
  var keys = Object.keys(grouped);
  for (var k = 0; k < keys.length; k++) {
    var shopId = keys[k];
    var shopName = 'Unknown', shopMobile = '';
    for (var i = 0; i < shopkeepers.length; i++) {
      if (shopkeepers[i].id == shopId) {
        shopName = shopkeepers[i].name;
        shopMobile = shopkeepers[i].mobile;
      }
    }
    var sOrders = grouped[shopId];
    var totalKg = 0;
    for (var i = 0; i < sOrders.length; i++) {
      var o = sOrders[i];
      for (var j = 0; j < o.items.length; j++) {
        var it = o.items[j];
        var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
        var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
        totalKg += (remM * 40) + remK;
      }
    }

    var linesHtml = '';
    for (var i = 0; i < sOrders.length; i++) {
      var o = sOrders[i];
      for (var j = 0; j < o.items.length; j++) {
        var it = o.items[j];
        var remM = (parseInt(it.maund) || 0) - (parseInt(it.deliveredMaund) || 0);
        var remK = (parseInt(it.kg) || 0) - (parseInt(it.deliveredKg) || 0);
        if (remM <= 0 && remK <= 0) continue;
        var deliveredText = '';
        if (it.deliveredMaund > 0 || it.deliveredKg > 0) {
          deliveredText = '<div class="p-delivered">✓ ' + qtyText(it.deliveredMaund, it.deliveredKg) + ' deliver ho chuka</div>';
        }
        linesHtml += '<div class="product-line">' +
          '<div class="product-line-info">' +
            '<span class="p-name">📦 ' + it.product + '</span>' +
            '<span class="p-qty">' + qtyText(remM, remK) + '</span>' +
            deliveredText +
          '</div>' +
          '<button class="btn small success" onclick="openDeliverModal(' + o.id + ', \'' + it.product.replace(/'/g, "\\'") + '\')">' +
            '<i class="fa fa-check"></i> Delivered' +
          '</button>' +
        '</div>';
      }
    }

    html += '<div class="shop-group">' +
      '<div class="shop-group-head">' +
        '<div><h4><i class="fa fa-store"></i> ' + shopName + '</h4>' +
          '<p><i class="fa fa-phone"></i> ' + shopMobile + '</p></div>' +
        '<span class="shop-group-total">' + totalKgText(totalKg) + '</span>' +
      '</div>' + linesHtml +
    '</div>';
  }
  list.innerHTML = html;
}

function renderHistory() {
  var searchEl = document.getElementById('historySearch');
  var dateEl = document.getElementById('historyDate');
  var search = searchEl ? searchEl.value.toLowerCase() : '';
  var dateFilter = dateEl ? dateEl.value : '';

  var filtered = [];
  for (var i = 0; i < orders.length; i++) {
    var o = orders[i];
    if (o.status !== 'Delivered') continue;
    if (dateFilter && o.date !== dateFilter) continue;
    if (search) {
      var shopName = '';
      for (var j = 0; j < shopkeepers.length; j++) {
        if (shopkeepers[j].id == o.shopId) shopName = shopkeepers[j].name.toLowerCase();
      }
      if (shopName.indexOf(search) === -1) continue;
    }
    filtered.push(o);
  }
  filtered.reverse();

  var list = document.getElementById('historyList');
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty"><i class="fa fa-clock"></i>Koi history nahi.</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    var o = filtered[i];
    var shopName = 'Unknown';
    for (var j = 0; j < shopkeepers.length; j++) {
      if (shopkeepers[j].id == o.shopId) shopName = shopkeepers[j].name;
    }
    var itemsHtml = '';
    for (var j = 0; j < o.items.length; j++) {
      itemsHtml += '<p>• ' + o.items[j].product + ' — <b>' + qtyText(o.items[j].maund, o.items[j].kg) + '</b></p>';
    }
    html += '<div class="item delivered-item">' +
      '<div class="item-info">' +
        '<h4>' + shopName + '</h4>' + itemsHtml +
        '<p class="date-line"><i class="fa fa-calendar"></i> ' + formatDate(o.date) + '</p>' +
        '<span class="badge delivered">Delivered</span>' +
      '</div>' +
    '</div>';
  }
  list.innerHTML = html;
}

function clearHistoryFilter() {
  document.getElementById('historySearch').value = '';
  document.getElementById('historyDate').value = '';
  renderHistory();
}

function viewShopHistory(shopId) {
  var shopName = '';
  for (var i = 0; i < shopkeepers.length; i++) {
    if (shopkeepers[i].id == shopId) shopName = shopkeepers[i].name;
  }
  var sOrders = [];
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].shopId == shopId) sOrders.push(orders[i]);
  }
  sOrders.reverse();
  document.getElementById('modalTitle').textContent = shopName + ' - Orders';
  var body = document.getElementById('modalBody');
  if (sOrders.length === 0) {
    body.innerHTML = '<div class="empty">Abhi koi order nahi.</div>';
  } else {
    var html = '';
    for (var i = 0; i < sOrders.length; i++) {
      var o = sOrders[i];
      var itemsHtml = '';
      for (var j = 0; j < o.items.length; j++) {
        itemsHtml += '<p><b>' + o.items[j].product + '</b> — ' + qtyText(o.items[j].maund, o.items[j].kg) + '</p>';
      }
      html += '<div class="item ' + (o.status === 'Delivered' ? 'delivered-item' : 'pending-item') + '" style="margin-bottom:10px;">' +
        '<div class="item-info">' + itemsHtml +
          '<p><small>' + formatDate(o.date) + '</small></p>' +
          '<span class="badge ' + o.status.toLowerCase() + '">' + o.status + '</span>' +
        '</div>' +
      '</div>';
    }
    body.innerHTML = html;
  }
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

window.addEventListener('load', function() {
  applySettings();
  renderDashboard();
  renderShopkeepers();
  prepareOrderForm();
  renderHistory();
  renderSettings();
});
