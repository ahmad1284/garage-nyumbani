import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NearingDueCard } from '@/app/admin/components/nearing-due-card';
import { ReminderModal } from '@/app/admin/components/reminder-modal';
import { generateServiceHistoryPDF } from '@/lib/admin-pdf-utils';
import { ServiceRecord } from '@/lib/storage';
import { addDays } from 'date-fns';

const mockJsPDF = {
  setFont: jest.fn(), setFontSize: jest.fn(), text: jest.fn(),
  line: jest.fn(), save: jest.fn(), addPage: jest.fn(),
  setPage: jest.fn(), setFillColor: jest.fn(), rect: jest.fn(),
  getNumberOfPages: jest.fn().mockReturnValue(1),
};
jest.mock('jspdf', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockJsPDF),
}));

const mockRecords: ServiceRecord[] = [
  {
    id: 'r001', customerName: 'Alice', phone: '+255700001111', carModel: 'Toyota Axio',
    serviceType: 'brake-systems',
    serviceDate: new Date().toISOString(),
    nextServiceDate: addDays(new Date(), 5).toISOString(),
    notes: '',
  },
  {
    id: 'r002', customerName: 'Bob', phone: '+255700002222', carModel: 'Nissan Note',
    serviceType: 'engine-performance',
    serviceDate: new Date().toISOString(),
    nextServiceDate: addDays(new Date(), 10).toISOString(),
    notes: '',
  },
];

beforeEach(() => jest.clearAllMocks());

describe('NearingDueCard', () => {
  test('renders count badge', () => {
    render(<NearingDueCard nearingDue={mockRecords} />);
    expect(screen.getByText('Cars Nearing Service Due')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('expands to show records on click', () => {
    render(<NearingDueCard nearingDue={mockRecords} />);
    fireEvent.click(screen.getByText('Cars Nearing Service Due'));
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  test('renders click-to-call links', () => {
    render(<NearingDueCard nearingDue={mockRecords} />);
    fireEvent.click(screen.getByText('Cars Nearing Service Due'));
    const link = screen.getByRole('link', { name: /\+255700001111/ });
    expect(link).toHaveAttribute('href', 'tel:+255700001111');
  });

  test('shows empty message when no records', () => {
    render(<NearingDueCard nearingDue={[]} />);
    fireEvent.click(screen.getByText('Cars Nearing Service Due'));
    expect(screen.getByText('No cars due within 14 days.')).toBeInTheDocument();
  });
});

describe('ReminderModal', () => {
  const onClose = jest.fn();
  const onReminderSent = jest.fn();

  test('renders first record', () => {
    render(<ReminderModal records={mockRecords} onClose={onClose} onReminderSent={onReminderSent} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  test('skip advances to next record', () => {
    render(<ReminderModal records={mockRecords} onClose={onClose} onReminderSent={onReminderSent} />);
    fireEvent.click(screen.getByText(/Skip/i));
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  test('close button calls onClose', () => {
    render(<ReminderModal records={mockRecords} onClose={onClose} onReminderSent={onReminderSent} />);
    fireEvent.click(document.querySelector('button[class*="rounded-full"]')!);
    expect(onClose).toHaveBeenCalled();
  });

  test('done screen shown after all records skipped', () => {
    render(<ReminderModal records={[mockRecords[0]]} onClose={onClose} onReminderSent={onReminderSent} />);
    fireEvent.click(screen.getByText(/Skip/i));
    expect(screen.getByText('All reminders sent!')).toBeInTheDocument();
  });
});

describe('generateServiceHistoryPDF', () => {
  test('saves with correct filename', () => {
    generateServiceHistoryPDF(mockRecords);
    expect(mockJsPDF.save).toHaveBeenCalledWith('Service_Records.pdf');
  });

  test('writes business name header', () => {
    generateServiceHistoryPDF(mockRecords);
    expect(mockJsPDF.text).toHaveBeenCalledWith('GARAGE NYUMBANI', 20, 20);
  });

  test('handles empty records without error', () => {
    expect(() => generateServiceHistoryPDF([])).not.toThrow();
    expect(mockJsPDF.save).toHaveBeenCalledWith('Service_Records.pdf');
  });
});
