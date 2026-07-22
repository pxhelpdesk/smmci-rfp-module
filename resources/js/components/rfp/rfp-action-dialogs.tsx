// components/rfp/rfp-action-dialogs.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type RfpActionType = 'cancel' | 'post' | 'revert' | 'delete' | null;

type DialogConfig = {
    title: string;
    description: string;
    confirmLabel: string;
    confirmClass: string;
    remarksRequired: boolean;
    showRemarks: boolean;
};

const DIALOG_CONFIGS: Record<Exclude<RfpActionType, null>, DialogConfig> = {
    cancel: {
        title: 'Cancel RFP',
        description: 'Are you sure you want to cancel this RFP?',
        confirmLabel: 'Cancel RFP',
        confirmClass: 'bg-orange-600 text-white hover:bg-orange-700',
        remarksRequired: true,
        showRemarks: true,
    },
    post: {
        title: 'Post RFP',
        description: 'Are you sure you want to mark this RFP as posted? Edit, cancel, and delete will be disabled after posting.',
        confirmLabel: 'Post RFP',
        confirmClass: 'bg-green-600 text-white hover:bg-green-700',
        remarksRequired: false,
        showRemarks: true,
    },
    revert: {
        title: 'Revert to Draft',
        description: 'Are you sure you want to revert this RFP back to draft status?',
        confirmLabel: 'Revert to Draft',
        confirmClass: 'bg-yellow-600 text-white hover:bg-yellow-700',
        remarksRequired: true,
        showRemarks: true,
    },
    delete: {
        title: 'Delete RFP',
        description: 'Are you sure you want to delete this RFP? This action cannot be undone.',
        confirmLabel: 'Delete',
        confirmClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        remarksRequired: true,
        showRemarks: true,
    },
};

type Props = {
    rfpNumber: string;
    activeAction: RfpActionType;
    onClose: () => void;
    onConfirm: (action: Exclude<RfpActionType, null>, remarks: string) => void;
    processing?: boolean;
};

export function RfpActionDialogs({ rfpNumber, activeAction, onClose, onConfirm, processing = false }: Props) {
    const [remarks, setRemarks] = useState('');
    const [remarksError, setRemarksError] = useState(false);

    const config = activeAction ? DIALOG_CONFIGS[activeAction] : null;

    const handleOpenChange = (open: boolean) => {
        if (processing) return; // block closing (Esc, overlay click) mid-request
        if (!open) {
            setRemarks('');
            setRemarksError(false);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!activeAction || !config || processing) return;

        if (config.remarksRequired && !remarks.trim()) {
            setRemarksError(true);
            toast.error('Remarks is required before proceeding.');
            return;
        }

        onConfirm(activeAction, remarks.trim());
        // Note: remarks/error are intentionally not reset here — if the
        // request fails, the dialog stays open with what the user typed.
        // They're reset in handleOpenChange when the dialog actually closes.
    };

    const handleRemarksChange = (val: string) => {
        setRemarks(val);
        if (remarksError && val.trim()) setRemarksError(false);
    };

    return (
        <AlertDialog open={!!activeAction} onOpenChange={handleOpenChange}>
            {config && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{config.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {config.description.replace('this RFP', rfpNumber)}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {config.showRemarks && (
                        <div className="space-y-1.5 px-0">
                            <Label htmlFor="action-remarks" className="text-sm">
                                Remarks{config.remarksRequired
                                    ? <span className="text-destructive ml-0.5">*</span>
                                    : <span className="text-muted-foreground ml-1">(Optional)</span>
                                }
                            </Label>
                            <Textarea
                                id="action-remarks"
                                value={remarks}
                                onChange={(e) => handleRemarksChange(e.target.value)}
                                placeholder="Add remarks..."
                                rows={3}
                                disabled={processing}
                                className={`resize-none uppercase ${remarksError ? 'border-destructive' : ''}`}
                            />
                            {remarksError && (
                                <p className="text-xs text-destructive">Remarks is required.</p>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>Back</AlertDialogCancel>
                        {/* Regular Button instead of AlertDialogAction to prevent auto-close on validation fail */}
                        <Button
                            type="button"
                            className={config.confirmClass}
                            onClick={handleConfirm}
                            disabled={processing}
                        >
                            {processing && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                            {config.confirmLabel}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            )}
        </AlertDialog>
    );
}
