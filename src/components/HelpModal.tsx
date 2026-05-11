import React, { useState } from 'react';
import { X, Calendar, Users, MessageSquare, Mic, BookOpen } from 'lucide-react';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'agenda' | 'patients' | 'messaging' | 'ai'>('agenda');

    const renderContent = () => {
        switch (activeTab) {
            case 'agenda':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Calendar className="text-blue-500" /> Gestión de Agenda
                        </h3>
                        <ul className="space-y-3 text-slate-600 text-sm">
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                <div>
                                    <span className="font-bold text-slate-800">Crear Turno:</span> Hacé clic en cualquier espacio vacío del calendario. Se abrirá una ventana para elegir el paciente y confirmar el horario.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                <div>
                                    <span className="font-bold text-slate-800">Editar/Mover:</span> Hacé clic en un turno existente para ver detalles, marcar como asistió, cancelar o reprogramar.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                <div>
                                    <span className="font-bold text-slate-800">Vistas:</span> Usá los botones de la barra lateral izquierda para cambiar entre vista Día, Semana o Mes.
                                </div>
                            </li>
                        </ul>
                    </div>
                );
            case 'patients':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-blue-500" /> Pacientes
                        </h3>
                        <ul className="space-y-3 text-slate-600 text-sm">
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                <div>
                                    <span className="font-bold text-slate-800">Buscar:</span> En la sección "Pacientes" (barra lateral), usá el buscador para encontrar por nombre o teléfono.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                <div>
                                    <span className="font-bold text-slate-800">Nuevo Paciente:</span> Hacé clic en el botón "+ Nuevo Paciente" para registrar uno nuevo. Es importante cargar el celular para enviar recordatorios.
                                </div>
                            </li>
                        </ul>
                    </div>
                );
            case 'messaging':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="text-green-500" /> Mensajería (WhatsApp)
                        </h3>
                        <p className="text-sm text-slate-600">
                            Enviá recordatorios de turnos de forma masiva o individual.
                        </p>
                        <ul className="space-y-3 text-slate-600 text-sm">
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                <div>
                                    <span className="font-bold text-slate-800">Centro de Mensajería:</span> Accedé desde el ícono de mensajes en la barra lateral.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                <div>
                                    <span className="font-bold text-slate-800">Modo Ráfaga:</span> Usá el botón "Iniciar Modo Ráfaga" para recorrer rápidamente todos los turnos del día y enviar mensajes uno por uno.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                <div>
                                    <span className="font-bold text-slate-800">Plantillas:</span> El mensaje se genera automáticamente con los datos del turno (fecha, hora, profesional).
                                </div>
                            </li>
                        </ul>
                    </div>
                );
            case 'ai':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Mic className="text-indigo-500" /> Asistente IA
                        </h3>
                        <p className="text-sm text-slate-600">
                            Tu asistente inteligente te ayuda a gestionar la agenda con tu voz. Hacé clic en el avatar de IA (arriba a la izquierda) para activar.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-sm text-slate-700 mb-2">Ejemplos de comandos:</h4>
                            <ul className="space-y-2 text-sm text-slate-600 italic">
                                <li>"Agendame un turno para Juan Perez el viernes a las 10"</li>
                                <li>"Mover el turno de Ana a mañana a las 5 de la tarde"</li>
                                <li>"Cancelar el turno de Carlos"</li>
                                <li>"¿Qué turnos tengo hoy?"</li>
                                <li>"Crear paciente nuevo: Maria Gomez, telefono 11..."</li>
                            </ul>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Guía de Uso</h2>
                            <p className="text-slate-400 text-sm">Aprende a usar tu Agenda Digital</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body layout */}
                <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-48 bg-slate-50 border-r border-slate-100 p-2 flex md:flex-col gap-1 overflow-x-auto shrink-0">
                        <button
                            onClick={() => setActiveTab('agenda')}
                            className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'agenda' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Calendar size={16} /> Agenda
                        </button>
                        <button
                            onClick={() => setActiveTab('patients')}
                            className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'patients' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Users size={16} /> Pacientes
                        </button>
                        <button
                            onClick={() => setActiveTab('messaging')}
                            className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'messaging' ? 'bg-white text-green-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <MessageSquare size={16} /> Mensajería
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`p-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'ai' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            <Mic size={16} /> Asistente IA
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-white">
                        {renderContent()}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
};
