import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, User, Phone, Clock, Calendar, FileText } from 'lucide-react';
import { createWhatsAppLink } from '../utils/whatsapp';

interface AppointmentType {
    id: string;
    label: string;
    colorKey: string;
}

interface Appointment {
    id: string;
    clientId: string;
    professionalId: string;
    title: string;
    clientName: string;
    patientId?: string;
    dni?: string; // Additional field for new patients if needed
    date: string;
    time: string;
    duration: number;
    typeId: string;
    isNewPatient: boolean;
    notes?: string;
    phone?: string;
}

// Shared interface (should ideally be in a types file)
// Shared interface (should ideally be in a types file)
interface Patient {
    id: string;
    clientId: string;
    name: string;
    dni?: string;
    email?: string;
    phone: string;
    birthDate?: string;
    firstVisit: string;
    lastVisit: string;
    notes?: string;
}

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (appt: Appointment) => void;
    onDelete: (id: string) => void;
    initialData: Appointment | null;
    selectedSlot: { date: string; time: string } | null;
    types: AppointmentType[];
    professionalId: string;
    clientId: string;
    patients?: Patient[]; // Optional to avoid breaking if not passed
    dbSavePatient?: (patient: Patient) => void; // Optional
    confirmTemplate?: string;
    professionalName?: string;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialData,
    selectedSlot,
    types,
    professionalId,
    clientId,
    patients = [], // Default to empty array
    dbSavePatient,
    confirmTemplate,
    professionalName = ''
}) => {
    const [formData, setFormData] = useState<Appointment>({
        id: '',
        clientId,
        professionalId,
        title: 'Consulta',
        clientName: '',
        patientId: '',
        date: '',
        time: '',
        duration: 30,
        typeId: types[0]?.id || '1',
        isNewPatient: false,
        notes: '',
        phone: ''
    });

    // Handle auto-filling patient details if name matches an existing patient
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const found = patients.find(p => p.name.toLowerCase() === val.toLowerCase());
        setFormData(prev => ({
            ...prev,
            clientName: val,
            patientId: found ? found.id : '',
            phone: found?.phone || prev.phone
        }));
    };

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // If appointment has patientId but no phone, try to get phone from patient
                let loadedData = { ...initialData };
                if (loadedData.patientId && !loadedData.phone) {
                    const linkedPatient = patients.find(p => p.id === loadedData.patientId);
                    if (linkedPatient?.phone) {
                        loadedData.phone = linkedPatient.phone;
                    }
                }
                setFormData(loadedData);
            } else if (selectedSlot) {
                setFormData({
                    id: crypto.randomUUID(),
                    clientId,
                    professionalId,
                    title: 'Consulta',
                    clientName: '',
                    date: selectedSlot.date,
                    time: selectedSlot.time,
                    duration: 30,
                    typeId: types[0]?.id || '1',
                    isNewPatient: true,
                    notes: '',
                    phone: ''
                });
            }
        }
    }, [isOpen, initialData, selectedSlot, clientId, professionalId, types, patients]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {initialData ? 'Editar Turno' : 'Nuevo Turno'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">

                    {/* Patient Name */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Paciente</label>
                        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                            <User size={18} className="text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                list="patient-list-suggestions"
                                placeholder="Nombre completo"
                                className="w-full bg-transparent outline-none font-medium"
                                value={formData.clientName}
                                onChange={handleNameChange}
                            />
                            <datalist id="patient-list-suggestions">
                                {patients.map(p => (
                                    <option key={p.id} value={p.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                                <Phone size={18} className="text-slate-400" />
                                <input
                                    type="tel"
                                    placeholder="Ej: 11 1234-5678"
                                    className="w-full bg-transparent outline-none font-medium"
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Turno</label>
                            <select
                                className="w-full border rounded-xl px-3 py-2.5 bg-white font-medium outline-none focus:ring-2 ring-blue-500"
                                value={formData.typeId}
                                onChange={e => setFormData({ ...formData, typeId: e.target.value })}
                            >
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                            <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50">
                                <Calendar size={18} className="text-slate-400" />
                                <input
                                    type="date"
                                    className="w-full bg-transparent outline-none font-medium"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Time & Duration */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                                <div className="flex items-center gap-2 border rounded-xl px-3 py-2 bg-slate-50">
                                    <Clock size={18} className="text-slate-400" />
                                    <input
                                        type="time"
                                        className="w-full bg-transparent outline-none font-medium"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="w-20">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Min</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-xl px-3 py-2 bg-slate-50 font-medium text-center outline-none"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas Adicionales</label>
                        <div className="flex gap-2 border rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:ring-2 ring-blue-500 transition-all">
                            <FileText size={18} className="text-slate-400 mt-1" />
                            <textarea
                                rows={3}
                                placeholder="Detalles importantes..."
                                className="w-full bg-transparent outline-none font-medium resize-none"
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t flex gap-3">
                    {initialData && (
                        <button
                            onClick={() => {
                                if (confirm('¿Seguro que deseas anular este turno?')) {
                                    onDelete(formData.id);
                                }
                            }}
                            className="p-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                            title="Anular Turno"
                        >
                            <Trash2 size={24} />
                        </button>
                    )}

                    <div className="flex-1 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                            Cancelar
                        </button>

                        {/* Action Buttons */}
                        {(() => {
                            const handleSave = () => {
                                if (!formData.clientName.trim()) {
                                    alert('Por favor ingrese el nombre del paciente');
                                    return;
                                }

                                let finalData = { ...formData };

                                // Auto-create Patient if name is typed but not selected from list
                                if (!finalData.patientId && dbSavePatient) {
                                    const existing = patients.find(p => p.name.toLowerCase() === finalData.clientName.toLowerCase());

                                    if (existing) {
                                        finalData.patientId = existing.id;
                                        finalData.phone = existing.phone || finalData.phone;
                                    } else {
                                        const newId = crypto.randomUUID();
                                        const newPatient: Patient = {
                                            id: newId,
                                            clientId,
                                            name: finalData.clientName,
                                            email: '',
                                            phone: finalData.phone || '',
                                            dni: '',
                                            firstVisit: finalData.date,
                                            lastVisit: finalData.date,
                                            notes: 'Creado automáticamente desde Turno'
                                        };
                                        dbSavePatient(newPatient);
                                        finalData.patientId = newId;
                                    }
                                }
                                onSave(finalData);
                            };

                            const handleSaveAndConfirm = () => {
                                if (!formData.clientName.trim()) {
                                    alert('Por favor ingrese el nombre del paciente');
                                    return;
                                }

                                // 1. Save (re-use logic slightly duplicated or we rely on parent causing close? Parent closes modal usually. Wait, handleSave calls onSave. We need to do actions BEFORE valid save triggers close)
                                // Let's just run the save logic first.
                                handleSave();

                                // 2. Generate WhatsApp Link
                                if (formData.phone && confirmTemplate) {
                                    let msg = confirmTemplate
                                        .replace(/{paciente}/gi, formData.clientName)
                                        .replace(/{nombreWA}/gi, formData.clientName) // For new appointments, use clientName
                                        .replace(/{hora}/gi, formData.time)
                                        .replace(/{fecha}/gi, `${formData.date.split('-')[2]}/${formData.date.split('-')[1]}/${formData.date.split('-')[0]}`);

                                    msg = msg.replace(/{profesional}/gi, professionalName);

                                    window.location.href = createWhatsAppLink(formData.phone, msg);
                                }
                            };

                            return (
                                <div className="flex-[2] flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} /> Guardar
                                    </button>
                                    <button
                                        onClick={handleSaveAndConfirm}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        title="Guardar y Confirmar"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>

            </div>
        </div >
    );
};
