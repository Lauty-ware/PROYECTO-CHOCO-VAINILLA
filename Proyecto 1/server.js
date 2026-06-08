const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { Etapa } = require('Proyecto 1/src/core/Etapa');
const { Sensor } = require('./src/core/Sensor');
const { ReleResistencia, Ventilador, Humidificador } = require('./src/core/Actuador');
const { CamaraClimatica } = require('./src/core/CamaraClimatica');
const { DataService } = require('./src/services/DataService');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Servir index.html en la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Instancias globales (simulando hardware)
const sensorTempExt = new Sensor('tempExterior', 28.5);
const sensorTempInt = new Sensor('tempInterior', 25.0);
const sensorHumedad = new Sensor('humedad', 85.0);
const resistencia = new ReleResistencia();
const ventilador = new Ventilador();
const humidificador = new Humidificador();

const camara = new CamaraClimatica(sensorTempInt, sensorHumedad, resistencia, ventilador, humidificador);
const dataService = new DataService();

// Variables de estado
let cicloActivo = false;
let intervaloMonitor = null;

// API Endpoints

// Iniciar nuevo lote
app.post('/api/lote/nuevo', (req, res) => {
    console.log('📨 POST /api/lote/nuevo recibido');
    
    if (cicloActivo) {
        return res.status(400).json({ error: 'Ya hay un ciclo activo. Finalice el actual primero.' });
    }
    
    const lote = camara.iniciarNuevoLote();
    cicloActivo = true;
    
    // Iniciar monitoreo automático
    if (intervaloMonitor) clearInterval(intervaloMonitor);
    intervaloMonitor = setInterval(() => {
        if (cicloActivo && camara.loteActual) {
            camara.actualizar();
            
            // Verificar si la etapa actual ha terminado
            const etapaActual = camara.loteActual.etapaActual;
            const tiempoTranscurrido = (Date.now() - camara.loteActual.inicioEtapaActual) / 1000 / 3600;
            
            if (tiempoTranscurrido >= etapaActual.duracionHoras) {
                const avanzado = camara.loteActual.avanzarEtapa();
                if (!avanzado) {
                    console.log('✅ Ciclo de curado completado');
                    cicloActivo = false;
                    clearInterval(intervaloMonitor);
                    dataService.guardarLote(camara.loteActual);
                }
            }
        }
    }, 5000);
    
    res.json({ 
        message: 'Lote iniciado exitosamente', 
        lote: {
            id: lote.id,
            fechaInicio: lote.fechaInicio,
            etapaActual: lote.etapaActual.nombre
        }
    });
});

// Obtener estado actual
app.get('/api/lote/actual', (req, res) => {
    console.log('📨 GET /api/lote/actual');
    
    if (!cicloActivo || !camara.loteActual) {
        return res.json({ 
            activo: false,
            message: 'No hay ciclo activo' 
        });
    }
    
    const lote = camara.loteActual;
    const etapaActual = lote.etapaActual;
    const tiempoTranscurrido = (Date.now() - lote.inicioEtapaActual) / 1000 / 3600;
    const tiempoRestante = Math.max(0, etapaActual.duracionHoras - tiempoTranscurrido);
    
    res.json({
        activo: true,
        loteId: lote.id,
        etapa: {
            nombre: etapaActual.nombre,
            temperaturaObjetivo: etapaActual.temperaturaObjetivo,
            duracionHoras: etapaActual.duracionHoras,
            progreso: Math.min(100, (tiempoTranscurrido / etapaActual.duracionHoras) * 100),
            tiempoRestanteHoras: Math.round(tiempoRestante * 10) / 10
        },
        sensores: {
            tempExterior: Math.round(sensorTempExt.leer() * 10) / 10,
            tempInterior: Math.round(sensorTempInt.leer() * 10) / 10,
            humedad: Math.round(sensorHumedad.leer() * 10) / 10
        },
        actuadores: {
            resistencia: resistencia.encendido,
            ventilador: ventilador.encendido,
            humidificador: humidificador.encendido
        },
        calidadEstimada: lote.calidadEstimada || 'Procesando...'
    });
});

// Obtener historial de lotes
app.get('/api/historial', (req, res) => {
    console.log('📨 GET /api/historial');
    const historial = dataService.listarLotes();
    res.json(historial);
});

// Obtener un lote específico
app.get('/api/lote/:id', (req, res) => {
    const lote = dataService.cargarLote(req.params.id);
    if (!lote) {
        return res.status(404).json({ error: 'Lote no encontrado' });
    }
    res.json(lote);
});

// Finalizar ciclo actual
app.post('/api/lote/finalizar', (req, res) => {
    console.log('📨 POST /api/lote/finalizar');
    
    if (!cicloActivo || !camara.loteActual) {
        return res.status(400).json({ error: 'No hay ciclo activo' });
    }
    
    dataService.guardarLote(camara.loteActual);
    cicloActivo = false;
    if (intervaloMonitor) clearInterval(intervaloMonitor);
    
    res.json({ message: 'Ciclo finalizado y guardado' });
});

// Simular recalibración de sensores
app.post('/api/sensores/recalibrar', (req, res) => {
    sensorTempInt.valor = req.body.tempInterior || sensorTempInt.valor;
    sensorHumedad.valor = req.body.humedad || sensorHumedad.valor;
    res.json({ message: 'Sensores recalibrados' });
});

// Endpoint de prueba para verificar que el servidor funciona
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🌱 Sistema de Curado de Vainilla - Chocó Biogeográfico`);
    console.log(`📡 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🎛️ Panel de control disponible en http://localhost:${PORT}`);
    console.log(`🔧 API Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(60));
});