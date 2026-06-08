DEFINICION DEL PROBLEMA Y OBJETOS
Problema:
El proceso artesanal de curado de vainilla (90 días) en el Chocó tiene una alta tasa de pérdida por moho debido a la incapacidad de controlar la humedad y temperatura.

Objetivo del Sistema:
Reducir el tiempo de curado de 90 días a ~14-21 días y eliminar pérdidas por hongos mediante una Cámara Climática Inteligente que automatice las etapas de: Escaldado → Sudado → Secado → Afinado.

Entidades que intervienen:

Usuario: Operador (usa el panel) / Técnico (configura)

Sensores: Temp Ext, Temp Int, Humedad

Actuadores: Resistencia (Relé), Ventilación, Humidificador

Lote de Vainas: Estado actual, historial, calidad

Funcionalidades mínimas:

Control automático por etapas

Registro de datos (guardar en JSON)

Dashboard web en tiempo real

WiFi (simulado)

Requisitos Funcionales (qué hace)
ID	Descripción
RF1	Iniciar ciclo de producción con un nuevo lote
RF2	Ejecutar secuencia: Escaldado → Sudado → Secado → Afinado
RF3	Monitorear sensores (temp/humedad) en tiempo real
RF4	Actuar sobre resistencias/ventilación según etapa
RF5	Guardar historial de cada lote en .json
RF6	Visualizar estado actual vía web
Requisitos No Funcionales (cómo es)
ID	Descripción
RNF1	Simulación ejecutable sin hardware real
RNF2	Dockerizable (contenedor Linux + servidor web)
RNF3	Código con principios SOLID
RNF4	Persistencia en archivos JSON
RNF5	Frontend HTML/CSS/JS responsive
