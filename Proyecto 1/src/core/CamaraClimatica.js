const { Lote } = require('Proyecto 1/src/core/Lote');
const { Etapa } = require('Proyecto 1/src/core/Etapa.js');

class CamaraClimatica {
  constructor(sensorTempInt, sensorHumedad, resistencia, ventilador, humidificador) {
    this.sensorTempInt = sensorTempInt;
    this.sensorHumedad = sensorHumedad;
    this.resistencia = resistencia;
    this.ventilador = ventilador;
    this.humidificador = humidificador;
    this.loteActual = null;
    this.alarmas = [];
    this.umbralAlarmaTemp = 5; // Grados fuera de rango
    this.umbralAlarmaHumedad = 15; // Porcentaje fuera de rango
  }
  
  iniciarNuevoLote() {
    this.loteActual = new Lote(Date.now());
    this.loteActual.agregarNota('Lote iniciado en cámara climática');
    console.log(`🚀 Nuevo lote iniciado: ${this.loteActual.id}`);
    return this.loteActual;
  }
  
  actualizar() {
    if (!this.loteActual || !this.loteActual.etapaActual) return;
    
    const etapa = this.loteActual.etapaActual;
    const tempActual = this.sensorTempInt.leer();
    const humedadActual = this.sensorHumedad.leer();
    
    // Control PID simplificado para temperatura
    this.controlarTemperatura(tempActual, etapa);
    
    // Control de humedad según etapa
    this.controlarHumedad(humedadActual, etapa);
    
    // Verificar alarmas
    this.verificarAlarmas(tempActual, humedadActual, etapa);
  }
  
  controlarTemperatura(tempActual, etapa) {
    const tempObjetivo = etapa.temperaturaObjetivo;
    const diferencia = tempActual - tempObjetivo;
    
    // Control proporcional
    if (Math.abs(diferencia) > 1) {
      if (tempActual < tempObjetivo) {
        // Necesita calor
        const intensidad = Math.min(100, Math.abs(diferencia) * 20);
        this.resistencia.setEncendido(true);
        
        if (diferencia < -3 && this.ventilador.encendido) {
          this.ventilador.setEncendido(false);
        }
      } else {
        // Necesita enfriar (ventilación)
        this.resistencia.setEncendido(false);
        const intensidadVentilacion = Math.min(100, diferencia * 25);
        this.ventilador.setVelocidad(intensidadVentilacion);
      }
    } else {
      // Estable - mantener
      if (this.resistencia.encendido && tempActual >= tempObjetivo) {
        this.resistencia.setEncendido(false);
      }
      if (this.ventilador.encendido && tempActual <= tempObjetivo + 0.5) {
        this.ventilador.setVelocidad(20); // Mínimo para circulación
      }
    }
  }
  
  controlarHumedad(humedadActual, etapa) {
    // Humedad óptima según etapa
    let humedadObjetivo;
    switch(etapa.nombre) {
      case 'Escaldado':
        humedadObjetivo = 90;
        break;
      case 'Sudado':
        humedadObjetivo = 85;
        break;
      case 'Secado':
        humedadObjetivo = 45;
        break;
      case 'Afinado':
        humedadObjetivo = 35;
        break;
      default:
        humedadObjetivo = 60;
    }
    
    const diferencia = humedadActual - humedadObjetivo;
    
    if (diferencia < -10) {
      // Muy seco, humidificar
      this.humidificador.setEncendido(true);
      this.humidificador.setFlujo(Math.min(100, Math.abs(diferencia) * 5));
    } else if (diferencia > 10) {
      // Muy húmedo, ventilar
      this.humidificador.setEncendido(false);
      this.ventilador.setVelocidad(Math.min(100, diferencia * 5));
    } else {
      // Rango aceptable
      this.humidificador.setEncendido(false);
      if (this.ventilador.velocidad > 20) {
        this.ventilador.setVelocidad(20);
      }
    }
  }
  
  verificarAlarmas(tempActual, humedadActual, etapa) {
    // Verificar temperatura
    if (tempActual < etapa.temperaturaMinima || tempActual > etapa.temperaturaMaxima) {
      this.registrarAlarma('TEMPERATURA', `Temp ${tempActual}°C fuera de rango [${etapa.temperaturaMinima}-${etapa.temperaturaMaxima}]`);
    }
    
    // Verificar humedad
    if (etapa.nombre === 'Secado' && humedadActual > 60) {
      this.registrarAlarma('HUMEDAD', `Humedad ${humedadActual}% muy alta para etapa de secado - riesgo de moho`);
    }
  }
  
  registrarAlarma(tipo, mensaje) {
    const alarma = {
      tipo,
      mensaje,
      timestamp: new Date().toISOString(),
      etapa: this.loteActual.etapaActual.nombre
    };
    this.alarmas.push(alarma);
    this.loteActual.registrarIncidencia(tipo, mensaje);
    console.log(`🚨 ALARMA [${tipo}]: ${mensaje}`);
  }
  
  obtenerEstadoCompleto() {
    return {
      tieneLoteActivo: !!this.loteActual,
      lote: this.loteActual ? {
        id: this.loteActual.id,
        etapa: this.loteActual.etapaActual.nombre,
        progreso: this.loteActual.historialEtapas.length / 4 * 100
      } : null,
      alarmasActivas: this.alarmas.filter(a => !a.resuelta).length,
      estadisticas: {
        temperaturaPromedio: this.sensorTempInt.getPromedioUltimasLecturas(),
        humedadPromedio: this.sensorHumedad.getPromedioUltimasLecturas()
      }
    };
  }
}

module.exports = { CamaraClimatica };