import { useEffect, useRef, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RfpPdfDocument } from '@/components/rfp/rfp-pdf-document';
import type { RfpRequest } from '@/types';

type Props = {
    rfp_request: RfpRequest | null;
    open: boolean;
    onClose: () => void;
};

export function RfpPdfPreviewDialog({ rfp_request, open, onClose }: Props) {
    const urlRef = useRef<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!open || !rfp_request) return;

        let cancelled = false;

        const generate = async () => {
            setIsGenerating(true);
            try {
                const blob = await pdf(<RfpPdfDocument rfp_request={rfp_request} />).toBlob();
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                const iframe = document.getElementById('rfp-pdf-iframe') as HTMLIFrameElement | null;
                if (iframe) iframe.src = url;
            } catch (error) {
                console.error('PDF generation failed:', error);
            } finally {
                if (!cancelled) setIsGenerating(false);
            }
        };

        generate();

        return () => {
            cancelled = true;
        };
    }, [open, rfp_request]);

    const handleClose = () => {
        if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
            urlRef.current = null;
        }
        onClose();
    };

    const handleDownload = () => {
        if (!urlRef.current || !rfp_request) return;
        const link = document.createElement('a');
        link.href = urlRef.current;
        link.download = `${rfp_request.rfp_request_number}_generated-pdf.pdf`;
        link.click();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="flex flex-col p-0 gap-0"
                style={{
                    maxWidth: '90vw',
                    width: '90vw',
                    height: '95vh',
                    margin: 'auto',
                }}
            >
                <DialogHeader className="px-6 py-3 border-b shrink-0">
                    <div className="flex items-center justify-between pr-8">
                        <DialogTitle className="text-lg">
                            {rfp_request?.rfp_request_number || 'PDF Preview'}
                        </DialogTitle>
                        <Button
                            size="sm"
                            onClick={handleDownload}
                            disabled={isGenerating || !urlRef.current}
                        >
                            <Download className="h-4 w-4 mr-1.5" />
                            {isGenerating ? 'Generating...' : 'Download w/ filename'}
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <iframe
                        id="rfp-pdf-iframe"
                        className="w-full h-full border-0"
                        title={rfp_request?.rfp_request_number || 'PDF Preview'}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
