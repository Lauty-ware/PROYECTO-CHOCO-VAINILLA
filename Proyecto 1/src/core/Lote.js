const { Etapa } = require('Proyecto 1/src/core/Etapa.js');
const fs = require('fs');

class Lote {
  constructor(id, fechaInicio) {
    this.id = id;
    this.fechaInicio = fechaInicio || new Date();
    this.etapaActual = Etapa.ESCALDADO;
    this.inicioEtapaActual = Date.now();
    this.historialEtapas = [];
    this.calidadEstimada = null;
    this.pesoInicialGramos = null;
    this.pesoFinalGramos = null;
    this.notas = [];
    this.incidencias = [];
  }
  
  setPesoInicial(gramos) {
    this.pesoInicialGramos = gramos;
    this.agregarNota(`Peso inicial registrado: ${gramos}g`);
  }
  
  setPesoFinal(gramos) {
    this.pesoFinalGramos = gramos;
    this.calcularRendimiento();
    this.agregarNota(`Peso final registrado: ${gramos}g`);
  }
  
  calcularRendimiento() {
    if (this.pesoInicialGramos && this.pesoFinalGramos) {
      const perdida = ((this.pesoInicialGramos - this.pesoFinalGramos) / this.pesoInicialGramos) * 100;
      this.rendimiento = {
        pesoInicial: this.pesoInicialGramos,
        pesoFinal: this.pesoFinalGramos,
        porcentajePerdida: Math.round(perdida * 10) / 10,
        eficiencia: Math.round((100 - perdida) * 10) / 10
      };
    }
  }
  
  avanzarEtapa() {
    const etapas = Etapa.getSecuenciaCompleta();
    const indiceActual = etapas.findIndex(e => e.nombre === this.etapaActual.nombre);
    
    if (indiceActual === -1) return false;
    
    // Registrar etapa completada
    this.historialEtapas.push({
      etapa: this.etapaActual.nombre,
      inicio: new Date(this.inicioEtapaActual).toISOString(),
      fin: new Date().toISOString(),
      duracionHoras: (Date.now() - this.inicioEtapaActual) / 1000 / 3600
    });
    
    // Avanzar a siguiente etapa
    if (indiceActual + 1 < etapas.length) {
      this.etapaActual = etapas[indiceActual + 1];
      this.inicioEtapaActual = Date.now();
      console.log(`📦 Lote ${this.id} avanzó a etapa: ${this.etapaActual.nombre}`);
      this.agregarNota(`Iniciando etapa: ${this.etapaActual.nombre}`);
      return true;
    } else {
      // Ciclo completado
      this.etapaActual = null;
      this.calcularCalidad();
      console.log(`✅ Lote ${this.id} completado. Calidad: ${this.calidadEstimada}`);
      this.agregarNota(`Ciclo completado - Calidad: ${this.calidadEstimada}`);
      return false;
    }
  }
  
  calcularCalidad() {
    // Algoritmo simplificado de evaluación de calidad
    const etapasExitosas = this.historialEtapas.length;
    const tiempoTotal = (Date.now() - this.fechaInicio) / 1000 / 3600;
    const tiempoEsperado = 336; // 14 días en horas
    
    let puntuacion = 80; // Base
    
    if (etapasExitosas >= 4) puntuacion += 10;
    if (tiempoTotal <= tiempoEsperado) puntuacion += 5;
    if (this.incidencias.length === 0) puntuacion += 5;
    
    if (puntuacion >= 90) this.calidadEstimada = 'Premium';
    else if (puntuacion >= 75) this.calidadEstimada = 'Primera';
    else this.calidadEstimada = 'Segunda';
    
    return this.calidadEstimada;
  }
  
  agregarNota(nota) {
    this.notas.push({
      timestamp: new Date().toISOString(),
      mensaje: nota
    });
  }
  
  registrarIncidencia(tipo, descripcion) {
    this.incidencias.push({
      tipo,
      descripcion,
      timestamp: new Date().toISOString(),
      etapa: this.etapaActual.nombre
    });
    this.agregarNota(`⚠️ Incidencia: ${descripcion}`);
  }
  
  toJSON() {
    return {
      id: this.id,
      fechaInicio: this.fechaInicio.toISOString(),
      etapaActual: this.etapaActual ? this.etapaActual.nombre : 'Completado',
      historialEtapas: this.historialEtapas,
      calidadEstimada: this.calidadEstimada,
      pesoInicialGramos: this.pesoInicialGramos,
      pesoFinalGramos: this.pesoFinalGramos,
      rendimiento: this.rendimiento,
      notas: this.notas,
      incidencias: this.incidencias,
      fechaCompletado: this.etapaActual === null ? new Date().toISOString() : null
    };
  }
}

module.exports = { Lote };
