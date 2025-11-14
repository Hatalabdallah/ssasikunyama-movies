// Simple download manager for pause/resume functionality
interface DownloadItem {
  movieId: string;
  fileName: string;
  url: string;
  progress: number;
  status: 'downloading' | 'paused' | 'completed' | 'error';
  controller?: AbortController;
  receivedBytes: number;
  totalBytes: number;
}

class DownloadManager {
  private downloads: Map<string, DownloadItem> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // Save download state to localStorage
  private saveToStorage() {
    const downloadsArray = Array.from(this.downloads.entries());
    localStorage.setItem('activeDownloads', JSON.stringify(downloadsArray));
  }

  // Load download state from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('activeDownloads');
      if (stored) {
        const downloadsArray = JSON.parse(stored);
        this.downloads = new Map(downloadsArray);
        
        // Clear any downloads that were in progress (start fresh after refresh)
        this.downloads.forEach((download, movieId) => {
          if (download.status === 'downloading') {
            download.status = 'paused'; // Pause all ongoing downloads on refresh
            this.downloads.set(movieId, download);
          }
        });
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Failed to load downloads from storage:', error);
      localStorage.removeItem('activeDownloads');
    }
  }

  // Start or resume a download
  async startDownload(movieId: string, fileName: string, url: string, onProgress?: (progress: number) => void) {
    // If already downloading, resume it
    const existing = this.downloads.get(movieId);
    if (existing && existing.status === 'paused') {
      return this.resumeDownload(movieId);
    }

    // Create new download
    const controller = new AbortController();
    const downloadItem: DownloadItem = {
      movieId,
      fileName,
      url,
      progress: 0,
      status: 'downloading',
      controller,
      receivedBytes: 0,
      totalBytes: 0
    };

    this.downloads.set(movieId, downloadItem);
    this.saveToStorage(); // ADD THIS LINE
    await this.executeDownload(downloadItem, onProgress);
  }

  // Pause a download
  pauseDownload(movieId: string) {
    const download = this.downloads.get(movieId);
    if (download && download.status === 'downloading' && download.controller) {
      download.controller.abort();
      download.status = 'paused';
      this.downloads.set(movieId, download);
      this.saveToStorage(); // ADD THIS LINE
    }
  }

  // Resume a paused download
  async resumeDownload(movieId: string) {
    const download = this.downloads.get(movieId);
    if (download && download.status === 'paused') {
      download.status = 'downloading';
      download.controller = new AbortController();
      this.downloads.set(movieId, download);
      
      await this.executeDownload(download);
    }
  }

  // Cancel and remove a download
  cancelDownload(movieId: string) {
    const download = this.downloads.get(movieId);
    if (download && download.controller) {
      download.controller.abort();
    }
    this.downloads.delete(movieId);
    this.saveToStorage(); // ADD THIS LINE
  }

  // Get download status
  getDownloadStatus(movieId: string) {
    return this.downloads.get(movieId);
  }

  // Get all active downloads
  getAllDownloads() {
    return Array.from(this.downloads.values());
  }

  // Execute the actual download
  private async executeDownload(download: DownloadItem, onProgress?: (progress: number) => void) {
    try {
      const headers: HeadersInit = {};
      
      // If resuming, add Range header
      if (download.receivedBytes > 0) {
        headers['Range'] = `bytes=${download.receivedBytes}-`;
      }

      const response = await fetch(download.url, {
        headers,
        signal: download.controller?.signal
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }

      // Get total file size
      const contentLength = response.headers.get('content-length');
      const totalBytes = contentLength ? parseInt(contentLength) : 0;
      
      if (download.receivedBytes === 0) {
        download.totalBytes = totalBytes;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const chunks: Uint8Array[] = [];
      let received = download.receivedBytes;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        chunks.push(value);
        received += value.length;
        download.receivedBytes = received;

        // Update progress
        if (totalBytes > 0) {
          download.progress = (received / totalBytes) * 100;
          if (onProgress) {
            onProgress(download.progress);
          }
        }

        // Check if paused
        if (download.status === 'paused') {
          reader.releaseLock();
          return;
        }
      }

      // Download completed
      download.status = 'completed';
      download.progress = 100;

      // Create and save the file
      const blob = new Blob(chunks as BlobPart[]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = download.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Clean up
      this.downloads.delete(download.movieId);

    } catch (error: any) {
      if (error.name === 'AbortError') {
      } else {
        console.error('Download error:', error);
        download.status = 'error';
        this.downloads.set(download.movieId, download);
      }
    }
  }
}

export const downloadManager = new DownloadManager();