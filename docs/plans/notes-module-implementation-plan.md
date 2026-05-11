# Implementación del Módulo de Notas

Plan de implementación para agregar un módulo completo de notas/recordatorios a Agenda Digital, con funcionalidad similar a turnos pero visualización exclusivamente mensual.

## User Review Required

> [!IMPORTANT]
> **Vista de Visualización**: El plan propone que las notas SOLO se visualicen en una vista mensual dedicada (al hacer clic en el nuevo ícono del menú). ¿Confirmas que las notas NO deben aparecer en las vistas de día/semana/mes de turnos? ¿O prefieres que también aparezcan en la vista mensual de turnos?

> [!IMPORTANT]
> **Estructura de Notas**: Propongo crear notas con:
> - **Título** (campo obligatorio, texto corto)
> - **Contenido/Descripción** (campo de texto largo para el recordatorio)
> - **Fecha** (para ubicar la nota en el calendario)
> - Sin hora específica (diferencia clave vs turnos)
> ¿Te parece adecuado o necesitas campos adicionales?

## Proposed Changes

### Core Types and Data Model

#### [MODIFY] [types.ts](file:///c:/Users/cyanez/Documents/Aganda%20Digital/Aganda%20Digital/src/types.ts)

Agregar nueva interfaz `Note` siguiendo el patrón existente de `Appointment` y `Patient`:

```typescript
export interface Note {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    content: string;
    date: string; // YYYY-MM-DD format
    createdAt: string;
    updatedAt: string;
}
```

**Campos clave**:
- `title`: Título breve de la nota/recordatorio
- `content`: Texto completo de la nota
- `date`: Fecha para mostrar en el calendario mensual
- Sin campo `time` (diferencia principal vs appointments)

---

### UI Components

#### [NEW] [NoteModal.tsx](file:///c:/Users/cyanez/Documents/Aganda%20Digital/Aganda%20Digital/src/components/NoteModal.tsx)

Modal para crear/editar notas, siguiendo el mismo patrón de diseño que `AppointmentModal.tsx`:

**Campos del formulario**:
- Input de título (texto corto, obligatorio)
- Textarea de contenido (texto largo)
- Date picker para seleccionar fecha
- Botones: Guardar, Eliminar (si edita), Cancelar

**Esquema de colores**: Usar tonos naranjas para diferenciar visualmente del módulo de turnos (azules):
- Primary button: `bg-orange-600 hover:bg-orange-700`
- Header background: `bg-orange-50`
- Focus rings: `ring-orange-500`

#### [NEW] [NotesMonthView.tsx](file:///c:/Users/cyanez/Documents/Aganda%20Digital/Aganda%20Digital/src/components/views/NotesMonthView.tsx)

Vista de calendario mensual dedicada exclusivamente a notas, basada en `MonthView.tsx`:

**Características**:
- Grid mensual 7x5/6 (igual que vista mensual de turnos)
- Cada celda muestra las notas del día correspondiente
- Click en celda vacía: abre `NoteModal` para crear nota en esa fecha
- Click en nota existente: abre `NoteModal` para editar
- Color de fondo de notas: tonos naranjas (`bg-orange-100`, `border-orange-400`)
- Mostrar título de nota (truncado si es necesario)
- Tooltip con contenido completo al hacer hover

---

### Main Application Integration

#### [MODIFY] [App.tsx](file:///c:/Users/cyanez/Documents/Aganda%20Digital/Aganda%20Digital/src/App.tsx)

**1. Actualizar tipo `ViewMode`** (línea 87):
```typescript
type ViewMode = 'day' | 'week' | 'month' | 'patients' | 'config' | 'messages' | 'notes';
```

**2. Agregar estado para notas** (después de línea 231):
```typescript
const [notes, setNotes] = useState<Note[]>([]);
const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
const [selectedNoteDate, setSelectedNoteDate] = useState<string | null>(null);
const [editingNote, setEditingNote] = useState<Note | null>(null);
```

**3. Agregar ícono de menú para notas** (dentro del menú lateral izquierdo, aprox. línea 881):

Insertar entre el botón de "Mensajes" (`MessageSquare`) y "Configuración" (`Settings`):

```tsx
<button 
    onClick={() => setView('notes')} 
    className={/* estilo similar a otros botones del menú */}
    title="Notas y Recordatorios"
>
    <StickyNote size={24} /> {/* Nuevo icono a importar de lucide-react */}
</button>
```

**Icono propuesto**: `StickyNote` de lucide-react (representa notas adhesivas, muy intuitivo)

**4. Agregar Firebase listeners para notas** (dentro de `useEffect` línea 629):

```typescript
// 4. NOTES SYNC - SECURED QUERY
const qNotes = query(collection(db, 'notes'), where('clientId', '==', clientId));
const unsubNotes = onSnapshot(qNotes, (snapshot) => {
    const allNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Note[];
    setNotes(allNotes);
});

return () => { unsubConfig(); unsubAppts(); unsubPatients(); unsubNotes(); };
```

**5. Implementar funciones CRUD para notas** (después de línea 728):

```typescript
const dbSaveNote = async (note: Note) => {
    if (!user || !clientId) return;
    const securedNote = { ...note, clientId, professionalId: selectedProfId };
    try {
        await setDoc(doc(db, 'notes', note.id), securedNote);
    } catch (e) { console.error("Save Note Error:", e); }
};

const dbDeleteNote = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'notes', id));
    } catch (e) { console.error("Delete Note Error:", e); }
};
```

**6. Renderizar vista de notas** (en la sección de renderizado condicional de vistas):

```tsx
{view === 'notes' && (
    <NotesMonthView
        currentDate={currentDate}
        notes={notes.filter(n => n.clientId === clientId && n.professionalId === selectedProfId)}
        onDayClick={(dateKey) => {
            setSelectedNoteDate(dateKey);
            setEditingNote(null);
            setIsNoteModalOpen(true);
        }}
        onNoteClick={(note) => {
            setEditingNote(note);
            setIsNoteModalOpen(true);
        }}
    />
)}
```

**7. Agregar imports necesarios** (línea 17-38):

```typescript
import { StickyNote } from 'lucide-react';
import { NoteModal } from './components/NoteModal';
import { NotesMonthView } from './components/views/NotesMonthView';
import { Note } from './types';
```

---

### Utility Functions

#### [MODIFY] [utils/calendar.ts](file:///c:/Users/cyanez/Documents/Aganda%20Digital/Aganda%20Digital/src/utils/calendar.ts)

Agregar paleta de colores naranja para notas al objeto `COLOR_PALETTES`:

```typescript
'orange': { 
    bg: 'bg-orange-100', 
    text: 'text-orange-800', 
    border: 'border-orange-400', 
    hover: 'hover:bg-orange-200' 
}
```

## Verification Plan

### Automated Tests

No hay tests automatizados en el proyecto actual. La verificación será manual.

### Manual Verification

1. **Navegación**: Verificar que el nuevo ícono de notas aparece en el menú lateral y cambia la vista correctamente
2. **Creación de Notas**: 
   - Hacer clic en una celda vacía del calendario mensual
   - Verificar que se abre el modal con la fecha correcta preseleccionada
   - Completar título y contenido
   - Guardar y verificar que aparece en el calendario
3. **Edición de Notas**: 
   - Hacer clic en una nota existente
   - Modificar título/contenido
   - Verificar que se actualiza correctamente
4. **Eliminación**: Eliminar una nota y verificar que desaparece
5. **Diferenciación Visual**: Confirmar que las notas usan colores naranjas claramente distinguibles de los turnos azules
6. **Multi-tenancy**: Cambiar de organización y verificar que solo se muestran las notas del clientId correspondiente
7. **Persistencia**: Recargar la página y verificar que las notas persisten correctamente desde Firebase
8. **Responsividad**: Probar en diferentes tamaños de pantalla
