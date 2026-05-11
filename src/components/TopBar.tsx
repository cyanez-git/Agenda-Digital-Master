import { ChevronLeft, ChevronRight, Check, Bell, LogOut, HelpCircle } from 'lucide-react';
import type { AppConfig, AppNotification, Professional } from '../types';
import type { ViewMode } from '../constants';
import { APP_THEMES } from '../constants';
import { formatDateKey } from '../utils/calendar';
import { getInitials } from '../utils/string';

interface TopBarProps {
    currentDate: Date;
    view: ViewMode;
    config: AppConfig;
    selectedProfId: string;
    currentProfessional: Professional;
    notifications: AppNotification[];
    isNotificationsOpen: boolean;
    onDateChange: (date: Date) => void;
    onProfessionalChange: (id: string) => void;
    onClearNotifications: () => void;
    onNotificationsOpenChange: (open: boolean) => void;
    onLogout: () => void;
    onHelp: () => void;
}

export const TopBar = ({
    currentDate,
    view,
    config,
    selectedProfId,
    currentProfessional,
    notifications,
    isNotificationsOpen,
    onDateChange,
    onProfessionalChange,
    onClearNotifications,
    onNotificationsOpenChange,
    onLogout,
    onHelp,
}: TopBarProps) => {
    const currentTheme = APP_THEMES[config.theme] ?? APP_THEMES.blue;

    const navigateDate = (direction: 1 | -1) => {
        const d = new Date(currentDate);
        if (view === 'month') d.setMonth(d.getMonth() + direction);
        else if (view === 'week') d.setDate(d.getDate() + 7 * direction);
        else d.setDate(d.getDate() + direction);
        onDateChange(d);
    };

    return (
        <div className="bg-white shadow-md z-20 px-4 py-3 flex flex-col gap-3 shrink-0">
            {/* Row 1: Professional selector + logout */}
            <div className="flex justify-between items-center">
                <div className="relative group flex-1">
                    <button className="flex items-center gap-2 font-bold text-slate-700 bg-slate-100 px-2 py-2 rounded-lg pr-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {currentProfessional.avatar && currentProfessional.avatar.trim() !== '' ? (
                                <img src={currentProfessional.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs text-slate-500 font-bold">{getInitials(currentProfessional.name)}</span>
                            )}
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-xs text-slate-400 uppercase font-bold leading-none">{config.organizationName}</span>
                            <span className="truncate max-w-[150px] text-sm">{currentProfessional.name}</span>
                        </div>
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 hidden group-hover:block z-50 overflow-hidden">
                        <div className="p-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase">Seleccionar Profesional</div>
                        {config.professionals.map(p => (
                            <button
                                key={p.id}
                                onClick={() => onProfessionalChange(p.id)}
                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 ${selectedProfId === p.id ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                    {p.avatar && p.avatar.trim() !== '' ? (
                                        <img src={p.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-500 font-bold">{getInitials(p.name)}</span>
                                    )}
                                </div>
                                <span className="flex-1 truncate">{p.name}</span>
                                {selectedProfId === p.id && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onLogout} className="bg-slate-100 text-slate-500 p-2 rounded-lg hover:bg-red-50 hover:text-red-500 shrink-0">
                    <LogOut size={18} />
                </button>
            </div>

            {/* Row 2: Notifications + Hoy + Help */}
            <div className="flex items-center justify-center gap-3">
                <div className="relative shrink-0">
                    <button
                        onClick={() => onNotificationsOpenChange(!isNotificationsOpen)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 relative"
                    >
                        <Bell size={20} />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                        )}
                    </button>

                    {isNotificationsOpen && (
                        <>
                            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => onNotificationsOpenChange(false)} />
                            <div className="fixed left-4 right-4 top-32 md:absolute md:top-full md:left-auto md:right-0 md:w-80 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <span className="font-bold text-sm text-slate-700">Notificaciones</span>
                                    {notifications.length > 0 && (
                                        <button onClick={onClearNotifications} className="text-xs text-blue-600 hover:underline">
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-xs italic">No hay notificaciones nuevas</div>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.read ? 'bg-blue-50/50' : ''}`}>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                                                    <span className="text-[10px] text-slate-400">{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 mb-2">{n.msg}</p>
                                                {n.actionLabel && (
                                                    <button
                                                        onClick={() => { n.onAction?.(); onNotificationsOpenChange(false); }}
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                                                    >
                                                        {n.actionLabel} →
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={() => onDateChange(new Date())}
                    className={`${currentTheme.primary} text-white px-4 py-2 rounded-lg text-sm font-bold shadow shrink-0`}
                >
                    Hoy
                </button>

                <button onClick={onHelp} className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 shrink-0" title="Ayuda">
                    <HelpCircle size={20} />
                </button>
            </div>

            {/* Row 3: Date navigation */}
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg">
                <button onClick={() => navigateDate(-1)}><ChevronLeft size={20} /></button>
                <div className="relative group cursor-pointer">
                    <span className="text-sm font-bold text-slate-800 uppercase group-hover:text-blue-600 transition-colors">
                        {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <input
                        type="date"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        value={formatDateKey(currentDate)}
                        onChange={(e) => {
                            if (!e.target.value) return;
                            const [y, m, d] = e.target.value.split('-').map(Number);
                            onDateChange(new Date(y, m - 1, d));
                        }}
                    />
                </div>
                <button onClick={() => navigateDate(1)}><ChevronRight size={20} /></button>
            </div>
        </div>
    );
};
