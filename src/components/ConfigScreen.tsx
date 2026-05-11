import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Layout, Type, MessageSquare, User, Upload } from 'lucide-react';
import { getInitials } from '../utils/string';
import { processAvatar } from '../utils/image';

// Replicating interfaces from App.tsx to avoid circular deps or complex refactors
// In a larger app, these would be in a types.ts file
interface AppointmentType {
    id: string;
    label: string;
    duration: number; // in minutes
    colorKey: string;
    price?: number;
}

interface Professional {
    id: string;
    name: string;
    title?: string;
    avatar?: string;
}

interface AppConfig {
    clientId: string;
    organizationName: string;
    theme: any;
    types: AppointmentType[];
    professionals: Professional[];
    slotDuration: number;
    gridStep: number;
    whatsappConfirmTemplate: string;
    whatsappReminderTemplate: string;
    country: string;
    startHour: number;
    endHour: number;
}

// Color palettes matching App.tsx map
const AVAILABLE_THEMES = [
    { key: 'blue', label: 'Azul Profesional', color: 'bg-blue-600' },
    { key: 'indigo', label: 'Índigo Moderno', color: 'bg-indigo-600' },
    { key: 'teal', label: 'Verde Salud', color: 'bg-teal-600' },
    { key: 'rose', label: 'Rosa Suave', color: 'bg-rose-600' },
    { key: 'violet', label: 'Violeta Creativo', color: 'bg-violet-600' },
    { key: 'slate', label: 'Gris Minimalista', color: 'bg-slate-600' },
];

const AVAILABLE_COLORS = [
    { key: 'blue', label: 'Azul', bg: 'bg-blue-100', text: 'text-blue-700' },
    { key: 'green', label: 'Verde', bg: 'bg-green-100', text: 'text-green-700' },
    { key: 'red', label: 'Rojo', bg: 'bg-red-100', text: 'text-red-700' },
    { key: 'yellow', label: 'Amarillo', bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { key: 'purple', label: 'Violeta', bg: 'bg-purple-100', text: 'text-purple-700' },
    { key: 'pink', label: 'Rosa', bg: 'bg-pink-100', text: 'text-pink-700' },
    { key: 'orange', label: 'Naranja', bg: 'bg-orange-100', text: 'text-orange-700' },
    { key: 'gray', label: 'Gris', bg: 'bg-gray-100', text: 'text-gray-700' },
];

interface ConfigScreenProps {
    config: AppConfig;
    onSave: (newConfig: AppConfig) => void;
    onCancel: () => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ config, onSave, onCancel }) => {
    const [formData, setFormData] = useState<AppConfig>(config);
    const [activeTab, setActiveTab] = useState<'general' | 'professionals' | 'types' | 'whatsapp'>('general');

    useEffect(() => {
        setFormData(config);
    }, [config]);

    const handleChange = (field: keyof AppConfig, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- Type Management ---
    const addType = () => {
        const newType: AppointmentType = {
            id: crypto.randomUUID(),
            label: 'Nuevo Tipo',
            duration: 30,
            colorKey: 'blue'
        };
        setFormData(prev => ({ ...prev, types: [...prev.types, newType] }));
    };

    const removeType = (id: string) => {
        if (confirm('¿Seguro que deseas eliminar este tipo de turno?')) {
            setFormData(prev => ({ ...prev, types: prev.types.filter(t => t.id !== id) }));
        }
    };

    const updateType = (id: string, field: keyof AppointmentType, value: any) => {
        setFormData(prev => ({
            ...prev,
            types: prev.types.map(t => t.id === id ? { ...t, [field]: value } : t)
        }));
    };

    // --- Professional Management ---
    const addProfessional = () => {
        const newProf: Professional = {
            id: crypto.randomUUID(),
            name: 'Nuevo Profesional',
            title: 'Especialista'
        };
        setFormData(prev => ({ ...prev, professionals: [...prev.professionals, newProf] }));
    };

    const removeProfessional = (id: string) => {
        if (formData.professionals.length <= 1) {
            alert('Debe haber al menos un profesional.');
            return;
        }
        if (confirm('¿Seguro que deseas eliminar este profesional?')) {
            setFormData(prev => ({ ...prev, professionals: prev.professionals.filter(p => p.id !== id) }));
        }
    };

    const updateProfessional = (id: string, field: keyof Professional, value: any) => {
        setFormData(prev => ({
            ...prev,
            professionals: prev.professionals.map(p => p.id === id ? { ...p, [field]: value } : p)
        }));
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                        <p className="text-slate-500">Personaliza tu agenda y automatizaciones</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Volver
                        </button>
                        <button
                            onClick={() => onSave(formData)}
                            className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <Save size={20} /> Guardar Cambios
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="col-span-12 md:col-span-3 space-y-2">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'general' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`}
                        >
                            <Layout size={20} /> General y Diseño
                        </button>
                        <button
                            onClick={() => setActiveTab('professionals')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'professionals' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`}
                        >
                            <User size={20} /> Profesionales
                        </button>
                        <button
                            onClick={() => setActiveTab('types')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'types' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`}
                        >
                            <Type size={20} /> Tipos de Turno
                        </button>
                        <button
                            onClick={() => setActiveTab('whatsapp')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-medium transition-colors ${activeTab === 'whatsapp' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`}
                        >
                            <MessageSquare size={20} /> WhatsApp
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 md:col-span-9 space-y-6">

                        {/* --- GENERAL TAB --- */}
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <Layout size={20} className="text-blue-500" /> Información del Consultorio
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Organización</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                value={formData.organizationName}
                                                onChange={e => handleChange('organizationName', e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duración Base (min)</label>
                                                <input
                                                    type="number"
                                                    className="w-full border rounded-xl px-4 py-2 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    value={formData.slotDuration}
                                                    onChange={e => handleChange('slotDuration', Number(e.target.value))}
                                                />
                                                <p className="text-xs text-slate-400 mt-1">Tiempo sugerido al crear turnos.</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">País (Feriados)</label>
                                                <select
                                                    className="w-full border rounded-xl px-4 py-2 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    value={formData.country || 'AR'}
                                                    onChange={e => handleChange('country', e.target.value)}
                                                >
                                                    <option value="AR">Argentina</option>
                                                    <option value="US">Estados Unidos</option>
                                                    <option value="MX">México</option>
                                                    <option value="ES">España</option>
                                                    <option value="UY">Uruguay</option>
                                                    <option value="CL">Chile</option>
                                                    <option value="CO">Colombia</option>
                                                    <option value="PE">Perú</option>
                                                </select>
                                                <p className="text-xs text-slate-400 mt-1">Define los días festivos.</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Escala de Grilla (min)</label>
                                            <select
                                                className="w-full border rounded-xl px-4 py-2 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                value={formData.gridStep}
                                                onChange={e => handleChange('gridStep', Number(e.target.value))}
                                            >
                                                <option value={10}>10 minutos</option>
                                                <option value={15}>15 minutos</option>
                                                <option value={30}>30 minutos</option>
                                                <option value={60}>60 minutos</option>
                                            </select>
                                            <p className="text-xs text-slate-400 mt-1">División visual en la vista diaria.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora de Inicio</label>
                                                <select
                                                    className="w-full border rounded-xl px-4 py-2 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    value={formData.startHour || 8}
                                                    onChange={e => handleChange('startHour', Number(e.target.value))}
                                                >
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <option key={i} value={i}>
                                                            {String(i).padStart(2, '0')}:00
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400 mt-1">Comienzo de la grilla horaria.</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora de Fin</label>
                                                <select
                                                    className="w-full border rounded-xl px-4 py-2 bg-slate-50 focus:bg-white outline-none focus:ring-2 ring-blue-500 font-medium"
                                                    value={formData.endHour || 20}
                                                    onChange={e => handleChange('endHour', Number(e.target.value))}
                                                >
                                                    {Array.from({ length: 24 }, (_, i) => (
                                                        <option key={i} value={i}>
                                                            {String(i).padStart(2, '0')}:00
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400 mt-1">Fin de la grilla horaria.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Tema de Color</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {AVAILABLE_THEMES.map(theme => (
                                            <button
                                                key={theme.key}
                                                onClick={() => handleChange('theme', theme.key)}
                                                className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${formData.theme === theme.key ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-100 hover:border-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-6 h-6 rounded-full ${theme.color} shadow-sm`}></div>
                                                <span className="font-medium text-slate-700">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- PROFESSIONALS TAB --- */}
                        {activeTab === 'professionals' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <User size={20} className="text-blue-500" /> Equipo de Profesionales
                                    </h3>
                                    <button onClick={addProfessional} className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-bold text-sm flex items-center gap-2">
                                        <Plus size={16} /> Nuevo Profesional
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {formData.professionals.map(p => (
                                        <div key={p.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                            {/* Avatar Section */}
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shadow-sm flex items-center justify-center relative group">
                                                    {p.avatar && p.avatar.trim() !== '' ? (
                                                        <img
                                                            src={p.avatar}
                                                            alt={p.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).style.display = 'none';
                                                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-slate-400 font-bold text-lg">{getInitials(p.name)}</span>
                                                    )}

                                                    {/* Hover Overlay for upload */}
                                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                        <Upload className="text-white w-6 h-6" />
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    try {
                                                                        const base64 = await processAvatar(e.target.files[0]);
                                                                        updateProfessional(p.id, 'avatar', base64);
                                                                    } catch (err) {
                                                                        alert('Error al procesar la imagen');
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                <div className="text-[10px] text-blue-600 font-medium cursor-pointer relative">
                                                    Cambiar Foto
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                try {
                                                                    const base64 = await processAvatar(e.target.files[0]);
                                                                    updateProfessional(p.id, 'avatar', base64);
                                                                } catch (err) {
                                                                    alert('Error al procesar la imagen');
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex-1 w-full grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white px-3 py-2 rounded-lg outline-none focus:ring-2 ring-blue-500 border border-slate-200"
                                                        value={p.name}
                                                        onChange={(e) => updateProfessional(p.id, 'name', e.target.value)}
                                                        placeholder="Nombre del profesional"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Título / Especialidad</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white px-3 py-2 rounded-lg outline-none focus:ring-2 ring-blue-500 border border-slate-200"
                                                        value={p.title || ''}
                                                        onChange={(e) => updateProfessional(p.id, 'title', e.target.value)}
                                                        placeholder="Especialidad"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeProfessional(p.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end md:self-center"
                                                title="Eliminar Profesional"
                                                disabled={formData.professionals.length <= 1}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- TYPES TAB --- */}
                        {activeTab === 'types' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Type size={20} className="text-blue-500" /> Tipos de Turno
                                    </h3>
                                    <button onClick={addType} className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-bold text-sm flex items-center gap-2">
                                        <Plus size={16} /> Nuevo Tipo
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formData.types.map((type, idx) => (
                                        <div key={type.id} className="flex gap-4 items-center p-4 border rounded-xl bg-slate-50 group hover:shadow-md transition-all">
                                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 font-bold text-slate-400">
                                                {idx + 1}
                                            </div>

                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-bold text-slate-700"
                                                    value={type.label}
                                                    onChange={e => updateType(type.id, 'label', e.target.value)}
                                                />
                                            </div>

                                            <div className="w-24">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minutos</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none font-bold text-slate-700"
                                                    value={type.duration || 30}
                                                    onChange={e => updateType(type.id, 'duration', Number(e.target.value))}
                                                />
                                            </div>

                                            <div className="w-48">
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Color</label>
                                                <select
                                                    className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer"
                                                    value={type.colorKey}
                                                    onChange={e => updateType(type.id, 'colorKey', e.target.value)}
                                                >
                                                    {AVAILABLE_COLORS.map(c => (
                                                        <option key={c.key} value={c.key}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                onClick={() => removeType(type.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- WHATSAPP TAB --- */}
                        {activeTab === 'whatsapp' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-blue-500" /> Plantillas de Mensajes
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block font-bold text-slate-700 mb-2">Mensaje de Confirmación</label>
                                        <textarea
                                            rows={4}
                                            className="w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 ring-green-500 outline-none font-medium text-slate-600"
                                            value={formData.whatsappConfirmTemplate}
                                            onChange={e => handleChange('whatsappConfirmTemplate', e.target.value)}
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            Variables: <span className="font-mono bg-slate-100 px-1 rounded">{'{paciente}'}</span>, <span className="font-mono bg-green-100 text-green-700 px-1 rounded">{'{nombreWA}'}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{'{fecha}'}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{'{hora}'}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{'{profesional}'}</span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-slate-700 mb-2">Mensaje de Recordatorio</label>
                                        <textarea
                                            rows={4}
                                            className="w-full border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 ring-green-500 outline-none font-medium text-slate-600"
                                            value={formData.whatsappReminderTemplate}
                                            onChange={e => handleChange('whatsappReminderTemplate', e.target.value)}
                                        />
                                        <p className="text-xs text-slate-400 mt-2">
                                            Variables: <span className="font-mono bg-slate-100 px-1 rounded">{'{paciente}'}</span>, <span className="font-mono bg-green-100 text-green-700 px-1 rounded">{'{nombreWA}'}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{'{hora}'}</span>, <span className="font-mono bg-slate-100 px-1 rounded">{'{profesional}'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
