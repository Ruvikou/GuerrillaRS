/**
 * Formatea una fecha a tiempo relativo en español
 * Ej: "hace 5 minutos", "hace 2 horas", "ayer", "hace 3 días"
 */
export function formatRelativeTime(date: string | Date): string {
	const now = new Date();
	const then = new Date(date);
	const diffMs = now.getTime() - then.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);
	const diffWeeks = Math.floor(diffDays / 7);
	const diffMonths = Math.floor(diffDays / 30);
	const diffYears = Math.floor(diffDays / 365);

	if (diffSeconds < 10) {
		return 'ahora';
	}

	if (diffSeconds < 60) {
		return `hace ${diffSeconds}s`;
	}

	if (diffMinutes < 60) {
		return `hace ${diffMinutes}m`;
	}

	if (diffHours < 24) {
		return `hace ${diffHours}h`;
	}

	if (diffDays === 1) {
		return 'ayer';
	}

	if (diffDays < 7) {
		return `hace ${diffDays}d`;
	}

	if (diffWeeks < 4) {
		return `hace ${diffWeeks}sem`;
	}

	if (diffMonths < 12) {
		return `hace ${diffMonths}mes`;
	}

	return `hace ${diffYears}a`;
}

/**
 * Formatea una fecha a formato legible
 * Ej: "15 de enero de 2024, 14:30"
 */
export function formatDateTime(date: string | Date): string {
	const d = new Date(date);
	return d.toLocaleDateString('es-ES', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Formatea una fecha a formato corto
 * Ej: "15/01/2024"
 */
export function formatShortDate(date: string | Date): string {
	const d = new Date(date);
	return d.toLocaleDateString('es-ES', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
}

/**
 * Formatea segundos a formato legible
 * Ej: 3665 -> "1h 1m"
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	const parts: string[] = [];
	
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}
	if (secs > 0 && hours === 0) {
		parts.push(`${secs}s`);
	}

	return parts.join(' ') || '0s';
}

/**
 * Formatea segundos restantes a mensaje de tiempo
 * Ej: 1800 -> "30 minutos restantes"
 */
export function formatTimeRemaining(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes > 0) {
		return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
	}
	
	return `${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
}
