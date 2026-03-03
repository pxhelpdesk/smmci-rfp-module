import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RfpRequest } from '@/types';

// ── Local PDF-safe formatters ─────────────────────────────────────────────────

function pdfFormatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

function pdfFormatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'N/A';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hh = String(hours).padStart(2, '0');
    return `${mm}/${dd}/${yyyy} ${hh}:${minutes}:${seconds} ${ampm}`;
}

function pdfFormatAmount(amount: number | null | undefined, prefix?: string): string {
    if (amount === null || amount === undefined) return '0.00';
    const fixed = Math.abs(amount).toFixed(2);
    const [intPart, decPart] = fixed.split('.');
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = `${withCommas}.${decPart}`;
    const sign = amount < 0 ? '-' : '';
    return `${sign}${prefix ?? ''}${formatted}`;
}

function pdfFormatArea(area: string | null | undefined): string {
    if (!area) return '';
    const mapping: Record<string, string> = {
        'head_office': 'Head Office',
        'mine_site': 'Mine Site'
    };
    return mapping[area] || area; // Returns formatted string or the original if no match
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    page: {
        paddingTop: 42,
        paddingBottom: 80,
        paddingLeft: 42,
        paddingRight: 42,
        fontSize: 11,
        fontFamily: 'Helvetica',
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
        marginTop: 0,
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 1.15,
    },

    // ── Info Grid (2 columns) ────────────────────────────────────
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 10,
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
        marginBottom: 5,
    },

    // ── Details Header ───────────────────────────────────────────
    detailsHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginBottom: 0,
    },
    detailsHeaderLabel: {
        fontSize: 9,
        fontWeight: 'bold',
    },
    detailsHeaderArea: {
        fontSize: 9,
        fontWeight: 'bold',
    },

    // ── Details Table ────────────────────────────────────────────
    detailsTableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        paddingVertical: 4,
        paddingHorizontal: 6,
        backgroundColor: '#f0f0f0',
    },
    detailsTableHeaderText: {
        fontSize: 8.5,
        fontWeight: 'bold',
    },
    detailsTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cccccc',
        paddingVertical: 8,
        paddingHorizontal: 6,
        minHeight: 20,
    },
    detailsColDescription: {
        flex: 1,
    },
    detailsColTotal: {
        width: 100,
    },
    detailsTableText: {
        fontSize: 8.5,
    },
    detailsTableTextRight: {
        fontSize: 8.5,
        textAlign: 'right',
    },
    detailsTableRowLast: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
    },

    // ── Remarks ───────────────────────────────────────────────────
    remarksLabel: {
        fontSize: 8.5,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    remarksBox: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 8,
        minHeight: 40,
    },
    remarksText: {
        fontSize: 8.5,
    },

    // ── Footer ────────────────────────────────────────────────
    footerDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dashed',
        position: 'absolute',
        bottom: 90,
        left: 42,
        right: 42,
    },

    footerNotice: {
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 65,
        fontSize: 8.5,
        fontWeight: 'bold',
        textDecoration: 'underline',
        textAlign: 'center',
        color: '#000000',
    },

    footerDraftLeft: {
        position: 'absolute',
        left: 42,
        bottom: 52,
        fontSize: 8,
        fontStyle: 'italic',
        textAlign: 'left',
        color: '#000000',
    },

    footerGeneratedLeft: {
        position: 'absolute',
        left: 42,
        bottom: 40,
        fontSize: 8,
        textAlign: 'left',
        color: '#000000',
    },

    footerPageRight: {
        position: 'absolute',
        right: 42,
        bottom: 52,
        fontSize: 8,
        textAlign: 'right',
        color: '#000000',
    },

    footerPortalRight: {
        position: 'absolute',
        right: 42,
        bottom: 40,
        fontSize: 7.5,
        textAlign: 'right',
        color: '#000000',
    },
});

const LOGO_URL = '/storage/images/logos/SMMCI_Logo_icon-text.png';

type Props = {
    rfp_request: RfpRequest;
};

export function RfpPdfDocument({ rfp_request }: Props) {
    const currencyCode = rfp_request.currency?.code ?? '';
    const generatedAt = pdfFormatDateTime(new Date().toISOString());

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
                                {pdfFormatDate(rfp_request.created_at)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>Due Date</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>
                                {pdfFormatDate(rfp_request.due_date)}
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

                {/* Details Header */}
                <View style={styles.detailsHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 3, height: 12, backgroundColor: '#000000', marginRight: 6 }} />
                        <Text style={styles.detailsHeaderLabel}>Details</Text>
                    </View>
                    <Text style={styles.detailsHeaderArea}>
                        {pdfFormatArea(rfp_request.area)}
                    </Text>
                </View>

                {/* Table Column Headers */}
                <View style={styles.detailsTableHeader}>
                    <Text style={[styles.detailsTableHeaderText, styles.detailsColDescription]}>
                        Description
                    </Text>
                    <Text style={[styles.detailsTableHeaderText, styles.detailsColTotal, { textAlign: 'right' }]}>
                        Total
                    </Text>
                </View>

                {/* Table Rows */}
                {rfp_request.details && rfp_request.details.length > 0 ? (
                    rfp_request.details.map((detail, index) => (
                        <View
                            key={detail.id ?? index}
                            style={[
                                styles.detailsTableRow,
                                index === rfp_request.details.length - 1 ? styles.detailsTableRowLast : {},
                            ]}
                        >
                            <Text style={[styles.detailsTableText, styles.detailsColDescription]}>
                                {detail.description ?? '—'}
                            </Text>
                            <Text style={[styles.detailsTableTextRight, styles.detailsColTotal]}>
                                {pdfFormatAmount(detail.total_amount)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={[styles.detailsTableRow, styles.detailsTableRowLast]}>
                        <Text style={[styles.detailsTableText, styles.detailsColDescription]}>—</Text>
                        <Text style={[styles.detailsTableTextRight, styles.detailsColTotal]}>—</Text>
                    </View>
                )}

                {/* Remarks */}
                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.remarksLabel}>Remarks :</Text>
                        <View style={styles.remarksBox}>
                            <Text style={styles.remarksText}>{rfp_request.remarks ?? 'None'}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>

                {/* Footer */}
                <View style={styles.footerDivider} fixed />

                <Text style={styles.footerNotice} fixed>
                    "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX"
                </Text>

                <Text style={styles.footerDraftLeft} fixed>
                    DRAFT RFP FORM
                </Text>

                <Text style={styles.footerGeneratedLeft} fixed>
                    Generation: {generatedAt}
                </Text>

                <Text
                    style={styles.footerPageRight}
                    fixed
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                />

                <Text style={styles.footerPortalRight} fixed>
                    Generated by: SMMCI WEB PORTAL
                </Text>
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
