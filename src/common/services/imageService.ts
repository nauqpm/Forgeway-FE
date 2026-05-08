import api from '@/config/api';
import imageCompression from 'browser-image-compression';

export interface ImageResponse {
  _id: string;
  filename: string;
  path: string;
  url: string;
  imageUrl: string;
  size: number;
  mimetype: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  originalName?: string;
  alt?: string;
  caption?: string;
}

// Biến trạng thái hỗ trợ nén ảnh
let imageCompressionSupported: boolean | null = null;

const isImageCompressionSupported = (): boolean => {
  // Đánh giá lại mỗi lần gọi để đảm bảo trạng thái mới nhất
  imageCompressionSupported =
    typeof window.File !== "undefined" &&
    typeof window.Blob !== "undefined" &&
    typeof window.FileReader !== "undefined" &&
    !!document.createElement("canvas").getContext;
  return imageCompressionSupported;
};

// Cấu hình mặc định cho việc nén ảnh
const compressionOptions = {
  maxSizeMB: 1, // Luôn giới hạn ở 1MB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: true,
  initialQuality: 0.9, // Bắt đầu với chất lượng 90%
  alwaysKeepResolution: true,
  fileType: 'image/jpeg',
};

const imageService = {
  /**
   * Nén ảnh trước khi upload
   */
  compressImage: async (file: File, customOptions?: any): Promise<File> => {
    // Cập nhật trạng thái hỗ trợ nén ảnh mỗi lần chạy
    const supported = isImageCompressionSupported();
    if (!supported) {
      console.warn("Thiết bị hoặc trình duyệt không hỗ trợ nén ảnh. Trả về file gốc.");
      return file;
    }

    try {
      // Kiểm tra kích thước và loại file
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        console.warn('File không phải là ảnh:', file.type);
        return file;
      }

      // Chỉ nén khi ảnh > 1MB
      if (file.size <= 1024 * 1024) {
        console.log('Ảnh đã nhỏ hơn 1MB, không cần nén:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        return file;
      }

      console.log('Bắt đầu nén ảnh:', file.name, 'Kích thước gốc:', (file.size / 1024 / 1024).toFixed(2), 'MB');

      const options = {
        ...compressionOptions,
        ...customOptions,
        maxSizeMB: customOptions?.maxSizeMB || 1, // Cho phép điều chỉnh kích thước tối đa
        initialQuality: customOptions?.initialQuality || 0.9 // Cho phép điều chỉnh chất lượng ban đầu
      };

      let compressedFile;
      try {
        compressedFile = await imageCompression(file, options);
      } catch (compressError) {
        console.error('Lỗi khi nén ảnh lần đầu, thử lại với chất lượng thấp hơn:', compressError);
        // Thử lại với chất lượng thấp hơn nếu lần đầu thất bại
        options.initialQuality = 0.7;
        compressedFile = await imageCompression(file, options);
      }

      // Kiểm tra kích thước sau khi nén
      if (compressedFile.size > options.maxSizeMB * 1024 * 1024) {
        console.warn('Ảnh vẫn lớn sau khi nén lần đầu, thử nén lần hai với chất lượng thấp hơn');
        // Thử nén lần thứ hai với cài đặt chất lượng thấp hơn
        options.initialQuality = 0.5;
        options.maxWidthOrHeight = 1280; // Giảm kích thước ảnh
        compressedFile = await imageCompression(compressedFile, options);
      }

      // Tạo file mới với tên gốc
      const newFile = new File(
        [compressedFile],
        file.name,
        { type: 'image/jpeg' }
      );

      console.log(
        'Nén ảnh hoàn tất:',
        '\nKích thước gốc:', (file.size / 1024 / 1024).toFixed(2), 'MB',
        '\nKích thước sau nén:', (newFile.size / 1024 / 1024).toFixed(2), 'MB',
        '\nTỷ lệ nén:', Math.round((1 - newFile.size / file.size) * 100) + '%',
        '\nLoại file:', newFile.type
      );

      return newFile;
    } catch (error) {
      console.error('Lỗi khi nén ảnh:', error);
      // Nếu có lỗi khi nén, trả về file gốc với kích thước giảm nếu có thể
      try {
        // Thử nén với cài đặt khẩn cấp (chất lượng thấp, kích thước nhỏ)
        const emergencyOptions = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1024,
          initialQuality: 0.4,
          useWebWorker: false,
        };

        const emergencyCompressed = await imageCompression(file, emergencyOptions);
        const emergencyFile = new File([emergencyCompressed], file.name, { type: 'image/jpeg' });

        console.log('Nén khẩn cấp thành công, kích thước mới:', (emergencyFile.size / 1024 / 1024).toFixed(2), 'MB');
        return emergencyFile;
      } catch (emergencyError) {
        console.error('Không thể nén ảnh trong chế độ khẩn cấp:', emergencyError);
        return file;
      }
    }
  },

  /**
   * Upload a single image file
   */
  uploadImage: async (file: File, compress: boolean = true): Promise<ImageResponse> => {
    const formData = new FormData();

    try {
      let processedFile = file;
      if (compress) {
        processedFile = await imageService.compressImage(file);
      }

      // Kiểm tra kích thước file sau khi xử lý
      if (processedFile.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Kích thước file quá lớn (tối đa 10MB)');
      }

      formData.append('file', processedFile);

      const response = await api.post('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      console.error("Lỗi upload ảnh:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Upload multiple image files (up to 10)
   */
  uploadMultipleImages: async (files: File[], compress: boolean = true): Promise<ImageResponse[]> => {
    if (!files.length) {
      return [];
    }

    if (files.length > 10) {
      throw new Error('Chỉ có thể upload tối đa 10 ảnh một lần');
    }

    try {
      console.log(`Đang xử lý ${files.length} ảnh...`);

      // Xử lý từng file một thay vì song song
      const processedFiles = [];
      for (const file of files) {
        let processedFile = file;
        if (compress) {
          // Điều chỉnh thông số nén ảnh dựa trên số lượng ảnh để tránh quá tải
          const compressionLevel = files.length > 5 ? 0.7 : 0.9;
          const maxSizeMB = files.length > 5 ? 0.8 : 1;

          processedFile = await imageService.compressImage(file, {
            initialQuality: compressionLevel,
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: files.length > 5 ? 1600 : 1920
          });
        }

        // Kiểm tra kích thước
        if (processedFile.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} quá lớn (tối đa 10MB)`);
        }

        processedFiles.push(processedFile);
      }

      console.log(`Đã xử lý ${processedFiles.length} ảnh, bắt đầu tải lên...`);

      // Chia thành các nhóm nhỏ nếu có nhiều ảnh
      const uploadResults = [];
      const chunkSize = 3; // Tải lên tối đa 3 ảnh mỗi lần

      for (let i = 0; i < processedFiles.length; i += chunkSize) {
        const chunk = processedFiles.slice(i, i + chunkSize);
        console.log(`Đang tải lên nhóm ảnh ${i / chunkSize + 1}/${Math.ceil(processedFiles.length / chunkSize)}...`);

        const formData = new FormData();
        chunk.forEach(file => {
          formData.append('files', file);
        });

        const response = await api.post('/images/upload-multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 60000, // 60 seconds
        });

        // Xử lý kết quả từ server
        let chunkResults;
        if (typeof response.data === 'string') {
          try {
            chunkResults = JSON.parse(response.data);
          } catch (e) {
            console.error("Failed to parse response string as JSON:", e);
            throw new Error("Invalid response format from server");
          }
        } else {
          chunkResults = response.data;
        }

        // Đảm bảo chúng ta có một mảng
        if (!Array.isArray(chunkResults)) {
          if (chunkResults && typeof chunkResults === 'object' && Array.isArray(chunkResults.data)) {
            chunkResults = chunkResults.data;
          } else {
            console.error("Invalid response format:", chunkResults);
            throw new Error("Expected array of images but got: " + typeof chunkResults);
          }
        }

        // Xử lý từng kết quả
        const processedChunkResults = chunkResults.map((img: any, index: number) => {
          // Nếu img là chuỗi, giả định đó là URL
          if (typeof img === 'string') {
            const pathOnly = img.replace(/^https?:\/\/[^\/]+/i, '');
            return {
              _id: `generated_${index}`,
              filename: `image_${index}.jpg`,
              path: pathOnly,
              url: pathOnly,
              size: 0,
              mimetype: 'image/jpeg',
              slug: `image_${index}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }

          // Nếu img là null hoặc không phải đối tượng, xử lý lỗi
          if (!img || typeof img !== 'object') {
            console.error(`Image response ${index} is invalid:`, img);
            throw new Error(`Invalid image response at index ${index}`);
          }

          // Trích xuất URL
          let url = null;
          if (img.url) url = img.url;
          else if (img.path) url = img.path;
          else if (img.location) url = img.location;
          else if (img.src) url = img.src;
          else if (img.data && img.data.url) url = img.data.url;

          if (!url || url === 'undefined') {
            console.error(`No valid URL found in image response ${index}:`, img);
            throw new Error(`Missing URL in image response at index ${index}`);
          }

          // Đảm bảo URL là chuỗi và loại bỏ phần domain
          const urlString = String(url);
          const pathOnly = urlString.replace(/^https?:\/\/[^\/]+/i, '');

          // Trả về đối tượng chuẩn hóa
          return {
            ...img,
            url: pathOnly,
            _id: img._id || `generated_${index}`,
            filename: img.filename || `image_${index}.jpg`,
            path: img.path || pathOnly,
            size: img.size || 0,
            mimetype: img.mimetype || 'image/jpeg',
            slug: img.slug || `image_${index}`,
            createdAt: img.createdAt || new Date().toISOString(),
            updatedAt: img.updatedAt || new Date().toISOString()
          };
        });

        uploadResults.push(...processedChunkResults);
      }

      console.log("Tất cả ảnh đã được tải lên thành công:", uploadResults.length);
      return uploadResults;
    } catch (error: any) {
      console.error('Lỗi upload ảnh:', error);

      if (error.response) {
        console.error('Chi tiết lỗi:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }

      error.imageData = {
        message: "Lỗi khi xử lý upload ảnh",
        error: error.message
      };

      throw error;
    }
  },

  /**
   * Upload an image for the SunEditor
   */
  uploadEditorImage: async (file: File, compress: boolean = true): Promise<ImageResponse> => {
    const formData = new FormData();

    try {
      // Nén ảnh nếu được yêu cầu
      const processedFile = compress ? await imageService.compressImage(file) : file;
      formData.append('file', processedFile);

      const response = await api.post('/images/sunEditor', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("Error uploading editor image:", error);
      throw error;
    }
  },

  /**
   * Get all images
   */
  getAllImages: async (): Promise<ImageResponse[]> => {
    const response = await api.get('/images');
    return response.data;
  },

  /**
   * Delete an image by slug
   */
  deleteImage: async (slug: string): Promise<any> => {
    const response = await api.delete(`/images/${slug}`);
    return response.data;
  },
};

// In ra trạng thái hỗ trợ nén ảnh khi khởi tạo module
if (!isImageCompressionSupported()) {
  console.log("Thiết bị hoặc trình duyệt không hỗ trợ nén ảnh. Hãy cập nhật trình duyệt.");
} else {
  console.log("Thiết bị hoặc trình duyệt hỗ trợ nén ảnh.");
}

export default imageService;