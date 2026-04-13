import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Booking } from '@/lib/storage';
import { SERVICES, BUSINESS_NAME } from '@/lib/constants';

export function generateHistoryPDF(bookings: Booking[], phone: string): void {
  const doc = new jsPDF();
  const generatedDate = format(new Date(), 'MMM dd, yyyy HH:mm');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BUSINESS_NAME, 20, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Service History Report', 20, 28);
  doc.text(`Phone: ${phone}`, 20, 35);
  doc.text(`Generated: ${generatedDate}`, 140, 35);

  doc.line(20, 40, 190, 40);

  // Table header
  const colX = [20, 50, 85, 125, 155, 178];
  const headers = ['ID', 'Date', 'Service', 'Car', 'Status', 'Emg'];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let y = 50;

  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.line(20, y + 2, 190, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  bookings.forEach((booking, idx) => {
    y += 10;
    // Add new page if needed
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const service = SERVICES.find(s => s.id === booking.serviceType);
    const serviceLabel = service
      ? service.titleEn.substring(0, 22)
      : booking.serviceType.substring(0, 22);

    const rowBg = idx % 2 === 0;
    if (rowBg) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y - 6, 170, 9, 'F');
    }

    doc.text(booking.id.toUpperCase().substring(0, 8), colX[0], y);
    doc.text(booking.preferredDate || '-', colX[1], y);
    doc.text(serviceLabel, colX[2], y);
    doc.text(booking.carModel.substring(0, 15), colX[3], y);
    doc.text(booking.status, colX[4], y);
    doc.text(booking.isEmergency ? 'YES' : '-', colX[5], y);
  });

  // Footer with page number
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 170, 290);
    doc.text(BUSINESS_NAME, 20, 290);
  }

  doc.save(`History_${phone}.pdf`);
}
