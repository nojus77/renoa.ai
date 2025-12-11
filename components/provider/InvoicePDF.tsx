import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981', // Emerald green - Renoa brand
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  textBold: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 3,
  },
  infoBox: {
    width: '48%',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
  },
  tableRowLast: {
    flexDirection: 'row',
    padding: 10,
  },
  col1: {
    width: '50%',
  },
  col2: {
    width: '15%',
    textAlign: 'right',
  },
  col3: {
    width: '20%',
    textAlign: 'right',
  },
  col4: {
    width: '15%',
    textAlign: 'right',
  },
  summarySection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#10b981',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },
  paidBadge: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#d1fae5',
    borderRadius: 4,
    textAlign: 'center',
  },
  paidText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#065f46',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginVertical: 15,
  },
});

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    status: string;
    subtotal: number;
    taxRate: number | null;
    taxAmount: number;
    discountAmount: number;
    total: number;
    amountPaid: number;
    notes: string | null;
    terms: string | null;
    paymentInstructions: string | null;
    provider: {
      businessName: string;
      ownerName: string;
      email: string;
      phone: string;
      businessAddress?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      taxId?: string;
      salesTaxNumber?: string;
      website?: string;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const balance = invoice.total - invoice.amountPaid;
  const isPaid = invoice.status === 'paid';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Renoa</Text>
          <Text style={styles.invoiceTitle}>INVOICE #{invoice.invoiceNumber}</Text>
        </View>

        {/* Invoice Info and Dates */}
        <View style={styles.headerRow}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.textBold}>{invoice.provider.businessName}</Text>
            <Text style={styles.text}>{invoice.provider.ownerName}</Text>
            {invoice.provider.taxId && (
              <Text style={styles.text}>EIN: {invoice.provider.taxId}</Text>
            )}
            {invoice.provider.businessAddress && (
              <Text style={styles.text}>
                {invoice.provider.businessAddress}
                {invoice.provider.city && invoice.provider.state && invoice.provider.zipCode
                  ? `, ${invoice.provider.city}, ${invoice.provider.state} ${invoice.provider.zipCode}`
                  : ''}
              </Text>
            )}
            <Text style={styles.text}>{invoice.provider.email}</Text>
            <Text style={styles.text}>{invoice.provider.phone}</Text>
            {invoice.provider.website && (
              <Text style={styles.text}>{invoice.provider.website}</Text>
            )}
            {invoice.provider.salesTaxNumber && (
              <Text style={styles.text}>Sales Tax #: {invoice.provider.salesTaxNumber}</Text>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={styles.text}>Invoice Date:</Text>
              <Text style={styles.textBold}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={styles.text}>Due Date:</Text>
              <Text style={styles.textBold}>{formatDate(invoice.dueDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.text}>Status:</Text>
              <Text style={styles.textBold}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.textBold}>{invoice.customer.name}</Text>
          <Text style={styles.text}>{invoice.customer.email}</Text>
          <Text style={styles.text}>{invoice.customer.phone}</Text>
          <Text style={styles.text}>{invoice.customer.address}</Text>
        </View>

        <View style={styles.divider} />

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Total</Text>
          </View>

          {invoice.lineItems.map((item, index) => (
            <View
              key={index}
              style={index === invoice.lineItems.length - 1 ? styles.tableRowLast : styles.tableRow}
            >
              <Text style={[styles.text, styles.col1]}>{item.description}</Text>
              <Text style={[styles.text, styles.col2]}>{item.quantity}</Text>
              <Text style={[styles.text, styles.col3]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.textBold, styles.col4]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>

          {invoice.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.discountAmount)}</Text>
            </View>
          )}

          {invoice.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tax {invoice.taxRate ? `(${invoice.taxRate}%)` : ''}:
              </Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
          </View>

          {invoice.amountPaid > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount Paid:</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.amountPaid)}</Text>
            </View>
          )}

          {isPaid ? (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>PAID IN FULL</Text>
            </View>
          ) : balance > 0 ? (
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance Due:</Text>
              <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Payment Instructions */}
          <View style={styles.section}>
            <Text style={styles.footerTitle}>Payment Instructions</Text>
            {invoice.paymentInstructions ? (
              <Text style={styles.footerText}>{invoice.paymentInstructions}</Text>
            ) : (
              <>
                <Text style={styles.footerText}>
                  Payment is due within {Math.ceil((new Date(invoice.dueDate).getTime() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days of invoice date.
                </Text>
                <Text style={styles.footerText}>
                  • Online: Pay securely at {invoice.provider.website || 'renoa.com'}
                </Text>
                <Text style={styles.footerText}>
                  • Credit Card: Visa, Mastercard, American Express accepted
                </Text>
                {invoice.provider.businessAddress && (
                  <Text style={styles.footerText}>
                    • Check: Mail to {invoice.provider.businessAddress}
                    {invoice.provider.city && invoice.provider.state && invoice.provider.zipCode
                      ? `, ${invoice.provider.city}, ${invoice.provider.state} ${invoice.provider.zipCode}`
                      : ''}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Terms & Conditions */}
          <View style={styles.section}>
            <Text style={styles.footerTitle}>Terms & Conditions</Text>
            {invoice.terms ? (
              <Text style={styles.footerText}>{invoice.terms}</Text>
            ) : (
              <>
                <Text style={styles.footerText}>
                  Payment Terms: Net {Math.ceil((new Date(invoice.dueDate).getTime() - new Date(invoice.invoiceDate).getTime()) / (1000 * 60 * 60 * 24))} days.
                  Late Fee: 1.5% per month (18% APR) on overdue balance.
                </Text>
                <Text style={styles.footerText}>
                  All services are subject to acceptance and availability. Prices are subject to change without notice.
                  Customer is responsible for ensuring access to property and clearing work areas prior to service date.
                </Text>
              </>
            )}
          </View>

          {/* Liability & Warranty */}
          <View style={styles.section}>
            <Text style={styles.footerTitle}>Liability & Warranty</Text>
            <Text style={styles.footerText}>
              We guarantee all workmanship for 30 days from service completion. Plant materials carry a 1-year warranty
              when proper care instructions are followed. We are not liable for pre-existing conditions, underground
              utilities not marked, or damage caused by weather, pests, or improper maintenance. Customer must notify
              us of any issues within 7 days of service for warranty consideration.
            </Text>
          </View>

          {/* Custom Notes */}
          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.footerTitle}>Additional Notes</Text>
              <Text style={styles.footerText}>{invoice.notes}</Text>
            </View>
          )}

          {/* Contact Info */}
          <View style={{ marginTop: 20 }}>
            <Text style={styles.footerText}>
              Thank you for your business! For any questions about this invoice, please contact{' '}
              {invoice.provider.email} or {invoice.provider.phone}.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
