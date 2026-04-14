import React from 'react';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/footer';
import { PHONE_NUMBER, WHATSAPP_NUMBER, BUSINESS_LOCATION, FACEBOOK_URL, INSTAGRAM_URL } from '@/lib/constants';

describe('Footer', () => {
  test('renders phone number as call link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: PHONE_NUMBER });
    expect(link).toHaveAttribute('href', `tel:${PHONE_NUMBER}`);
  });

  test('renders WhatsApp link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'WhatsApp' });
    expect(link).toHaveAttribute('href', `https://wa.me/${WHATSAPP_NUMBER}`);
  });

  test('renders business location', () => {
    render(<Footer />);
    expect(screen.getByText(BUSINESS_LOCATION)).toBeInTheDocument();
  });

  test('renders Facebook link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /facebook/i });
    expect(link).toHaveAttribute('href', FACEBOOK_URL);
  });

  test('renders Instagram link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: /instagram/i });
    expect(link).toHaveAttribute('href', INSTAGRAM_URL);
  });

  test('renders Google Maps iframe with lazy loading', () => {
    render(<Footer />);
    const iframe = screen.getByTitle('Garage Nyumbani Location');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('loading', 'lazy');
  });

  test('renders opening hours', () => {
    render(<Footer />);
    expect(screen.getByText(/Mon – Sat/)).toBeInTheDocument();
    expect(screen.getByText(/Emergency only/)).toBeInTheDocument();
  });

  test('renders copyright with current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
