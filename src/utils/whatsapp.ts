/**
 * Formats a phone number for WhatsApp usage.
 * Automatically adds Argentina's country code (549) if likely missing.
 * 
 * Logic:
 * 1. Sanitizes input to digits only.
 * 2. If it starts with '54', assumes it's already international-ish.
 * 3. If it has 10 digits (e.g. 11 1234 5678), prepends '549'.
 * 4. Otherwise returns sanitized number.
 */
export const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';

    // Remove all non-numeric characters
    const clean = phone.replace(/[^0-9]/g, '');

    // Already has Argentina country code? (54...)
    if (clean.startsWith('54')) {
        return clean;
    }

    // Typical Mobile Number (Area Code + Local Number) = 10 digits
    // e.g. 11 1234 5678 (Buenos Aires) -> 5491112345678
    // e.g. 351 123 4567 (Cordoba) -> 5493511234567
    if (clean.length === 10) {
        return `549${clean}`;
    }

    // Fallback: return numbers as is (user might have entered +1... or other formats)
    return clean;
};

export const createWhatsAppLink = (phone: string, text?: string): string => {
    const formatted = formatPhoneNumber(phone);
    const textParam = text ? `&text=${encodeURIComponent(text)}` : '';
    // Use the whatsapp:// protocol as requested for direct app opening
    return `whatsapp://send?phone=${formatted}${textParam}`;
};
