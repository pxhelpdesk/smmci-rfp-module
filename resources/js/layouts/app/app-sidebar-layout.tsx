import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps, SharedData } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { flash } = usePage<SharedData>().props;

    // Track previous flash messages to prevent duplicates
    const prevFlashRef = useRef<typeof flash>({});

    useEffect(() => {
        // Only show toast if message is new and different from previous
        if (flash.success && flash.success !== prevFlashRef.current.success) {
            toast.success(flash.success);
        }
        if (flash.error && flash.error !== prevFlashRef.current.error) {
            toast.error(flash.error);
        }
        if (flash.info && flash.info !== prevFlashRef.current.info) {
            toast.info(flash.info);
        }
        if (flash.warning && flash.warning !== prevFlashRef.current.warning) {
            toast.warning(flash.warning);
        }

        // Update previous flash reference
        prevFlashRef.current = flash;
    }, [flash.success, flash.error, flash.info, flash.warning]);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="container max-w-[1400px] mx-auto px-4 py-4">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
