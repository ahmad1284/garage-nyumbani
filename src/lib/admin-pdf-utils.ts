import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ServiceRecord } from '@/lib/storage';
import { BUSINESS_NAME } from '@/lib/constants';

export function generateServiceHistoryPDF(records: ServiceRecord[]): void {
  const doc = new jsPDF();
  const generatedDate = format(new Date(), 'MMM dd, yyyy HH:mm');

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BUSINESS_NAME, 20, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Service Records Report', 20, 28);
  doc.text(`Generated: ${generatedDate}`, 140, 28);
  doc.text(`Total records: ${records.length}`, 20, 35);

  doc.line(20, 40, 190, 40);

  // Table header
  const colX = [20, 55, 95, 130, 160];
  const headers = ['Customer', 'Car', 'Service', 'Last Service', 'Next Due'];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  let y = 50;

  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.line(20, y + 2, 190, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  records.forEach((record, idx) => {
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(20, y - 6, 170, 9, 'F');
    }

    doc.text(record.customerName.substring(0, 16), colX[0], y);
    doc.text(record.carModel.substring(0, 16), colX[1], y);
    doc.text(record.serviceType.substring(0, 16), colX[2], y);
    doc.text(format(new Date(record.serviceDate), 'PP'), colX[3], y);
    doc.text(format(new Date(record.nextServiceDate), 'PP'), colX[4], y);
  });

  // Page footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, 170, 290);
    doc.text(BUSINESS_NAME, 20, 290);
  }

  doc.save('Service_Records.pdf');
}
