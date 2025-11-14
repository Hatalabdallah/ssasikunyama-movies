const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export class ApiService {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Get auth token for protected routes
      const token = tokenService.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Something went wrong' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error. Please try again.' };
    }
  }

  // Auth endpoints
  static async login(emailOrPhone: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    });
  }

  static async register(fullName: string, email: string, phone: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, phone, password }),
    });
  }

  // User management endpoints (admin only)
  static async getUsers() {
    return this.request<any[]>('/users');
  }

  static async createUser(userData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async updateUser(id: string, userData: {
    fullName: string;
    email: string;
    phone: string;
    subscriptionPlanId?: string;
    subscriptionExpiry?: string;
  }) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  static async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Plan management endpoints
  static async getPlans() {
    return this.request<any[]>('/plans');
  }

  static async createPlan(planData: {
    name: string;
    amount: number;
    currency?: string;
    startDate: string;    // Replaced durationDays
    endDate: string;      // Replaced durationDays
    description: string;
  }) {
    return this.request<{ plan: any }>('/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  static async updatePlan(id: string, planData: {
    name: string;
    amount: number;
    currency?: string;
    startDate: string;    // Replaced durationDays
    endDate: string;      // Replaced durationDays
    description: string;
    isActive?: boolean;
  }) {
    return this.request<{ plan: any }>(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    });
  }

    // Add toggle activation endpoint
  static async togglePlanActivation(id: string, isActive: boolean) {
    return this.request<{ success: boolean; plan: any; message: string }>(`/plans/${id}/activate`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  static async deletePlan(id: string) {
    return this.request<{ message: string }>(`/plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment endpoints
  static async initializePayment(paymentData: {
    planId: string;
    phoneNumber: string;
    provider: string;
  }) {
    return this.request<{
      success: boolean;
      transactionToken: string;
      instructions: string;
      statusCode: string;
      message: string;
    }>('/payments/initialize', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  static async verifyPayment(transactionToken: string) {
    return this.request<{
      success: boolean;
      status: string;
      message: string;
      user?: any;
    }>('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionToken }),
    });
  }

  static async getPaymentStatus(transactionToken: string) {
    return this.request<{
      status: string;
      amount: number;
      currency: string;
      provider: string;
      createdAt: string;
    }>(`/payments/status/${transactionToken}`);
  }

  // Movie endpoints
  static async getMovies() {
    return this.request<{
      movies: any[];
      canAccessEnglish: boolean;
      downloadedLocalCount: number;
      totalLocalCount: number;
      hasActiveSubscription: boolean;
    }>('/movies');
  }

  static async getTrendingMovies() {
    return this.request<{ movies: any[] }>('/movies/trending');
  }

  static async downloadMovie(movieId: string) {
    return this.request<{ downloadUrl: string; message: string }>(`/movies/download/${movieId}`);
  }

  // Admin movie endpoints
  static async startUpload(uploadData: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }) {
    return this.request<{ 
      uploadId: string; 
      fileKey: string;
      isResume?: boolean;
      uploadedChunks?: number[];
    }>('/movies/upload/start', {
      method: 'POST',
      body: JSON.stringify(uploadData),
    });
  }

  static async getUploadUrl(uploadData: {
    fileKey: string;
    uploadId: string;
    partNumber: number;
  }) {
    return this.request<{ uploadUrl: string; partNumber: number }>('/movies/upload/url', {
      method: 'POST',
      body: JSON.stringify(uploadData),
    });
  }

  static async completeUpload(completeData: {
    fileKey: string;
    uploadId: string;
    parts: Array<{ ETag: string; PartNumber: number }>;
    movieData: {
      title: string;
      description: string;
      category: string;
      thumbnailUrl: string;
      fileSize: number;
      fileName: string; // Add this
      subscriptionPlanIds: string[];
    };
  }) {
    return this.request<{ success: boolean; movie: any; message: string }>('/movies/upload/complete', {
      method: 'POST',
      body: JSON.stringify(completeData),
    });
  }

  static async getAllMovies() {
    return this.request<{ movies: any[] }>('/movies/admin/all');
  }

  static async createMovie(movieData: {
    title: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    fileKey: string;
    fileSize: number;
    duration?: number;
    subscriptionPlanIds: string[];
  }) {
    return this.request<{ success: boolean; movie: any; message: string }>('/movies/admin/create', {
      method: 'POST',
      body: JSON.stringify(movieData),
    });
  }

  static async deleteMovie(movieId: string) {
    return this.request<{ message: string }>(`/movies/admin/${movieId}`, {
      method: 'DELETE',
    });
  }

    // Public movie endpoints (no authentication required)
  static async getPublicTrendingMovies() {
    return this.request<{ movies: any[] }>('/movies/public/trending');
  }

  // Enhanced upload endpoints
  static async pauseUpload(pauseData: {
    fileKey: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/movies/upload/pause', {
      method: 'POST',
      body: JSON.stringify(pauseData),
    });
  }

  static async getUploadStatus(fileName: string) {
    return this.request<{
      exists: boolean;
      fileKey?: string;
      uploadId?: string;
      uploadedChunks?: number[];
      progress?: number;
      status?: string;
    }>(`/movies/upload/status/${encodeURIComponent(fileName)}`);
  }

  static async uploadThumbnail(thumbnailData: {
    fileName: string;
    fileData: string; // base64
  }) {
    return this.request<{ success: boolean; thumbnailUrl: string; message: string }>('/movies/upload/thumbnail', {
      method: 'POST',
      body: JSON.stringify(thumbnailData),
    });
  }

  static async toggleMovieActivation(movieId: string, isActive: boolean) {
    return this.request<{ success: boolean; movie: any; message: string }>(`/movies/admin/activate/${movieId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  static async completeDownload(movieId: string) {
    return this.request<{ success: boolean; message: string }>(`/movies/download/${movieId}/complete`, {
      method: 'POST',
    });
  }

  // Password management endpoints
  static async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/password/change', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

// Password reset endpoints
static async requestPasswordReset(emailOrPhone: string) {
  return this.request<{ message: string }>('/password/request-reset', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone }),
  });
}

// Reset password using OTP
static async resetPassword(emailOrPhone: string, otp: string, newPassword: string) {
  return this.request<{ message: string }>('/password/reset', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, otp, newPassword }),
  });
}

}

// Token management
export const tokenService = {
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  },

  removeToken(): void {
    localStorage.removeItem('authToken');
  },
};
