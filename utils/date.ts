
export const toYyyyMmDd = (date: Date): string => date.toISOString().split('T')[0];

export const getWeekDays = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    const day = startOfWeek.getUTCDay();
    const diff = startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setUTCDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setUTCDate(day.getUTCDate() + i);
        days.push(day);
    }
    return days;
};

export const formatDateRange = (start: string, end: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(`${end}T00:00:00Z`);
    if (start === end) {
        return startDate.toLocaleDateString('en-GB', options);
    }
    return `${startDate.toLocaleDateString('en-GB', options)} to ${endDate.toLocaleDateString('en-GB', options)}`;
};

export const formatFriendlyDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(`${date}T00:00:00Z`) : date;
    return dateObj.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};
