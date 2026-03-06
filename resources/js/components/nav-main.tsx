import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { usePermission } from '@/hooks/use-permission';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const { can } = usePermission();

    const filterItems = (navItems: NavItem[]): NavItem[] => {
        return navItems.reduce<NavItem[]>((acc, item) => {
            // Filter sub-items first
            if (item.items) {
                const visibleSubs = item.items.filter(
                    sub => !sub.permission || can(sub.permission)
                );
                // Only show parent if at least one sub-item is visible
                if (visibleSubs.length > 0) {
                    acc.push({ ...item, items: visibleSubs });
                }
                return acc;
            }

            // Regular item — show if no permission required or user has it
            if (!item.permission || can(item.permission)) {
                acc.push(item);
            }

            return acc;
        }, []);
    };

    const visibleItems = filterItems(items);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {visibleItems.map((item) =>
                    item.items ? (
                        <Collapsible
                            key={item.title}
                            asChild
                            defaultOpen={
                                item.isActive ||
                                item.items.some((sub) => sub.href && isCurrentUrl(sub.href))
                            }
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton tooltip={{ children: item.title }}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <div className="ml-auto flex items-center gap-1">
                                            {item.badge ? (
                                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-800 px-1 text-[11px] font-medium text-white">
                                                    {item.badge}
                                                </span>
                                            ) : null}
                                            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </div>
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => (
                                            <SidebarMenuSubItem key={subItem.title}>
                                                {subItem.isExternal ? (
                                                    <SidebarMenuSubButton asChild>
                                                        <a href={subItem.href as string}>
                                                            <span>{subItem.title}</span>
                                                        </a>
                                                    </SidebarMenuSubButton>
                                                ) : (
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={!!(subItem.href && isCurrentUrl(subItem.href))}
                                                    >
                                                        <Link href={subItem.href!} prefetch>
                                                            {subItem.icon && <subItem.icon />}
                                                            <span>{subItem.title}</span>
                                                            {subItem.badge ? (
                                                                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-800 px-1 text-[11px] font-medium text-white">
                                                                    {subItem.badge}
                                                                </span>
                                                            ) : null}
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                )}
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            {item.isExternal ? (
                                <SidebarMenuButton asChild tooltip={{ children: item.title }}>
                                    <a href={item.href as string}>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            ) : item.onClick ? (
                                <SidebarMenuButton
                                    onClick={item.onClick}
                                    tooltip={{ children: item.title }}
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                    {item.badge ? (
                                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-800 px-1 text-[11px] font-medium text-white">
                                            {item.badge}
                                        </span>
                                    ) : null}
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    isActive={!!(item.href && isCurrentUrl(item.href))}
                                    tooltip={{ children: item.title }}
                                >
                                    <Link href={item.href!} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        {item.badge ? (
                                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-800 px-1 text-[11px] font-medium text-white">
                                                {item.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    )
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
