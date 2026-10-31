import type { NextRouter } from 'next/router';

export function isNavigationCancellation(error: unknown): boolean {
    return error === 'Navigation rejected.' ||
        (typeof error === 'object' &&
            error !== null &&
            ('cancelled' in error && error.cancelled === true ||
                'message' in error && error.message === 'Navigation rejected.'));
}

export async function pushRoute(router: NextRouter, route: string): Promise<boolean> {
    try {
        return await router.push(route);
    } catch (error) {
        if (isNavigationCancellation(error)) return false;
        throw error;
    }
}
