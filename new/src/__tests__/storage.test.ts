import { storageService, Booking } from '@/lib/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const makeBooking = (overrides: Partial<Omit<Booking, 'id' | 'status' | 'createdAt'>> = {}) =>
  storageService.saveBooking({
    customerName: 'Test User',
    phone: '0700000000',
    carModel: 'Toyota IST',
    serviceType: 'brake-systems',
    location: 'Mpendae',
    preferredDate: '2026-04-10',
    preferredTime: '10:00',
    isEmergency: false,
    ...overrides,
  });

beforeEach(() => {
  localStorageMock.clear();
});

describe('storageService', () => {
  describe('Booking interface new fields', () => {
    test('saveBooking persists optional new fields', () => {
      const booking = makeBooking({
        whatsapp: '0711000000',
        notes: 'Test note',
      });
      const bookings = storageService.getBookings();
      expect(bookings[0].whatsapp).toBe('0711000000');
      expect(bookings[0].notes).toBe('Test note');
      expect(booking.id).toBeTruthy();
    });
  });

  describe('updateBooking', () => {
    test('merges partial updates without overwriting unrelated fields', () => {
      const booking = makeBooking({ whatsapp: '0711000000' });
      storageService.updateBooking(booking.id, { price: 55000, workDone: 'Replaced brake pads' });

      const updated = storageService.getBookings().find(b => b.id === booking.id)!;
      expect(updated.price).toBe(55000);
      expect(updated.workDone).toBe('Replaced brake pads');
      expect(updated.customerName).toBe('Test User'); // unrelated field preserved
      expect(updated.whatsapp).toBe('0711000000'); // existing optional field preserved
    });

    test('accepts price: 0 for other-specialist', () => {
      const booking = makeBooking({ serviceType: 'other-specialist' });
      storageService.updateBooking(booking.id, { price: 0 });

      const updated = storageService.getBookings().find(b => b.id === booking.id)!;
      expect(updated.price).toBe(0);
    });

    test('persists invoiceItems array', () => {
      const booking = makeBooking();
      const items = [
        { description: 'Brake pads', amount: 40000 },
        { description: 'Labour', amount: 15000 },
      ];
      storageService.updateBooking(booking.id, { invoiceItems: items });

      const updated = storageService.getBookings().find(b => b.id === booking.id)!;
      expect(updated.invoiceItems).toHaveLength(2);
      expect(updated.invoiceItems![0].description).toBe('Brake pads');
      expect(updated.invoiceItems![1].amount).toBe(15000);
    });

    test('does not affect other bookings', () => {
      const b1 = makeBooking();
      const b2 = makeBooking({ customerName: 'Other User' });
      storageService.updateBooking(b1.id, { price: 99999 });

      const b2After = storageService.getBookings().find(b => b.id === b2.id)!;
      expect(b2After.price).toBeUndefined();
      expect(b2After.customerName).toBe('Other User');
    });
  });
});
