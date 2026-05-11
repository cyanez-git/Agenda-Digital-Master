import { Search, Plus, Phone, Trash, CalendarPlus } from 'lucide-react';
import { createWhatsAppLink } from '../utils/whatsapp';
import { getInitials } from '../utils/string';
import type { Patient } from '../types';

interface PatientsViewProps {
    patients: Patient[];
    patientFilter: string;
    onFilterChange: (value: string) => void;
    onNewPatient: () => void;
    onEditPatient: (p: Patient) => void;
    onDeletePatient: (id: string) => void;
    onScheduleAppointment: (p: Patient) => void;
}

export const PatientsView = ({
    patients,
    patientFilter,
    onFilterChange,
    onNewPatient,
    onEditPatient,
    onDeletePatient,
    onScheduleAppointment,
}: PatientsViewProps) => {
    const filtered = patients
        .filter(p =>
            p.name.toLowerCase().includes(patientFilter.toLowerCase()) ||
            p.phone.includes(patientFilter)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white p-4 shadow-sm z-10 flex gap-4 items-center">
                <div className="flex-1 flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
                    <Search size={20} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar paciente por nombre o teléfono..."
                        className="bg-transparent outline-none w-full"
                        value={patientFilter}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </div>
                <button
                    onClick={onNewPatient}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                    <Plus size={20} />
                    <span className="hidden md:inline">Nuevo Paciente</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => onEditPatient(p)}
                            className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-shadow border border-slate-100 group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {getInitials(p.name)}
                                </div>
                                <div className="flex gap-2">
                                    {p.phone && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); window.location.href = createWhatsAppLink(p.phone); }}
                                            className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                            title="Chat WhatsApp"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeletePatient(p.id); }}
                                        className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                        title="Eliminar Paciente"
                                    >
                                        <Trash size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onScheduleAppointment(p); }}
                                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                        title="Agendar Turno"
                                    >
                                        <CalendarPlus size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 truncate text-lg">{p.name}</h3>
                            <p className="text-sm text-slate-500 mb-2 font-mono flex items-center gap-1">
                                <Phone size={12} /> {p.phone}
                            </p>
                            <div className="text-xs bg-slate-50 rounded px-2 py-1 inline-block text-slate-400">
                                Ultima visita: <span className="font-medium text-slate-600">
                                    {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : '-'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
