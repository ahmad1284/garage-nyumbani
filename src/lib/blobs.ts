import { getStore } from '@netlify/blobs';

export function getGarageStore() {
  return getStore({ name: 'garage-nyumbani', consistency: 'strong' });
}
