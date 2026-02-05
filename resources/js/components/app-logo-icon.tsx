// js/components/app-logo-icon.tsx
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/storage/images/logos/SMMCI_Logo-icon.png"
            alt="SMMCI Logo"
            className="size-5 object-contain"
            {...props}
        />
    );
}
