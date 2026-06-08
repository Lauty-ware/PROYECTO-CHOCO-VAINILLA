DEFINICION DEL PROBLEMA Y OBJETOS:
Problema que resuelve
Actualmente no existe un sistema integrado que gestione desde la recepción de materia prima hasta el control de calidad post-proceso, generando pérdidas por falta de trazabilidad, criterios de clasificación no estandarizados y mantenimiento reactivo de equipos.

Objetivos
Reducir tiempos de evaluación de 2 horas a 15 minutos por lote

Estandarizar clasificación con criterios objetivos (tamaño, color, madurez)

Detectar patógenos tempranamente mediante análisis físico/químico

Trazabilidad completa desde recepción hasta despacho

Mantenimiento predictivo basado en horas de uso y condiciones

Entidades que intervienen
Entidad	Descripción
Materia Prima	Vainas frescas provenientes de productores
Lote de Producción	Conjunto de vainas procesadas juntas
Operador	Usuario que registra inspecciones y operaciones
Técnico de Calidad	Usuario que realiza análisis y clasificación
Mantenimiento	Usuario que gestiona equipos y reportes
Equipo	Cámara climática, sensores, actuadores
Usuarios del Sistema
Rol	Funcionalidades
Operador	Registrar recepción, inspección visual, iniciar procesos
Técnico de Calidad	Realizar análisis físico/químico, clasificar, liberar lotes
Mantenimiento	Registrar mantenimientos, ver alarmas, generar reportes
Administrador	Configurar parámetros, gestionar usuarios, ver estadísticas
Tipo de aplicación
Web interna (Dashboard) + API REST + Base de datos SQLite/PostgreSQL

Funcionalidades mínimas
text
✅ Recepción de materia prima
✅ Inspección organoléptica (OK/NOK)
✅ Análisis físico/químico
✅ Detección de patógenos
✅ Clasificación por criterios
✅ Reportes de proceso
✅ Mantenimiento preventivo/predictivo
✅ Reporte de errores
✅ Historial de lotes
✅ Log de procesos
✅ Gráficos y estadísticas
✅ Configuración de parámetros
📋 2. Requisitos
Requisitos Funcionales (Qué hace)
ID	Requisito	Descripción
RF01	Gestión de Lotes	CRUD completo de lotes desde recepción hasta despacho
RF02	Inspección Organoléptica	Registrar evaluación visual, olfativa y táctil
RF03	Análisis Físico/Químico	Registrar humedad, pH, brix, vainillina
RF04	Detección de Patógenos	Identificar mohos y hongos con niveles de riesgo
RF05	Clasificación Automática	Calcular calidad basada en múltiples criterios
RF06	Trazabilidad	Historial completo de cada lote
RF07	Gestión de Mantenimiento	CRUD de equipos, mantenimientos programados
RF08	Reportes	Generar reportes en PDF/Excel
RF09	Dashboard	Gráficos en tiempo real de KPIs
RF10	Logs	Registro automático de todas las operaciones
RF11	Configuración	Parámetros editables por administrador
RF12	Alertas	Notificaciones automáticas de anomalías
Requisitos No Funcionales (Cómo es)
ID	Requisito	Descripción
RNF01	Seguridad	Autenticación JWT, roles y permisos
RNF02	Escalabilidad	Arquitectura modular, base de datos indexada
RNF03	Rendimiento	Respuesta < 500ms en operaciones CRUD
RNF04	Disponibilidad	99.5% uptime
RNF05	Mantenibilidad	Código con principios SOLID, documentado
RNF06	Portabilidad	Dockerizado, funciona en cualquier SO
RNF07	Persistencia	SQLite (dev) / PostgreSQL (prod)
RNF08	Logging	Todos los eventos registrados con timestamp
🧱 3. Modelo de Dominio (POO)
Diagrama de Clases
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SISTEMA DE GESTIÓN                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      Usuario      │     │      Lote        │     │    Inspeccion    │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ - id             │     │ - id             │     │ - id             │
│ - nombre         │     │ - codigo         │     │ - fecha          │
│ - email          │     │ - fechaRecepcion │     │ - tipo           │
│ - rol            │     │ - productor      │     │ - resultado      │
│ - password       │     │ - pesoKg         │     │ - observaciones  │
├──────────────────┤     │ - estado         │     │ - usuarioId      │
│ + autenticar()   │     │ - calidadFinal   │     ├──────────────────┤
│ + tienePermiso() │     ├──────────────────┤     │ + registrar()    │
└──────────────────┘     │ + recibir()      │     │ + generarPDF()   │
         │                │ + clasificar()   │     └──────────────────┘
         │                │ + calcularScore()│              │
         ▼                └──────────────────┘              │
┌──────────────────┐               │                        │
│      Reporte     │               │                        │
├──────────────────┤               ▼                        ▼
│ - id             │     ┌──────────────────┐     ┌──────────────────┐
│ - tipo           │     │   AnalisisLab    │     │    Patogeno      │
│ - fechaGeneracion│     ├──────────────────┤     ├──────────────────┤
│ - datos          │     │ - id             │     │ - id             │
│ - usuarioId      │     │ - humedad        │     │ - tipo           │
├──────────────────┤     │ - ph             │     │ - nivel          │
│ + generarPDF()   │     │ - brix           │     │ - detectado      │
│ + exportarExcel()│     │ - vainillina     │     │ - tratamiento    │
└──────────────────┘     │ - observaciones  │     ├──────────────────┤
                         ├──────────────────┤     │ + identificar()  │
                         │ + realizar()     │     │ + evaluarRiesgo()│
                         └──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     Equipo       │     │  Mantenimiento   │     │      Log         │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ - id             │     │ - id             │     │ - id             │
│ - nombre         │     │ - equipoId       │     │ - nivel          │
│ - tipo           │     │ - fecha          │     │ - mensaje        │
│ - horasUso       │     │ - tipo           │     │ - origen         │
│ - estado         │     │ - descripcion    │     │ - timestamp      │
│ - ultimoMant     │     │ - tecnico        │     │ - datos          │
├──────────────────┤     │ - costo          │     ├──────────────────┤
│ + registrarUso() │     ├──────────────────┤     │ + registrar()    │
│ + necesitaMant() │     │ + programar()    │     │ + consultar()    │
└──────────────────┘     │ + ejecutar()     │     └──────────────────┘
                         │ + generarReporte()│
                         └──────────────────┘
Clases Principales
javascript
// Enums y Constantes
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
    PREMIUM: 'PREMIUM',
    PRIMERA: 'PRIMERA',
    SEGUNDA: 'SEGUNDA',
    RECHAZADO: 'RECHAZADO'
};

const RolUsuario = {
    OPERADOR: 'OPERADOR',
    TECNICO_CALIDAD: 'TECNICO_CALIDAD',
    MANTENIMIENTO: 'MANTENIMIENTO',
    ADMINISTRADOR: 'ADMINISTRADOR'
};