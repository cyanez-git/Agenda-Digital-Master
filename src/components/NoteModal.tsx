import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Calendar, FileText, StickyNote } from 'lucide-react';

interface Note {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    content: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (note: Note) => void;
    onDelete: (id: string) => void;
    initialData: Note | null;
    selectedDate: string | null;
    professionalId: string;
    clientId: string;
}

export const NoteModal: React.FC<NoteModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    selectedDate,
    professionalId,
    clientId
}) => {
    const [formData, setFormData] = useState<Note>({
        id: '',
        clientId,
        professionalId,
        title: '',
        content: '',
        date: '',
        createdAt: '',
        updatedAt: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else if (selectedDate) {
                const now = new Date().toISOString();
                setFormData({
                    id: crypto.randomUUID(),
                    clientId,
                    professionalId,
                    title: '',
                    content: '',
                    date: selectedDate,
                    createdAt: now,
                    updatedAt: now
                });
            }
        }
    }, [isOpen, initialData, selectedDate, clientId, professionalId]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!formData.title.trim()) {
            alert('Por favor ingrese un título para la nota');
            return;
        }

        const now = new Date().toISOString();
        const savedNote = {
            ...formData,
            updatedAt: now,
            createdAt: formData.createdAt || now
        };

        onSave(savedNote);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-md">
                            <StickyNote size={22} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {initialData ? 'Editar Nota' : 'Nueva Nota'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-orange-500 transition-all">
                            <FileText size={18} className="text-orange-500" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Título de la nota o recordatorio"
                                className="w-full bg-transparent outline-none font-medium"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50">
                            <Calendar size={18} className="text-orange-500" />
                            <input
                                type="date"
                                className="w-full bg-transparent outline-none font-medium"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contenido</label>
                        <div className="flex gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-orange-500 transition-all">
                            <textarea
                                rows={8}
                                placeholder="Escribe aquí el contenido de tu nota o recordatorio..."
                                className="w-full bg-transparent outline-none font-medium resize-none"
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-orange-50 border-t border-orange-100 flex gap-3">
                    {initialData && (
                        <button
                            onClick={() => {
                                if (confirm('¿Seguro que deseas eliminar esta nota?')) {
                                    onDelete(formData.id);
                                }
                            }}
                            className="p-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                            title="Eliminar Nota"
                        >
                            <Trash2 size={24} />
                        </button>
                    )}

                    <div className="flex-1 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            onClick={handleSave}
                            className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Guardar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
