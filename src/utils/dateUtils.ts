export const formatDueDate = (dateStr: string): string => {
    if (!dateStr) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = dateStr.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Difference in days

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    // Check if within this week relative to today (simple check: if diff is small and not "this week" calendar logic)
    // "This week" usually means current Monday-Sunday or next 7 days.

    // For now, I'll use: if the due date is within the next 6 days, show day name.
    if (diffDays > 1 && diffDays < 7) {
        return due.toLocaleDateString('en-US', { weekday: 'long' });
    }

    // Default: Short Month + Day
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
