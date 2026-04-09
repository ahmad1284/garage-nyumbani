import React from 'react';
import { Booking } from '@/lib/storage';
import { BUSINESS_NAME, BUSINESS_LOCATION, PHONE_NUMBER } from '@/lib/constants';
import { format } from 'date-fns';

interface InvoiceDocumentProps {
  booking: Booking;
}

export function InvoiceDocument({ booking }: InvoiceDocumentProps) {
  const invoiceNumber = `INV-${booking.id.toUpperCase()}`;
  const invoiceDate = format(new Date(), 'MMMM dd, yyyy');

  const lineItems = booking.invoiceItems && booking.invoiceItems.length > 0
    ? booking.invoiceItems
    : [{ description: `${booking.serviceType} service`, amount: booking.price ?? 0 }];

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div
      style={{
        width: '794px',
        padding: '48px',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#111111',
        lineHeight: '1.5',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{BUSINESS_NAME}</div>
          <div style={{ color: '#555', fontSize: '12px' }}>{BUSINESS_LOCATION}</div>
          <div style={{ color: '#555', fontSize: '12px' }}>{PHONE_NUMBER}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb', marginBottom: '4px' }}>INVOICE</div>
          <div style={{ fontSize: '12px', color: '#555' }}>{invoiceNumber}</div>
          <div style={{ fontSize: '12px', color: '#555' }}>{invoiceDate}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '2px solid #2563eb', marginBottom: '24px' }} />

      {/* Bill To + Vehicle Details */}
      <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Bill To</div>
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{booking.customerName}</div>
          <div style={{ color: '#555' }}>{booking.phone}</div>
          {booking.whatsapp && <div style={{ color: '#555' }}>WhatsApp: {booking.whatsapp}</div>}
          <div style={{ color: '#555' }}>{booking.location}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Details</div>
          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{booking.carModel}</div>
          <div style={{ color: '#555' }}>Service: {booking.serviceType}</div>
          <div style={{ color: '#555' }}>Date: {booking.preferredDate}</div>
          {booking.mechanic && <div style={{ color: '#555' }}>Mechanic: {booking.mechanic}</div>}
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: '#555', borderBottom: '1px solid #e5e7eb' }}>
              Description
            </th>
            <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: '#555', borderBottom: '1px solid #e5e7eb', width: '140px' }}>
              Amount (TZS)
            </th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '10px 12px' }}>{item.description}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                {item.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
        <div style={{ width: '240px', borderTop: '2px solid #111', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
            <span>Total</span>
            <span>TZS {total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Work Done */}
      {booking.workDone && (
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase', marginBottom: '6px' }}>Work Done</div>
          <div style={{ color: '#333' }}>{booking.workDone}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center', color: '#888', fontSize: '11px' }}>
        Thank you for choosing {BUSINESS_NAME} — Mobile Auto Service, {BUSINESS_LOCATION}
      </div>
    </div>
  );
}
