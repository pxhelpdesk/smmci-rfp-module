// components/rfp/rfp-pdf-document.tsx
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { RfpRecord, RfpSign } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Local PDF-safe formatters
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getSignsByRole = (signs: RfpSign[] | undefined, role: string) =>
    (signs ?? []).filter(s => s.details === role);

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    // ── Page ────────────────────────────────────────────────────
    page: {
        paddingTop: 52,
        paddingBottom: 72,
        paddingLeft: 36,
        paddingRight: 36,
        fontSize: 9,
        fontFamily: 'Helvetica',
        lineHeight: 1.1,
    },

    // ── Header ──────────────────────────────────────────────────
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    logoWrapper: {
        width: 64,
        flexShrink: 0,
        alignItems: 'flex-start',
    },
    logo: {
        width: 56,
        height: 56,
        objectFit: 'contain',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    companyName: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 2,
        lineHeight: 1.1,
        textAlign: 'center',
    },
    companyAddress: {
        fontSize: 6.5,
        lineHeight: 1.2,
        marginBottom: 0,
        textAlign: 'center',
    },
    companyContact: {
        fontSize: 6.5,
        lineHeight: 1.2,
        marginBottom: 0,
        textAlign: 'center',
    },
    headerRight: {
        width: 64,
        flexShrink: 0,
    },

    // ── Title ────────────────────────────────────────────────────
    title: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 8,
        textAlign: 'center',
        lineHeight: 1.1,
    },

    // ── Info Grid ────────────────────────────────────────────────
    infoGrid: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    infoColLeft: {
        width: 340,
    },
    infoColRight: {
        flex: 1,
        paddingLeft: 8,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    infoLabel: {
        fontSize: 7.5,
        width: 60,
        flexShrink: 0,
    },
    infoLabelRight: {
        fontSize: 7.5,
        width: 70,
        flexShrink: 0,
    },
    infoColon: {
        fontSize: 7.5,
        width: 8,
        flexShrink: 0,
    },
    infoValue: {
        fontSize: 7.5,
        flex: 1,
        fontWeight: 'bold',
    },
    infoValueRight: {
        fontSize: 7.5,
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'right',
    },

    // ── Divider ──────────────────────────────────────────────────
    divider: {
        borderBottomWidth: 0.75,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dashed',
        marginBottom: 4,
    },

    // ── Details Table ────────────────────────────────────────────
    detailsTableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        paddingVertical: 3,
        paddingHorizontal: 5,
        backgroundColor: '#f0f0f0',
    },
    detailsTableHeaderText: {
        fontSize: 7.5,
        fontWeight: 'bold',
    },
    detailsTableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cccccc',
        paddingVertical: 5,
        paddingHorizontal: 5,
        minHeight: 14,
    },
    detailsTableRowLast: {
        borderBottomWidth: 0.75,
        borderBottomColor: '#000000',
    },
    detailsColDescription: {
        flex: 1,
    },
    detailsColTotal: {
        width: 80,
    },
    detailsTableText: {
        fontSize: 7.5,
    },
    detailsTableTextRight: {
        fontSize: 7.5,
        textAlign: 'right',
    },

    // ── Purpose ──────────────────────────────────────────────────
    purposeLabel: {
        fontSize: 7.5,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    purposeBox: {
        borderWidth: 0.75,
        borderColor: '#000000',
        padding: 5,
        minHeight: 24,
        marginBottom: 6,
    },
    purposeText: {
        fontSize: 7.5,
    },

    // ── Signatories ───────────────────────────────────────────────
    signatorySection: {
        marginTop: 6,
    },
    signatoryRow: {
        flexDirection: 'row' as const,
        marginBottom: 6,
    },
    signatoryCell: {
        flex: 1,
        alignItems: 'center' as const,
    },
    signatoryLabel: {
        fontSize: 7,
        textAlign: 'center' as const,
    },
    signatoryLine: {
        borderBottomWidth: 0.75,
        borderBottomColor: '#000000',
        marginBottom: 3,
        width: 150,
    },
    signatoryName: {
        fontSize: 7.5,
        fontWeight: 'bold' as const,
        textAlign: 'center' as const,
    },
    signatoryEntry: {
        alignItems: 'center' as const,
        marginTop: 14,
    },

    // ── Footer ───────────────────────────────────────────────────
    footerDivider: {
        borderBottomWidth: 0.75,
        borderBottomColor: '#000000',
        borderBottomStyle: 'dashed',
        position: 'absolute',
        bottom: 56,
        left: 36,
        right: 36,
    },
    footerDraftLeft: {
        position: 'absolute',
        left: 36,
        bottom: 34,
        fontSize: 7,
        fontStyle: 'italic',
        textAlign: 'left',
        color: '#000000',
    },
    footerGeneratedLeft: {
        position: 'absolute',
        left: 36,
        bottom: 22,
        fontSize: 7,
        textAlign: 'left',
        color: '#000000',
    },
    footerPageRight: {
        position: 'absolute',
        right: 36,
        bottom: 40,
        fontSize: 7,
        textAlign: 'right',
        color: '#000000',
    },
    footerPortalRight: {
        position: 'absolute',
        right: 36,
        bottom: 22,
        fontSize: 6.5,
        textAlign: 'right',
        color: '#000000',
    },
    footerNotice: {
        position: 'absolute',
        left: 36,
        right: 36,
        bottom: 10,
        fontSize: 7.5,
        fontWeight: 'bold',
        textDecoration: 'underline',
        textAlign: 'center',
        color: '#000000',
    },

});

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOGO_URL = '/storage/images/logos/SMMCI_Logo_icon-text.png';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    rfp_record: RfpRecord;
};

export function RfpPdfDocument({ rfp_record }: Props) {
    const generatedAt = pdfFormatDateTime(new Date().toISOString());
    const preparedBySign = getSignsByRole(rfp_record.signs, 'prepared_by')[0];

    return (
        <Document>
            <Page size="A4" style={styles.page} wrap>

                {/* ── Header ─────────────────────────────────────────────── */}
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

                {/* ── Title ──────────────────────────────────────────────── */}
                <Text style={styles.title}>REQUEST FOR PAYMENT</Text>

                {/* ── Info Grid ──────────────────────────────────────────── */}
                <View style={styles.infoGrid}>

                    {/* Left Column */}
                    <View style={styles.infoColLeft}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Office</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>
                                {rfp_record.office === 'head_office' ? 'Head Office' : rfp_record.office === 'mine_site' ? 'Mine Site' : '—'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Supplier</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.supplier_name ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Vendor Ref.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.vendor_ref ?? '—'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Department</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>
                                {preparedBySign?.user?.department?.department ?? '—'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Currency</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValue}>{rfp_record.currency?.name ?? '—'}</Text>
                        </View>
                    </View>

                    {/* Right Column */}
                    <View style={styles.infoColRight}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabelRight}>RFP No.</Text>
                            <Text style={styles.infoColon}>:</Text>
                            <Text style={styles.infoValueRight}>{rfp_record.rfp_number ?? '—'}</Text>
                        </View>
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

                {/* ── Divider ────────────────────────────────────────────── */}
                <View style={styles.divider} />

                {/* ── Details Table ──────────────────────────────────────── */}
                <View style={styles.detailsTableHeader}>
                    <Text style={[styles.detailsTableHeaderText, styles.detailsColDescription]}>
                        Short Description
                    </Text>
                    <Text style={[styles.detailsTableHeaderText, styles.detailsColTotal, { textAlign: 'right' }]}>
                        Amount
                    </Text>
                </View>

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
                                {detail.usage
                                    ? `${detail.usage.description}`
                                    : '—'}
                            </Text>
                            <Text style={[styles.detailsTableTextRight, styles.detailsColTotal]}>
                                {rfp_record.currency?.code ? `${rfp_record.currency.code} ${pdfFormatAmount(detail.total_amount)}` : pdfFormatAmount(detail.total_amount)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={[styles.detailsTableRow, styles.detailsTableRowLast]}>
                        <Text style={[styles.detailsTableText, styles.detailsColDescription]}>—</Text>
                        <Text style={[styles.detailsTableTextRight, styles.detailsColTotal]}>—</Text>
                    </View>
                )}

                {/* ── Purpose ────────────────────────────────────────────── */}
                <View style={{ marginTop: 6 }} wrap={false}>
                    <Text style={styles.purposeLabel}>Purpose :</Text>
                    <View style={styles.purposeBox}>
                        <Text style={styles.purposeText}>{rfp_record.purpose ?? 'None'}</Text>
                    </View>
                </View>

                {/* ── Signatories ────────────────────────────────────────── */}
                <View style={styles.signatorySection} wrap={false}>
                    <View style={styles.signatoryRow} wrap={false}>

                        <View style={styles.signatoryCell}>
                            <Text style={styles.signatoryLabel}>Prepared By :</Text>
                            {getSignsByRole(rfp_record.signs, 'prepared_by').map((s, i) => (
                                <View key={i} style={styles.signatoryEntry}>
                                    <View style={styles.signatoryLine} />
                                    <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                </View>
                            ))}

                            {getSignsByRole(rfp_record.signs, 'recommending_approval_by').length > 0 && (
                                <>
                                    <Text style={[styles.signatoryLabel, { marginTop: 10 }]}>Recommending Approval By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'recommending_approval_by').map((s, i) => (
                                        <View key={i} style={styles.signatoryEntry}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </>
                            )}

                            {getSignsByRole(rfp_record.signs, 'concurred_by').length > 0 && (
                                <>
                                    <Text style={[styles.signatoryLabel, { marginTop: 10 }]}>Concurred By :</Text>
                                    <View style={styles.signatoryEntry}>
                                        <View style={styles.signatoryLine} />
                                        <Text style={styles.signatoryName}>
                                            {getSignsByRole(rfp_record.signs, 'concurred_by')
                                                .map(s => s.user?.name ?? '')
                                                .join(' / ')}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.signatoryCell}>
                            {getSignsByRole(rfp_record.signs, 'approved_by').length > 0 && (
                                <>
                                    <Text style={styles.signatoryLabel}>Approved By :</Text>
                                    {getSignsByRole(rfp_record.signs, 'approved_by').map((s, i) => (
                                        <View key={i} style={[styles.signatoryEntry, { marginTop: i === 0 ? 14 : 22 }]}>
                                            <View style={styles.signatoryLine} />
                                            <Text style={styles.signatoryName}>{s.user?.name ?? ''}</Text>
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>

                    </View>
                </View>

                {/* ── Approval Matrix Reference ──────────────────────────── */}
                <View style={{ marginTop: 8 }} wrap={false}>

                    <Text style={{ fontSize: 7, fontWeight: 'bold', marginBottom: 2 }}>
                        Approval Matrix Reference
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: '#f0f0f0',
                        borderWidth: 0.5,
                        borderColor: '#000000',
                        paddingVertical: 3,
                        paddingHorizontal: 4,
                    }}>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', width: 55, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#000000' }}>Amount</Text>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', flex: 1, textAlign: 'center', paddingHorizontal: 3, borderRightWidth: 0.5, borderRightColor: '#000000' }}>MS (Mine Site)</Text>
                        <Text style={{ fontSize: 7, fontWeight: 'bold', flex: 1, textAlign: 'center', paddingHorizontal: 3 }}>HO (Head Office)</Text>
                    </View>

                    {/* Row 1 */}
                    <View style={{ flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: '#000000', paddingVertical: 3, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 6.5, width: 55, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#000000' }}>1 – 500k</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3, borderRightWidth: 0.5, borderRightColor: '#000000' }}>
                            {'Resident Manager/Mine Site Head\nw/ Finance Head concurrence'}
                        </Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3 }}>
                            {'Highest Manager/Officer of the Department\nw/ Finance Controller/Comptroller concurrence'}
                        </Text>
                    </View>

                    {/* Row 2 */}
                    <View style={{ flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: '#000000', paddingVertical: 3, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 6.5, width: 55, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#000000' }}>{'>'}500k – 1M</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3, borderRightWidth: 0.5, borderRightColor: '#000000' }}>
                            {'Highest Manager/Officer of the Department\nw/ Finance Controller/Comptroller concurrence'}
                        </Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3 }}>
                            {'Highest Manager/Officer of the Department\nw/ Finance Controller/Comptroller concurrence'}
                        </Text>
                    </View>

                    {/* Row 3 */}
                    <View style={{ flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: '#000000', paddingVertical: 3, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 6.5, width: 55, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#000000' }}>{'>'}1M – 5M</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3, borderRightWidth: 0.5, borderRightColor: '#000000' }}>Treasurer & CFO</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3 }}>Treasurer & CFO</Text>
                    </View>

                    {/* Row 4 */}
                    <View style={{ flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor: '#000000', paddingVertical: 3, paddingHorizontal: 4 }}>
                        <Text style={{ fontSize: 6.5, width: 55, textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#000000' }}>{'>'}5M – 50M</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3, borderRightWidth: 0.5, borderRightColor: '#000000' }}>President & CEO</Text>
                        <Text style={{ fontSize: 6.5, flex: 1, textAlign: 'center', color: '#000000', paddingHorizontal: 3 }}>President & CEO</Text>
                    </View>

                </View>

                {/* ── Footer ─────────────────────────────────────────────── */}
                <View style={styles.footerDivider} fixed />

                {/* <Text style={styles.footerDraftLeft} fixed>
                    DRAFT RFP FORM
                </Text> */}
                <Text style={styles.footerGeneratedLeft} fixed>
                    Generation: {generatedAt}
                </Text>

                {/* <Text
                    style={styles.footerPageRight}
                    fixed
                    render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
                /> */}
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
