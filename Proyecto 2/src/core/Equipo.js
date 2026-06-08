const { EstadoEquipo, TipoMantenimiento } = require('./Enums');

class Equipo {
    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.codigo = data.codigo || `EQ-${this.id}`;
        this.nombre = data.nombre || '';
        this.tipo = data.tipo || ''; // camara_climatica, sensor, actuador, etc.
        this.marca = data.marca || '';
        this.modelo = data.modelo || '';
        this.fechaInstalacion = data.fechaInstalacion || new Date().toISOString();
        this.estado = data.estado || EstadoEquipo.OPERATIVO;
        this.horasUso = data.horasUso || 0;
        this.ultimoMantenimiento = data.ultimoMantenimiento || null;
        this.proximoMantenimiento = data.proximoMantenimiento || null;
        this.horasMantenimientoPreventivo = data.horasMantenimientoPreventivo || 500;
        this.parametros = data.parametros || {};
        this.historialMantenimientos = data.historialMantenimientos || [];
        this.alarmas = data.alarmas || [];
    }
    
    // Registrar uso del equipo
    registrarUso(horas, operacion) {
        this.horasUso += horas;
        this.parametros.ultimaOperacion = operacion;
        this.parametros.ultimaFechaUso = new Date().toISOString();
        
        // Verificar si necesita mantenimiento
        if (this.necesitaMantenimiento()) {
            this.generarAlarma('MANTENIMIENTO_PROGRAMADO', 
                `Equipo ${this.nombre} requiere mantenimiento. Horas uso: ${this.horasUso}`);
        }
        
        return this;
    }
    
    // Verificar si necesita mantenimiento
    necesitaMantenimiento() {
        if (!this.ultimoMantenimiento) return true;
        
        const horasDesdeUltimoMant = this.horasUso - this.ultimoMantenimiento.horasUso;
        return horasDesdeUltimoMant >= this.horasMantenimientoPreventivo;
    }
    
    // Programar mantenimiento
    programarMantenimiento(tipo, fechaProgramada, tecnico, descripcion) {
        const mantenimiento = {
            id: Date.now(),
            tipo: tipo,
            fechaProgramada: fechaProgramada,
            tecnico: tecnico,
            descripcion: descripcion,
            estado: 'PROGRAMADO'
        };
        
        this.proximoMantenimiento = mantenimiento;
        this.estado = EstadoEquipo.MANTENIMIENTO;
        
        return mantenimiento;
    }
    
    // Ejecutar mantenimiento
    ejecutarMantenimiento(mantenimientoId, resultado, costo) {
        const mantenimiento = this.proximoMantenimiento;
        if (mantenimiento && mantenimiento.id === mantenimientoId) {
            mantenimiento.estado = 'COMPLETADO';
            mantenimiento.fechaEjecucion = new Date().toISOString();
            mantenimiento.resultado = resultado;
            mantenimiento.costo = costo;
            
            this.historialMantenimientos.push(mantenimiento);
            this.ultimoMantenimiento = {
                fecha: mantenimiento.fechaEjecucion,
                horasUso: this.horasUso,
                tipo: mantenimiento.tipo
            };
            this.proximoMantenimiento = null;
            this.estado = EstadoEquipo.OPERATIVO;
            
            return mantenimiento;
        }
        return null;
    }
    
    // Generar alarma
    generarAlarma(tipo, mensaje) {
        const alarma = {
            id: Date.now(),
            tipo: tipo,
            mensaje: mensaje,
            fecha: new Date().toISOString(),
            resuelta: false
        };
        this.alarmas.push(alarma);
        return alarma;
    }
    
    // Resolver alarma
    resolverAlarma(alarmaId, solucion) {
        const alarma = this.alarmas.find(a => a.id === alarmaId);
        if (alarma) {
            alarma.resuelta = true;
            alarma.solucion = solucion;
            alarma.fechaResolucion = new Date().toISOString();
        }
        return alarma;
    }
    
    // Obtener estadísticas de mantenimiento
    getEstadisticasMantenimiento() {
        const mantenimientos = this.historialMantenimientos;
        const preventivos = mantenimientos.filter(m => m.tipo === TipoMantenimiento.PREVENTIVO);
        const correctivos = mantenimientos.filter(m => m.tipo === TipoMantenimiento.CORRECTIVO);
        
        const costoTotal = mantenimientos.reduce((sum, m) => sum + (m.costo || 0), 0);
        
        return {
            totalMantenimientos: mantenimientos.length,
            preventivos: preventivos.length,
            correctivos: correctivos.length,
            costoTotal: costoTotal,
            tiempoPromedioEntreMant: this.horasUso / (mantenimientos.length || 1),
            ultimoMantenimiento: this.ultimoMantenimiento,
            proximoMantenimiento: this.proximoMantenimiento
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            codigo: this.codigo,
            nombre: this.nombre,
            tipo: this.tipo,
            marca: this.marca,
            modelo: this.modelo,
            fechaInstalacion: this.fechaInstalacion,
            estado: this.estado,
            horasUso: this.horasUso,
            ultimoMantenimiento: this.ultimoMantenimiento,
            proximoMantenimiento: this.proximoMantenimiento,
            parametros: this.parametros,
            historialMantenimientos: this.historialMantenimientos,
            alarmasActivas: this.alarmas.filter(a => !a.resuelta)
        };
    }
}

module.exports = { Equipo }; 