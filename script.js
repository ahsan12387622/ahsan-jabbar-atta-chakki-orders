// ================== DATA STORAGE ==================
let shopkeepers = JSON.parse(localStorage.getItem('shopkeepers')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];

function saveData() {
  localStorage.setItem('shopkeepers', JSON.stringify(shopkeepers));
  localStorage.setItem('orders', JSON.stringify(orders));
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

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'shopkeepers') renderShopkeepers();
  if (pageId === 'neworder') prepareOrderForm();
  if (pageId === 'orders') renderOrders();
  if (pageId === 'delivery') renderDelivery();
  if (pageId === 'history') renderHistory();
}

// ================== DASHBOARD ==================
function renderDashboard() {
  document.getElementById('totalShopkeepers').textContent = shopkeepers.length;
  
  const today = new Date().toISOString().split('T')[0];
  const todayCount = orders.filter(o => o.date === today).length;
  const pending = orders.filter(o => o.status === 'Pending').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;

  document.getElementById('todayOrders').textContent = todayCount;
  document.getElementById('pendingOrders').textContent = pending;
  document.getElementById('deliveredOrders').textContent = delivered;
}

// ================== SHOPKEEPERS ==================
function saveShopkeeper() {
  const id = document.getElementById('shopId').value;
  const name = document.getElementById('shopName').value.trim();
  const mobile = document.getElementById('shopMobile').value.trim();
  const address = document.getElementById('shopAddress').value.trim();

  if (!name || !mobile) {
    alert('Naam aur mobile number zaroori hai!');
    return;
  }

  if (id) {
    const s = shopkeepers.find(x => x.id == id);
    s.name = name; s.mobile = mobile; s.address = address;
  } else {
    shopkeepers.push({
      id: Date.now(),
      name, mobile, address
    });
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
    list.innerHTML = '<div class="empty">Koi shopkeeper nahi. Upar form se add karein.</div>';
    return;
  }

  list.innerHTML = shopkeepers.map(s => {
    const orderCount = orders.filter(o => o.shopId == s.id).length;
    return `
      <div class="item">
        <div class="item-info">
          <h4><i class="fa fa-user"></i> ${s.name}</h4>
          <p><i class="fa fa-phone"></i> ${s.mobile}</p>
          ${s.address ? `<p><i class="fa fa-map-marker-alt"></i> ${s.address}</p>` : ''}
          <p><small>${orderCount} orders total</small></p>
        </div>
        <div class="item-actions">
          <button class="btn small" onclick="viewShopHistory(${s.id})"><i class="fa fa-history"></i> History</button>
          <button class="btn small" onclick="editShopkeeper(${s.id})"><i class="fa fa-edit"></i> Edit</button>
          <button class="btn small danger" onclick="deleteShopkeeper(${s.id})"><i class="fa fa-trash"></i> Delete</button>
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
      shopkeepers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }

  document.getElementById('orderDate').value = new Date().toISOString().split('T')[0];
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
    list.innerHTML = '<div class="empty">Koi order nahi mila.</div>';
    return;
  }

  list.innerHTML = filtered.map(o => {
    const shop = shopkeepers.find(s => s.id == o.shopId);
    const shopName = shop ? shop.name : 'Unknown';
    return `
      <div class="item">
        <div class="item-info">
          <h4>${shopName}</h4>
          <p><i class="fa fa-box"></i> ${o.product} — <b>${o.qty} bags</b></p>
          <p><i class="fa fa-calendar"></i> ${formatDate(o.date)}</p>
          ${o.notes ? `<p class="notes"><i class="fa fa-sticky-note"></i> ${o.notes}</p>` : ''}
          <span class="badge ${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="item-actions">
          ${o.status === 'Pending' 
            ? `<button class="btn small success" onclick="markDelivered(${o.id})"><i class="fa fa-check"></i> Delivered</button>` 
            : ''}
          <button class="btn small danger" onclick="deleteOrder(${o.id})"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `;
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
}

function deleteOrder(id) {
  if (!confirm('Order delete karein?')) return;
  orders = orders.filter(x => x.id != id);
  saveData();
  renderOrders();
  renderDelivery();
  renderDashboard();
  renderHistory();
}

// ================== DELIVERY ==================
function renderDelivery() {
  const pending = orders.filter(o => o.status === 'Pending');
  const list = document.getElementById('deliveryList');

  if (pending.length === 0) {
    list.innerHTML = '<div class="empty">🎉 Koi pending order nahi. Sab deliver ho gaya!</div>';
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

    return `
      <div class="item" style="flex-direction: column; align-items: stretch;">
        <div class="item-info" style="width:100%">
          <h4><i class="fa fa-store"></i> ${shopName} ${shop ? `— ${shop.mobile}` : ''}</h4>
          ${shopOrders.map(o => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-top:1px solid #eee; margin-top:8px; flex-wrap:wrap; gap:8px;">
              <div>
                <b>${o.product}</b> — ${o.qty} bags <br>
                <small>${formatDate(o.date)} ${o.notes ? '• ' + o.notes : ''}</small>
              </div>
              <button class="btn small success" onclick="markDelivered(${o.id})"><i class="fa fa-check"></i> Delivered</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
    list.innerHTML = '<div class="empty">Koi delivered order nahi mila.</div>';
    return;
  }

  list.innerHTML = filtered.map(o => {
    const shop = shopkeepers.find(s => s.id == o.shopId);
    return `
      <div class="item">
        <div class="item-info">
          <h4>${shop ? shop.name : 'Unknown'}</h4>
          <p><i class="fa fa-box"></i> ${o.product} — ${o.qty} bags</p>
          <p><i class="fa fa-calendar"></i> ${formatDate(o.date)}</p>
          ${o.notes ? `<p class="notes">${o.notes}</p>` : ''}
          <span class="badge delivered">Delivered</span>
        </div>
      </div>
    `;
  }).join('');
}

function clearHistoryFilter() {
  document.getElementById('historySearch').value = '';
  document.getElementById('historyDate').value = '';
  renderHistory();
}

// ================== SHOP HISTORY MODAL ==================
function viewShopHistory(shopId) {
  const shop = shopkeepers.find(s => s.id == shopId);
  const shopOrders = orders.filter(o => o.shopId == shopId).reverse();

  document.getElementById('modalTitle').textContent = shop.name + ' - Orders';
  const body = document.getElementById('modalBody');

  if (shopOrders.length === 0) {
    body.innerHTML = '<div class="empty">Abhi koi order nahi.</div>';
  } else {
    body.innerHTML = shopOrders.map(o => `
      <div class="item" style="margin-bottom:8px;">
        <div class="item-info">
          <p><b>${o.product}</b> — ${o.qty} bags</p>
          <p><small>${formatDate(o.date)}</small></p>
          <span class="badge ${o.status.toLowerCase()}">${o.status}</span>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// ================== UTILS ==================
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ================== INIT ==================
window.onload = () => {
  renderDashboard();
  renderShopkeepers();
  prepareOrderForm();
  renderOrders();
  renderDelivery();
  renderHistory();
};
