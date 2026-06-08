const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class Reporte {
    constructor(tipo, datos, usuario) {
        this.id = Date.now();
        this.tipo = tipo; // LOTE, MANTENIMIENTO, ESTADISTICAS, CALIDAD
        this.fechaGeneracion = new Date().toISOString();
        this.datos = datos;
        this.usuario = usuario;
        this.archivoGenerado = null;
    }
    
    async generarPDF(outputPath) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const stream = fs.createWriteStream(outputPath);
            
            doc.pipe(stream);
            
            // Header
            doc.fontSize(20)
               .text('Sistema de Gestión de Vainilla - Chocó', { align: 'center' })
               .moveDown();
            
            doc.fontSize(16)
               .text(`Reporte: ${this.tipo}`, { align: 'center' })
               .moveDown();
            
            doc.fontSize(10)
               .text(`Fecha generación: ${new Date(this.fechaGeneracion).toLocaleString('es-CO')}`)
               .text(`Generado por: ${this.usuario}`)
               .moveDown();
            
            doc.lineWidth(1)
               .moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .stroke()
               .moveDown();
            
            // Contenido según tipo
            if (this.tipo === 'LOTE' && this.datos.lote) {
                this._agregarReporteLote(doc);
            } else if (this.tipo === 'MANTENIMIENTO') {
                this._agregarReporteMantenimiento(doc);
            } else if (this.tipo === 'ESTADISTICAS') {
                this._agregarReporteEstadisticas(doc);
            }
            
            doc.end();
            
            stream.on('finish', () => {
                this.archivoGenerado = outputPath;
                resolve(outputPath);
            });
            
            stream.on('error', reject);
        });
    }
    
    _agregarReporteLote(doc) {
        const lote = this.datos.lote;
        
        doc.fontSize(14).text('Información del Lote', { underline: true }).moveDown(0.5);
        doc.fontSize(10)
           .text(`Código: ${lote.codigo}`)
           .text(`Productor: ${lote.productor}`)
           .text(`Peso: ${lote.pesoKg} kg`)
           .text(`Estado: ${lote.estado}`)
           .text(`Calidad: ${lote.calidadFinal || 'Pendiente'}`)
           .text(`Puntaje: ${lote.puntajeCalidad || 'N/A'}`)
           .moveDown();
        
        if (lote.inspeccionOrganoleptica) {
            doc.fontSize(12).text('Inspección Organoléptica', { underline: true }).moveDown(0.5);
            const inspeccion = lote.inspeccionOrganoleptica;
            doc.fontSize(10)
               .text(`Resultado: ${inspeccion.resultado}`)
               .text(`Color: ${inspeccion.color || 'N/A'}`)
               .text(`Olor: ${inspeccion.olor || 'N/A'}`)
               .text(`Textura: ${inspeccion.textura || 'N/A'}`)
               .text(`Observaciones: ${inspeccion.observaciones || 'Ninguna'}`)
               .moveDown();
        }
        
        if (lote.analisisFisicoQuimico) {
            doc.fontSize(12).text('Análisis Físico/Químico', { underline: true }).moveDown(0.5);
            const analisis = lote.analisisFisicoQuimico;
            doc.fontSize(10)
               .text(`Humedad: ${analisis.humedad}%`)
               .text(`pH: ${analisis.ph}`)
               .text(`Brix: ${analisis.brix}°`)
               .text(`Vainillina: ${analisis.vainillina}%`)
               .moveDown();
        }
        
        if (lote.patogenos && lote.patogenos.length > 0) {
            doc.fontSize(12).text('Patógenos Detectados', { underline: true }).moveDown(0.5);
            lote.patogenos.forEach(p => {
                doc.fontSize(10)
                   .text(`- ${p.tipo}: Nivel ${p.nivel} - ${p.tratamiento || 'Sin tratamiento'}`);
            });
        }
    }
    
    _agregarReporteMantenimiento(doc) {
        const { equipo, mantenimientos } = this.datos;
        
        doc.fontSize(14).text('Reporte de Mantenimiento', { underline: true }).moveDown(0.5);
        doc.fontSize(10)
           .text(`Equipo: ${equipo.nombre} (${equipo.codigo})`)
           .text(`Horas de uso total: ${equipo.horasUso}`)
           .text(`Estado actual: ${equipo.estado}`)
           .moveDown();
        
        doc.fontSize(12).text('Historial de Mantenimientos', { underline: true }).moveDown(0.5);
        
        mantenimientos.forEach(m => {
            doc.fontSize(10)
               .text(`- ${m.tipo} | ${new Date(m.fechaEjecucion).toLocaleDateString()} | Técnico: ${m.tecnico}`)
               .text(`  Descripción: ${m.descripcion}`)
               .text(`  Costo: $${(m.costo || 0).toLocaleString('es-CO')}`)
               .moveDown(0.3);
        });
    }
    
    _agregarReporteEstadisticas(doc) {
        const estadisticas = this.datos;
        
        doc.fontSize(14).text('Estadísticas del Sistema', { underline: true }).moveDown(0.5);
        
        doc.fontSize(12).text('Resumen de Lotes', { underline: true }).moveDown(0.5);
        doc.fontSize(10)
           .text(`Total lotes procesados: ${estadisticas.totalLotes}`)
           .text(`Lotes Premium: ${estadisticas.lotesPremium}`)
           .text(`Lotes Primera: ${estadisticas.lotesPrimera}`)
           .text(`Lotes Segunda: ${estadisticas.lotesSegunda}`)
           .text(`Lotes Rechazados: ${estadisticas.lotesRechazados}`)
           .moveDown();
        
        doc.fontSize(12).text('Eficiencia de Producción', { underline: true }).moveDown(0.5);
        doc.fontSize(10)
           .text(`Tiempo promedio de proceso: ${estadisticas.tiempoPromedioHoras} horas`)
           .text(`Tasa de aprobación: ${estadisticas.tasaAprobacion}%`)
           .text(`Pérdidas por patógenos: ${estadisticas.perdidasPatogenos}%`);
    }
    
    async generarExcel(outputPath) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Reporte_${this.tipo}`);
        
        // Configurar columnas
        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 20 },
            { header: 'Evento', key: 'evento', width: 30 },
            { header: 'Valor', key: 'valor', width: 20 },
            { header: 'Observaciones', key: 'observaciones', width: 40 }
        ];
        
        // Agregar datos según tipo
        if (this.tipo === 'LOTE' && this.datos.lote) {
            const lote = this.datos.lote;
            worksheet.addRow({ fecha: lote.fechaRecepcion, evento: 'Recepción', valor: `${lote.pesoKg} kg`, observaciones: `Productor: ${lote.productor}` });
            if (lote.fechaInspeccion) worksheet.addRow({ fecha: lote.fechaInspeccion, evento: 'Inspección', valor: lote.inspeccionOrganoleptica?.resultado, observaciones: 'Organoléptica' });
            if (lote.fechaAnalisis) worksheet.addRow({ fecha: lote.fechaAnalisis, evento: 'Análisis', valor: `Humedad: ${lote.analisisFisicoQuimico?.humedad}%`, observaciones: 'Físico/Químico' });
            if (lote.fechaClasificacion) worksheet.addRow({ fecha: lote.fechaClasificacion, evento: 'Clasificación', valor: lote.calidadFinal, observaciones: `Puntaje: ${lote.puntajeCalidad}` });
        }
        
        await workbook.xlsx.writeFile(outputPath);
        this.archivoGenerado = outputPath;
        return outputPath;
    }
    
    getResumen() {
        return {
            id: this.id,
            tipo: this.tipo,
            fechaGeneracion: this.fechaGeneracion,
            usuario: this.usuario,
            archivoGenerado: this.archivoGenerado
        };
    }
}

module.exports = { Reporte };