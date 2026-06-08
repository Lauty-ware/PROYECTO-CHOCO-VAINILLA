// ============================================
// Sistema de Gestión de Vainilla - Chocó Biogeográfico
// Versión: 1.0.0
// ============================================

// Variables globales
let token = localStorage.getItem('token');
let currentUser = null;
let charts = {};

// ============================================
// AUTENTICACIÓN
// ============================================

async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            currentUser = data.usuario;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            document.getElementById('userInfo').innerHTML = `
                <div class="text-sm">${currentUser.nombre}</div>
                <div class="text-xs opacity-75">${currentUser.rol}</div>
            `;
            
            mostrarToast(`Bienvenido ${currentUser.nombre}`, 'success');
            showSection('dashboard');
            cargarDashboard();
            return true;
        } else {
            mostrarToast('Credenciales inválidas', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        mostrarToast('Error de conexión', 'error');
        return false;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    mostrarLogin();
    mostrarToast('Sesión cerrada', 'info');
}

function mostrarLogin() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
            <div class="card bg-white rounded-lg p-8 shadow-lg w-96">
                <div class="text-center mb-6">
                    <h1 class="text-3xl font-bold text-green-800">🌱 Vainilla</h1>
                    <p class="text-gray-500">Sistema de Gestión</p>
                    <p class="text-xs text-gray-400 mt-1">Chocó Biogeográfico</p>
                </div>
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="loginEmail" placeholder="admin@vainilla.com" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-1">Contraseña</label>
                        <input type="password" id="loginPassword" placeholder="admin123" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    <button type="submit" class="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition">Ingresar</button>
                </form>
                <div class="mt-4 text-center text-sm text-gray-400">
                    <p>Demo: admin@vainilla.com / admin123</p>
                    <p>Demo: operador@vainilla.com / operador123</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (await login(email, password)) {
            location.reload();
        }
    });
}

// ============================================
// UTILIDADES
// ============================================

function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSection(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(s => {
        s.classList.add('hidden');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Actualizar active en sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-green-800');
        item.classList.add('hover:bg-green-800');
    });
    
    // Cargar datos según la sección
    switch(section) {
        case 'dashboard':
            cargarDashboard();
            break;
        case 'lotes':
            cargarLotes();
            break;
        case 'equipos':
            cargarEquipos();
            break;
        case 'configuracion':
            cargarConfiguracion();
            break;
        case 'reportes':
            cargarLotesParaSelect();
            cargarEquiposParaSelect();
            break;
    }
}

async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Sesión expirada');
        }
        
        return response;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================
// DASHBOARD
// ============================================

async function cargarDashboard() {
    try {
        const response = await apiRequest('/api/estadisticas');
        const data = await response.json();
        
        // Actualizar cards
        document.getElementById('stats-cards').innerHTML = `
            <div class="card bg-white rounded-lg p-6 shadow">
                <div class="text-2xl font-bold text-green-700">${data.totalLotes || 0}</div>
                <div class="text-gray-500 text-sm">Total Lotes</div>
            </div>
            <div class="card bg-white rounded-lg p-6 shadow">
                <div class="text-2xl font-bold text-green-600">${data.calidadDistribucion?.find(c => c.calidadFinal === 'PREMIUM')?.count || 0}</div>
                <div class="text-gray-500 text-sm">Calidad Premium</div>
            </div>
            <div class="card bg-white rounded-lg p-6 shadow">
                <div class="text-2xl font-bold text-blue-600">${data.calidadDistribucion?.find(c => c.calidadFinal === 'PRIMERA')?.count || 0}</div>
                <div class="text-gray-500 text-sm">Calidad Primera</div>
            </div>
            <div class="card bg-white rounded-lg p-6 shadow">
                <div class="text-2xl font-bold ${data.tasaRechazo > 20 ? 'text-red-600' : 'text-orange-600'}">${data.tasaRechazo?.toFixed(1) || 0}%</div>
                <div class="text-gray-500 text-sm">Tasa de Rechazo</div>
            </div>
        `;
        
        // Gráfico de calidad
        const calidadCtx = document.getElementById('calidadChart')?.getContext('2d');
        if (calidadCtx) {
            if (charts.calidad) charts.calidad.destroy();
            charts.calidad = new Chart(calidadCtx, {
                type: 'doughnut',
                data: {
                    labels: (data.calidadDistribucion || []).map(c => c.calidadFinal),
                    datasets: [{
                        data: (data.calidadDistribucion || []).map(c => c.count),
                        backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#f44336'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
        
        // Gráfico de tiempo de proceso
        const tiempoCtx = document.getElementById('tiempoChart')?.getContext('2d');
        if (tiempoCtx && data.tiemposProceso) {
            if (charts.tiempo) charts.tiempo.destroy();
            charts.tiempo = new Chart(tiempoCtx, {
                type: 'bar',
                data: {
                    labels: data.tiemposProceso.map(t => t.codigo),
                    datasets: [{
                        label: 'Tiempo de proceso (horas)',
                        data: data.tiemposProceso.map(t => t.tiempoTotalHoras || 0),
                        backgroundColor: '#2d6a4f',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }
        
        // Cargar lotes recientes
        cargarLotesRecientes();
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        mostrarToast('Error al cargar dashboard', 'error');
    }
}

async function cargarLotesRecientes() {
    try {
        const response = await apiRequest('/api/lotes?limit=5');
        const lotes = await response.json();
        
        const container = document.getElementById('lotes-recientes');
        if (container) {
            if (lotes.length === 0) {
                container.innerHTML = '<div class="text-center py-4 text-gray-500">No hay lotes registrados</div>';
                return;
            }
            
            container.innerHTML = lotes.map(lote => `
                <div class="flex justify-between items-center py-2 border-b">
                    <div>
                        <span class="font-medium">${lote.codigo}</span>
                        <span class="text-sm text-gray-500 ml-2">${lote.productor || 'N/A'}</span>
                    </div>
                    <span class="estado-badge estado-${lote.estado}">${lote.estado}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando lotes recientes:', error);
    }
}

// ============================================
// LOTES
// ============================================

async function cargarLotes() {
    const filtro = document.getElementById('filtroEstado')?.value || '';
    const url = filtro ? `/api/lotes?estado=${filtro}` : '/api/lotes';
    
    try {
        const response = await apiRequest(url);
        const lotes = await response.json();
        
        const container = document.getElementById('lotes-lista');
        if (lotes.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">📭 No hay lotes registrados</div>';
            return;
        }
        
        container.innerHTML = lotes.map(lote => `
            <div class="card bg-white rounded-lg p-5 shadow">
                <div class="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <h3 class="font-bold text-lg text-green-800">${lote.codigo}</h3>
                        <p class="text-sm text-gray-500 mt-1">
                            Productor: ${lote.productor || 'N/A'} | 
                            Finca: ${lote.finca || 'N/A'} | 
                            Peso: ${lote.pesoKg} kg
                        </p>
                        <p class="text-xs text-gray-400 mt-1">
                            Registrado: ${formatDate(lote.fechaRegistro)}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="estado-badge estado-${lote.estado}">${lote.estado}</span>
                        ${lote.calidadFinal ? `<span class="estado-badge calidad-${lote.calidadFinal} ml-2">${lote.calidadFinal}</span>` : ''}
                    </div>
                </div>
                
                ${lote.analisisFisicoQuimico ? `
                    <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
                        <div class="grid grid-cols-4 gap-2">
                            <div>💧 Humedad: ${lote.analisisFisicoQuimico.humedad || 'N/A'}%</div>
                            <div>🧪 pH: ${lote.analisisFisicoQuimico.ph || 'N/A'}</div>
                            <div>⭐ Vainillina: ${lote.analisisFisicoQuimico.vainillina || 'N/A'}%</div>
                            <div>🌡️ Temp: ${lote.analisisFisicoQuimico.temperatura || 'N/A'}°C</div>
                        </div>
                    </div>
                ` : ''}
                
                <div class="mt-4 flex gap-2 flex-wrap">
                    <button onclick="verDetalleLote(${lote.id})" class="text-blue-600 hover:text-blue-800 text-sm">🔍 Ver detalles</button>
                    ${lote.estado === 'RECIBIDO' ? `<button onclick="registrarInspeccion(${lote.id})" class="text-green-600 hover:text-green-800 text-sm">✅ Registrar Inspección</button>` : ''}
                    ${lote.estado === 'INSPECCION_OK' ? `<button onclick="registrarAnalisis(${lote.id})" class="text-green-600 hover:text-green-800 text-sm">🔬 Registrar Análisis</button>` : ''}
                    ${lote.estado === 'ANALISIS_OK' ? `<button onclick="registrarClasificacion(${lote.id})" class="text-green-600 hover:text-green-800 text-sm">📊 Clasificar</button>` : ''}
                    <button onclick="mostrarLogs(${lote.id})" class="text-gray-500 hover:text-gray-700 text-sm">📋 Ver logs</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando lotes:', error);
        mostrarToast('Error al cargar lotes', 'error');
    }
}

function verDetalleLote(id) {
    window.open(`/api/reportes/lote/${id}`, '_blank');
}

function mostrarLogs(id) {
    window.open(`/api/logs/lote/${id}`, '_blank');
}

async function registrarInspeccion(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content p-6">
            <h3 class="text-xl font-bold mb-4">🔍 Inspección Organoléptica</h3>
            <form id="formInspeccion">
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Color</label>
                    <select name="color" class="w-full border rounded-lg px-3 py-2">
                        <option value="VERDE">Verde</option>
                        <option value="VERDE_CLARO">Verde Claro</option>
                        <option value="AMARILLO">Amarillo</option>
                        <option value="MARRON">Marrón</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Olor</label>
                    <select name="olor" class="w-full border rounded-lg px-3 py-2">
                        <option value="NORMAL">Normal</option>
                        <option value="FERMENTADO">Fermentado</option>
                        <option value="MOHO">Moho</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Textura</label>
                    <select name="textura" class="w-full border rounded-lg px-3 py-2">
                        <option value="NORMAL">Normal</option>
                        <option value="BLANDA">Blanda</option>
                        <option value="DURA">Dura</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Observaciones</label>
                    <textarea name="observaciones" rows="2" class="w-full border rounded-lg px-3 py-2"></textarea>
                </div>
                <div class="flex gap-3 mt-4">
                    <button type="submit" name="resultado" value="APROBADO" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">✅ Aprobar</button>
                    <button type="submit" name="resultado" value="RECHAZADO" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">❌ Rechazar</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="border border-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formInspeccion').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitter = e.submitter;
        const resultado = submitter.value;
        const formData = new FormData(e.target);
        
        const data = {
            resultado,
            observaciones: formData.get('observaciones'),
            color: formData.get('color'),
            olor: formData.get('olor'),
            textura: formData.get('textura')
        };
        
        try {
            await apiRequest(`/api/lotes/${id}/inspeccion`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            modal.remove();
            mostrarToast('Inspección registrada exitosamente');
            cargarLotes();
        } catch (error) {
            mostrarToast('Error al registrar inspección', 'error');
        }
    });
}

async function registrarAnalisis(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content p-6">
            <h3 class="text-xl font-bold mb-4">🔬 Análisis Físico-Químico</h3>
            <form id="formAnalisis">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-sm font-medium mb-1">Humedad (%)</label>
                        <input type="number" step="0.1" name="humedad" required class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">pH</label>
                        <input type="number" step="0.1" name="ph" required class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Vainillina (%)</label>
                        <input type="number" step="0.1" name="vainillina" required class="w-full border rounded-lg px-3 py-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Temperatura (°C)</label>
                        <input type="number" step="0.1" name="temperatura" class="w-full border rounded-lg px-3 py-2">
                    </div>
                </div>
                <div class="mb-3 mt-3">
                    <label class="block text-sm font-medium mb-1">Observaciones</label>
                    <textarea name="observaciones" rows="2" class="w-full border rounded-lg px-3 py-2"></textarea>
                </div>
                <div class="flex gap-3 mt-4">
                    <button type="submit" name="resultado" value="APROBADO" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">✅ Aprobar</button>
                    <button type="submit" name="resultado" value="RECHAZADO" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">❌ Rechazar</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="border border-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formAnalisis').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitter = e.submitter;
        const resultado = submitter.value;
        const formData = new FormData(e.target);
        
        const data = {
            resultado,
            humedad: parseFloat(formData.get('humedad')),
            ph: parseFloat(formData.get('ph')),
            vainillina: parseFloat(formData.get('vainillina')),
            temperatura: parseFloat(formData.get('temperatura')),
            brix: 20,
            observaciones: formData.get('observaciones')
        };
        
        try {
            await apiRequest(`/api/lotes/${id}/analisis`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            modal.remove();
            mostrarToast('Análisis registrado exitosamente');
            cargarLotes();
        } catch (error) {
            mostrarToast('Error al registrar análisis', 'error');
        }
    });
}

async function registrarClasificacion(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content p-6">
            <h3 class="text-xl font-bold mb-4">📊 Clasificación de Lote</h3>
            <form id="formClasificacion">
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Calidad Final</label>
                    <select name="calidad" class="w-full border rounded-lg px-3 py-2">
                        <option value="PREMIUM">Premium</option>
                        <option value="PRIMERA">Primera</option>
                        <option value="SEGUNDA">Segunda</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Destino</label>
                    <input type="text" name="destino" placeholder="Cliente / Exportación" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Observaciones</label>
                    <textarea name="observaciones" rows="2" class="w-full border rounded-lg px-3 py-2"></textarea>
                </div>
                <div class="flex gap-3 mt-4">
                    <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">✅ Confirmar</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="border border-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formClasificacion').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const data = {
            calidadFinal: formData.get('calidad'),
            destino: formData.get('destino'),
            observaciones: formData.get('observaciones')
        };
        
        try {
            await apiRequest(`/api/lotes/${id}/clasificar`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            modal.remove();
            mostrarToast('Clasificación registrada exitosamente');
            cargarLotes();
        } catch (error) {
            mostrarToast('Error al registrar clasificación', 'error');
        }
    });
}

// ============================================
// EQUIPOS
// ============================================

async function cargarEquipos() {
    try {
        const response = await apiRequest('/api/equipos');
        const equipos = await response.json();
        
        const container = document.getElementById('equipos-lista');
        if (equipos.length === 0) {
            container.innerHTML = '<div class="text-center py-8 text-gray-500">⚙️ No hay equipos registrados</div>';
            return;
        }
        
        container.innerHTML = equipos.map(equipo => `
            <div class="card bg-white rounded-lg p-5 shadow">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg text-green-800">${equipo.nombre}</h3>
                        <p class="text-sm text-gray-500">${equipo.codigo} | ${equipo.tipo}</p>
                    </div>
                    <span class="estado-badge estado-${equipo.estado}">${equipo.estado}</span>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>⏱️ Horas de uso: ${equipo.horasUso || 0}</div>
                    <div>📈 Ciclos: ${equipo.ciclos || 0}</div>
                    <div>📅 Instalación: ${formatDate(equipo.fechaInstalacion)}</div>
                    <div>🔧 Último mantenimiento: ${equipo.ultimoMantenimiento ? formatDate(equipo.ultimoMantenimiento.fecha) : 'Nunca'}</div>
                </div>
                <div class="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div class="text-sm font-medium mb-1">Próximo mantenimiento</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${equipo.porcentajeVidaUtil || 100}%"></div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${equipo.horasRestantesMantenimiento ? `${equipo.horasRestantesMantenimiento} horas restantes` : 'Mantenimiento al día'}
                    </div>
                </div>
                <div class="mt-4 flex gap-2 flex-wrap">
                    <button onclick="registrarUsoEquipo(${equipo.id})" class="text-blue-600 hover:text-blue-800 text-sm">▶️ Registrar Uso</button>
                    <button onclick="programarMantenimiento(${equipo.id})" class="text-orange-600 hover:text-orange-800 text-sm">🔧 Programar Mantenimiento</button>
                    <button onclick="verHistorialMantenimiento(${equipo.id})" class="text-gray-500 hover:text-gray-700 text-sm">📋 Historial</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando equipos:', error);
        mostrarToast('Error al cargar equipos', 'error');
    }
}

function mostrarFormEquipo() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content p-6">
            <h3 class="text-xl font-bold mb-4">➕ Nuevo Equipo</h3>
            <form id="formEquipo">
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Nombre *</label>
                    <input type="text" name="nombre" required class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Código *</label>
                    <input type="text" name="codigo" required class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Tipo</label>
                    <select name="tipo" class="w-full border rounded-lg px-3 py-2">
                        <option value="CAMARA">Cámara Climática</option>
                        <option value="SENSOR">Sensor</option>
                        <option value="ACTUADOR">Actuador</option>
                        <option value="BALANZA">Balanza</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Frecuencia Mantenimiento (horas)</label>
                    <input type="number" name="frecuenciaMantenimiento" value="500" class="w-full border rounded-lg px-3 py-2">
                </div>
                <div class="flex gap-3 mt-4">
                    <button type="submit" class="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Guardar</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="border border-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formEquipo').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await apiRequest('/api/equipos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            modal.remove();
            mostrarToast('Equipo registrado exitosamente');
            cargarEquipos();
        } catch (error) {
            mostrarToast('Error al registrar equipo', 'error');
        }
    });
}

async function registrarUsoEquipo(id) {
    const horas = prompt('Ingrese horas de uso:');
    if (horas && !isNaN(horas)) {
        try {
            await apiRequest(`/api/equipos/${id}/uso`, {
                method: 'POST',
                body: JSON.stringify({ horas: parseFloat(horas) })
            });
            mostrarToast('Uso registrado exitosamente');
            cargarEquipos();
        } catch (error) {
            mostrarToast('Error al registrar uso', 'error');
        }
    }
}

async function programarMantenimiento(id) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content p-6">
            <h3 class="text-xl font-bold mb-4">🔧 Programar Mantenimiento</h3>
            <form id="formMantenimiento">
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Tipo de Mantenimiento</label>
                    <select name="tipo" class="w-full border rounded-lg px-3 py-2">
                        <option value="PREVENTIVO">Preventivo</option>
                        <option value="CORRECTIVO">Correctivo</option>
                        <option value="PREDICTIVO">Predictivo</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium mb-1">Descripción</label>
                    <textarea name="descripcion" rows="3" required class="w-full border rounded-lg px-3 py-2"></textarea>
                </div>
                <div class="flex gap-3 mt-4">
                    <button type="submit" class="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">Programar</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="border border-gray-300 px-4 py-2 rounded-lg">Cancelar</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('formMantenimiento').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await apiRequest(`/api/equipos/${id}/mantenimiento`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            modal.remove();
            mostrarToast('Mantenimiento programado exitosamente');
            cargarEquipos();
        } catch (error) {
            mostrarToast('Error al programar mantenimiento', 'error');
        }
    });
}

async function verHistorialMantenimiento(id) {
    window.open(`/api/reportes/mantenimiento/${id}`, '_blank');
}

// ============================================
// CONFIGURACIÓN
// ============================================

async function cargarConfiguracion() {
    try {
        const response = await apiRequest('/api/configuracion');
        const configs = await response.json();
        
        const container = document.getElementById('config-lista');
        container.innerHTML = configs.map(config => `
            <div class="flex justify-between items-center py-3 border-b">
                <div>
                    <div class="font-medium text-gray-800">${config.clave}</div>
                    <div class="text-sm text-gray-500">${config.descripcion || 'Sin descripción'}</div>
                </div>
                <div class="flex items-center gap-2">
                    ${config.tipo === 'BOOLEAN' ? `
                        <select id="val_${config.clave}" class="border rounded px-2 py-1">
                            <option value="true" ${config.valor === 'true' ? 'selected' : ''}>Sí</option>
                            <option value="false" ${config.valor === 'false' ? 'selected' : ''}>No</option>
                        </select>
                    ` : `
                        <input type="${config.tipo === 'NUMBER' ? 'number' : 'text'}" 
                               id="val_${config.clave}" 
                               value="${config.valor}" 
                               class="border rounded px-2 py-1 w-32">
                    `}
                    <button onclick="actualizarConfig('${config.clave}')" 
                            class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Guardar
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando configuración:', error);
        mostrarToast('Error al cargar configuración', 'error');
    }
}

async function actualizarConfig(clave) {
    const input = document.getElementById(`val_${clave}`);
    if (!input) return;
    
    const valor = input.value;
    
    try {
        await apiRequest(`/api/configuracion/${clave}`, {
            method: 'PUT',
            body: JSON.stringify({ valor })
        });
        mostrarToast('Configuración actualizada');
    } catch (error) {
        mostrarToast('Error al actualizar configuración', 'error');
    }
}

// ============================================
// REPORTES
// ============================================

async function cargarLotesParaSelect() {
    try {
        const response = await apiRequest('/api/lotes');
        const lotes = await response.json();
        const select = document.getElementById('reporteLoteId');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar lote...</option>' + 
                lotes.map(l => `<option value="${l.id}">${l.codigo} - ${l.productor || 'N/A'} (${l.estado})</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando lotes para select:', error);
    }
}

async function cargarEquiposParaSelect() {
    try {
        const response = await apiRequest('/api/equipos');
        const equipos = await response.json();
        const select = document.getElementById('reporteEquipoId');
        if (select) {
            select.innerHTML = '<option value="">Seleccionar equipo...</option>' + 
                equipos.map(e => `<option value="${e.id}">${e.nombre} (${e.codigo}) - ${e.estado}</option>`).join('');
        }
    } catch (error) {
        console.error('Error cargando equipos para select:', error);
    }
}

async function generarReporteLote() {
    const loteId = document.getElementById('reporteLoteId')?.value;
    if (!loteId) {
        mostrarToast('Seleccione un lote', 'warning');
        return;
    }
    window.open(`/api/reportes/lote/${loteId}`, '_blank');
}

async function generarReporteMantenimiento() {
    const equipoId = document.getElementById('reporteEquipoId')?.value;
    if (!equipoId) {
        mostrarToast('Seleccione un equipo', 'warning');
        return;
    }
    window.open(`/api/reportes/mantenimiento/${equipoId}`, '_blank');
}

// ============================================
// INICIALIZACIÓN
// ============================================

// Formulario de nuevo lote
document.addEventListener('DOMContentLoaded', () => {
    const formNuevoLote = document.getElementById('formNuevoLote');
    if (formNuevoLote) {
        formNuevoLote.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.pesoKg = parseFloat(data.pesoKg);
            data.numeroVainas = data.numeroVainas ? parseInt(data.numeroVainas) : null;
            
            try {
                const response = await apiRequest('/api/lotes', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    mostrarToast('Lote registrado exitosamente');
                    showSection('lotes');
                    cargarLotes();
                } else {
                    const error = await response.json();
                    mostrarToast(error.error || 'Error al registrar lote', 'error');
                }
            } catch (error) {
                mostrarToast('Error al registrar lote', 'error');
            }
        });
    }
    
    // Verificar sesión
    if (token) {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                currentUser = JSON.parse(userStr);
                document.getElementById('userInfo').innerHTML = `
                    <div class="text-sm">${currentUser.nombre}</div>
                    <div class="text-xs opacity-75">${currentUser.rol}</div>
                `;
            }
            showSection('dashboard');
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            logout();
        }
    } else {
        mostrarLogin();
    }
});