import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { RfpRequest } from '@/types';

// Register Arial-like font
Font.register({
    family: 'Arial',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf' },
        { src: 'https://fonts.gstatic.com/s/opensans/v34/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf', fontWeight: 'bold' },
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: '2.54cm',
        fontSize: 11,
        fontFamily: 'Arial',
        lineHeight: 1.15,
    },
    header: {
        marginBottom: 20,
        borderBottom: 2,
        borderBottomColor: '#000',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        lineHeight: 1.15,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 1.15,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        padding: 5,
        lineHeight: 1.15,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
        lineHeight: 1.15,
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
    },
    value: {
        width: '70%',
    },
    table: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#000',
        paddingBottom: 5,
        marginBottom: 5,
        fontWeight: 'bold',
        lineHeight: 1.15,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 5,
        borderBottom: 1,
        borderBottomColor: '#eee',
        lineHeight: 1.15,
    },
    tableColWide: {
        flex: 2,
    },
    tableColAmount: {
        flex: 1,
        textAlign: 'right',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 3,
        fontSize: 9,
        fontWeight: 'bold',
    },
    badgeDraft: {
        backgroundColor: '#e0e0e0',
        color: '#000',
    },
    badgeApproved: {
        backgroundColor: '#bde0fe',
        color: '#023e8a',
    },
    badgePaid: {
        backgroundColor: '#d8f3dc',
        color: '#1b4332',
    },
    footer: {
        marginTop: 30,
        paddingTop: 10,
        borderTop: 1,
        borderTopColor: '#000',
        fontSize: 8,
        color: '#666',
        lineHeight: 1.15,
    },
});

type Props = {
    rfp_request: RfpRequest;
};

export function RfpPdfDocument({ rfp_request }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount: number | null) => {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const getStatusStyle = () => {
        switch (rfp_request.status) {
            case 'approved':
                return styles.badgeApproved;
            case 'paid':
                return styles.badgePaid;
            default:
                return styles.badgeDraft;
        }
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Request for Payment</Text>
                    <Text style={styles.subtitle}>{rfp_request.rfp_request_number}</Text>
                </View>

                {/* Status & Area */}
                <View style={[styles.section, { flexDirection: 'row', gap: 10 }]}>
                    <View style={[styles.badge, getStatusStyle()]}>
                        <Text>{rfp_request.status.toUpperCase().replace('_', ' ')}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#666' }}>{rfp_request.area}</Text>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Category:</Text>
                        <Text style={styles.value}>
                            {rfp_request.usage?.category?.code} - {rfp_request.usage?.category?.name}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Usage:</Text>
                        <Text style={styles.value}>
                            {rfp_request.usage?.code} - {rfp_request.usage?.description}
                        </Text>
                    </View>
                </View>

                {/* Payee Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payee Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Type:</Text>
                        <Text style={styles.value}>{rfp_request.payee_type}</Text>
                    </View>
                    {rfp_request.payee_type === 'Supplier' ? (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>Supplier Code:</Text>
                                <Text style={styles.value}>{rfp_request.supplier_code || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Supplier Name:</Text>
                                <Text style={styles.value}>{rfp_request.supplier_name || 'N/A'}</Text>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.label}>Employee Code:</Text>
                                <Text style={styles.value}>{rfp_request.employee_code || 'N/A'}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Employee Name:</Text>
                                <Text style={styles.value}>{rfp_request.employee_name || 'N/A'}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Document Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Document Information</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>AP Number:</Text>
                        <Text style={styles.value}>{rfp_request.ap_no || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Due Date:</Text>
                        <Text style={styles.value}>{formatDate(rfp_request.due_date)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>RR Number:</Text>
                        <Text style={styles.value}>{rfp_request.rr_no || 'N/A'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>PO Number:</Text>
                        <Text style={styles.value}>{rfp_request.po_no || 'N/A'}</Text>
                    </View>
                </View>

                {/* Details Table */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.tableColWide}>Description</Text>
                            <Text style={styles.tableColAmount}>Amount</Text>
                        </View>
                        {rfp_request.details.map((detail, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.tableColWide}>{detail.description || 'N/A'}</Text>
                                <Text style={styles.tableColAmount}>
                                    {formatCurrency(detail.total_amount)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Financial Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Financial Summary</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Currency:</Text>
                        <Text style={styles.value}>
                            {rfp_request.currency?.code} - {rfp_request.currency?.name}
                        </Text>
                    </View>
                    {rfp_request.wtax_amount && Number(rfp_request.wtax_amount) > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Withholding Tax:</Text>
                            <Text style={styles.value}>{formatCurrency(rfp_request.wtax_amount)}</Text>
                        </View>
                    )}
                    {rfp_request.less_down_payment_amount && Number(rfp_request.less_down_payment_amount) > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Less: Down Payment:</Text>
                            <Text style={styles.value}>-{formatCurrency(rfp_request.less_down_payment_amount)}</Text>
                        </View>
                    )}
                    <View style={[styles.row, { marginTop: 10, borderTop: 1, paddingTop: 5 }]}>
                        <Text style={[styles.label, { fontWeight: 'bold', fontSize: 12 }]}>Grand Total:</Text>
                        <Text style={[styles.value, { fontWeight: 'bold', fontSize: 12 }]}>
                            {formatCurrency(rfp_request.grand_total_amount)}
                        </Text>
                    </View>
                </View>

                {/* Remarks */}
                {rfp_request.remarks && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Remarks</Text>
                        <Text style={{ fontSize: 9 }}>{rfp_request.remarks}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        Generated on {new Date().toLocaleDateString('en-US')} at{' '}
                        {new Date().toLocaleTimeString('en-US')}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
