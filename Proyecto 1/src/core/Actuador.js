class ReleResistencia {
  constructor(potenciaKW = 2.5) {
    this.encendido = false;
    this.potenciaKW = potenciaKW;
    this.consumoTotalKWh = 0;
    this.ultimoCambio = Date.now();
  }
  
  setEncendido(valor) {
    if (this.encendido !== valor) {
      const tiempoTranscurrido = (Date.now() - this.ultimoCambio) / 3600000;
      if (this.encendido) {
        this.consumoTotalKWh += this.potenciaKW * tiempoTranscurrido;
      }
      this.encendido = valor;
      this.ultimoCambio = Date.now();
      console.log(`🔥 Resistencia: ${valor ? 'ENCENDIDA' : 'APAGADA'} | Consumo total: ${this.consumoTotalKWh.toFixed(2)} kWh`);
    }
  }
  
  getConsumoActual() {
    let consumo = this.consumoTotalKWh;
    if (this.encendido) {
      const tiempoTranscurrido = (Date.now() - this.ultimoCambio) / 3600000;
      consumo += this.potenciaKW * tiempoTranscurrido;
    }
    return consumo;
  }
}

class Ventilador {
  constructor() {
    this.encendido = false;
    this.velocidad = 0; // 0-100%
  }
  
  setEncendido(valor) {
    this.encendido = valor;
    this.velocidad = valor ? 70 : 0;
    console.log(`💨 Ventilador: ${valor ? 'ENCENDIDO' : 'APAGADO'} (${this.velocidad}%)`);
  }
  
  setVelocidad(porcentaje) {
    this.velocidad = Math.max(0, Math.min(100, porcentaje));
    this.encendido = this.velocidad > 0;
    console.log(`💨 Ventilador velocidad: ${this.velocidad}%`);
  }
}

class Humidificador {
  constructor() {
    this.encendido = false;
    this.flujo = 0; // 0-100%
  }
  
  setEncendido(valor) {
    this.encendido = valor;
    this.flujo = valor ? 50 : 0;
    console.log(`💧 Humidificador: ${valor ? 'ENCENDIDO' : 'APAGADO'} (${this.flujo}%)`);
  }
  
  setFlujo(porcentaje) {
    this.flujo = Math.max(0, Math.min(100, porcentaje));
    this.encendido = this.flujo > 0;
    console.log(`💧 Humidificador flujo: ${this.flujo}%`);
  }
}

module.exports = { ReleResistencia, Ventilador, Humidificador };