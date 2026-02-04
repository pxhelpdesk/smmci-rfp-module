import { Link } from '@inertiajs/react';
import { FileText, GitBranch, Home, LayoutGrid, Layers, FolderTree, DollarSign } from 'lucide-react';
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
        title: 'Home',
        href: 'http://172.17.2.25:8001',
        icon: Home,
        isExternal: true,
    },
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Requests',
        href: '/rfp/requests',
        icon: FileText,
    },
    {
        title: 'Setup',
        icon: Layers,
        items: [
            {
                title: 'Categories',
                href: '/rfp/categories',
                icon: FolderTree,
            },
            {
                title: 'Usages',
                href: '/rfp/usages',
                icon: Layers,
            },
            {
                title: 'Currencies',
                href: '/rfp/currencies',
                icon: DollarSign,
            },
        ],
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
