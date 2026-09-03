/**
 * Application Data Mode Configuration
 * 
 * Supports:
 * - 'demo' : Uses centralized demo/presentation dataset (default)
 * - 'live' : Connects strictly to backend REST API & database
 */

export const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'demo';

export const isDemoMode = () => DATA_MODE === 'demo';
export const isLiveMode = () => DATA_MODE === 'live';

export default {
  DATA_MODE,
  isDemoMode,
  isLiveMode
};
