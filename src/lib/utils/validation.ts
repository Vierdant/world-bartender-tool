// Security and validation utilities

export const MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const MAX_JSON_SIZE = 1024 * 1024; // 1MB
export const MAX_INPUT_LENGTH = 1000;

export function validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` };
    }

    // Only allow JSON files for imports
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        return { valid: false, error: 'Only JSON files are allowed' };
    }

    return { valid: true };
}

export function validateImageUrl(url: string): { valid: boolean; error?: string } {
    if (!url.trim()) {
        return { valid: true }; // Empty URLs are allowed
    }

    if (url.length > MAX_INPUT_LENGTH) {
        return { valid: false, error: 'URL too long' };
    }

    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { valid: false, error: 'Invalid URL protocol' };
        }
    } catch {
        return { valid: false, error: 'Invalid URL format' };
    }

    const imagePattern = /\.(jpeg|jpg|png|gif|webp|bmp|svg)$/i;
    if (!imagePattern.test(url)) {
        return { valid: false, error: 'URL must end with a valid image extension' };
    }

    return { valid: true };
}

export function sanitizeInput(input: string): string {
    return input
        .trim()
        .slice(0, MAX_INPUT_LENGTH)
        .replace(/[<>]/g, ''); // Basic XSS prevention
}

export function validateJSON(jsonString: string): { valid: boolean; error?: string } {
    if (jsonString.length > MAX_JSON_SIZE) {
        return { valid: false, error: 'JSON file too large' };
    }

    try {
        const parsed = JSON.parse(jsonString);
        if (typeof parsed !== 'object' || parsed === null) {
            return { valid: false, error: 'Invalid JSON structure' };
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Invalid JSON format' };
    }
}

export function validateProfile(profile: any): { valid: boolean; error?: string } {
    if (!profile || typeof profile !== 'object') {
        return { valid: false, error: 'Invalid profile structure' };
    }

    if (!profile.id || typeof profile.id !== 'string') {
        return { valid: false, error: 'Profile must have a valid ID' };
    }

    if (!profile.name || typeof profile.name !== 'string') {
        return { valid: false, error: 'Profile must have a valid name' };
    }

    if (!profile.image || typeof profile.image !== 'string') {
        return { valid: false, error: 'Profile must have a valid image URL' };
    }

    if (!Array.isArray(profile.menu)) {
        return { valid: false, error: 'Profile must have a valid menu array' };
    }

    // Validate customTheme if present (optional field)
    if (profile.customTheme !== undefined && profile.customTheme !== null) {
        if (typeof profile.customTheme !== 'object') {
            return { valid: false, error: 'Custom theme must be an object' };
        }
        
        // Validate that both light and dark themes exist
        if (!profile.customTheme.light || !profile.customTheme.dark) {
            return { valid: false, error: 'Custom theme must contain both light and dark theme objects' };
        }
        
        // Validate required color properties for each theme
        const requiredColors = [
            'bodyColor', 'fieldColor', 'borderColor', 'textColor', 'textColorMuted', 
            'textColorAccent', 'secondaryColor', 'secondaryColorHover', 'accentColor', 
            'accentColorHover', 'accentColorDark', 'errorColor', 'errorColorDark', 
            'infoColor', 'infoColorDark', 'acceptColor', 'acceptColorDark'
        ];
        
        for (const themeMode of ['light', 'dark']) {
            const theme = profile.customTheme[themeMode];
            if (typeof theme !== 'object') {
                return { valid: false, error: `${themeMode} theme must be an object` };
            }
            
            for (const colorKey of requiredColors) {
                if (!theme[colorKey] || typeof theme[colorKey] !== 'string') {
                    return { valid: false, error: `Missing or invalid ${colorKey} in ${themeMode} theme` };
                }
                
                // Basic hex color validation
                if (!/^#[0-9A-Fa-f]{6}$/.test(theme[colorKey])) {
                    return { valid: false, error: `Invalid hex color format for ${colorKey} in ${themeMode} theme` };
                }
            }
        }
    }

    return { valid: true };
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
