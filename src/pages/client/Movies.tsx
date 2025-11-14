import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Download, Lock, Check, AlertCircle, Pause, Play } from 'lucide-react';
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

export default function Movies() {
  const { currentUser, updateUser } = useAuth();
  const [moviesData, setMoviesData] = useState<MoviesResponse | null>(null);
  const [downloadingMovies, setDownloadingMovies] = useState<Set<string>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});
  const [displayCount, setDisplayCount] = useState(20);
  const observerTarget = useRef(null);

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
    } catch (error) {
      toast.error('Failed to load movies');
    }
  };

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + 20);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [loadMore]);

  const handleDownload = async (movie: Movie) => {
    if (!currentUser || !moviesData) return;

    // Check subscription
    if (!moviesData.hasActiveSubscription) {
      toast.error('Please subscribe to download movies');
      return;
    }

    // Check if already downloaded
    if (movie.is_downloaded) {
      toast.info('You have already downloaded this movie');
      return;
    }

    // Check Luganda-first rule
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
    const canDownload = moviesData?.hasActiveSubscription && !isLocked && !movie.is_downloaded && !isDownloading && !isPaused;

    const handleDownload = async () => {
      if (!currentUser || !moviesData) return;

      // Check subscription
      if (!moviesData.hasActiveSubscription) {
        toast.error('Please subscribe to download movies');
        return;
      }

      // Check if already downloaded
      if (movie.is_downloaded) {
        toast.info('You have already downloaded this movie');
        return;
      }
      

      // Check Luganda-first rule
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
        
        // Start download with manager
        await downloadManager.startDownload(
          movie.id,
          `${movie.title}.mp4`,
          downloadUrl,
          async (newProgress) => {
            setProgress(newProgress);
            
            // TRUTH: Only mark as downloaded when 100% complete
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
      <Card className="group overflow-hidden hover:shadow-lg transition-all">
        <div className="relative aspect-[3/4]">
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
            <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1.5">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
          <Badge className="absolute top-2 right-2 text-xs capitalize">
            {movie.category}
          </Badge>
        </div>
        <CardContent className="p-3 space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1">{movie.title}</h3>
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
            ) : isLocked ? (
              <Badge variant="outline" className="text-xs">Locked</Badge>
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
              <Badge variant="outline" className="text-xs">Subscribe</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!moviesData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Browse Movies</h1>
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      </div>
    );
  }

  const localMovies = moviesData.movies.filter(m => m.category === 'local');
  const englishMovies = moviesData.movies.filter(m => m.category === 'english');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Browse Movies</h1>
        <p className="text-muted-foreground">
          {moviesData.hasActiveSubscription 
            ? moviesData.canAccessEnglish 
              ? 'You have full access to all movies'
              : `Download all local movies to unlock English movies (${moviesData.downloadedLocalCount}/${moviesData.totalLocalCount})`
            : 'Subscribe to start downloading movies'}
        </p>
      </div>

      {!moviesData.hasActiveSubscription && (
        <Card className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-300">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-800">Subscription Required</h3>
              <p className="text-sm text-orange-700">
                You need an active subscription to download movies. Choose a plan that works for you.
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
            disabled={!moviesData.canAccessEnglish && !moviesData.hasActiveSubscription}
          >
            English Movies ({englishMovies.length})
            {!moviesData.canAccessEnglish && moviesData.hasActiveSubscription && (
              <Lock className="h-3 w-3 ml-1" />
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="local" className="mt-6">
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {localMovies.slice(0, displayCount).map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
          {displayCount < localMovies.length && (
            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="english" className="mt-6">
          {!moviesData.canAccessEnglish && moviesData.hasActiveSubscription ? (
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {englishMovies.slice(0, displayCount).map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
          {displayCount < englishMovies.length && (
            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-4">
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}