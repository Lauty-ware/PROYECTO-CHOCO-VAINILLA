const { EstadoLote, CalidadLote } = require('./Enums');

class Lote {
    constructor(data = {}) {
        this.id = data.id || Date.now();
        this.codigo = data.codigo || `LOT-${this.id}`;
        this.fechaRecepcion = data.fechaRecepcion || new Date().toISOString();
        this.productor = data.productor || '';
        this.finca = data.finca || '';
        this.pesoKg = data.pesoKg || 0;
        this.numeroVainas = data.numeroVainas || 0;
        this.estado = data.estado || EstadoLote.RECIBIDO;
        this.calidadFinal = data.calidadFinal || null;
        this.puntajeCalidad = data.puntajeCalidad || 0;
        this.observaciones = data.observaciones || '';
        
        // Timestamps
        this.fechaInspeccion = data.fechaInspeccion || null;
        this.fechaAnalisis = data.fechaAnalisis || null;
        this.fechaClasificacion = data.fechaClasificacion || null;
        this.fechaProduccion = data.fechaProduccion || null;
        this.fechaTerminado = data.fechaTerminado || null;
        
        // Resultados
        this.inspeccionOrganoleptica = data.inspeccionOrganoleptica || null;
        this.analisisFisicoQuimico = data.analisisFisicoQuimico || null;
        this.patogenos = data.patogenos || [];
        this.clasificacionCriterios = data.clasificacionCriterios || {};
        
        // Historial
        this.historialEstados = data.historialEstados || [{
            estado: EstadoLote.RECIBIDO,
            fecha: this.fechaRecepcion,
            usuario: data.usuarioRecepcion || 'sistema'
        }];
    }
    
    // Cambiar estado con registro
    cambiarEstado(nuevoEstado, usuario, motivo = '') {
        this.estado = nuevoEstado;
        this.historialEstados.push({
            estado: nuevoEstado,
            fecha: new Date().toISOString(),
            usuario: usuario,
            motivo: motivo
        });
        
        // Actualizar timestamps específicos
        switch(nuevoEstado) {
            case EstadoLote.EN_INSPECCION:
                this.fechaInspeccion = new Date().toISOString();
                break;
            case EstadoLote.EN_ANALISIS:
                this.fechaAnalisis = new Date().toISOString();
                break;
            case EstadoLote.EN_CLASIFICACION:
                this.fechaClasificacion = new Date().toISOString();
                break;
            case EstadoLote.EN_PRODUCCION:
                this.fechaProduccion = new Date().toISOString();
                break;
            case EstadoLote.TERMINADO:
                this.fechaTerminado = new Date().toISOString();
                break;
        }
        
        return this;
    }
    
    // Registrar inspección organoléptica
    registrarInspeccionOrganoleptica(datos, usuario) {
        this.inspeccionOrganoleptica = {
            ...datos,
            fecha: new Date().toISOString(),
            usuario: usuario
        };
        
        const esAprobado = datos.resultado === 'APROBADO';
        this.cambiarEstado(
            esAprobado ? EstadoLote.INSPECCION_OK : EstadoLote.INSPECCION_NOK,
            usuario,
            esAprobado ? 'Inspección aprobada' : `Inspección rechazada: ${datos.observaciones}`
        );
        
        return this;
    }
    
    // Registrar análisis físico/químico
    registrarAnalisis(datos, usuario) {
        this.analisisFisicoQuimico = {
            humedad: datos.humedad,
            ph: datos.ph,
            brix: datos.brix,
            vainillina: datos.vainillina,
            temperatura: datos.temperatura,
            observaciones: datos.observaciones,
            fecha: new Date().toISOString(),
            usuario: usuario
        };
        
        // Verificar si cumple estándares mínimos
        const cumpleEstandares = 
            datos.humedad >= 65 && datos.humedad <= 75 &&
            datos.ph >= 5.5 && datos.ph <= 6.5 &&
            datos.vainillina >= 1.5;
        
        this.cambiarEstado(
            cumpleEstandares ? EstadoLote.ANALISIS_OK : EstadoLote.ANALISIS_NOK,
            usuario,
            cumpleEstandares ? 'Análisis aprobado' : `Análisis rechazado: ${datos.observaciones}`
        );
        
        return this;
    }
    
    // Registrar detección de patógenos
    registrarPatogenos(patogenosDetectados, usuario) {
        this.patogenos = patogenosDetectados.map(p => ({
            ...p,
            fechaDeteccion: new Date().toISOString(),
            usuario: usuario
        }));
        
        // Si hay patógenos de nivel alto o crítico, rechazar lote
        const tienePatogenoAlto = patogenosDetectados.some(p => 
            p.nivel === 'ALTO' || p.nivel === 'CRITICO'
        );
        
        if (tienePatogenoAlto) {
            this.cambiarEstado(EstadoLote.RECHAZADO, usuario, 'Presencia de patógenos de alto riesgo');
        }
        
        return this;
    }
    
    // Clasificar lote basado en múltiples criterios
    clasificar(criterios, usuario) {
        this.clasificacionCriterios = {
            ...criterios,
            fecha: new Date().toISOString(),
            usuario: usuario
        };
        
        // Calcular puntaje de calidad
        let puntaje = 0;
        
        // Criterio 1: Tamaño de vainas (máx 30 puntos)
        if (criterios.tamanioPromedio) {
            if (criterios.tamanioPromedio >= 18) puntaje += 30;
            else if (criterios.tamanioPromedio >= 15) puntaje += 20;
            else if (criterios.tamanioPromedio >= 12) puntaje += 10;
        }
        
        // Criterio 2: Color (máx 25 puntos)
        if (criterios.color) {
            const colorScore = { 'VERDE_OSCURO': 25, 'VERDE': 20, 'VERDE_CLARO': 10, 'AMARILLO': 5 };
            puntaje += colorScore[criterios.color] || 0;
        }
        
        // Criterio 3: Madurez (máx 25 puntos)
        if (criterios.madurez) {
            const madurezScore = { 'OPTIMA': 25, 'BUENA': 20, 'REGULAR': 10, 'MALA': 0 };
            puntaje += madurezScore[criterios.madurez] || 0;
        }
        
        // Criterio 4: Ausencia de defectos (máx 20 puntos)
        if (criterios.defectos !== undefined) {
            puntaje += Math.max(0, 20 - (criterios.defectos * 2));
        }
        
        this.puntajeCalidad = Math.min(100, puntaje);
        
        // Determinar calidad final
        if (this.patogenos.length > 0 && this.patogenos.some(p => p.nivel === 'ALTO')) {
            this.calidadFinal = CalidadLote.RECHAZADO.nombre;
        } else if (this.puntajeCalidad >= CalidadLote.PREMIUM.puntajeMin) {
            this.calidadFinal = CalidadLote.PREMIUM.nombre;
        } else if (this.puntajeCalidad >= CalidadLote.PRIMERA.puntajeMin) {
            this.calidadFinal = CalidadLote.PRIMERA.nombre;
        } else if (this.puntajeCalidad >= CalidadLote.SEGUNDA.puntajeMin) {
            this.calidadFinal = CalidadLote.SEGUNDA.nombre;
        } else {
            this.calidadFinal = CalidadLote.RECHAZADO.nombre;
        }
        
        this.cambiarEstado(EstadoLote.CLASIFICADO, usuario, `Clasificado como ${this.calidadFinal}`);
        
        return {
            puntaje: this.puntajeCalidad,
            calidad: this.calidadFinal,
            criteriosAplicados: criterios
        };
    }
    
    // Calcular tiempo total de proceso
    calcularTiempoProceso() {
        if (!this.fechaRecepcion) return null;
        
        const fin = this.fechaTerminado || new Date().toISOString();
        const inicio = new Date(this.fechaRecepcion);
        const finDate = new Date(fin);
        
        const diferenciaHoras = (finDate - inicio) / 1000 / 3600;
        
        return {
            horas: Math.round(diferenciaHoras * 10) / 10,
            dias: Math.round(diferenciaHoras / 24 * 10) / 10,
            inicio: this.fechaRecepcion,
            fin: fin
        };
    }
    
    // Generar resumen del lote
    getResumen() {
        return {
            id: this.id,
            codigo: this.codigo,
            productor: this.productor,
            pesoKg: this.pesoKg,
            estado: this.estado,
            calidad: this.calidadFinal,
            puntaje: this.puntajeCalidad,
            tiempoProceso: this.calcularTiempoProceso(),
            patogenosDetectados: this.patogenos.length,
            historialEstados: this.historialEstados
        };
    }
    
    // Convertir a JSON
    toJSON() {
        return {
            id: this.id,
            codigo: this.codigo,
            fechaRecepcion: this.fechaRecepcion,
            productor: this.productor,
            finca: this.finca,
            pesoKg: this.pesoKg,
            numeroVainas: this.numeroVainas,
            estado: this.estado,
            calidadFinal: this.calidadFinal,
            puntajeCalidad: this.puntajeCalidad,
            observaciones: this.observaciones,
            fechaInspeccion: this.fechaInspeccion,
            fechaAnalisis: this.fechaAnalisis,
            fechaClasificacion: this.fechaClasificacion,
            fechaProduccion: this.fechaProduccion,
            fechaTerminado: this.fechaTerminado,
            inspeccionOrganoleptica: this.inspeccionOrganoleptica,
            analisisFisicoQuimico: this.analisisFisicoQuimico,
            patogenos: this.patogenos,
            clasificacionCriterios: this.clasificacionCriterios,
            historialEstados: this.historialEstados
        };
    }
}

module.exports = { Lote };