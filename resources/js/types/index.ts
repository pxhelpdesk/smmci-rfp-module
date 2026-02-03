// types/index.ts
export type * from './auth';
export type * from './navigation';
export type * from './ui';
export type * from './rfp';

import type { Auth } from './auth';

export type Flash = {
    success?: string;
    error?: string;
    info?: string;
    warning?: string;
};

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    flash: Flash;
    [key: string]: unknown;
};
