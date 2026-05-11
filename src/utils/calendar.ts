export const COLOR_PALETTES: Record<string, { bg: string, text: string, border: string }> = {
    'blue': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'green': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'purple': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    'red': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    'yellow': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
    'orange': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
};

export const generateTimeSlots = (step: number = 30, startHour: number = 8, endHour: number = 20) => {
    const slots = [];
    const startTotalMinutes = startHour * 60;
    const endTotalMinutes = endHour * 60;
    const safeStep = (step && step >= 5) ? step : 30; // SAFETY GUARD
    for (let m = startTotalMinutes; m < endTotalMinutes; m += safeStep) {
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }
    return slots;
};

export const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
export const addDays = (date: Date, days: number) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };
export const getStartOfWeek = (date: Date) => { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); };

export const isSlotExpired = (dateStr: string, timeStr: string) => {
    const now = new Date();
    const slotDate = new Date(`${dateStr}T${timeStr}`);
    const limit = new Date(now);
    limit.setHours(limit.getHours() - 1, 0, 0, 0);
    return slotDate < limit;
};
