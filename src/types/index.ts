export type UserRole = 'admin' | 'agent' | 'client';

export type MovieCategory = 'local' | 'english';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  subscriptionPlanId?: string;
  subscriptionExpiry?: string;
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  category: MovieCategory;
  thumbnail: string;
  fileLink: string;
  subscriptionPlanIds: string[];
  uploadedAt: string;
  downloads: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  startDate: string;    // Replaced durationDays
  endDate: string;      // Replaced durationDays
  isActive: boolean;    // Added activation toggle
  description: string;
  createdAt: string;
}

export interface Download {
  id: string;
  userId: string;
  movieId: string;
  downloadedAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}
