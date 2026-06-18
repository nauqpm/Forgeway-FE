export type TaskCoverSource = "system" | "system-gradient" | "unsplash" | "upload" | string;

export type TaskColorCover = {
  type: "color";
  color: string;
  source?: TaskCoverSource;
};

export type TaskImageCover = {
  type: "image";
  imageUrl: string;
  source?: TaskCoverSource;
};

export type TaskCover = TaskColorCover | TaskImageCover;

export type UpdateTaskCoverPayload = TaskCover;

export type UpdateTaskCoverResponse = {
  message?: string;
  cover: TaskCover | null;
};

export const isImageCover = (cover?: TaskCover | null): cover is TaskImageCover =>
  cover?.type === "image" && Boolean(cover.imageUrl);
