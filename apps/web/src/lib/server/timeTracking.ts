import { prisma } from './prisma';
import type { AccessLevel } from '$lib/types/auth';

const UNVERIFIED_DAILY_LIMIT_SECONDS = 1800; // 30 minutos

/**
 * Verifica si un usuario UNVERIFIED ha excedido su límite diario
 * Retorna el estado del límite de tiempo
 */
export async function checkTimeLimit(
	userId: string
): Promise<{ allowed: boolean; remainingSeconds: number; usedSeconds: number }> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			dailyTimeUsedSeconds: true,
			lastActivityReset: true
		}
	});

	if (!user) {
		return { allowed: false, remainingSeconds: 0, usedSeconds: 0 };
	}

	// Verificar si necesitamos resetear el contador (nuevo día)
	const now = new Date();
	const lastReset = user.lastActivityReset;
	const shouldReset = !lastReset || !isSameDay(now, lastReset);

	if (shouldReset) {
		// Resetear contador
		await prisma.user.update({
			where: { id: userId },
			data: {
				dailyTimeUsedSeconds: 0,
				lastActivityReset: now
			}
		});

		return {
			allowed: true,
			remainingSeconds: UNVERIFIED_DAILY_LIMIT_SECONDS,
			usedSeconds: 0
		};
	}

	const remainingSeconds = Math.max(
		0,
		UNVERIFIED_DAILY_LIMIT_SECONDS - user.dailyTimeUsedSeconds
	);

	return {
		allowed: remainingSeconds > 0,
		remainingSeconds,
		usedSeconds: user.dailyTimeUsedSeconds
	};
}

/**
 * Registra tiempo usado por un usuario UNVERIFIED
 */
export async function trackTime(userId: string, seconds: number): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			dailyTimeUsedSeconds: true,
			lastActivityReset: true
		}
	});

	if (!user) return;

	const now = new Date();
	const lastReset = user.lastActivityReset;
	const shouldReset = !lastReset || !isSameDay(now, lastReset);

	if (shouldReset) {
		// Resetear y aplicar nuevo tiempo
		await prisma.user.update({
			where: { id: userId },
			data: {
				dailyTimeUsedSeconds: Math.min(seconds, UNVERIFIED_DAILY_LIMIT_SECONDS),
				lastActivityReset: now
			}
		});
	} else {
		// Acumular tiempo
		const newTime = Math.min(
			user.dailyTimeUsedSeconds + seconds,
			UNVERIFIED_DAILY_LIMIT_SECONDS
		);

		await prisma.user.update({
			where: { id: userId },
			data: { dailyTimeUsedSeconds: newTime }
		});
	}
}

/**
 * Middleware para verificar límite de tiempo
 * Lanza error si el usuario ha excedido su límite
 */
export async function requireTimeLimit(
	userId: string,
	accessLevel: AccessLevel
): Promise<void> {
	// Solo aplicar a UNVERIFIED
	if (accessLevel !== 'UNVERIFIED') return;

	const { allowed } = await checkTimeLimit(userId);

	if (!allowed) {
		throw new Error('TIME_LIMIT_EXCEEDED');
	}
}

/**
 * Verifica si dos fechas son el mismo día
 */
function isSameDay(date1: Date, date2: Date): boolean {
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

/**
 * Obtiene el tiempo restante formateado para mostrar
 */
export function formatTimeRemaining(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	if (minutes > 0) {
		return `${minutes}m ${remainingSeconds}s`;
	}

	return `${remainingSeconds}s`;
}
