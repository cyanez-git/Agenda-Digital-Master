
// --- DATA: FERIADOS (AR 2025/2026) ---
// Sources: Argentina official calendar projections
const HOLIDAYS_AR: Record<string, string> = {
    // 2025
    '2025-01-01': 'Año Nuevo',
    '2025-03-03': 'Carnaval',
    '2025-03-04': 'Carnaval',
    '2025-03-24': 'Día de la Memoria',
    '2025-04-02': 'Malvinas',
    '2025-04-18': 'Viernes Santo',
    '2025-05-01': 'Día del Trabajador',
    '2025-05-25': 'Revolución de Mayo',
    '2025-06-17': 'Güemes',
    '2025-06-20': 'Día de la Bandera',
    '2025-07-09': 'Independencia',
    '2025-08-17': 'San Martín',
    '2025-10-12': 'Diversidad Cultural',
    '2025-11-20': 'Soberanía Nacional',
    '2025-12-08': 'Inmaculada Concepción',
    '2025-12-25': 'Navidad',

    // 2026 (Projections based on standard rules)
    '2026-01-01': 'Año Nuevo',
    '2026-02-16': 'Carnaval',
    '2026-02-17': 'Carnaval',
    '2026-03-24': 'Día de la Memoria',
    '2026-04-02': 'Malvinas / Jueves Santo',
    '2026-04-03': 'Viernes Santo',
    '2026-05-01': 'Día del Trabajador',
    '2026-05-25': 'Revolución de Mayo',
    '2026-06-17': 'Güemes',
    '2026-06-20': 'Día de la Bandera',
    '2026-07-09': 'Independencia',
    '2026-08-17': 'San Martín',
    '2026-10-12': 'Diversidad Cultural',
    '2026-11-20': 'Soberanía Nacional',
    '2026-12-08': 'Inmaculada Concepción',
    '2026-12-25': 'Navidad'
};

const HOLIDAYS_US: Record<string, string> = {
    // 2025 Examples
    '2025-01-01': 'New Year\'s Day',
    '2025-07-04': 'Independence Day',
    '2025-12-25': 'Christmas Day'
};

export const getHoliday = (dateStr: string, country: string = 'AR'): string | null => {
    if (country === 'AR') return HOLIDAYS_AR[dateStr] || null;
    if (country === 'US') return HOLIDAYS_US[dateStr] || null;
    return null;
};
