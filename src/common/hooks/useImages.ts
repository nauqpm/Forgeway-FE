'use client'

import { useState } from 'react';
import imageService, { ImageResponse } from '../services/imageService';

export const useImages = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageResponse[]>([]);

  /**
   * Upload a single image
   */
  const uploadImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageService.uploadImage(file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload multiple images
   */
  const uploadMultipleImages = async (files: File[]) => {
    setLoading(true);
    setError(null);

    try {
      const results = await imageService.uploadMultipleImages(files);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload images');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Upload an image for the editor
   */
  const uploadEditorImage = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageService.uploadEditorImage(file);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload editor image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all images
   */
  const fetchAllImages = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await imageService.getAllImages();
      setImages(results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an image by slug
   */
  const deleteImage = async (slug: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageService.deleteImage(slug);
      // Update the images list after deletion
      setImages(images.filter(img => img.slug !== slug));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    images,
    uploadImage,
    uploadMultipleImages,
    uploadEditorImage,
    fetchAllImages,
    deleteImage,
  };
};