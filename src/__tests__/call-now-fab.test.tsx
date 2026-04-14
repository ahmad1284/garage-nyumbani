import React from 'react';
import { render, screen } from '@testing-library/react';
import { CallNowFAB } from '@/components/call-now-fab';
import { PHONE_NUMBER } from '@/lib/constants';

describe('CallNowFAB', () => {
  test('renders as a tel: link', () => {
    render(<CallNowFAB />);
    const link = screen.getByRole('link', { name: /call now/i });
    expect(link).toHaveAttribute('href', `tel:${PHONE_NUMBER}`);
  });

  test('has sm:hidden class for mobile-only visibility', () => {
    render(<CallNowFAB />);
    const link = screen.getByRole('link', { name: /call now/i });
    expect(link.className).toContain('sm:hidden');
  });

  test('is fixed positioned at bottom-right', () => {
    render(<CallNowFAB />);
    const link = screen.getByRole('link', { name: /call now/i });
    expect(link.className).toContain('fixed');
    expect(link.className).toContain('bottom-');
    expect(link.className).toContain('right-');
  });
});
