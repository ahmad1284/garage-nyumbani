
import { Booking } from './types';
import { WHATSAPP_NUMBER } from './constants';

export const generateBookingId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GN-${year}-${random}`;
};

export const createWhatsAppLink = (booking: Booking): string => {
  const text = encodeURIComponent(
    `Habari Garage Nyumbani, naomba huduma ya gari.\n` +
    `Booking No: ${booking.id}\n` +
    `Huduma: ${booking.serviceType}\n` +
    `Eneo: ${booking.location}\n` +
    `Gari: ${booking.carModel}\n` +
    `Dharura: ${booking.isEmergency ? 'NDIO' : 'HAPANA'}\n` +
    `Tafadhali wasiliana nami.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
};

export const formatDateTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString();
};
