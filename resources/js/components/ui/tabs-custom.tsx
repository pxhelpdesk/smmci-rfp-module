import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';

type Tab = {
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
};

type TabsCustomProps = {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
};

export function TabsCustom({ tabs, defaultTab, className }: TabsCustomProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Tab Navigation */}
            <div className="border-b">
                <div className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'relative px-6 py-3 text-sm font-medium transition-colors',
                                'hover:text-foreground',
                                activeTab === tab.id
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <div className="flex items-center gap-2">
                                {tab.icon}
                                <span>{tab.label}</span>
                            </div>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={cn(
                            'animate-in fade-in-50 duration-200',
                            activeTab === tab.id ? 'block' : 'hidden',
                        )}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
