
import { Booking, ServiceRecord } from '../types';

const STORAGE_KEY = 'garage_nyumbani_bookings';
const RECORDS_KEY = 'garage_nyumbani_records';

export const storageService = {
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveBooking: (booking: Booking): void => {
    const bookings = storageService.getBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  },

  updateBookingStatus: (id: string, status: Booking['status'], notes?: string): void => {
    const bookings = storageService.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      if (notes !== undefined) bookings[index].notes = notes;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  },

  updateBookingInvoice: (id: string, price: number, workDone: string): void => {
    const bookings = storageService.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].price = price;
      bookings[index].workDone = workDone;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  },
  
  assignMechanic: (id: string, mechanicName: string): void => {
    const bookings = storageService.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].assignedMechanic = mechanicName;
      bookings[index].status = 'In Progress';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    }
  },

  getServiceRecords: (): ServiceRecord[] => {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveServiceRecord: (record: ServiceRecord): void => {
    const records = storageService.getServiceRecords();
    records.push(record);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },

  seedMockData: (): void => {
    const existing = localStorage.getItem(RECORDS_KEY);
    if (existing && JSON.parse(existing).length > 50) return;

    const services = [
      'ENGINE PERFORMANCE & OVERHAUL',
      'TIRE MAINTENANCE & RECOVERY',
      'BRAKE & SAFETY SYSTEMS',
      'SUSPENSION & STEERING TUNING',
      'CLIMATE CONTROL & AC SERVICE',
      'ELECTRICAL & COMPUTER DIAGNOSTICS',
      'SCHEDULED PERIODIC MAINTENANCE',
      'MOBILE CAR SPA & DETAILING'
    ];

    const cars = ['TOYOTA IST', 'TOYOTA HARRIER', 'SUZUKI ESCUDO', 'NISSAN X-TRAIL', 'TOYOTA RAV4', 'HONDA FIT', 'TOYOTA ALPHARD', 'TOYOTA CROWN', 'VW GOLF', 'SUBARU FORESTER'];
    const names = ['Amani Juma', 'Zuwena Ali', 'Said Bakari', 'Fatma Khamis', 'Musa Hassan', 'Asha Suleiman', 'Idris Rashid', 'Maryam Omar', 'Salum Hamad', 'Haji Mwinyi', 'Bakari Shein', 'Khadija Yusuf', 'Juma Abdullah', 'Zainab Salum'];

    const newRecords: ServiceRecord[] = [];
    
    // Generate 50 cars, each with 3 services
    for (let i = 1; i <= 50; i++) {
      const name = names[i % names.length];
      const phone = `0777${(100000 + i).toString().slice(1)}`;
      const car = cars[i % cars.length];
      
      // Each car gets 3 historical services
      for (let s = 1; s <= 3; s++) {
        const service = services[(i + s) % services.length];
        const date = new Date();
        // Stagger dates: s=1 is latest, s=3 is oldest
        date.setMonth(date.getMonth() - (s * 3)); 
        date.setDate(date.getDate() - (i % 28));

        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 3);

        newRecords.push({
          id: `REC-${1000 + (i * 10) + s}`,
          phone,
          customerName: name.toUpperCase(),
          carModel: car,
          serviceType: service,
          serviceDate: date.toISOString(),
          nextServiceDate: nextDate.toISOString(),
          notes: `COMPLETED ${service} AT CUSTOMER RESIDENCE. SYSTEM CHECKS CLEAR. FLUIDS TOPPED UP. NEXT VISIT RECOMMENDED FOR TIRE ROTATION.`.toUpperCase()
        });
      }
    }
    
    localStorage.setItem(RECORDS_KEY, JSON.stringify(newRecords));
  },

  getDataByPhone: (phone: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const bookings = storageService.getBookings().filter(b => b.phone.replace(/[^0-9]/g, '') === cleanPhone);
    const records = storageService.getServiceRecords().filter(r => r.phone.replace(/[^0-9]/g, '') === cleanPhone);
    
    const totalSpend = bookings.reduce((acc, b) => acc + (b.price || 0), 0);
    const sortedRecords = records.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
    const lastService = sortedRecords.length > 0 ? sortedRecords[0] : null;
    
    return { 
      bookings, 
      records: sortedRecords,
      summary: {
        totalSpend,
        visitCount: bookings.length + records.length,
        lastServiceDate: lastService?.serviceDate,
        nextServiceDate: lastService?.nextServiceDate
      }
    };
  }
};
