// Configuración
const API_URL = 'http://localhost:3000/api';
let intervaloActualizacion = null;

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Panel de Control de Vainilla - Iniciado');
    console.log(`🔗 Conectando a API en: ${API_URL}`);
    
    // Verificar conexión con el servidor
    verificarConexion();
    
    // Configurar event listeners
    const btnIniciar = document.getElementById('btnIniciarLote');
    const btnFinalizar = document.getElementById('btnFinalizarLote');
    
    if (btnIniciar) {
        btnIniciar.addEventListener('click', iniciarNuevoLote);
        console.log('✅ Botón "Iniciar Lote" configurado');
    } else {
        console.error('❌ No se encontró el botón "btnIniciarLote"');
    }
    
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarLoteActual);
        console.log('✅ Botón "Finalizar Lote" configurado');
    } else {
        console.error('❌ No se encontró el botón "btnFinalizarLote"');
    }
    
    // Iniciar actualización periódica
    actualizarDashboard();
    intervaloActualizacion = setInterval(actualizarDashboard, 3000);
    
    // Cargar historial
    cargarHistorial();
});

async function verificarConexion() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ Conexión con el servidor establecida');
            mostrarNotificacion('Conectado al servidor', 'success');
        } else {
            console.error('❌ Error de conexión con el servidor');
            mostrarNotificacion('Error de conexión con el servidor', 'error');
        }
    } catch (error) {
        console.error('❌ No se pudo conectar al servidor:', error);
        mostrarNotificacion('No se puede conectar al servidor. ¿Está corriendo?', 'error');
    }
}

async function iniciarNuevoLote() {
    console.log('🚀 Intentando iniciar nuevo lote...');
    
    try {
        const response = await fetch(`${API_URL}/lote/nuevo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', data);
        
        if (response.ok) {
            mostrarNotificacion('✅ ' + data.message, 'success');
            actualizarDashboard();
            cargarHistorial();
        } else {
            mostrarNotificacion('❌ Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al iniciar lote:', error);
        mostrarNotificacion('❌ Error de conexión. ¿El servidor está corriendo?', 'error');
    }
}

async function finalizarLoteActual() {
    console.log('⏹️ Intentando finalizar lote actual...');
    
    try {
        const response = await fetch(`${API_URL}/lote/finalizar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarNotificacion('✅ ' + data.message, 'success');
            actualizarDashboard();
            cargarHistorial();
        } else {
            mostrarNotificacion('❌ Error: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al finalizar lote:', error);
        mostrarNotificacion('❌ Error de conexión', 'error');
    }
}

async function actualizarDashboard() {
    try {
        const response = await fetch(`${API_URL}/lote/actual`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const estado = await response.json();
        console.log('Estado actual:', estado);
        
        if (estado.activo) {
            actualizarEstadoLote(estado);
            actualizarSensores(estado.sensores);
            actualizarActuadores(estado.actuadores);
            actualizarProgreso(estado);
        } else {
            mostrarSinCicloActivo();
        }
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
        const estadoLoteDiv = document.getElementById('estadoLote');
        if (estadoLoteDiv) {
            estadoLoteDiv.innerHTML = '<p class="loading">❌ Error de conexión con el servidor</p>';
        }
    }
}

function actualizarEstadoLote(estado) {
    const estadoLoteDiv = document.getElementById('estadoLote');
    if (!estadoLoteDiv) return;
    
    const html = `
        <div class="etapa-activa">
            📍 Etapa Actual: <strong>${estado.etapa.nombre}</strong>
        </div>
        <p>🆔 ID Lote: ${estado.loteId}</p>
        <p>🎯 Calidad Estimada: <strong>${estado.calidadEstimada}</strong></p>
        <p>⏱️ Tiempo restante: ${Math.floor(estado.etapa.tiempoRestanteHoras)} horas ${Math.round((estado.etapa.tiempoRestanteHoras % 1) * 60)} minutos</p>
    `;
    estadoLoteDiv.innerHTML = html;
}

function actualizarSensores(sensores) {
    const sensoresDiv = document.getElementById('sensoresInfo');
    if (!sensoresDiv) return;
    
    const html = `
        <div class="sensor-value">🌡️ Temp Exterior: ${sensores.tempExterior}°C</div>
        <div class="sensor-value">🌡️ Temp Interior: ${sensores.tempInterior}°C</div>
        <div class="sensor-value">💧 Humedad: ${sensores.humedad}%</div>
    `;
    sensoresDiv.innerHTML = html;
}

function actualizarActuadores(actuadores) {
    const actuadoresDiv = document.getElementById('actuadoresInfo');
    if (!actuadoresDiv) return;
    
    const html = `
        <div class="actuador-value">🔥 Resistencia: ${actuadores.resistencia ? 'ENCENDIDA ✅' : 'APAGADA ❌'}</div>
        <div class="actuador-value">💨 Ventilador: ${actuadores.ventilador ? 'ENCENDIDO ✅' : 'APAGADO ❌'}</div>
        <div class="actuador-value">💧 Humidificador: ${actuadores.humidificador ? 'ENCENDIDO ✅' : 'APAGADO ❌'}</div>
    `;
    actuadoresDiv.innerHTML = html;
}

function actualizarProgreso(estado) {
    const progresoDiv = document.getElementById('progresoInfo');
    if (!progresoDiv) return;
    
    const progreso = estado.etapa.progreso;
    const etapaNombre = estado.etapa.nombre;
    
    let descripcion = '';
    let icono = '';
    switch(etapaNombre) {
        case 'Escaldado':
            icono = '♨️';
            descripcion = 'Choque térmico a 63°C - Eliminando patógenos y activando enzimas';
            break;
        case 'Sudado':
            icono = '🍃';
            descripcion = 'Fermentación controlada - Desarrollando precursores aromáticos';
            break;
        case 'Secado':
            icono = '💨';
            descripcion = 'Reducción gradual de humedad al 30%';
            break;
        case 'Afinado':
            icono = '🌙';
            descripcion = 'Maduración en oscuridad - Potenciando vainillina';
            break;
        default:
            icono = '⚙️';
            descripcion = 'Procesando...';
    }
    
    const html = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progreso}%">
                ${Math.round(progreso)}%
            </div>
        </div>
        <p>🎯 Temperatura objetivo: ${estado.etapa.temperaturaObjetivo}°C</p>
        <p>${icono} ${descripcion}</p>
        <p>⏰ Duración de etapa: ${estado.etapa.duracionHoras} horas</p>
    `;
    progresoDiv.innerHTML = html;
}

function mostrarSinCicloActivo() {
    const estadoLoteDiv = document.getElementById('estadoLote');
    const sensoresDiv = document.getElementById('sensoresInfo');
    const actuadoresDiv = document.getElementById('actuadoresInfo');
    const progresoDiv = document.getElementById('progresoInfo');
    
    if (estadoLoteDiv) {
        estadoLoteDiv.innerHTML = `
            <p style="text-align: center; color: #4CAF50; padding: 20px;">
                🟢 SISTEMA LISTO<br>
                <strong>Presiona "Iniciar Nuevo Lote"</strong><br>
                para comenzar el proceso de curado tecnológico
            </p>
        `;
    }
    
    if (sensoresDiv) {
        sensoresDiv.innerHTML = '<p class="loading">⏳ Esperando inicio de ciclo...</p>';
    }
    
    if (actuadoresDiv) {
        actuadoresDiv.innerHTML = '<p class="loading">⏳ Esperando inicio de ciclo...</p>';
    }
    
    if (progresoDiv) {
        progresoDiv.innerHTML = '<p class="loading">⏳ Esperando inicio de ciclo...</p>';
    }
}

async function cargarHistorial() {
    try {
        const response = await fetch(`${API_URL}/historial`);
        if (!response.ok) throw new Error('Error al cargar historial');
        
        const lotes = await response.json();
        const historialDiv = document.getElementById('historialLista');
        
        if (!historialDiv) return;
        
        if (lotes.length === 0) {
            historialDiv.innerHTML = '<p class="loading">📭 No hay lotes registrados aún</p>';
            return;
        }
        
        let html = '';
        for (const lote of lotes.slice(0, 5)) {
            const fecha = new Date(lote.fechaInicio).toLocaleString('es-CO');
            const calidad = lote.calidadEstimada || 'En proceso';
            const etapaActual = lote.etapaActual || 'Completado';
            
            let calidadColor = '';
            if (calidad === 'Premium') calidadColor = '#4CAF50';
            else if (calidad === 'Primera') calidadColor = '#2196F3';
            else if (calidad === 'Segunda') calidadColor = '#FF9800';
            else calidadColor = '#999';
            
            html += `
                <div class="lote-item">
                    <h4>📦 Lote #${lote.id}</h4>
                    <p>📅 Inicio: ${fecha}</p>
                    <p>⭐ Calidad: <strong style="color: ${calidadColor}">${calidad}</strong></p>
                    <p>📍 Etapa final: ${etapaActual}</p>
                </div>
            `;
        }
        
        html += `<p style="text-align: center; margin-top: 10px; color: #999;"><small>📋 Mostrando últimos 5 lotes</small></p>`;
        historialDiv.innerHTML = html;
    } catch (error) {
        console.error('Error al cargar historial:', error);
        const historialDiv = document.getElementById('historialLista');
        if (historialDiv) {
            historialDiv.innerHTML = '<p class="loading">❌ Error al cargar historial</p>';
        }
    }
}

function mostrarNotificacion(mensaje, tipo) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-weight: bold;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacion.remove(), 300);
    }, 3000);
}

// Agregar estilos animados dinámicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);