import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Download, Lock, Check, Film, LogOut, AlertCircle, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';
import { downloadManager } from '@/lib/downloadManager';

interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  downloads_count: number;
  uploaded_at: string;
  is_downloaded: boolean;
}

interface MoviesResponse {
  movies: Movie[];
  canAccessEnglish: boolean;
  downloadedLocalCount: number;
  totalLocalCount: number;
  hasActiveSubscription: boolean;
}

export default function AgentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [moviesData, setMoviesData] = useState<MoviesResponse | null>(null);
  const [downloadingMovies, setDownloadingMovies] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [totalDownloads, setTotalDownloads] = useState(0);

  useEffect(() => {
    if (!currentUser) return;
    loadMovies();
  }, [currentUser]);

  const loadMovies = async () => {
    try {
      const result = await ApiService.getMovies();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setMoviesData(result.data!);
      
      // Calculate total downloads for this agent
      const downloadedCount = result.data!.movies.filter(m => m.is_downloaded).length;
      setTotalDownloads(downloadedCount);
    } catch (error) {
      toast.error('Failed to load movies');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDownload = async (movie: Movie) => {
    if (!currentUser || !moviesData) return;

    // Check if already downloaded
    if (movie.is_downloaded) {
      toast.info('You have already downloaded this movie');
      return;
    }

    // Check Luganda-first rule for agents
    if (movie.category === 'english' && !moviesData.canAccessEnglish) {
      toast.error(`Please download all local movies first. You have downloaded ${moviesData.downloadedLocalCount} of ${moviesData.totalLocalCount} local movies.`);
      return;
    }

    setDownloadingMovies(prev => new Set([...prev, movie.id]));
    setDownloadProgress(prev => ({ ...prev, [movie.id]: 0 }));

    try {
      // Get download URL from API
      const result = await ApiService.downloadMovie(movie.id);
      if (result.error) {
        throw new Error(result.error);
      }

      const { downloadUrl } = result.data!;

      // Start download with progress tracking
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength) : 0;
      const reader = response.body?.getReader();
      
      if (!reader) throw new Error('No reader available');

      let received = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        // Update progress
        if (total > 0) {
          const progress = (received / total) * 100;
          setDownloadProgress(prev => ({ ...prev, [movie.id]: progress }));
        }
      }

      // Create blob and download
      const blob = new Blob(chunks);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${movie.title}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Update local state
      setMoviesData(prev => prev ? {
        ...prev,
        movies: prev.movies.map(m => 
          m.id === movie.id ? { ...m, is_downloaded: true } : m
        ),
        downloadedLocalCount: movie.category === 'local' ? prev.downloadedLocalCount + 1 : prev.downloadedLocalCount,
        // ✅ FIXED: Same logic as backend
        canAccessEnglish: prev.totalLocalCount === 0 || 
          (movie.category === 'local' && (prev.downloadedLocalCount + 1) >= prev.totalLocalCount)
      } : null);

      // ✅ ALSO sync with backend truth
      loadMovies();

      setTotalDownloads(prev => prev + 1);
      toast.success(`"${movie.title}" downloaded successfully!`);

      if (movie.category === 'local' && 
          moviesData.downloadedLocalCount + 1 >= moviesData.totalLocalCount) {
        toast.success('All local movies downloaded! English movies are now unlocked!');
      }

    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Download failed. Please try again.');
    } finally {
      setDownloadingMovies(prev => {
        const newSet = new Set(prev);
        newSet.delete(movie.id);
        return newSet;
      });
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[movie.id];
        return newProgress;
      });
    }
  };

  const MovieCard = ({ movie }: { movie: Movie }) => {
    const [progress, setProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'paused' | 'completed' | 'error'>('idle');

    // Check download status periodically
    useEffect(() => {
      const checkDownloadStatus = () => {
        const download = downloadManager.getDownloadStatus(movie.id);
        if (download) {
          setProgress(download.progress);
          setDownloadStatus(download.status);
        } else {
          setProgress(0);
          setDownloadStatus('idle');
        }
      };

      const interval = setInterval(checkDownloadStatus, 500);
      return () => clearInterval(interval);
    }, [movie.id]);

    const isDownloading = downloadStatus === 'downloading';
    const isPaused = downloadStatus === 'paused';
    const isLocked = movie.category === 'english' && !moviesData?.canAccessEnglish;
    const canDownload = !isLocked && !movie.is_downloaded && !isDownloading && !isPaused;

    const handleDownload = async () => {
      if (!currentUser || !moviesData) return;

      // Check if already downloaded
      if (movie.is_downloaded) {
        toast.info('You have already downloaded this movie');
        return;
      }

      // Check Luganda-first rule for agents
      if (movie.category === 'english' && !moviesData.canAccessEnglish) {
        toast.error(`Please download all local movies first. You have downloaded ${moviesData.downloadedLocalCount} of ${moviesData.totalLocalCount} local movies.`);
        return;
      }

      try {
        // Get download URL from API
        const result = await ApiService.downloadMovie(movie.id);
        if (result.error) {
          throw new Error(result.error);
        }

        const { downloadUrl } = result.data!;
        
        // Start download with manager - ADD THE COMPLETION CALLBACK
        await downloadManager.startDownload(
          movie.id,
          `${movie.title}.mp4`,
          downloadUrl,
          async (newProgress) => {
            setProgress(newProgress);
            
            // ✅ ADD THIS: Mark as downloaded when 100% complete (same as client)
            if (newProgress === 100) {
              try {
                await ApiService.completeDownload(movie.id);
                // Refresh to get truth from database
                loadMovies();
                toast.success(`"${movie.title}" downloaded successfully!`);
              } catch (error) {
                console.error('Failed to mark download as completed:', error);
              }
            }
          }
        );

      } catch (error: any) {
        console.error('Download error:', error);
        toast.error(error.message || 'Download failed. Please try again.');
      }
    };

    const handlePauseDownload = () => {
      downloadManager.pauseDownload(movie.id);
    };

    const handleResumeDownload = async () => {
      await downloadManager.resumeDownload(movie.id);
    };

    const handleCancelDownload = () => {
      downloadManager.cancelDownload(movie.id);
      setProgress(0);
      setDownloadStatus('idle');
    };

    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
        <div className="relative aspect-[3/4] flex-shrink-0">
          <img 
            src={movie.thumbnail_url} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm p-2">
              <Lock className="h-6 w-6 text-white mb-1" />
              <p className="text-white text-xs text-center">
                Download {moviesData?.totalLocalCount - (moviesData?.downloadedLocalCount || 0)} more local movies
              </p>
            </div>
          )}
          {movie.is_downloaded && (
            <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 text-xs capitalize">
            {movie.category}
          </Badge>
        </div>
        <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{movie.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{movie.description}</p>
          </div>
          
          {/* Download Progress */}
          {(isDownloading || isPaused) && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress)}%</span>
                <span>{isPaused ? 'Paused' : 'Downloading'}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{movie.downloads_count} downloads</span>
            
            {canDownload ? (
              <Button size="sm" onClick={handleDownload} className="h-7 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            ) : movie.is_downloaded ? (
              <Badge variant="secondary" className="text-xs">Downloaded</Badge>
            ) : isDownloading ? (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handlePauseDownload} className="h-7 px-2">
                  <Pause className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelDownload} className="h-7 px-2 text-xs">
                  Cancel
                </Button>
              </div>
            ) : isPaused ? (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handleResumeDownload} className="h-7 px-2">
                  <Play className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelDownload} className="h-7 px-2 text-xs">
                  Cancel
                </Button>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs">Locked</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!moviesData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading movies...</p>
        </div>
      </div>
    );
  }

  const localMovies = moviesData.movies.filter(m => m.category === 'local');
  const englishMovies = moviesData.movies.filter(m => m.category === 'english');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Film className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Agent Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden sm:inline">{currentUser?.fullName}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <Download className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Movies</CardTitle>
              <Film className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moviesData.movies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {moviesData.canAccessEnglish ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-orange-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {moviesData.canAccessEnglish ? 'Full Access' : `Download Local (${moviesData.downloadedLocalCount}/${moviesData.totalLocalCount})`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Movies */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Browse & Download Movies</h2>
          
          {!moviesData.canAccessEnglish && (
            <Card className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-300 mb-6">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-800">Download Local Movies First</h3>
                  <p className="text-sm text-orange-700">
                    You need to download all local movies first to unlock English movies.
                    Progress: {moviesData.downloadedLocalCount} of {moviesData.totalLocalCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="local">Local Movies ({localMovies.length})</TabsTrigger>
              <TabsTrigger 
                value="english" 
                disabled={!moviesData.canAccessEnglish}
              >
                English Movies ({englishMovies.length})
                {!moviesData.canAccessEnglish && (
                  <Lock className="h-3 w-3 ml-1" />
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="local" className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {localMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="english" className="mt-6">
              {!moviesData.canAccessEnglish ? (
                <Card className="text-center p-8">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">English Movies Locked</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to download all local movies first to unlock English movies.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Progress: {moviesData.downloadedLocalCount} of {moviesData.totalLocalCount} local movies downloaded
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {englishMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}