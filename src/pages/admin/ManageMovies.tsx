import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Download, Upload, Pause, Play, Image, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api';

interface Movie {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  file_key: string;
  file_size: number;
  file_type: string;
  downloads_count: number;
  uploaded_at: string;
  uploaded_by_name: string;
  subscription_plan_ids: string[];
  is_active: boolean;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'ready' | 'uploading' | 'paused' | 'completed' | 'error'; // ADD 'ready'
  uploadId?: string;
  fileKey?: string;
  uploadedParts?: Array<{ ETag: string; PartNumber: number }>;
  uploadedChunks?: number[];
  totalChunks?: number;
  isResuming?: boolean;
}

export default function ManageMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'local',
    subscriptionPlanIds: [] as string[],
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const uploadControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    loadMovies();
    loadPlans();
  }, []);

  const loadMovies = async () => {
    try {
      const result = await ApiService.getAllMovies();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setMovies(result.data?.movies || []);
    } catch (error) {
      toast.error('Failed to load movies');
    }
  };

  const loadPlans = async () => {
    try {
      const result = await ApiService.getPlans();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setPlans(result.data?.map((p: any) => ({ id: p.id.toString(), name: p.name })) || []);
    } catch (error) {
      toast.error('Failed to load plans');
    }
  };

  // Support all video formats
  const videoFormats = [
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo',
    'video/x-matroska', 'video/x-ms-wmv', 'video/x-flv', 'video/webm',
    'video/mpeg', 'video/dvd'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file size (max 4GB) and type
    const validFiles = files.filter(file => {
      if (file.size > 4 * 1024 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 4GB.`);
        return false;
      }
      
      if (!videoFormats.some(format => file.type.includes(format.replace('video/', '')) || 
          file.name.toLowerCase().endsWith('.mp4') ||
          file.name.toLowerCase().endsWith('.avi') ||
          file.name.toLowerCase().endsWith('.mov') ||
          file.name.toLowerCase().endsWith('.mkv') ||
          file.name.toLowerCase().endsWith('.wmv') ||
          file.name.toLowerCase().endsWith('.flv') ||
          file.name.toLowerCase().endsWith('.webm') ||
          file.name.toLowerCase().endsWith('.mpeg') ||
          file.name.toLowerCase().endsWith('.vob'))) {
        toast.error(`File ${file.name} is not a supported video format.`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // SIMPLE: Just add files as "ready" - no automatic status checking
    setUploadProgress(prev => [
      ...prev,
      ...validFiles.map(file => ({
        file,
        progress: 0,
        status: 'ready' as const, // NEW: Start as 'ready' not 'paused'
        uploadedParts: [],
        uploadedChunks: []
      }))
    ]);
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file for thumbnail');
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadThumbnail = async (): Promise<string> => {
    if (!thumbnailFile) {
      throw new Error('No thumbnail file selected');
    }

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const result = await ApiService.uploadThumbnail({
            fileName: thumbnailFile.name,
            fileData: e.target?.result as string
          });
          
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          
          resolve(result.data!.thumbnailUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(thumbnailFile);
    });
  };

  const uploadFile = async (file: File, onProgress: (progress: number) => void) => {
    const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // Create abort controller for this upload
    const controller = new AbortController();
    uploadControllers.current.set(file.name, controller);

    try {
      // Start or resume multipart upload
      const startResult = await ApiService.startUpload({
        fileName: file.name,
        fileType: file.type || 'video/mp4', // Default to mp4 if type not detected
        fileSize: file.size
      });

      if (startResult.error) throw new Error(startResult.error);

      const { uploadId, fileKey, isResume, uploadedChunks = [] } = startResult.data!;
      
      // Update progress with upload info
      setUploadProgress(prev => prev.map(item => 
        item.file === file ? { 
          ...item, 
          uploadId, 
          fileKey, 
          status: 'uploading',
          uploadedChunks,
          totalChunks,
          isResuming: isResume
        } : item
      ));

      const parts = [];
      const existingChunks = new Set(uploadedChunks);
      
      // Upload each chunk (skip already uploaded chunks)
      for (let i = 0; i < totalChunks; i++) {
        // Check if upload was paused
        const currentProgress = uploadProgress.find(item => item.file === file);
        if (currentProgress?.status === 'paused') {
          throw new Error('Upload paused by user');
        }

        // Skip already uploaded chunks when resuming
        if (existingChunks.has(i + 1)) {
          continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        // Get upload URL for this chunk
        const urlResult = await ApiService.getUploadUrl({
          fileKey: fileKey!,
          uploadId: uploadId!,
          partNumber: i + 1
        });

        if (urlResult.error) throw new Error(urlResult.error);

        // Upload chunk with abort signal
        const uploadResponse = await fetch(urlResult.data!.uploadUrl, {
          method: 'PUT',
          body: chunk,
          signal: controller.signal
        });

        if (!uploadResponse.ok) throw new Error('Chunk upload failed');

        const etag = uploadResponse.headers.get('ETag');
        if (!etag) throw new Error('No ETag received');

        parts.push({
          ETag: etag,
          PartNumber: i + 1
        });

        // Update progress and track uploaded chunks
        const progress = ((i + 1) / totalChunks) * 100;
        onProgress(progress);
        
        setUploadProgress(prev => prev.map(item => 
          item.file === file ? { 
            ...item, 
            progress,
            uploadedChunks: [...(item.uploadedChunks || []), i + 1]
          } : item
        ));
      }

      // Upload thumbnail first
      let thumbnailUrl = '';
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }

      // Complete upload
      const completeResult = await ApiService.completeUpload({
        fileKey: fileKey!,
        uploadId: uploadId!,
        parts,
        movieData: {
          ...formData,
          thumbnailUrl,
          fileSize: file.size,
          fileName: file.name,
          subscriptionPlanIds: formData.subscriptionPlanIds
        }
      });

      if (completeResult.error) throw new Error(completeResult.error);

      // Update progress to completed
      setUploadProgress(prev => prev.map(item => 
        item.file === file ? { ...item, progress: 100, status: 'completed' } : item
      ));

      toast.success(`Movie "${formData.title}" uploaded successfully! It will be visible after activation.`);
      loadMovies();

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload paused by user') {
        // Pause is normal, don't show error
        setUploadProgress(prev => prev.map(item => 
          item.file === file ? { ...item, status: 'paused' } : item
        ));
      } else {
        console.error('Upload error:', error);
        setUploadProgress(prev => prev.map(item => 
          item.file === file ? { ...item, status: 'error' } : item
        ));
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    } finally {
      uploadControllers.current.delete(file.name);
    }
  };

  const pauseUpload = async (file: File) => {
    const progressItem = uploadProgress.find(item => item.file === file);
    if (!progressItem?.fileKey) return;

    // Abort current upload
    const controller = uploadControllers.current.get(file.name);
    if (controller) {
      controller.abort();
    }

    // Update status to paused
    setUploadProgress(prev => prev.map(item => 
      item.file === file ? { ...item, status: 'paused' } : item
    ));

    // Notify backend about pause
    try {
      await ApiService.pauseUpload({ fileKey: progressItem.fileKey });
    } catch (error) {
      console.error('Error pausing upload:', error);
    }

    toast.info(`Upload paused for ${file.name}`);
  };

  const resumeUpload = async (file: File) => {
    setUploadProgress(prev => prev.map(item => 
      item.file === file ? { ...item, status: 'uploading' } : item
    ));

    await uploadFile(file, (progress) => {
      setUploadProgress(prev => prev.map(item => 
        item.file === file ? { ...item, progress } : item
      ));
    });
  };

  const startAllUploads = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!formData.title) {
      toast.error('Please enter movie title');
      return;
    }

    if (!thumbnailFile) {
      toast.error('Please select a thumbnail image');
      return;
    }

    if (formData.subscriptionPlanIds.length === 0) {
      toast.error('Please select at least one subscription plan');
      return;
    }

    setUploading(true);

    // Start uploading each READY or PAUSED file
    for (const file of selectedFiles) {
      const progressItem = uploadProgress.find(item => item.file === file);
      if (progressItem && (progressItem.status === 'ready' || progressItem.status === 'paused')) {
        await resumeUpload(file);
      }
    }

    setUploading(false);
  };

  const togglePlan = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      subscriptionPlanIds: prev.subscriptionPlanIds.includes(planId)
        ? prev.subscriptionPlanIds.filter(id => id !== planId)
        : [...prev.subscriptionPlanIds, planId]
    }));
  };

  const removeFile = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
    setUploadProgress(prev => prev.filter(item => item.file !== file));
    
    // Abort any ongoing upload
    const controller = uploadControllers.current.get(file.name);
    if (controller) {
      controller.abort();
      uploadControllers.current.delete(file.name);
    }
  };

  const toggleMovieActivation = async (movieId: string, isActive: boolean) => {
    try {
      const result = await ApiService.toggleMovieActivation(movieId, isActive);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setMovies(prev => prev.map(movie => 
        movie.id === movieId ? { ...movie, is_active: isActive } : movie
      ));

      toast.success(result.data!.message);
    } catch (error) {
      toast.error('Failed to update movie status');
    }
  };

  const deleteMovie = async (movieId: string) => {
    try {
      // Add this to your ApiService in api.ts first
      const result = await ApiService.deleteMovie(movieId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setMovies(prev => prev.filter(movie => movie.id !== movieId));
      toast.success('Movie deleted successfully');
    } catch (error) {
      toast.error('Failed to delete movie');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetUploadForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'local',
      subscriptionPlanIds: [],
    });
    setSelectedFiles([]);
    setUploadProgress([]);
    setThumbnailFile(null);
    setThumbnailPreview('');
    
    // Abort all ongoing uploads
    uploadControllers.current.forEach(controller => controller.abort());
    uploadControllers.current.clear();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Movies</h1>
          <p className="text-muted-foreground">Upload and manage movies</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetUploadForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Movies
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload New Movies</DialogTitle>
              <DialogDescription>
                Upload multiple movies at once. Supports all video formats with manual pause/resume control.
              </DialogDescription>
            </DialogHeader>

            {/* Movie Details Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Movie Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter movie title"
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter movie description"
                />
              </div> */}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local (Kinauganda)</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="hidden"
                    id="thumbnail"
                  />
                  <Label htmlFor="thumbnail" className="cursor-pointer">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                      {thumbnailPreview ? (
                        <div className="space-y-2">
                          <img src={thumbnailPreview} alt="Thumbnail preview" className="w-32 h-32 object-cover mx-auto rounded" />
                          <p className="text-sm text-muted-foreground">Click to change thumbnail</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="font-medium">Click to select thumbnail</p>
                          <p className="text-sm text-muted-foreground">Supports JPG, PNG, WebP</p>
                        </div>
                      )}
                    </div>
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subscription Plans *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={plan.id}
                        checked={formData.subscriptionPlanIds.includes(plan.id)}
                        onCheckedChange={() => togglePlan(plan.id)}
                      />
                      <label htmlFor={plan.id} className="text-sm cursor-pointer">
                        {plan.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <Label>Select Movie Files *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    multiple
                    accept=".mp4,.avi,.mov,.mkv,.wmv,.flv,.webm,.mpeg,.vob,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="movie-files"
                  />
                  <Label htmlFor="movie-files" className="cursor-pointer">
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Click to select files</p>
                        <p className="text-sm text-muted-foreground">
                          Supports MP4, AVI, MOV, MKV, WMV, FLV, WebM, MPEG, VOB (up to 4GB each)
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
                      {selectedFiles.map((file, index) => {
                        const progressItem = uploadProgress.find(item => item.file === file);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {progressItem?.status || 'ready'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {/* Only show pause button when uploading */}
                              {progressItem?.status === 'uploading' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => pauseUpload(file)}
                                  disabled={uploading}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Show play button when ready or paused */}
                              {(progressItem?.status === 'ready' || progressItem?.status === 'paused') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resumeUpload(file)}
                                  disabled={uploading}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(file)}
                                disabled={uploading && progressItem?.status === 'uploading'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Upload Progress */}
                {uploadProgress.map((item, index) => (
                  <div key={index} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)} • {item.status}
                          {item.isResuming && ' • Resumed'}
                        </p>
                      </div>
                      <Badge variant={
                        item.status === 'completed' ? 'default' :
                        item.status === 'error' ? 'destructive' :
                        item.status === 'uploading' ? 'secondary' : 'outline'
                      }>
                        {Math.round(item.progress)}%
                      </Badge>
                    </div>
                    <Progress value={item.progress} className="h-2" />
                  </div>
                ))}

                {/* Upload Button */}
                {selectedFiles.length > 0 && (
                  <Button 
                    onClick={startAllUploads} 
                    disabled={uploading || !formData.title || !thumbnailFile || formData.subscriptionPlanIds.length === 0}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Start Upload ({selectedFiles.length} files)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Movies Grid */}
      <div className="grid gap-4">
        {movies.map((movie) => (
          <Card key={movie.id} className={!movie.is_active ? 'opacity-60' : ''}>
            <div className="flex gap-4 p-4">
              <div className="w-32 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                <img src={movie.thumbnail_url} alt={movie.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{movie.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{movie.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={movie.is_active}
                        onCheckedChange={(checked) => toggleMovieActivation(movie.id, checked)}
                      />
                      {movie.is_active ? (
                        <Power className="h-4 w-4 text-green-500" />
                      ) : (
                        <PowerOff className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    {/* ADD DELETE BUTTON */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{movie.title}"? This action cannot be undone and will remove the movie from storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMovie(movie.id)} className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Badge variant={movie.is_active ? 'default' : 'secondary'}>
                      {movie.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="capitalize">{movie.category}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {movie.downloads_count}
                  </Badge>
                  <Badge variant="secondary">
                    {formatFileSize(movie.file_size)}
                  </Badge>
                  <Badge variant="outline">
                    {movie.file_type?.toUpperCase() || 'MP4'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Uploaded by {movie.uploaded_by_name} • {new Date(movie.uploaded_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  Plans: {movie.subscription_plan_ids.map(id => 
                    plans.find(p => p.id === id.toString())?.name
                  ).filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}