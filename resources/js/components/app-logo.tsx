// js/components/app-logo.tsx
import { useSidebar } from '@/components/ui/sidebar';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <>
            <div className="flex items-center justify-center rounded-md">
                <AppLogoIcon className="h-8 w-auto rounded-md" />
            </div>

            {!isCollapsed && (
                <div className="ml-1 grid flex-1 text-left text-sm">
                    <span className="mb-0.5 truncate leading-tight font-semibold">
                        SMMCI RFP Module
                    </span>
                </div>
            )}
        </>
    );
}
