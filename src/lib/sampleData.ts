import { User, Movie, SubscriptionPlan, Download } from '@/types';

export const sampleUsers: User[] = [
  {
    id: 'admin-1',
    fullName: 'Admin User',
    email: 'admin@movies.com',
    phone: '0700000000',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'agent-1',
    fullName: 'Agent User',
    email: 'agent@movies.com',
    phone: '0711111111',
    password: 'agent123',
    role: 'agent',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-1',
    fullName: 'John Doe',
    email: 'user@movies.com',
    phone: '0771234567',
    password: 'user123',
    role: 'client',
    subscriptionPlanId: 'plan-3',
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    fullName: 'Jane Smith',
    email: 'nonuser@movies.com',
    phone: '0772345678',
    password: 'nonuser123',
    role: 'client',
    createdAt: new Date().toISOString(),
  },
];

export const samplePlans: SubscriptionPlan[] = [
  {
    id: 'plan-1',
    name: 'Basic',
    amount: 5000,
    currency: 'UGX',
    durationDays: 7,
    description: 'Access to all local and English movies for 7 days',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'plan-2',
    name: 'Standard',
    amount: 10000,
    currency: 'UGX',
    durationDays: 14,
    description: 'Access to all local and English movies for 14 days',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'plan-3',
    name: 'Premium',
    amount: 20000,
    currency: 'UGX',
    durationDays: 30,
    description: 'Access to all local and English movies for 30 days',
    createdAt: new Date().toISOString(),
  },
];

export const sampleMovies: Movie[] = [
  {
    id: 'movie-1',
    title: 'The Kampala Story',
    description: 'A thrilling tale of life in the heart of Kampala city',
    category: 'local',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
    fileLink: 'sample-local-1.mp4',
    subscriptionPlanIds: ['plan-1', 'plan-2', 'plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 45,
  },
  {
    id: 'movie-2',
    title: 'Uganda Rising',
    description: 'An inspiring documentary about modern Uganda',
    category: 'local',
    thumbnail: 'https://images.unsplash.com/photo-1574267432644-f610a5773a3b?w=800',
    fileLink: 'sample-local-2.mp4',
    subscriptionPlanIds: ['plan-1', 'plan-2', 'plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 32,
  },
  {
    id: 'movie-3',
    title: 'Nile Adventures',
    description: 'Experience the beauty of the River Nile through local eyes',
    category: 'local',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    fileLink: 'sample-local-3.mp4',
    subscriptionPlanIds: ['plan-2', 'plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 28,
  },
  {
    id: 'movie-4',
    title: 'The Matrix Reloaded',
    description: 'Neo and his allies race against time in this action-packed sequel',
    category: 'english',
    thumbnail: 'https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=800',
    fileLink: 'sample-english-1.mp4',
    subscriptionPlanIds: ['plan-1', 'plan-2', 'plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 89,
  },
  {
    id: 'movie-5',
    title: 'Inception Dreams',
    description: 'A mind-bending thriller about the architecture of dreams',
    category: 'english',
    thumbnail: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800',
    fileLink: 'sample-english-2.mp4',
    subscriptionPlanIds: ['plan-2', 'plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 67,
  },
  {
    id: 'movie-6',
    title: 'Interstellar Journey',
    description: 'A team of explorers travel through a wormhole in space',
    category: 'english',
    thumbnail: 'https://images.unsplash.com/photo-1635805737707-575885ab0b2a?w=800',
    fileLink: 'sample-english-3.mp4',
    subscriptionPlanIds: ['plan-3'],
    uploadedAt: new Date().toISOString(),
    downloads: 54,
  },
];

export const sampleDownloads: Download[] = [
  {
    id: 'download-1',
    userId: 'user-1',
    movieId: 'movie-1',
    downloadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'download-2',
    userId: 'user-1',
    movieId: 'movie-2',
    downloadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function initializeSampleData() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(sampleUsers));
  }
  if (!localStorage.getItem('movies')) {
    localStorage.setItem('movies', JSON.stringify(sampleMovies));
  }
  if (!localStorage.getItem('subscriptionPlans')) {
    localStorage.setItem('subscriptionPlans', JSON.stringify(samplePlans));
  }
  if (!localStorage.getItem('downloads')) {
    localStorage.setItem('downloads', JSON.stringify(sampleDownloads));
  }
}
