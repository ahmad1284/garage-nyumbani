import { storageService, setAdminToken, getAdminToken, Booking } from '@/lib/storage';

const BASE_BOOKING: Omit<Booking, 'id' | 'status' | 'createdAt'> = {
  customerName: 'Test User',
  phone: '0700000000',
  carModel: 'Toyota IST',
  serviceType: 'brake-systems',
  location: 'Mpendae',
  preferredDate: '2026-04-10',
  preferredTime: '10:00',
  isEmergency: false,
};

const makeServerBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 'test-id-123',
  status: 'New',
  createdAt: new Date().toISOString(),
  ...BASE_BOOKING,
  ...overrides,
});

const mockFetch = (data: unknown, status = 200) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response);
};

beforeEach(() => {
  jest.resetAllMocks();
  // Reset sessionStorage mock
  setAdminToken(null);
});

describe('storageService', () => {
  describe('getBookings', () => {
    test('fetches bookings from API', async () => {
      const bookings = [makeServerBooking()];
      mockFetch(bookings);

      const result = await storageService.getBookings();
      expect(result).toEqual(bookings);
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings');
    });

    test('passes phone query param when provided', async () => {
      mockFetch([]);
      await storageService.getBookings('0700000000');
      expect(global.fetch).toHaveBeenCalledWith('/api/bookings?phone=0700000000');
    });

    test('throws on non-ok response', async () => {
      mockFetch({ error: 'Failed' }, 500);
      await expect(storageService.getBookings()).rejects.toThrow();
    });
  });

  describe('saveBooking', () => {
    test('POSTs booking to API and returns created booking', async () => {
      const created = makeServerBooking();
      mockFetch(created, 201);

      const result = await storageService.saveBooking(BASE_BOOKING);
      expect(result.id).toBe('test-id-123');
      expect(result.status).toBe('New');
      expect((global.fetch as jest.Mock).mock.calls[0][1].method).toBe('POST');
    });

    test('throws on error response', async () => {
      mockFetch({ error: 'Missing required fields' }, 400);
      await expect(storageService.saveBooking(BASE_BOOKING)).rejects.toThrow();
    });
  });

  describe('updateBooking', () => {
    test('PATCHes booking with auth header', async () => {
      const updated = makeServerBooking({ price: 55000 });
      mockFetch(updated, 200);
      setAdminToken('test-token');

      await storageService.updateBooking('test-id-123', { price: 55000 });

      const call = (global.fetch as jest.Mock).mock.calls[0];
      expect(call[0]).toBe('/api/bookings/test-id-123');
      expect(call[1].method).toBe('PATCH');
      expect(call[1].headers['Authorization']).toBe('Bearer test-token');
    });

    test('throws on 401', async () => {
      mockFetch({ error: 'Unauthorized' }, 401);
      await expect(storageService.updateBooking('id', { price: 0 })).rejects.toThrow();
    });
  });

  describe('token management', () => {
    test('setAdminToken stores token', () => {
      setAdminToken('abc-token');
      expect(getAdminToken()).toBe('abc-token');
    });

    test('setAdminToken(null) clears token', () => {
      setAdminToken('abc-token');
      setAdminToken(null);
      expect(getAdminToken()).toBeNull();
    });
  });
});
