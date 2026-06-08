// Enums del Sistema
const EstadoLote = {
    RECIBIDO: 'RECIBIDO',
    EN_INSPECCION: 'EN_INSPECCION',
    INSPECCION_OK: 'INSPECCION_OK',
    INSPECCION_NOK: 'INSPECCION_NOK',
    EN_ANALISIS: 'EN_ANALISIS',
    ANALISIS_OK: 'ANALISIS_OK',
    ANALISIS_NOK: 'ANALISIS_NOK',
    EN_CLASIFICACION: 'EN_CLASIFICACION',
    CLASIFICADO: 'CLASIFICADO',
    EN_PRODUCCION: 'EN_PRODUCCION',
    TERMINADO: 'TERMINADO',
    RECHAZADO: 'RECHAZADO'
};

const CalidadLote = {
    PREMIUM: { nombre: 'Premium', puntajeMin: 90, color: '#4CAF50' },
    PRIMERA: { nombre: 'Primera', puntajeMin: 75, color: '#2196F3' },
    SEGUNDA: { nombre: 'Segunda', puntajeMin: 60, color: '#FF9800' },
    RECHAZADO: { nombre: 'Rechazado', puntajeMin: 0, color: '#f44336' }
};

const RolUsuario = {
    OPERADOR: 'OPERADOR',
    TECNICO_CALIDAD: 'TECNICO_CALIDAD',
    MANTENIMIENTO: 'MANTENIMIENTO',
    ADMINISTRADOR: 'ADMINISTRADOR'
};

const TipoInspeccion = {
    ORGANOLEPTICA: 'ORGANOLEPTICA',
    FISICA: 'FISICA',
    QUIMICA: 'QUIMICA'
};

const ResultadoInspeccion = {
    APROBADO: 'APROBADO',
    RECHAZADO: 'RECHAZADO',
    OBSERVADO: 'OBSERVADO'
};

const TipoPatogeno = {
    MOHO_VERDE: 'MOHO_VERDE',
    MOHO_NEGRO: 'MOHO_NEGRO',
    HONGO_BLANCO: 'HONGO_BLANCO',
    BACTERIA: 'BACTERIA'
};

const NivelPatogeno = {
    BAJO: { nivel: 'BAJO', umbral: 0.3, accion: 'Monitorear' },
    MEDIO: { nivel: 'MEDIO', umbral: 0.6, accion: 'Tratamiento preventivo' },
    ALTO: { nivel: 'ALTO', umbral: 0.8, accion: 'Rechazar lote' },
    CRITICO: { nivel: 'CRITICO', umbral: 1.0, accion: 'Rechazar y desinfectar área' }
};

const TipoMantenimiento = {
    PREVENTIVO: 'PREVENTIVO',
    CORRECTIVO: 'CORRECTIVO',
    PREDICTIVO: 'PREDICTIVO'
};

const EstadoEquipo = {
    OPERATIVO: 'OPERATIVO',
    MANTENIMIENTO: 'MANTENIMIENTO',
    AVERIADO: 'AVERIADO',
    CALIBRACION: 'CALIBRACION'
};

const NivelLog = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    DEBUG: 'DEBUG'
};

module.exports = {
    EstadoLote,
    CalidadLote,
    RolUsuario,
    TipoInspeccion,
    ResultadoInspeccion,
    TipoPatogeno,
    NivelPatogeno,
    TipoMantenimiento,
    EstadoEquipo,
    NivelLog
};