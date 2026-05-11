
export const generateTimeSlots = (step: number = 30) => {
    const slots = [];
    const startTotalMinutes = 8 * 60; // 08:00
    const endTotalMinutes = 20 * 60;  // 20:00
    const safeStep = (step && step >= 5) ? step : 30;
    for (let m = startTotalMinutes; m < endTotalMinutes; m += safeStep) {
        const hours = Math.floor(m / 60);
        const mins = m % 60;
        slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }
    return slots;
};

export const checkOverlap = (existingAppts: any[], newDate: string, newTime: string, newDuration: number) => {
    const newStart = new Date(`${newDate}T${newTime}`);
    const newEnd = new Date(newStart.getTime() + newDuration * 60000);

    return existingAppts.some(a => {
        // Only check same date
        if (a.date !== newDate) return false;

        const existStart = new Date(`${a.date}T${a.time}`);
        const existEnd = new Date(existStart.getTime() + (a.duration || 30) * 60000);

        // Overlap logic: (StartA < EndB) and (EndA > StartB)
        return (newStart < existEnd && newEnd > existStart);
    });
};

export const isWithinWorkingHours = (time: string, duration: number) => {
    const [h, m] = time.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + duration;

    // Hardcoded 08:00 (480) to 20:00 (1200) for now, or passed from config
    return startMins >= 480 && endMins <= 1200;
};
