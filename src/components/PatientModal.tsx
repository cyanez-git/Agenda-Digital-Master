import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, Mail, FileText, Calendar, CreditCard, MessageSquare } from 'lucide-react';

interface Patient {
    id: string;
    clientId: string;
    name: string;
    dni?: string;
    email?: string;
    phone: string;
    whatsappName?: string;
    birthDate?: string;
    firstVisit: string;
    lastVisit: string;
    notes?: string;
}

interface PatientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (patient: Patient) => void;
    initialData: Patient | null;
    clientId: string;
}

export const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSave, initialData, clientId }) => {
    const [formData, setFormData] = useState<Patient>({
        id: '',
        clientId,
        name: '',
        dni: '',
        email: '',
        phone: '',
        whatsappName: '',
        birthDate: '',
        firstVisit: new Date().toISOString().split('T')[0],
        lastVisit: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {
                id: crypto.randomUUID(),
                clientId,
                name: '',
                dni: '',
                email: '',
                phone: '',
                whatsappName: '',
                birthDate: '',
                firstVisit: new Date().toISOString().split('T')[0],
                lastVisit: new Date().toISOString().split('T')[0],
                notes: ''
            });
        }
    }, [isOpen, initialData, clientId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Editar Paciente' : 'Nuevo Paciente'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                            <User size={18} className="text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-transparent outline-none font-medium text-slate-700"
                                placeholder="Ej: Juan Pérez"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* DNI & Nacimiento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DNI / Identificación</label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                                <CreditCard size={18} className="text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full bg-transparent outline-none font-medium text-slate-700"
                                    placeholder="Opcional"
                                    value={formData.dni || ''}
                                    onChange={e => setFormData({ ...formData, dni: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Nacimiento</label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                                <Calendar size={18} className="text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full bg-transparent outline-none font-medium text-slate-700"
                                    value={formData.birthDate || ''}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Celular <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                                <Phone size={18} className="text-slate-400" />
                                <input
                                    type="tel"
                                    className="w-full bg-transparent outline-none font-medium text-slate-700"
                                    placeholder="Ej: 11 1234 5678"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                                <Mail size={18} className="text-slate-400" />
                                <input
                                    type="email"
                                    className="w-full bg-transparent outline-none font-medium text-slate-700"
                                    placeholder="Opcional"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Nombre WhatsApp */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre para WhatsApp</label>
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-green-500 transition-all">
                            <MessageSquare size={18} className="text-green-500" />
                            <input
                                type="text"
                                className="w-full bg-transparent outline-none font-medium text-slate-700"
                                placeholder={formData.name || 'Ej: Juanchi'}
                                value={formData.whatsappName || ''}
                                onChange={e => setFormData({ ...formData, whatsappName: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Opcional. Cómo saludar al paciente en WhatsApp. Si está vacío, usa el nombre completo.</p>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas / Antecedentes</label>
                        <div className="flex items-start gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                            <FileText size={18} className="text-slate-400 mt-1" />
                            <textarea
                                rows={3}
                                className="w-full bg-transparent outline-none font-medium text-slate-700 resize-none"
                                placeholder="Información relevante..."
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                    <button
                        onClick={() => {
                            if (!formData.name.trim()) return alert('El nombre es obligatorio');
                            if (!formData.phone.trim()) return alert('El celular es obligatorio');
                            onSave(formData);
                        }}
                        className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Save size={20} /> Guardar Paciente
                    </button>
                </div>
            </div>
        </div>
    );
};
