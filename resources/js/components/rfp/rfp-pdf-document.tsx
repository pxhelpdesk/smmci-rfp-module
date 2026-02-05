import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { RfpRequest } from '@/types';
import { formatDateTime } from '@/lib/formatters';

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
        textAlign: 'center',
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
        lineHeight: 1.2,
    },
    companyAddress: {
        fontSize: 9,
        lineHeight: 1.2,
        marginBottom: 1,
    },
    companyContact: {
        fontSize: 9,
        lineHeight: 1.2,
        marginBottom: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        textDecoration: 'underline',
        lineHeight: 1.15,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: '2.54cm',
        right: '2.54cm',
        paddingTop: 10,
        borderTop: 1,
        borderTopColor: '#000',
        fontSize: 8,
        color: '#666',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

type Props = {
    rfp_request: RfpRequest;
};

export function RfpPdfDocument({ rfp_request }: Props) {
    const getCurrentDateTime = () => {
        return formatDateTime(new Date().toISOString(), {
            dateFormat: 'short',
            timeFormat: '12h'
        });
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
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

                {/* Title */}
                <Text style={styles.title}>REQUEST FOR PAYMENT</Text>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text>Generated: {getCurrentDateTime()}</Text>
                    <Text render={({ pageNumber, totalPages }) => (
                        `Page ${pageNumber} of ${totalPages}`
                    )} />
                </View>
            </Page>
        </Document>
    );
}
