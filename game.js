// 数据存储
const DATA_VERSION = '1.0.2';
let clothes = [];
let orders = [];
let stats = {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
};

// JSONBin.io 配置
const JSONBIN_API = 'https://api.jsonbin.io/v3/b';
let jsonbinConfig = {
    apiKey: localStorage.getItem('jsonbinApiKey') || '',
    binId: localStorage.getItem('jsonbinBinId') || '',
    autoSync: localStorage.getItem('jsonbinAutoSync') === 'true'
};

// 保存 JSONBin.io 配置
function saveJsonbinConfig() {
    localStorage.setItem('jsonbinApiKey', jsonbinConfig.apiKey);
    localStorage.setItem('jsonbinBinId', jsonbinConfig.binId);
    localStorage.setItem('jsonbinAutoSync', jsonbinConfig.autoSync);
}

// 从云端加载数据
async function loadFromCloud() {
    if (!jsonbinConfig.binId) {
        alert('请先配置 JSONBin.io 的 Bin ID');
        return false;
    }

    try {
        const headers = {};
        if (jsonbinConfig.apiKey) {
            headers['X-Master-Key'] = jsonbinConfig.apiKey;
        }

        const response = await fetch(`${JSONBIN_API}/${jsonbinConfig.binId}/latest`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('云端暂无数据或 Bin ID 不存在');
            } else {
                alert(`加载失败: ${response.status}`);
            }
            return false;
        }

        const result = await response.json();

        if (result.record) {
            if (result.record.clothes) clothes = result.record.clothes;
            if (result.record.orders) orders = result.record.orders;
            if (result.record.stats) stats = result.record.stats;

            saveToStorage();
            updateStats();
            renderOrders();

            alert('云端数据加载成功！');
            return true;
        }
    } catch (error) {
        console.error('加载云端数据失败:', error);
        alert('加载云端数据失败，请检查网络连接');
    }
    return false;
}

// 同步数据到云端
async function syncToCloud() {
    if (!jsonbinConfig.binId) {
        alert('请先配置 JSONBin.io 的 Bin ID');
        return false;
    }

    const data = {
        clothes: clothes,
        orders: orders,
        stats: stats,
        lastSyncTime: new Date().toLocaleString('zh-CN')
    };

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (jsonbinConfig.apiKey) {
            headers['X-Master-Key'] = jsonbinConfig.apiKey;
        }

        const response = await fetch(`${JSONBIN_API}/${jsonbinConfig.binId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            alert(`同步失败: ${response.status}`);
            return false;
        }

        alert('数据已同步到云端！');
        return true;
    } catch (error) {
        console.error('同步到云端失败:', error);
        alert('同步失败，请检查网络连接');
    }
    return false;
}

// 创建新的云端 Bin
async function createCloudBin() {
    if (!jsonbinConfig.apiKey) {
        alert('请先配置 JSONBin.io 的 API Key');
        return null;
    }

    const data = {
        clothes: clothes,
        orders: orders,
        stats: stats,
        createdTime: new Date().toLocaleString('zh-CN')
    };

    try {
        const response = await fetch(`${JSONBIN_API}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': jsonbinConfig.apiKey
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            alert(`创建 Bin 失败: ${response.status}`);
            return null;
        }

        const result = await response.json();

        if (result.metadata && result.metadata.id) {
            jsonbinConfig.binId = result.metadata.id;
            saveJsonbinConfig();
            alert(`云端 Bin 创建成功！\nBin ID: ${result.metadata.id}\n请保存此 ID 以便后续使用`);
            return result.metadata.id;
        }
    } catch (error) {
        console.error('创建云端 Bin 失败:', error);
        alert('创建失败，请检查网络连接');
    }
    return null;
}

// 自动同步（当 autoSync 开启时）
let syncTimeout = null;
function autoSync() {
    if (!jsonbinConfig.autoSync || !jsonbinConfig.binId) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    syncTimeout = setTimeout(() => {
        syncToCloud();
    }, 3000);
}

// 初始化一些示例数据
function initData() {
    const defaultClothes = [
        {
            id: 1,
            name: '森呼吸春季连衣裙',
            category: '连衣裙',
            price: 269,
            description: '2026春季新品，森系风格设计，让力量与柔美共生，舒适面料，百搭简约款型。',
            image: '香港街等你女装/1.png'
        },
        {
            id: 2,
            name: '优雅蕾丝连衣裙',
            category: '连衣裙',
            price: 299,
            description: '适中版型，无弹设计，常规厚度，柔软舒适的触感，尽显优雅气质。',
            image: '香港街等你女装/2.png'
        },
        {
            id: 3,
            name: '户外休闲连衣裙',
            category: '连衣裙',
            price: 249,
            description: '模特同款，修身显瘦，适合户外休闲场合，展现自然美。',
            image: '香港街等你女装/3.png'
        },
        {
            id: 4,
            name: '舒适百搭连衣裙',
            category: '连衣裙',
            price: 229,
            description: '舒适面料，百搭简约款型，适合多种场合穿着。',
            image: '香港街等你女装/4.png'
        },
        {
            id: 5,
            name: '闺蜜款连衣裙套装',
            category: '连衣裙',
            price: 399,
            description: '闺蜜款设计，让华丽与内敛并存，果敢与烂漫交织。',
            image: '香港街等你女装/5.png'
        },
        {
            id: 6,
            name: '简约白色T恤',
            category: 'T恤',
            price: 89,
            description: '纯棉面料，舒适透气，经典百搭款式。',
            image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=simple%20white%20t-shirt%20fashion%20photography%20clean%20background&image_size=portrait_4_3'
        },
        {
            id: 7,
            name: '韩版风衣外套',
            category: '外套',
            price: 359,
            description: '时尚韩版设计，显瘦显气质，春秋必备单品。',
            image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=korean%20style%20trench%20coat%20fashion%20photography%20elegant&image_size=portrait_4_3'
        },
        {
            id: 8,
            name: '高腰阔腿裤',
            category: '裤子',
            price: 159,
            description: '高腰设计，拉长腿部线条，阔腿版型显瘦遮肉。',
            image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=high%20waist%20wide%20leg%20pants%20fashion%20photography%20stylish&image_size=portrait_4_3'
        }
    ];
    
    loadFromStorage();
    
    const savedVersion = localStorage.getItem('dataVersion');
    
    if (savedVersion !== DATA_VERSION) {
        clothes = defaultClothes;
        orders = [];
        stats = {
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            completedOrders: 0
        };
        localStorage.setItem('dataVersion', DATA_VERSION);
        saveToStorage();
    } else if (clothes.length === 0) {
        clothes = defaultClothes;
        saveToStorage();
    }
    
    updateStats();
}

// 从本地存储加载数据
function loadFromStorage() {
    const savedClothes = localStorage.getItem('clothes');
    const savedOrders = localStorage.getItem('orders');
    const savedStats = localStorage.getItem('stats');
    
    if (savedClothes) {
        clothes = JSON.parse(savedClothes);
    }
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
}

// 保存数据到本地存储
function saveToStorage() {
    localStorage.setItem('clothes', JSON.stringify(clothes));
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('stats', JSON.stringify(stats));
}

// 更新统计数据
function updateStats() {
    stats.totalOrders = orders.length;
    stats.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    stats.pendingOrders = orders.filter(o => o.status === 'pending').length;
    stats.completedOrders = orders.filter(o => o.status === 'completed').length;
    saveToStorage();
    autoSync();
}

// 导出数据库为JSON文件
function exportDatabase() {
    const data = {
        clothes: clothes,
        orders: orders,
        stats: stats,
        exportTime: new Date().toLocaleString('zh-CN')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `女装店数据库_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('数据库导出成功！');
}

// 导入数据库
function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.clothes) clothes = data.clothes;
            if (data.orders) orders = data.orders;
            if (data.stats) stats = data.stats;
            
            saveToStorage();
            updateStats();
            showPage('orders');
            
            alert('数据库导入成功！');
        } catch (error) {
            alert('导入失败：无效的JSON文件');
        }
    };
    reader.readAsText(file);
}

// 清空数据库
function clearDatabase() {
    if (!confirm('确定要清空所有数据吗？此操作不可恢复！')) return;
    
    clothes = [];
    orders = [];
    stats = {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0
    };
    
    saveToStorage();
    showPage('orders');
    alert('数据库已清空');
}

// 登录状态
let isLoggedIn = false;

// 页面切换
function showPage(pageId) {
    // 需要登录的页面
    const protectedPages = ['manage', 'orders'];
    
    if (protectedPages.includes(pageId) && !isLoggedIn) {
        // 保存目标页面
        loginTargetPage = pageId;
        showLoginModal();
        return;
    }
    
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    pages.forEach(page => page.classList.remove('active'));
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`button[onclick="showPage('${pageId}')"]`).classList.add('active');
    
    if (pageId === 'home') {
        renderClothes();
    } else if (pageId === 'manage') {
        renderManageClothes();
    } else if (pageId === 'orders') {
        renderOrders();
        renderStats();
    }
}

// 登录目标页面
let loginTargetPage = '';

// 显示登录弹窗
function showLoginModal() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginModal').classList.add('show');
}

// 关闭登录弹窗
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginError').textContent = '';
}

// 检查登录
function checkLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (username === 'admin' && password === '123321') {
        isLoggedIn = true;
        closeLoginModal();
        showPage(loginTargetPage);
    } else {
        document.getElementById('loginError').textContent = '用户名或密码错误！';
    }
}

// 回车键登录
function setupLoginEnterKey() {
    document.getElementById('loginPassword').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            checkLogin();
        }
    });
}

// 渲染统计数据
function renderStats() {
    const statsDiv = document.getElementById('statsDiv');
    if (!statsDiv) return;
    
    statsDiv.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-value">${stats.totalOrders}</div>
                <div class="stat-label">总订单数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">¥${stats.totalRevenue.toFixed(2)}</div>
                <div class="stat-label">总收入</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.pendingOrders}</div>
                <div class="stat-label">待处理</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.completedOrders}</div>
                <div class="stat-label">已完成</div>
            </div>
        </div>
    `;
}

// 渲染服装列表（首页展示，只显示上架中的）
function renderClothes(filteredClothes = clothes) {
    const grid = document.getElementById('clothesGrid');
    
    // 只显示上架中的服装
    const activeClothes = filteredClothes.filter(item => item.status !== 'disabled');
    
    if (activeClothes.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>暂无服装</p></div>';
        return;
    }
    
    grid.innerHTML = activeClothes.map(item => `
        <div class="clothes-card" onclick="showDetail(${item.id})">
            <img class="clothes-img" src="${item.image}" alt="${item.name}">
            <div class="clothes-info">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">¥${item.price}</span>
            </div>
        </div>
    `).join('');
}

// 渲染服装管理列表
function renderManageClothes() {
    const grid = document.getElementById('manageGrid');
    const statusFilter = document.getElementById('manageStatusSelect').value;
    
    let filteredClothes = clothes;
    if (statusFilter === 'active') {
        filteredClothes = clothes.filter(item => item.status !== 'disabled');
    } else if (statusFilter === 'disabled') {
        filteredClothes = clothes.filter(item => item.status === 'disabled');
    }
    
    if (filteredClothes.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>暂无服装</p></div>';
        return;
    }
    
    grid.innerHTML = filteredClothes.map(item => `
        <div class="manage-card ${item.status === 'disabled' ? 'disabled' : ''}">
            <img src="${item.image}" alt="${item.name}">
            <div class="manage-info">
                <div class="manage-header">
                    <h3>${item.name}</h3>
                    <span class="manage-status ${item.status === 'disabled' ? 'disabled' : 'active'}">
                        ${item.status === 'disabled' ? '已下架' : '上架中'}
                    </span>
                </div>
                <p class="manage-desc">${item.description}</p>
                <span class="manage-price">¥${item.price}</span>
                <div class="manage-actions">
                    <button class="manage-btn ${item.status === 'disabled' ? 'primary' : 'warning'}" onclick="toggleClothesStatus(${item.id})">
                        ${item.status === 'disabled' ? '上架' : '下架'}
                    </button>
                    <button class="manage-btn edit" onclick="showEditModal(${item.id})">编辑</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 切换服装上下架状态
function toggleClothesStatus(id) {
    const item = clothes.find(c => c.id === id);
    if (item) {
        item.status = item.status === 'disabled' ? 'active' : 'disabled';
        saveToStorage();
        renderManageClothes();
        alert(item.status === 'disabled' ? '服装已下架' : '服装已上架');
    }
}

// 显示编辑弹窗
function showEditModal(id) {
    const item = clothes.find(c => c.id === id);
    if (!item) return;
    
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editContent');
    
    content.innerHTML = `
        <h3>编辑服装</h3>
        <form id="editForm" enctype="multipart/form-data">
            <input type="hidden" id="editId" value="${item.id}">
            <div class="form-group">
                <label>当前图片</label>
                <img src="${item.image}" alt="${item.name}" class="edit-current-image">
            </div>
            <div class="form-group">
                <label>更换图片（可选）</label>
                <input type="file" id="editImage" accept="image/*">
                <div id="editPreview" class="preview"></div>
            </div>
            <div class="form-group">
                <label>服装名称</label>
                <input type="text" id="editName" value="${item.name}" required>
            </div>
            <div class="form-group">
                <label>分类</label>
                <select id="editCategory" required>
                    <option value="连衣裙" ${item.category === '连衣裙' ? 'selected' : ''}>连衣裙</option>
                    <option value="T恤" ${item.category === 'T恤' ? 'selected' : ''}>T恤</option>
                    <option value="外套" ${item.category === '外套' ? 'selected' : ''}>外套</option>
                    <option value="裤子" ${item.category === '裤子' ? 'selected' : ''}>裤子</option>
                    <option value="裙子" ${item.category === '裙子' ? 'selected' : ''}>半身裙</option>
                    <option value="鞋子" ${item.category === '鞋子' ? 'selected' : ''}>鞋子</option>
                    <option value="帽子" ${item.category === '帽子' ? 'selected' : ''}>帽子</option>
                    <option value="首饰" ${item.category === '首饰' ? 'selected' : ''}>首饰</option>
                </select>
            </div>
            <div class="form-group">
                <label>价格</label>
                <input type="number" id="editPrice" value="${item.price}" required min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea id="editDesc" required rows="2">${item.description}</textarea>
            </div>
            <div class="form-row">
                <button type="button" class="edit-btn cancel" onclick="closeEditModal()">取消</button>
                <button type="submit" class="edit-btn save">保存修改</button>
            </div>
        </form>
    `;
    
    // 添加图片预览事件
    document.getElementById('editImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('editPreview').innerHTML = `<img src="${e.target.result}" alt="预览">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 添加表单提交事件
    document.getElementById('editForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveEdit();
    });
    
    modal.classList.add('show');
}

// 关闭编辑弹窗
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

// 保存编辑
function saveEdit() {
    const id = parseInt(document.getElementById('editId').value);
    const name = document.getElementById('editName').value;
    const category = document.getElementById('editCategory').value;
    const price = parseFloat(document.getElementById('editPrice').value);
    const desc = document.getElementById('editDesc').value;
    const imageFile = document.getElementById('editImage').files[0];
    
    const item = clothes.find(c => c.id === id);
    if (!item) return;
    
    item.name = name;
    item.category = category;
    item.price = price;
    item.description = desc;
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.image = e.target.result;
            saveToStorage();
            renderManageClothes();
            closeEditModal();
            alert('修改成功！');
        };
        reader.readAsDataURL(imageFile);
    } else {
        saveToStorage();
        renderManageClothes();
        closeEditModal();
        alert('修改成功！');
    }
}

// 搜索和筛选
function filterClothes() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categorySelect').value;
    
    const filtered = clothes.filter(item => {
        const matchSearch = item.name.toLowerCase().includes(searchText) || 
                          item.description.toLowerCase().includes(searchText);
        const matchCategory = category === 'all' || item.category === category;
        return matchSearch && matchCategory;
    });
    
    renderClothes(filtered);
}

// 显示服装详情
function showDetail(id) {
    const item = clothes.find(c => c.id === id);
    if (!item) return;
    
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <h2>${item.name}</h2>
        <span class="category">${item.category}</span>
        <span class="price">¥${item.price}</span>
        <p>${item.description}</p>
        
        <div class="order-form">
            <div class="form-group">
                <label>数量</label>
                <input type="number" id="orderQty" value="1" min="1">
            </div>
            <div class="form-group">
                <label>您的姓名</label>
                <input type="text" id="customerName" placeholder="请输入姓名">
            </div>
            <div class="form-group">
                <label>客户留言</label>
                <textarea id="customerMessage" placeholder="如有特殊需求，请在此留言（选填）" rows="3"></textarea>
            </div>
            <button class="order-btn" onclick="createOrder(${item.id})">立即下单</button>
        </div>
    `;
    
    modal.classList.add('show');
}

// 关闭弹窗
function closeModal() {
    document.getElementById('detailModal').classList.remove('show');
}

// 添加服装表单处理
function addClothesFormHandler(e) {
    e.preventDefault();
    
    const name = document.getElementById('addName').value;
    const category = document.getElementById('addCategory').value;
    const price = parseFloat(document.getElementById('addPrice').value);
    const desc = document.getElementById('addDesc').value;
    const imageFile = document.getElementById('addImage').files[0];
    
    if (!imageFile) {
        alert('请选择图片');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const newClothes = {
            id: Date.now(),
            name: name,
            category: category,
            price: price,
            description: desc,
            image: e.target.result,
            uploadTime: new Date().toLocaleString('zh-CN'),
            status: 'active'
        };
        
        clothes.push(newClothes);
        saveToStorage();
        
        document.getElementById('addClothesForm').reset();
        
        renderManageClothes();
        alert('添加成功！');
    };
    
    reader.readAsDataURL(imageFile);
}

// 创建订单
function createOrder(clothesId) {
    const item = clothes.find(c => c.id === clothesId);
    const qty = parseInt(document.getElementById('orderQty').value);
    const name = document.getElementById('customerName').value;
    const message = document.getElementById('customerMessage').value;
    
    if (!name) {
        alert('请填写姓名');
        return;
    }
    
    const order = {
        id: Date.now(),
        clothesId: item.id,
        clothesName: item.name,
        clothesImage: item.image,
        price: item.price,
        quantity: qty,
        total: item.price * qty,
        customerName: name,
        customerMessage: message,
        status: 'pending',
        createTime: new Date().toLocaleString('zh-CN'),
        orderNo: 'DD' + Date.now().toString().slice(-8)
    };
    
    orders.push(order);
    updateStats();
    
    closeModal();
    alert(`下单成功！\n订单号: ${order.orderNo}`);
}

// 渲染订单列表
function renderOrders() {
    const list = document.getElementById('ordersList');
    
    if (orders.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无订单</p></div>';
        return;
    }
    
    // 按时间倒序排列
    const sortedOrders = [...orders].sort((a, b) => b.id - a.id);
    
    list.innerHTML = sortedOrders.map(order => `
        <div class="order-card ${order.status === 'pending' ? 'pending' : 'completed'}">
            <div class="order-header">
                <span class="order-id">订单号: ${order.orderNo}</span>
                <span class="order-status ${order.status}">${order.status === 'pending' ? '待处理' : '已完成'}</span>
            </div>
            <div class="order-items">
                <div class="order-item">
                    <img src="${order.clothesImage}" alt="${order.clothesName}">
                    <div class="order-item-info">
                        <h4>${order.clothesName}</h4>
                        <p>¥${order.price} x ${order.quantity}</p>
                    </div>
                </div>
            </div>
            <div class="order-customer">
                <p>客户: ${order.customerName}</p>
                ${order.customerMessage ? `<p class="order-message">留言: ${order.customerMessage}</p>` : ''}
                <p>时间: ${order.createTime}</p>
            </div>
            <div class="order-total">
                <span>合计</span>
                <span>¥${order.total}</span>
            </div>
            <div class="order-actions">
                ${order.status === 'pending' ? `<button class="action-btn primary" onclick="completeOrder(${order.id})">确认发货</button>` : ''}
                <button class="action-btn danger" onclick="deleteOrder(${order.id})">删除订单</button>
            </div>
        </div>
    `).join('');
}

// 完成订单
function completeOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = 'completed';
        order.completeTime = new Date().toLocaleString('zh-CN');
        updateStats();
        renderOrders();
        alert('订单已完成发货！');
    }
}

// 删除订单
function deleteOrder(orderId) {
    if (!confirm('确定要删除此订单吗？')) return;
    
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders.splice(index, 1);
        updateStats();
        renderOrders();
        alert('订单已删除');
    }
}

// 点击弹窗外部关闭
document.getElementById('detailModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// 点击编辑弹窗外部关闭
document.getElementById('editModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditModal();
    }
});

// 新增服装表单提交
document.getElementById('addClothesForm').addEventListener('submit', addClothesFormHandler);

// 从封面进入主界面
function enterMain() {
    document.getElementById('cover').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    showPage('home');
}

// 打开大图预览
function openImagePreview(src) {
    document.getElementById('previewImage').src = src;
    document.getElementById('imageModal').style.display = 'flex';
}

// 关闭大图预览
function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// 点击图片显示大图
function setupImageClickHandler() {
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'IMG' && e.target.classList.contains('clothes-img')) {
            openImagePreview(e.target.src);
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initData();
    setupImageClickHandler();
    setupLoginEnterKey();
    initCloudConfigUI();
});

// 初始化云端配置界面
function initCloudConfigUI() {
    const apiKeyInput = document.getElementById('jsonbinApiKey');
    const binIdInput = document.getElementById('jsonbinBinId');
    const autoSyncCheckbox = document.getElementById('jsonbinAutoSync');

    if (apiKeyInput) apiKeyInput.value = jsonbinConfig.apiKey;
    if (binIdInput) binIdInput.value = jsonbinConfig.binId;
    if (autoSyncCheckbox) autoSyncCheckbox.checked = jsonbinConfig.autoSync;
}

// 保存云端配置
function saveCloudConfig() {
    const apiKeyInput = document.getElementById('jsonbinApiKey');
    const binIdInput = document.getElementById('jsonbinBinId');
    const autoSyncCheckbox = document.getElementById('jsonbinAutoSync');

    if (apiKeyInput) jsonbinConfig.apiKey = apiKeyInput.value.trim();
    if (binIdInput) jsonbinConfig.binId = binIdInput.value.trim();
    if (autoSyncCheckbox) jsonbinConfig.autoSync = autoSyncCheckbox.checked;

    saveJsonbinConfig();
    alert('配置已保存！');
}

// 切换自动同步
function toggleAutoSync() {
    const autoSyncCheckbox = document.getElementById('jsonbinAutoSync');
    if (autoSyncCheckbox) {
        jsonbinConfig.autoSync = autoSyncCheckbox.checked;
        saveJsonbinConfig();
    }
}