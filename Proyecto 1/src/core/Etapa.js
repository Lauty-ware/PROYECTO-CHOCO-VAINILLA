class Etapa {
  static ESCALDADO = new Etapa('Escaldado', 63, 2, 63, 65);
  static SUDADO = new Etapa('Sudado', 35, 72, 33, 37);
  static SECADO = new Etapa('Secado', 45, 48, 43, 47);
  static AFINADO = new Etapa('Afinado', 22, 240, 20, 24);
  
  constructor(nombre, tempObjetivo, duracionHoras, tempMin, tempMax) {
    this.nombre = nombre;
    this.temperaturaObjetivo = tempObjetivo;
    this.duracionHoras = duracionHoras;
    this.temperaturaMinima = tempMin || tempObjetivo - 2;
    this.temperaturaMaxima = tempMax || tempObjetivo + 2;
  }
  
  static getSecuenciaCompleta() {
    return [this.ESCALDADO, this.SUDADO, this.SECADO, this.AFINADO];
  }
  
  static fromNombre(nombre) {
    const etapa = this.getSecuenciaCompleta().find(e => e.nombre === nombre);
    if (!etapa) throw new Error(`Etapa no encontrada: ${nombre}`);
    return etapa;
  }
  
  getDescripcion() {
    const descripciones = {
      'Escaldado': 'Choque térmico para eliminar patógenos y activar enzimas',
      'Sudado': 'Fermentación controlada para desarrollar precursores aromáticos',
      'Secado': 'Reducción gradual de humedad al 30%',
      'Afinado': 'Maduración en oscuridad para potenciar vainillina'
    };
    return descripciones[this.nombre] || 'Procesando...';
  }
}

module.exports = { Etapa };