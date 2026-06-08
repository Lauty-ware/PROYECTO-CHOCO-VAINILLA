const fs = require('fs');
const path = require('path');

class DataService {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
  
  guardarLote(lote) {
    const filename = `lote_${lote.id}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    const data = {
      ...lote.toJSON(),
      guardadoEn: new Date().toISOString(),
      version: '1.0'
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Lote ${lote.id} guardado en ${filepath}`);
    return filepath;
  }
  
  cargarLote(id) {
    const filename = `lote_${id}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    if (!fs.existsSync(filepath)) {
      console.log(`⚠️ Lote ${id} no encontrado`);
      return null;
    }
    
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  }
  
  listarLotes() {
    const files = fs.readdirSync(this.dataDir);
    const lotes = [];
    
    for (const file of files) {
      if (file.startsWith('lote_') && file.endsWith('.json')) {
        const filepath = path.join(this.dataDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        lotes.push({
          id: data.id,
          fechaInicio: data.fechaInicio,
          calidadEstimada: data.calidadEstimada,
          etapaActual: data.etapaActual,
          fechaCompletado: data.fechaCompletado
        });
      }
    }
    
    return lotes.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
  }
  
  exportarEstadisticas() {
    const lotes = this.listarLotes();
    const completados = lotes.filter(l => l.fechaCompletado);
    
    return {
      totalLotes: lotes.length,
      lotesCompletados: completados.length,
      calidadDistribucion: {
        Premium: lotes.filter(l => l.calidadEstimada === 'Premium').length,
        Primera: lotes.filter(l => l.calidadEstimada === 'Primera').length,
        Segunda: lotes.filter(l => l.calidadEstimada === 'Segunda').length
      },
      promedioEficiencia: completados.reduce((acc, l) => acc + (l.rendimiento?.eficiencia || 0), 0) / completados.length || 0
    };
  }
}

module.exports = { DataService };