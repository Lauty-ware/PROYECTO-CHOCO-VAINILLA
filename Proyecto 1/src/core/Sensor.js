class Sensor {
  constructor(tipo, valorInicial) {
    this.tipo = tipo;
    this.valor = valorInicial;
    this.historial = [];
    this.deriva = 0; // Simular desgaste
  }
  
  leer() {
    // Simulación realista con ruido y deriva
    const ruido = (Math.random() - 0.5) * 0.3;
    let nuevoValor = this.valor + ruido + this.deriva;
    
    // Limitar rangos según tipo de sensor
    if (this.tipo === 'tempExterior' || this.tipo === 'tempInterior') {
      nuevoValor = Math.max(15, Math.min(70, nuevoValor));
    } else if (this.tipo === 'humedad') {
      nuevoValor = Math.max(20, Math.min(98, nuevoValor));
    }
    
    this.valor = nuevoValor;
    this.historial.push({ timestamp: Date.now(), valor: this.valor });
    
    // Mantener solo últimos 100 registros
    if (this.historial.length > 100) this.historial.shift();
    
    return this.valor;
  }
  
  calibrar(valorReal) {
    const error = valorReal - this.valor;
    this.deriva = error * 0.1; // Corrección gradual
    console.log(`🔧 Sensor ${this.tipo} calibrado. Nuevo valor: ${valorReal}`);
  }
  
  getPromedioUltimasLecturas(cantidad = 10) {
    const ultimas = this.historial.slice(-cantidad);
    if (ultimas.length === 0) return this.valor;
    const suma = ultimas.reduce((acc, lectura) => acc + lectura.valor, 0);
    return suma / ultimas.length;
  }
}

module.exports = { Sensor };