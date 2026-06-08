const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
    }
    
    async connect() {
        this.db = await open({
            filename: path.join(__dirname, '../../data/gestion.db'),
            driver: sqlite3.Database
        });
        
        await this.initTables();
        this.initialized = true;
        console.log('✅ Base de datos conectada');
        return this.db;
    }
    
    async initTables() {
        // Tabla de lotes
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS lotes (
                id INTEGER PRIMARY KEY,
                codigo TEXT UNIQUE,
                fechaRecepcion TEXT,
                productor TEXT,
                finca TEXT,
                pesoKg REAL,
                numeroVainas INTEGER,
                estado TEXT,
                calidadFinal TEXT,
                puntajeCalidad REAL,
                observaciones TEXT,
                datos JSON,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Tabla de inspecciones
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS inspecciones (
                id INTEGER PRIMARY KEY,
                loteId INTEGER,
                tipo TEXT,
                resultado TEXT,
                datos JSON,
                usuario TEXT,
                fecha TEXT,
                FOREIGN KEY (loteId) REFERENCES lotes(id)
            )
        `);
        
        // Tabla de equipos
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS equipos (
                id INTEGER PRIMARY KEY,
                codigo TEXT UNIQUE,
                nombre TEXT,
                tipo TEXT,
                estado TEXT,
                horasUso REAL,
                datos JSON,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Tabla de mantenimientos
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS mantenimientos (
                id INTEGER PRIMARY KEY,
                equipoId INTEGER,
                tipo TEXT,
                fechaProgramada TEXT,
                fechaEjecucion TEXT,
                tecnico TEXT,
                descripcion TEXT,
                costo REAL,
                resultado TEXT,
                FOREIGN KEY (equipoId) REFERENCES equipos(id)
            )
        `);
        
        // Tabla de usuarios
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY,
                nombre TEXT,
                email TEXT UNIQUE,
                rol TEXT,
                password TEXT,
                activo INTEGER DEFAULT 1,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Tabla de logs
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY,
                nivel TEXT,
                mensaje TEXT,
                origen TEXT,
                datos JSON,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Tabla de configuración
        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave TEXT PRIMARY KEY,
                valor TEXT,
                descripcion TEXT,
                updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Insertar configuraciones por defecto
        await this.initDefaultConfig();
    }
    
    async initDefaultConfig() {
        const configs = [
            { clave: 'humedad_min', valor: '65', descripcion: 'Humedad mínima aceptable (%)' },
            { clave: 'humedad_max', valor: '75', descripcion: 'Humedad máxima aceptable (%)' },
            { clave: 'ph_min', valor: '5.5', descripcion: 'pH mínimo aceptable' },
            { clave: 'ph_max', valor: '6.5', descripcion: 'pH máximo aceptable' },
            { clave: 'vainillina_min', valor: '1.5', descripcion: 'Vainillina mínima aceptable (%)' },
            { clave: 'tamanio_minimo_premium', valor: '18', descripcion: 'Tamaño mínimo para Premium (cm)' },
            { clave: 'horas_mantenimiento_preventivo', valor: '500', descripcion: 'Horas entre mantenimientos preventivos' },
            { clave: 'tiempo_maximo_proceso_horas', valor: '336', descripcion: 'Tiempo máximo de proceso (horas)' }
        ];
        
        for (const config of configs) {
            await this.db.exec(`
                INSERT OR IGNORE INTO configuracion (clave, valor, descripcion)
                VALUES ('${config.clave}', '${config.valor}', '${config.descripcion}')
            `);
        }
    }
    
    async getConfig(clave) {
        const result = await this.db.get('SELECT valor FROM configuracion WHERE clave = ?', clave);
        return result ? result.valor : null;
    }
    
    async setConfig(clave, valor, usuario) {
        await this.db.exec(`
            UPDATE configuracion 
            SET valor = '${valor}', updatedAt = CURRENT_TIMESTAMP
            WHERE clave = '${clave}'
        `);
        
        await this.registrarLog('INFO', `Configuración actualizada: ${clave}=${valor}`, 'Database', { usuario });
    }
    
    async getAllConfig() {
        return await this.db.all('SELECT * FROM configuracion');
    }
    
    async guardarLote(lote) {
        const exists = await this.db.get('SELECT id FROM lotes WHERE id = ?', lote.id);
        
        if (exists) {
            await this.db.exec(`
                UPDATE lotes SET
                    estado = '${lote.estado}',
                    calidadFinal = '${lote.calidadFinal}',
                    puntajeCalidad = ${lote.puntajeCalidad},
                    datos = '${JSON.stringify(lote.toJSON())}',
                    updatedAt = CURRENT_TIMESTAMP
                WHERE id = ${lote.id}
            `);
        } else {
            await this.db.exec(`
                INSERT INTO lotes (id, codigo, fechaRecepcion, productor, finca, pesoKg, numeroVainas, estado, calidadFinal, puntajeCalidad, observaciones, datos)
                VALUES (${lote.id}, '${lote.codigo}', '${lote.fechaRecepcion}', '${lote.productor}', '${lote.finca}', ${lote.pesoKg}, ${lote.numeroVainas}, '${lote.estado}', '${lote.calidadFinal}', ${lote.puntajeCalidad}, '${lote.observaciones}', '${JSON.stringify(lote.toJSON())}')
            `);
        }
        
        return lote;
    }
    
    async getLote(id) {
        const row = await this.db.get('SELECT * FROM lotes WHERE id = ?', id);
        if (row) {
            return JSON.parse(row.datos);
        }
        return null;
    }
    
    async getLotes(filtros = {}) {
        let query = 'SELECT * FROM lotes';
        const condiciones = [];
        
        if (filtros.estado) condiciones.push(`estado = '${filtros.estado}'`);
        if (filtros.calidad) condiciones.push(`calidadFinal = '${filtros.calidad}'`);
        if (filtros.fechaInicio) condiciones.push(`fechaRecepcion >= '${filtros.fechaInicio}'`);
        if (filtros.fechaFin) condiciones.push(`fechaRecepcion <= '${filtros.fechaFin}'`);
        
        if (condiciones.length > 0) {
            query += ' WHERE ' + condiciones.join(' AND ');
        }
        
        query += ' ORDER BY fechaRecepcion DESC';
        
        const rows = await this.db.all(query);
        return rows.map(row => JSON.parse(row.datos));
    }
    
    async guardarEquipo(equipo) {
        const exists = await this.db.get('SELECT id FROM equipos WHERE id = ?', equipo.id);
        
        if (exists) {
            await this.db.exec(`
                UPDATE equipos SET
                    estado = '${equipo.estado}',
                    horasUso = ${equipo.horasUso},
                    datos = '${JSON.stringify(equipo.toJSON())}'
                WHERE id = ${equipo.id}
            `);
        } else {
            await this.db.exec(`
                INSERT INTO equipos (id, codigo, nombre, tipo, estado, horasUso, datos)
                VALUES (${equipo.id}, '${equipo.codigo}', '${equipo.nombre}', '${equipo.tipo}', '${equipo.estado}', ${equipo.horasUso}, '${JSON.stringify(equipo.toJSON())}')
            `);
        }
        
        return equipo;
    }
    
    async registrarLog(nivel, mensaje, origen, datos = {}) {
        await this.db.exec(`
            INSERT INTO logs (nivel, mensaje, origen, datos)
            VALUES ('${nivel}', '${mensaje.replace(/'/g, "''")}', '${origen}', '${JSON.stringify(datos)}')
        `);
    }
    
    async getLogs(limit = 100, nivel = null) {
        let query = 'SELECT * FROM logs';
        if (nivel) query += ` WHERE nivel = '${nivel}'`;
        query += ` ORDER BY timestamp DESC LIMIT ${limit}`;
        
        return await this.db.all(query);
    }
    
    async getEstadisticas() {
        const stats = {};
        
        // Total lotes
        const totalLotes = await this.db.get('SELECT COUNT(*) as total FROM lotes');
        stats.totalLotes = totalLotes.total;
        
        // Lotes por calidad
        const calidadStats = await this.db.all(`
            SELECT calidadFinal, COUNT(*) as count 
            FROM lotes 
            WHERE calidadFinal IS NOT NULL 
            GROUP BY calidadFinal
        `);
        stats.calidadDistribucion = calidadStats;
        
        // Tiempo promedio de proceso
        const tiempoPromedio = await this.db.get(`
            SELECT AVG(
                (julianday(updatedAt) - julianday(fechaRecepcion)) * 24
            ) as promedioHoras
            FROM lotes 
            WHERE calidadFinal IS NOT NULL
        `);
        stats.tiempoPromedioHoras = tiempoPromedio.promedioHoras || 0;
        
        // Tasa de rechazo
        const rechazados = await this.db.get(`
            SELECT COUNT(*) as count FROM lotes WHERE estado = 'RECHAZADO'
        `);
        stats.tasaRechazo = totalLotes.total > 0 ? (rechazados.count / totalLotes.total) * 100 : 0;
        
        return stats;
    }
    
    async crearUsuario(nombre, email, rol, passwordHash) {
        const result = await this.db.exec(`
            INSERT INTO usuarios (nombre, email, rol, password)
            VALUES ('${nombre}', '${email}', '${rol}', '${passwordHash}')
        `);
        return result;
    }
    
    async getUsuarioPorEmail(email) {
        return await this.db.get('SELECT * FROM usuarios WHERE email = ?', email);
    }
    
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = { Database };