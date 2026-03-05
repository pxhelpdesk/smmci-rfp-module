import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { RfpRecord, RfpSign } from '@/types';

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
        paddingBottom: 90,
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
        width: 75,
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

    // ── Purpose ───────────────────────────────────────────────────
    purposeLabel: {
        fontSize: 8.5,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    purposeBox: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 8,
        minHeight: 40,
        marginBottom: 12,
    },
    purposeText: {
        fontSize: 8.5,
    },

    // ── Footer ────────────────────────────────────────────────
    footerDivider: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dashed',
        position: 'absolute',
        bottom: 70,
        left: 42,
        right: 42,
    },

    footerNotice: {
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 16,
        fontSize: 8.5,
        fontWeight: 'bold',
        textDecoration: 'underline',
        textAlign: 'center',
        color: '#000000',
    },

    footerDraftLeft: {
        position: 'absolute',
        left: 42,
        bottom: 40,
        fontSize: 8,
        fontStyle: 'italic',
        textAlign: 'left',
        color: '#000000',
    },

    footerGeneratedLeft: {
        position: 'absolute',
        left: 42,
        bottom: 28,
        fontSize: 8,
        textAlign: 'left',
        color: '#000000',
    },

    footerPageRight: {
        position: 'absolute',
        right: 42,
        bottom: 40,
        fontSize: 8,
        textAlign: 'right',
        color: '#000000',
    },

    footerPortalRight: {
        position: 'absolute',
        right: 42,
        bottom: 28,
        fontSize: 7.5,
        textAlign: 'right',
        color: '#000000',
    },

    footerRequisitionLeft: {
        position: 'absolute',
        left: 42,
        bottom: 54,
        fontSize: 8,
        textAlign: 'left',
        color: '#000000',
    },

    footerContractRight: {
        position: 'absolute',
        right: 42,
        bottom: 54,
        fontSize: 8,
        textAlign: 'right',
        color: '#000000',
    },

    footerRfpNumber: {
        position: 'absolute',
        left: 42,
        right: 42,
        bottom: 54,
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
    },

    // ── Signatories ────────────────────────────────────────────────
    signatorySection: {
        marginTop: 12,
    },
    signatoryRow: {
        flexDirection: 'row' as const,
        marginBottom: 16,
    },
    signatoryCell: {
        flex: 1,
        alignItems: 'center' as const,
    },
    signatoryLabel: {
        fontSize: 8,
        textAlign: 'center' as const,
    },
    signatoryLine: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        marginBottom: 4,
        width: 180,
    },
    signatoryName: {
        fontSize: 8.5,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
    },
    signatoryEntry: {
        alignItems: 'center' as const,
        marginTop: 20,
    },
});

const LOGO_URL = '/storage/images/logos/SMMCI_Logo_icon-text.png';

const getSignsByRole = (signs: RfpSign[] | undefined, role: string) =>
    (signs ?? []).filter(s => s.details === role);

type Props = {
    rfp_record: RfpRecord;
};

export function RfpPdfDocument({ rfp_record }: Props) {
    const currencyCode = rfp_record.currency?.code ?? '';
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
                            <Text style={styles.infoValue}>{rfp_record.supplier_name ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Address</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.supplier?.address ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>TIN</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.supplier?.tin ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Vendor Ref.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.vendor_ref ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Currency</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.currency?.code ?? '—'}</Text>
                        </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.infoColRight}>
                        {/* <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>AP No</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_record.ap_no ?? '—'}</Text>
                        </View> */}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>Prepared Date</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>
                                {pdfFormatDate(rfp_record.created_at)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>Due Date</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>
                                {pdfFormatDate(rfp_record.due_date)}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>RR No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_record.rr_no ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>PO No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_record.po_no ?? '—'}</Text>
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
                        {pdfFormatArea(rfp_record.area)}
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
                {rfp_record.details && rfp_record.details.length > 0 ? (
                    rfp_record.details.map((detail, index) => (
                        <View
                            key={detail.id ?? index}
                            style={[
                                styles.detailsTableRow,
                                index === rfp_record.details.length - 1 ? styles.detailsTableRowLast : {},
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

                {/* Purpose */}
                <View style={{ flexDirection: 'row', marginTop: 12 }} wrap={false}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.purposeLabel}>Purpose :</Text>
                        <View style={styles.purposeBox}>
                            <Text style={styles.purposeText}>{rfp_record.purpose ?? 'None'}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }} />
                </View>

                {/* Signatories */}
                <View style={styles.signatorySection} wrap={false}>

                    {/* only show row if at least one has signatories */}
                    {(getSignsByRole(rfp_record.signs, 'prepared_by').length > 0 ||
                    getSignsByRole(rfp_record.signs, 'approved_by').length > 0) && (
                        <View style={styles.signatoryRow} wrap={false}>
                            {/* Prepared By */}
                            {getSignsByRole(rfp_record.signs, 'prepared_by').length > 0 && (
                                <View style={styles.signatoryCell}>
                                    <Text style={styles.signatoryLabel}>Prepared By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'prepared_by').map((s, i) => (
                                        <View key={i} style={styles.signatoryEntry}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Approved By */}
                            {getSignsByRole(rfp_record.signs, 'approved_by').length > 0 && (
                                <View style={styles.signatoryCell}>
                                    <Text style={styles.signatoryLabel}>Approved By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'approved_by').map((s, i) => (
                                        <View key={i} style={styles.signatoryEntry}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* only show row if at least one has signatories */}
                    {(getSignsByRole(rfp_record.signs, 'recommending_approval_by').length > 0 ||
                    getSignsByRole(rfp_record.signs, 'concurred_by').length > 0) && (
                        <View style={styles.signatoryRow} wrap={false}>
                            {/* Recommending Approval By */}
                            {getSignsByRole(rfp_record.signs, 'recommending_approval_by').length > 0 && (
                                <View style={styles.signatoryCell}>
                                    <Text style={styles.signatoryLabel}>Recommending Approval By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'recommending_approval_by').map((s, i) => (
                                        <View key={i} style={styles.signatoryEntry}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Concurred By */}
                            {getSignsByRole(rfp_record.signs, 'concurred_by').length > 0 && (
                                <View style={styles.signatoryCell}>
                                    <Text style={styles.signatoryLabel}>Concurred By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'concurred_by').map((s, i) => (
                                        <View key={i} style={styles.signatoryEntry}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                </View>

                {/* Footer */}
                <View style={styles.footerDivider} fixed />

                <Text style={styles.footerRequisitionLeft} fixed>
                    SWP PR: {rfp_record.requisition_no ?? 'N/A'}
                </Text>
                <Text style={styles.footerRfpNumber} fixed>
                    Ref. No.: {rfp_record.rfp_number}
                </Text>
                <Text style={styles.footerContractRight} fixed>
                    SWP RCW: {rfp_record.contract_no ?? 'N/A'}
                </Text>

                <Text style={styles.footerDraftLeft} fixed>
                    DRAFT RFP FORM
                </Text>
                <Text style={[styles.footerRfpNumber, { bottom: 40 }]} fixed>
                    Ref. Dept.: {getSignsByRole(rfp_record.signs, 'prepared_by')[0]?.user?.department?.department ?? 'N/A'}
                </Text>
                <Text
                    style={styles.footerPageRight}
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                    fixed
                />

                <Text style={styles.footerGeneratedLeft} fixed>
                    Generation: {generatedAt}
                </Text>
                <Text style={styles.footerPortalRight} fixed>
                    Generated by: SMMCI Web Portal
                </Text>

                <Text style={styles.footerNotice} fixed>
                    "THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX"
                </Text>
            </Page>
        </Document>
    );
}
