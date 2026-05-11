import React, { useState } from 'react';
import { Building2, Lock, AlertCircle, HelpCircle } from 'lucide-react';

interface LoginScreenProps {
    onLogin: (clientId: string) => void;
    onHelp: () => void;
}

export const LoginScreen = ({ onLogin, onHelp }: LoginScreenProps) => {
    const [orgId, setOrgId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (orgId.length < 3) {
            setError('El ID de organización debe tener al menos 3 caracteres');
            return;
        }
        onLogin(orgId.toLowerCase().replace(/\s+/g, '-'));
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
                        <Building2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">AgendaPro SaaS</h1>
                    <p className="text-slate-500 mt-2">Plataforma de Gestión Multi-Cliente</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Lock size={16} className="text-slate-400" /> ID de Organización
                        </label>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Ej: clinica-central, dr-perez"
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none transition-colors font-medium"
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                        />
                        <p className="text-xs text-slate-400 mt-2">
                            * Si la organización no existe, se creará automáticamente.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
                    >
                        Ingresar al Sistema
                    </button>
                    <button
                        type="button"
                        onClick={onHelp}
                        className="w-full py-3 mt-4 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-bold rounded-xl transition-colors"
                    >
                        <HelpCircle size={20} /> Ayuda
                    </button>
                </form>
            </div>
        </div>
    );
};
