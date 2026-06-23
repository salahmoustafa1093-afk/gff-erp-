import { format, parseISO, isValid, differenceInDays } from 'date-fns';
// ============================================
// Date Helpers
// ============================================
export function parseDate(date) {
    if (!date)
        return null;
    if (date instanceof Date)
        return isValid(date) ? date : null;
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
}
export function formatDate(date, formatStr = 'yyyy-MM-dd') {
    const parsed = parseDate(date);
    if (!parsed)
        return '-';
    return format(parsed, formatStr);
}
export function daysUntil(date) {
    const parsed = parseDate(date);
    if (!parsed)
        return null;
    return differenceInDays(parsed, new Date());
}
export function isOverdue(date) {
    const days = daysUntil(date);
    return days !== null && days < 0;
}
// ============================================
// Number & Math Helpers
// ============================================
export function roundToDecimals(value, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
}
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}
export function average(arr) {
    if (arr.length === 0)
        return 0;
    return roundToDecimals(sum(arr) / arr.length);
}
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
// ============================================
// Array Helpers
// ============================================
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = String(item[key]);
        if (!result[groupKey])
            result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {});
}
export function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal < bVal)
            return direction === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return direction === 'asc' ? 1 : -1;
        return 0;
    });
}
export function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter((item) => {
        const val = String(item[key]);
        if (seen.has(val))
            return false;
        seen.add(val);
        return true;
    });
}
export function partition(array, predicate) {
    const pass = [];
    const fail = [];
    array.forEach((item) => {
        if (predicate(item))
            pass.push(item);
        else
            fail.push(item);
    });
    return [pass, fail];
}
// ============================================
// Object Helpers
// ============================================
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
export function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}
export function pick(obj, keys) {
    const result = {};
    keys.forEach((key) => {
        if (key in obj)
            result[key] = obj[key];
    });
    return result;
}
export function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[String(key)]);
    return result;
}
export function isEmpty(value) {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
// ============================================
// String Helpers
// ============================================
export function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
export function camelToTitle(str) {
    return str
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
}
export function kebabToTitle(str) {
    return str
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
}
export function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
export function slugify(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
// ============================================
// Debounce & Throttle
// ============================================
export function debounce(func, wait) {
    let timeout = null;
    return (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
export function throttle(func, limit) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
// ============================================
// Local Storage Helpers
// ============================================
export function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (e) {
        console.error('Failed to write to localStorage:', e);
    }
}
export function storageGet(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        if (item === null)
            return defaultValue;
        return JSON.parse(item);
    }
    catch {
        return defaultValue;
    }
}
export function storageRemove(key) {
    localStorage.removeItem(key);
}
export function storageClear() {
    localStorage.clear();
}
// ============================================
// Color Helpers
// ============================================
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result)
        return null;
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}
export function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
export function lightenColor(hex, amount = 0.2) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
export function darkenColor(hex, amount = 0.2) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return hex;
    const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}
// ============================================
// Validation Helpers
// ============================================
export function isValidEmail(email) {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
}
export function isValidPhone(phone) {
    return /^[+]?[\d\s-]{8,}$/.test(phone);
}
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
export function isValidNumber(value) {
    return !isNaN(Number(value)) && isFinite(Number(value));
}
// ============================================
// Export Helpers
// ============================================
export function exportToCSV(data, filename) {
    if (data.length === 0)
        return;
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map((row) => headers
            .map((header) => {
            const value = row[header];
            const stringValue = value == null ? '' : String(value);
            // Escape values containing commas, quotes, or newlines
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        })
            .join(',')),
    ].join('\n');
    downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}
export function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
// ============================================
// Scroll Helpers
// ============================================
export function scrollToTop(behavior = 'smooth') {
    window.scrollTo({ top: 0, behavior });
}
export function scrollToElement(elementId, behavior = 'smooth') {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior, block: 'start' });
    }
}
// ============================================
// Device Helpers
// ============================================
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}
// ============================================
// Retry Logic
// ============================================
export async function retry(fn, options = {}) {
    const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
    let lastError = new Error('Unknown error');
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (i < maxRetries - 1) {
                await sleep(delay * Math.pow(backoff, i));
            }
        }
    }
    throw lastError;
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
