import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RfpRequest } from '@/types';
import { formatDate, formatDateTime } from '@/lib/formatters';

Font.register({
    family: 'Arial',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf' },
        { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf', fontWeight: 'bold' },
    ]
});

const styles = StyleSheet.create({
    page: {
        paddingTop: 42,
        paddingBottom: 60, // enough room for footer
        paddingLeft: 42,
        paddingRight: 42,
        fontSize: 11,
        fontFamily: 'Arial',
        lineHeight: 1.15,
    },

    // ── Header ──────────────────────────────────────────────────
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 0,
    },
    logoWrapper: {
        width: 90,
        flexShrink: 0,
        alignItems: 'flex-start',
    },
    logo: {
        width: 80,
        height: 80,
        objectFit: 'contain',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    companyName: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 3,
        lineHeight: 1.2,
        textAlign: 'center',
    },
    companyAddress: {
        fontSize: 7.5,
        lineHeight: 1.2,
        marginBottom: 0,
        textAlign: 'center',
    },
    companyContact: {
        fontSize: 7.5,
        lineHeight: 1.2,
        marginBottom: 0,
        textAlign: 'center',
    },
    headerRight: {
        width: 90,
        flexShrink: 0,
    },

    // ── Title ────────────────────────────────────────────────────
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 1.15,
    },

    // ── Info Grid (2 columns) ────────────────────────────────────
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    infoCol: {
        flex: 1,
    },
    infoColLeft: {
        width: 325,
    },
    infoColRight: {
        flex: 1,
        paddingLeft: 20,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 8.5,
        width: 70,
        flexShrink: 0,
    },
    // right column label — narrower to keep values left-aligned
    infoLabelRight: {
        fontSize: 8.5,
        width: 50,
        flexShrink: 0,
    },
    infoColon: {
        fontSize: 8.5,
        width: 10,
        flexShrink: 0,
    },
    infoValue: {
        fontSize: 8.5,
        flex: 1,
        fontWeight: 'bold',
    },
    infoValueRight: {
        fontSize: 8.5,
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'right',
    },

    // ── Divider ──────────────────────────────────────────────────
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dashed',
        marginBottom: 10,
    },

    // ── Footer ───────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 42,
        right: 42,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#cccccc',
        paddingTop: 6,
    },
    footerText: {
        fontSize: 8,
        color: '#555555',
    },
});

const LOGO_URL = '/storage/images/logos/SMMCI_Logo_icon-text.png';

type Props = {
    rfp_request: RfpRequest;
};

export function RfpPdfDocument({ rfp_request }: Props) {
    const generatedAt = formatDateTime(new Date().toISOString());

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap>

                {/* Header */}
                <View style={styles.headerRow} fixed>
                    <View style={styles.logoWrapper}>
                        <Image style={styles.logo} src={LOGO_URL} />
                    </View>
                    <View style={styles.headerCenter}>
                        <Text style={styles.companyName}>SILANGAN MINDANAO MINING CO., INC.</Text>
                        <Text style={styles.companyAddress}>
                            2ND floor Launchpad Reliance corner Sheridan streets Highway Hills,
                        </Text>
                        <Text style={styles.companyAddress}>
                            City of Mandaluyong NCR, Second District Philippines 1550
                        </Text>
                        <Text style={styles.companyContact}>VAT REG T.I.N. : 204-941-101-00000</Text>
                        <Text style={styles.companyContact}>Tel No. : 631-1381</Text>
                    </View>
                    <View style={styles.headerRight} />
                </View>

                {/* Title */}
                <Text style={styles.title}>REQUEST FOR PAYMENT</Text>

                {/* Info Grid */}
                <View style={styles.infoGrid}>

                    {/* Left Column */}
                    <View style={styles.infoColLeft}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Supplier</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_request.supplier_name ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Address</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_request.supplier?.address ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>TIN</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_request.supplier?.tin ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Vendor Ref.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_request.vendor_ref ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Currency</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_request.currency?.code ?? '—'}</Text>
                        </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.infoColRight}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>AP No</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_request.ap_no ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>Date</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>
                                {rfp_request.created_at ? formatDate(rfp_request.created_at) : '—'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>Due Date</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>
                                {rfp_request.due_date ? formatDate(rfp_request.due_date) : '—'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>RR No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_request.rr_no ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>PO No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_request.po_no ?? '—'}</Text>
                        </View>
                    </View>

                </View>

                {/* Dashed Divider */}
                <View style={styles.divider} />

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerText}>Generated: {generatedAt}</Text>
                    <Text
                        style={styles.footerText}
                        render={({ pageNumber, totalPages }) =>
                            `Page ${pageNumber} of ${totalPages}`
                        }
                        fixed
                    />
                </View>

            </Page>
        </Document>
    );
}

type DownloadButtonProps = {
    rfp_request: RfpRequest;
};

export function RfpPdfDownloadButton({ rfp_request }: DownloadButtonProps) {
    const handleDownload = async () => {
        const blob = await pdf(<RfpPdfDocument rfp_request={rfp_request} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${rfp_request.rfp_request_number}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
    );
}
