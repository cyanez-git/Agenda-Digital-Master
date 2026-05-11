# Agenda Digital - Documentación del Proyecto

Sistema de gestión de turnos, pacientes y notas para consultorios médicos.

## Índice

- [Planes de Implementación](./plans/) - Planes detallados de nuevas funcionalidades
- [Guías de Implementación](./walkthroughs/) - Documentación de funcionalidades completadas
- [Tareas](./tasks/) - Estado actual de tareas en progreso

## Arquitectura

### Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Firebase (Firestore, Functions, Auth)
- **Build**: Vite
- **Deploy**: Firebase Hosting

### Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── views/          # Vistas (Day, Week, Month, Notes)
│   ├── modals/         # Modales (Appointment, Patient, Note)
│   └── ...
├── hooks/              # Custom hooks
├── utils/              # Utilidades
├── types.ts            # Definiciones de tipos TypeScript
└── App.tsx             # Componente principal
```

## Módulos Principales

### 1. Gestión de Turnos
- Vista diaria, semanal y mensual
- Creación, edición y eliminación de turnos
- Tipos de turnos configurables
- Integración con WhatsApp

### 2. Gestión de Pacientes
- CRUD completo de pacientes
- Historial de turnos
- Búsqueda y filtrado
- Nombres personalizados para WhatsApp

### 3. Gestión de Notas (Nuevo ✨)
- Creación de notas/recordatorios
- Vista mensual exclusiva
- Diferenciación visual con color naranja
- Sin horarios (solo fechas)

### 4. Centro de Mensajes
- Plantillas de WhatsApp
- Confirmaciones y recordatorios
- Historial de mensajes enviados

### 5. Asistente de Voz (IA)
- Reconocimiento de voz
- Procesamiento de lenguaje natural
- Ejecución de comandos (solo turnos por ahora)

## Multi-tenancy

El sistema soporta múltiples organizaciones:
- Cada cliente tiene un `clientId` único
- Todos los datos están filtrados por `clientId`
- Profesionales múltiples por organización
- Datos completamente aislados

## Firebase Collections

```
/configs/{clientId}        # Configuración por organización
/appointments/             # Turnos (filtrados por clientId)
/patients/                 # Pacientes (filtrados por clientId)
/notes/                    # Notas (filtrados por clientId)
```

## Temas y Personalización

- 6 temas de color disponibles
- Configuración de tipos de turnos
- Plantillas de mensajes personalizables
- Duración de slots configurable

## Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Deploy a Firebase
firebase deploy
```

## Variables de Entorno

Crear archivo `.env` con:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Historial de Cambios

- **Febrero 2026**: Implementación del módulo de notas
- **Enero 2026**: Integración del asistente de voz IA
- **Diciembre 2025**: Personalización de nombres para WhatsApp
- **Noviembre 2025**: Sistema base de turnos y pacientes

## Soporte

Para consultas o reportes de bugs, contactar al equipo de desarrollo.
