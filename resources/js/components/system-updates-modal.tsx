// components/system-updates-modal.tsx
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type SystemUpdatesModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function SystemUpdatesModal({
    open,
    onOpenChange,
}: SystemUpdatesModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>System Updates</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        No updates available at this time.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
