import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import type { Permission } from '@/types/permissions';

export function usePermission() {
    const { auth } = usePage<SharedData>().props;
    const permissions: string[] = auth.permissions ?? [];

    const can = (permission: Permission): boolean => {
        return permissions.includes(permission);
    };

    const canAny = (...perms: Permission[]): boolean => {
        return perms.some(p => permissions.includes(p));
    };

    const canAll = (...perms: Permission[]): boolean => {
        return perms.every(p => permissions.includes(p));
    };

    return { can, canAny, canAll };
}
