// components/nav-footer.tsx
import type { ComponentPropsWithoutRef } from 'react';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { toUrl } from '@/lib/utils';
import type { NavItem } from '@/types';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    return (
        <SidebarGroup
            {...props}
            className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}
        >
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild={!item.onClick}
                                onClick={item.onClick}
                                className="text-sidebar-foreground hover:text-sidebar-foreground animate-pulse"
                            >
                                {item.onClick ? (
                                    // Button behavior for onClick
                                    <>
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        <span>{item.title}</span>
                                    </>
                                ) : (
                                    // Link behavior for href
                                    <a
                                        href={toUrl(item.href!)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="animate-[breathing_2s_ease-in-out_infinite]"
                                        style={{
                                            animation: 'breathing 2s ease-in-out infinite'
                                        }}
                                    >
                                        {item.icon && <item.icon className="h-5 w-5" />}
                                        <span>{item.title}</span>
                                    </a>
                                )}
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
            <style>{`
                @keyframes breathing {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }
            `}</style>
        </SidebarGroup>
    );
}
