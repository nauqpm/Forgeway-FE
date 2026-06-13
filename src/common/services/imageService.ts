import api from "@/lib/axiosIns";
import imageCompression from "browser-image-compression";

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

// Image compression support state
let imageCompressionSupported: boolean | null = null;

const isImageCompressionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  imageCompressionSupported =
    typeof window.File !== "undefined" &&
    typeof window.Blob !== "undefined" &&
    typeof window.FileReader !== "undefined" &&
    !!document.createElement("canvas").getContext;
  return imageCompressionSupported;
};

// Default image compression configuration
const compressionOptions = {
  maxSizeMB: 1, // Always limit to 1MB
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  preserveExif: true,
  initialQuality: 0.9, // Start with 90% quality
  alwaysKeepResolution: true,
  fileType: "image/jpeg",
};

type ImageApiEnvelope = {
  data?: ImageResponse;
};

const imageService = {
  normalizeImageResponse: (payload: unknown): ImageResponse => {
    const envelope = payload as ImageApiEnvelope;
    const image = envelope.data ?? (payload as ImageResponse);
    return {
      ...image,
      imageUrl: image.imageUrl || image.url || image.path || "",
    };
  },

  /**
   * Compress image before upload
   */
  compressImage: async (file: File, customOptions?: any): Promise<File> => {
    // Update image compression support state on each run
    const supported = isImageCompressionSupported();
    if (!supported) {
      console.warn("Device or browser does not support image compression. Returning original file.");
      return file;
    }

    try {
      // Check file size and type
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        console.warn("File is not an image:", file.type);
        return file;
      }

      // Only compress images larger than 1MB
      if (file.size <= 1024 * 1024) {
        console.log(
          "Image is already under 1MB; compression is not needed:",
          (file.size / 1024 / 1024).toFixed(2),
          "MB"
        );
        return file;
      }

      console.log(
        "Starting image compression:",
        file.name,
        "Original size:",
        (file.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      const options = {
        ...compressionOptions,
        ...customOptions,
        maxSizeMB: customOptions?.maxSizeMB || 1, // Allow maximum size adjustment
        initialQuality: customOptions?.initialQuality || 0.9, // Allow initial quality adjustment
      };

      let compressedFile;
      try {
        compressedFile = await imageCompression(file, options);
      } catch (compressError) {
        console.error("First image compression attempt failed. Retrying with lower quality:", compressError);
        // Retry with lower quality if the first attempt fails
        options.initialQuality = 0.7;
        compressedFile = await imageCompression(file, options);
      }

      // Check size after compression
      if (compressedFile.size > options.maxSizeMB * 1024 * 1024) {
        console.warn(
          "Image is still large after the first compression attempt. Trying a second attempt with lower quality"
        );
        // Try a second compression attempt with lower quality settings
        options.initialQuality = 0.5;
        options.maxWidthOrHeight = 1280; // Reduce image dimensions
        compressedFile = await imageCompression(compressedFile, options);
      }

      // Create a new file with the original name
      const newFile = new File([compressedFile], file.name, { type: "image/jpeg" });

      console.log(
        "Image compression complete:",
        "\nOriginal size:",
        (file.size / 1024 / 1024).toFixed(2),
        "MB",
        "\nCompressed size:",
        (newFile.size / 1024 / 1024).toFixed(2),
        "MB",
        "\nCompression ratio:",
        Math.round((1 - newFile.size / file.size) * 100) + "%",
        "\nFile type:",
        newFile.type
      );

      return newFile;
    } catch (error) {
      console.error("Error compressing image:", error);
      // If compression fails, return the original file with reduced size when possible
      try {
        // Try emergency compression with low quality and small dimensions
        const emergencyOptions = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1024,
          initialQuality: 0.4,
          useWebWorker: false,
        };

        const emergencyCompressed = await imageCompression(file, emergencyOptions);
        const emergencyFile = new File([emergencyCompressed], file.name, { type: "image/jpeg" });

        console.log("Emergency compression succeeded, new size:", (emergencyFile.size / 1024 / 1024).toFixed(2), "MB");
        return emergencyFile;
      } catch (emergencyError) {
        console.error("Could not compress image in emergency mode:", emergencyError);
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

      // Check file size after processing
      if (processedFile.size > 10 * 1024 * 1024) {
        // 10MB
        throw new Error("File size is too large (maximum 10MB)");
      }

      formData.append("file", processedFile);

      const response = await api.post("/imagesapi/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 30000, // 30 seconds timeout
      });

      return imageService.normalizeImageResponse(response.data);
    } catch (error: any) {
      console.error("Image upload error:", error.response?.data || error.message);
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
      throw new Error("You can upload up to 10 images at a time");
    }

    try {
      console.log(`Processing ${files.length} images...`);

      // Process files one at a time instead of in parallel
      const processedFiles = [];
      for (const file of files) {
        let processedFile = file;
        if (compress) {
          // Adjust compression settings based on image count to avoid overload
          const compressionLevel = files.length > 5 ? 0.7 : 0.9;
          const maxSizeMB = files.length > 5 ? 0.8 : 1;

          processedFile = await imageService.compressImage(file, {
            initialQuality: compressionLevel,
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: files.length > 5 ? 1600 : 1920,
          });
        }

        // Check size
        if (processedFile.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (maximum 10MB)`);
        }

        processedFiles.push(processedFile);
      }

      console.log(`Processed ${processedFiles.length} images, starting upload...`);

      // Split into small batches when there are many images
      const uploadResults = [];
      const chunkSize = 3; // Upload up to 3 images at a time

      for (let i = 0; i < processedFiles.length; i += chunkSize) {
        const chunk = processedFiles.slice(i, i + chunkSize);
        console.log(`Uploading image batch ${i / chunkSize + 1}/${Math.ceil(processedFiles.length / chunkSize)}...`);

        const formData = new FormData();
        chunk.forEach((file) => {
          formData.append("files", file);
        });

        const response = await api.post("/images/upload-multiple", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 60000, // 60 seconds
        });

        // Process server results
        let chunkResults;
        if (typeof response.data === "string") {
          try {
            chunkResults = JSON.parse(response.data);
          } catch (e) {
            console.error("Failed to parse response string as JSON:", e);
            throw new Error("Invalid response format from server");
          }
        } else {
          chunkResults = response.data;
        }

        // Ensure we have an array
        if (!Array.isArray(chunkResults)) {
          if (chunkResults && typeof chunkResults === "object" && Array.isArray(chunkResults.data)) {
            chunkResults = chunkResults.data;
          } else {
            console.error("Invalid response format:", chunkResults);
            throw new Error("Expected array of images but got: " + typeof chunkResults);
          }
        }

        // Process each result
        const processedChunkResults = chunkResults.map((img: any, index: number) => {
          // If img is a string, assume it is a URL
          if (typeof img === "string") {
            const pathOnly = img.replace(/^https?:\/\/[^\/]+/i, "");
            return {
              _id: `generated_${index}`,
              filename: `image_${index}.jpg`,
              path: pathOnly,
              url: pathOnly,
              size: 0,
              mimetype: "image/jpeg",
              slug: `image_${index}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }

          // If img is null or not an object, handle it as an error
          if (!img || typeof img !== "object") {
            console.error(`Image response ${index} is invalid:`, img);
            throw new Error(`Invalid image response at index ${index}`);
          }

          // Extract URL
          let url = null;
          if (img.url) url = img.url;
          else if (img.path) url = img.path;
          else if (img.location) url = img.location;
          else if (img.src) url = img.src;
          else if (img.data && img.data.url) url = img.data.url;

          if (!url || url === "undefined") {
            console.error(`No valid URL found in image response ${index}:`, img);
            throw new Error(`Missing URL in image response at index ${index}`);
          }

          // Ensure URL is a string and remove the domain part
          const urlString = String(url);
          const pathOnly = urlString.replace(/^https?:\/\/[^\/]+/i, "");

          // Return normalized object
          return {
            ...img,
            url: pathOnly,
            _id: img._id || `generated_${index}`,
            filename: img.filename || `image_${index}.jpg`,
            path: img.path || pathOnly,
            size: img.size || 0,
            mimetype: img.mimetype || "image/jpeg",
            slug: img.slug || `image_${index}`,
            createdAt: img.createdAt || new Date().toISOString(),
            updatedAt: img.updatedAt || new Date().toISOString(),
          };
        });

        uploadResults.push(...processedChunkResults);
      }

      console.log("All images uploaded successfully:", uploadResults.length);
      return uploadResults;
    } catch (error: any) {
      console.error("Image upload error:", error);

      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }

      error.imageData = {
        message: "Error processing image upload",
        error: error.message,
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
      // Compress image when requested
      const processedFile = compress ? await imageService.compressImage(file) : file;
      formData.append("file", processedFile);

      const response = await api.post("/images/sunEditor", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
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
    const response = await api.get("/images");
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

// Log image compression support state when initializing module (client-only)
if (typeof window !== "undefined") {
  if (!isImageCompressionSupported()) {
    console.log("Device or browser does not support image compression. Please update your browser.");
  } else {
    console.log("Device or browser supports image compression.");
  }
}

export default imageService;
