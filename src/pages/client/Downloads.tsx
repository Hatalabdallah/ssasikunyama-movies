import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDownloads, getMovieById } from '@/lib/storage';
import { Download as DownloadType, Movie } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar } from 'lucide-react';

export default function Downloads() {
  const { currentUser } = useAuth();
  const [downloads, setDownloads] = useState<Array<DownloadType & { movie: Movie | undefined }>>([]);

  useEffect(() => {
    if (!currentUser) return;

    const userDownloads = getUserDownloads(currentUser.id);
    const downloadsWithMovies = userDownloads.map(download => ({
      ...download,
      movie: getMovieById(download.movieId)
    })).sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime());

    setDownloads(downloadsWithMovies);
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Download History</h1>
        <p className="text-muted-foreground">
          View all your downloaded movies
        </p>
      </div>

      {downloads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Download className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No downloads yet</h3>
            <p className="text-muted-foreground">
              Start downloading movies to see them here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {downloads.map((download) => {
            if (!download.movie) return null;
            
            return (
              <Card key={download.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className="flex gap-4 p-4">
                  <div className="relative w-32 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                    <img 
                      src={download.movie.thumbnail} 
                      alt={download.movie.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3 className="font-semibold text-lg">{download.movie.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {download.movie.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="capitalize">{download.movie.category}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(download.downloadedAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
