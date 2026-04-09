import {
  BUSINESS_NAME,
  PHONE_NUMBER,
  WHATSAPP_NUMBER,
  BUSINESS_LOCATION,
  MECHANICS,
  SERVICES,
  FAQ_ITEMS,
} from '@/lib/constants';

describe('constants', () => {
  test('business constants are defined', () => {
    expect(BUSINESS_NAME).toBe('GARAGE NYUMBANI');
    expect(PHONE_NUMBER).toBe('+255700000000');
    expect(WHATSAPP_NUMBER).toBe('255700000000');
    expect(BUSINESS_LOCATION).toBe('MPENDAE, ZANZIBAR');
  });

  describe('MECHANICS', () => {
    test('has exactly 5 mechanics', () => {
      expect(MECHANICS).toHaveLength(5);
    });

    test('all mechanics are non-empty strings', () => {
      MECHANICS.forEach(name => expect(typeof name).toBe('string'));
      MECHANICS.forEach(name => expect(name.length).toBeGreaterThan(0));
    });
  });

  describe('SERVICES', () => {
    test('has exactly 9 services', () => {
      expect(SERVICES).toHaveLength(9);
    });

    test('each service has required fields', () => {
      SERVICES.forEach(service => {
        expect(service.id).toBeTruthy();
        expect(service.titleSw).toBeTruthy();
        expect(service.titleEn).toBeTruthy();
        expect(service.descriptionSw).toBeTruthy();
        expect(service.descriptionEn).toBeTruthy();
        expect(service.icon).toBeTruthy();
        expect(typeof service.price).toBe('number');
      });
    });

    test('other-specialist service has price 0', () => {
      const otherSpecialist = SERVICES.find(s => s.id === 'other-specialist');
      expect(otherSpecialist).toBeDefined();
      expect(otherSpecialist!.price).toBe(0);
    });

    test('service ids are unique', () => {
      const ids = SERVICES.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('FAQ_ITEMS', () => {
    test('has exactly 4 items', () => {
      expect(FAQ_ITEMS).toHaveLength(4);
    });

    test('each item has bilingual Q&A', () => {
      FAQ_ITEMS.forEach(item => {
        expect(item.qSw).toBeTruthy();
        expect(item.aSw).toBeTruthy();
        expect(item.qEn).toBeTruthy();
        expect(item.aEn).toBeTruthy();
      });
    });
  });
});
