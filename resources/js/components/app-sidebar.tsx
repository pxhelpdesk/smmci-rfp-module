// components/app-sidebar.tsx
import { Link } from '@inertiajs/react';
import { GitBranch, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { SystemUpdatesModal } from '@/components/system-updates-modal';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

export function AppSidebar() {
    const [showUpdates, setShowUpdates] = useState(false);

    const footerNavItems: NavItem[] = [
        {
            title: 'System Updates',
            href: '#',
            icon: GitBranch,
            onClick: () => setShowUpdates(true),
        },
    ];

    return (
        <>
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={dashboard()} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={mainNavItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SystemUpdatesModal
                open={showUpdates}
                onOpenChange={setShowUpdates}
            />
        </>
    );
}
