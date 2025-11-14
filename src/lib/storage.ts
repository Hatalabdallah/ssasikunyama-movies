import { User, Movie, SubscriptionPlan, Download } from '@/types';

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem('users');
  return data ? JSON.parse(data) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('users', JSON.stringify(users));
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const getUserByEmailOrPhone = (emailOrPhone: string): User | undefined => {
  return getUsers().find(u => u.email === emailOrPhone || u.phone === emailOrPhone);
};

// Movies
export const getMovies = (): Movie[] => {
  const data = localStorage.getItem('movies');
  return data ? JSON.parse(data) : [];
};

export const saveMovies = (movies: Movie[]) => {
  localStorage.setItem('movies', JSON.stringify(movies));
};

export const getMovieById = (id: string): Movie | undefined => {
  return getMovies().find(m => m.id === id);
};

// Subscription Plans
export const getPlans = (): SubscriptionPlan[] => {
  const data = localStorage.getItem('subscriptionPlans');
  return data ? JSON.parse(data) : [];
};

export const savePlans = (plans: SubscriptionPlan[]) => {
  localStorage.setItem('subscriptionPlans', JSON.stringify(plans));
};

export const getPlanById = (id: string): SubscriptionPlan | undefined => {
  return getPlans().find(p => p.id === id);
};

// Downloads
export const getDownloads = (): Download[] => {
  const data = localStorage.getItem('downloads');
  return data ? JSON.parse(data) : [];
};

export const saveDownloads = (downloads: Download[]) => {
  localStorage.setItem('downloads', JSON.stringify(downloads));
};

export const getUserDownloads = (userId: string): Download[] => {
  return getDownloads().filter(d => d.userId === userId);
};

export const hasUserDownloadedMovie = (userId: string, movieId: string): boolean => {
  return getDownloads().some(d => d.userId === userId && d.movieId === movieId);
};

export const recordDownload = (userId: string, movieId: string) => {
  const downloads = getDownloads();
  const newDownload: Download = {
    id: `download-${Date.now()}`,
    userId,
    movieId,
    downloadedAt: new Date().toISOString(),
  };
  downloads.push(newDownload);
  saveDownloads(downloads);
  
  // Increment movie download count
  const movies = getMovies();
  const movie = movies.find(m => m.id === movieId);
  if (movie) {
    movie.downloads++;
    saveMovies(movies);
  }
};

// Check if user has downloaded all local movies
export const hasDownloadedAllLocalMovies = (userId: string): boolean => {
  const movies = getMovies();
  const localMovies = movies.filter(m => m.category === 'local');
  const userDownloads = getUserDownloads(userId);
  
  return localMovies.every(movie => 
    userDownloads.some(d => d.movieId === movie.id)
  );
};
