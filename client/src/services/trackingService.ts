import { trackUserAction } from '../utils/actionTracker';

export class TrackingService {
  static async trackFileUpload(files: File[]) {
    try {
      await trackUserAction({
        type: 'quicksign',
        data: {
          action: 'files_uploaded',
          file_count: files.length,
          total_size: files.reduce((sum, file) => sum + file.size, 0),
          file_names: files.map(f => f.name),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track file upload action:', error);
    }
  }

  static async trackProcessStart(fileCount: number) {
    try {
      await trackUserAction({
        type: 'quicksign',
        data: {
          action: 'process_started',
          file_count: fileCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track process start:', error);
    }
  }

  static async trackProcessComplete(fileCount: number, successCount: number, errorCount: number, processingTime: number) {
    try {
      await trackUserAction({
        type: 'quicksign',
        data: {
          action: 'process_completed',
          file_count: fileCount,
          success_count: successCount,
          error_count: errorCount,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track process completion:', error);
    }
  }

  static async trackProcessError(fileCount: number, error: string, processingTime: number) {
    try {
      await trackUserAction({
        type: 'quicksign',
        data: {
          action: 'process_error',
          file_count: fileCount,
          error_message: error,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track process error:', error);
    }
  }

  static async trackDownload(fileCount: number, successCount: number) {
    try {
      await trackUserAction({
        type: 'quicksign',
        data: {
          action: 'results_downloaded',
          file_count: fileCount,
          success_count: successCount,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to track download action:', error);
    }
  }
}