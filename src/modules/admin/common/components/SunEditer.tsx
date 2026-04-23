import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";
import { FormatTagName } from "suneditor/src/options";
import { useEffect, useRef, useState } from "react";
import { useImages } from "@/common/hooks/useImages";
import { ImageResponse } from "@/common/services/imageService";

// Define the SunEditor response type
interface SunEditorResponse {
  result: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}

declare module "suneditor-react" {
  interface SunEditorEventProps {
    onImageRemove?: (
      targetImg: HTMLImageElement,
      index: number,
      imageList: HTMLImageElement[],
      done: () => void
    ) => void | Promise<void>;
  }
}

const EDITOR_CONFIG = {
  buttonList: [
    [
      "undo",
      "redo",
      "bold",
      "italic",
      "underline",
      "strike",
      "subscript",
      "superscript",
      "font",
      "fontSize",
      "formatBlock",
      "paragraphStyle",
      "blockquote",
      "align",
      "list",
      "lineHeight",
      "horizontalRule",
      "table",
      "link",
      "image",
      "video",
      "audio",
      "fullScreen",
      "showBlocks",
      "codeView",
      "preview",
      "print",
      "removeFormat",
    ],
  ],
  defaultStyle: "position: relative;",
  height: "300px",
  minHeight: "200px",
  maxHeight: "500px",
  width: "100%",
  placeholder: "Nhập nội dung...",
  charCounter: true,
  charCounterLabel: "Ký tự: ",
  imageAccept: ".jpg, .jpeg, .png, .gif",
  videoAccept: ".mp4, .webm",
  audioAccept: ".mp3, .wav",
  imageDeleteConfirm: true,
  // imageUploadSizeLimit: 5242880, // 5MB
  videoUploadSizeLimit: 52428800, // 50MB
  audioUploadSizeLimit: 5242880, // 5MB
  resizingBar: true,
  stickyToolbar: 80,
  showPathLabel: true,
  formats: ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6"],
  colorList: [
    "#ff0000",
    "#ff5e00",
    "#ffe400",
    "#abf200",
    "#00d8ff",
    "#0055ff",
    "#6600ff",
    "#ff00dd",
    "#000000",
    "#ffd8d8",
    "#fae0d4",
    "#faf4c0",
    "#e4f7ba",
    "#d4f4fa",
    "#d9e5ff",
    "#e8d9ff",
    "#ffd9fa",
    "#ffffff",
  ],
  // Add custom styles for h1, h2, h3 with font-weight 500
  styleTags: {
    h1: {
      fontWeight: "500",
    },
    h2: {
      fontWeight: "500",
    },
    h3: {
      fontWeight: "500",
    },
  },
};

interface ImageInfo {
  url: string;
  slug: string;
}

export default function SunEditer({
  postData,
  setPostData,
}: {
  postData: string;
  setPostData: (value: string) => void;
}) {
  const [imageList, setImageList] = useState<ImageInfo[]>([]);
  const editorRef = useRef<any>(null);
  const prevContentRef = useRef<string>(postData);
  const { uploadEditorImage, deleteImage } = useImages();

  // Initialize image list on component mount
  useEffect(() => {
    // Extract initial images from postData
    const initialImages = extractImagesFromContent(postData);
    setImageList(initialImages);
    prevContentRef.current = postData;
  }, []);

  // Extract image information from content
  const extractImagesFromContent = (content: string): ImageInfo[] => {
    if (!content) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const images = Array.from(doc.querySelectorAll("img"));

    return images.map((img) => {
      const url = img.getAttribute("src") || "";

      // Extract the filename from the URL path
      const urlParts = url.split("/");
      const filename = urlParts[urlParts.length - 1];

      // In our system, the backend manages the slug, but for frontend tracking,
      // we'll use the filename as an identifier for now
      const slug = filename;

      return { url, slug };
    });
  };

  // Update image list when content changes
  useEffect(() => {
    if (postData !== prevContentRef.current) {
      const currentImages = extractImagesFromContent(postData);
      const previousImages = imageList;

      // Find removed images by comparing previous and current lists
      const removedImages = previousImages.filter(
        (prevImg) =>
          !currentImages.some((currImg) => currImg.url === prevImg.url)
      );

      // Delete removed images via API
      removedImages.forEach(async (img) => {
        try {
          console.log("Deleting removed image:", img);
          await deleteImage(img.slug);
        } catch (error) {
          console.error("Failed to delete image:", error);
        }
      });

      // Update the image list
      setImageList(currentImages);
      prevContentRef.current = postData;
    }
  }, [postData, deleteImage, imageList]);

  const handleImageUploadBefore = (
    files: File[],
    info: Record<string, any>,
    uploadHandler: Function
  ) => {
    if (!files || files.length === 0) return false;

    try {
      // Use the uploadEditorImage method from useImages hook
      uploadEditorImage(files[0])
        .then((response) => {
          try {
            console.log("Upload response:", response);

            // Safety check
            if (!response) {
              throw new Error("Upload failed - empty response");
            }

            // Initialize variables with safe defaults
            let imageUrl = "";
            let slug = `img-${Date.now()}`;

            // Case 1: Response is a string
            if (typeof response === "string") {
              imageUrl = response;
              try {
                const parts = String(response).split("/");
                if (parts.length > 0) {
                  slug = parts[parts.length - 1] || slug;
                }
              } catch (err) {
                console.warn("Error extracting slug from string URL:", err);
              }
            }
            // Case 2: Response is an object
            else if (response && typeof response === "object") {
              // Try to extract URL from various possible formats
              if (
                "result" in response &&
                Array.isArray((response as any).result)
              ) {
                // SunEditor format
                const resultItem = (response as any).result[0];
                if (resultItem && resultItem.url) {
                  imageUrl = resultItem.url;
                }
              } else if ("url" in response) {
                // Standard format with url property
                imageUrl = (response as any).url;
              } else if ("imageUrl" in response) {
                // Format with imageUrl property
                imageUrl = (response as any).imageUrl;
              } else if ("path" in response) {
                // Format with path property
                imageUrl = (response as any).path;
              } else if ("location" in response) {
                // Format with location property
                imageUrl = (response as any).location;
              }

              // Try to get slug from response or generate from URL
              if ("slug" in response) {
                slug = (response as any).slug;
              } else if (imageUrl) {
                try {
                  const parts = String(imageUrl).split("/");
                  if (parts.length > 0) {
                    slug = parts[parts.length - 1] || slug;
                  }
                } catch (err) {
                  console.warn("Error extracting slug from URL:", err);
                }
              }
            }

            // Final validation
            if (!imageUrl) {
              throw new Error("Could not extract image URL from response");
            }

            console.log("Final extracted values:", { imageUrl, slug });

            // Add to our tracking list
            setImageList((prev) => [...prev, { url: imageUrl, slug }]);

            // Pass the result to SunEditor in the expected format
            uploadHandler({
              result: [
                {
                  url: imageUrl,
                  name: files[0].name,
                  size: files[0].size,
                },
              ],
            });
          } catch (err) {
            console.error("Error processing upload response:", err);
            uploadHandler({
              errorMessage: err instanceof Error ? err.message : String(err),
            });
          }
        })
        .catch((error) => {
          console.error(
            "Error uploading image:",
            error instanceof Error ? error.message : String(error)
          );
          uploadHandler({
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        });
    } catch (outerError) {
      console.error("Unexpected error in upload handler:", outerError);
      uploadHandler({
        errorMessage:
          outerError instanceof Error ? outerError.message : String(outerError),
      });
    }

    return false;
  };

  const handleImageUpload = async (
    targetElement: HTMLImageElement,
    index: number,
    state: string,
    imageInfo: any
  ) => {
    if (state === "delete") {
      try {
        // Get URL from possible sources
        const url =
          imageInfo?.image?.src || targetElement?.src || imageInfo?.src;

        if (!url) {
          console.error("Cannot find image URL to delete");
          return;
        }

        console.log("Found image URL to delete:", url);

        // Parse image information
        const urlParts = url.split("/");
        const filename = urlParts[urlParts.length - 1];

        // Find the image in our tracking list to get the correct slug
        const imageToDelete = imageList.find((img) => img.url === url);

        if (!imageToDelete) {
          console.error("Cannot find image in tracking list:", url);
          return;
        }

        console.log(
          "Attempting to delete image with slug:",
          imageToDelete.slug
        );

        // Remove from our tracking list
        setImageList((prev) => prev.filter((img) => img.url !== url));

        // Delete from server using the slug via useImages hook
        await deleteImage(imageToDelete.slug);
      } catch (error) {
        console.error(
          "Error in delete handler:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  };

  // Store editor instance when it's ready
  const handleGetInstance = (sunEditor: any) => {
    editorRef.current = sunEditor;
  };

  return (
    <div>
      <SunEditor
        getSunEditorInstance={handleGetInstance}
        setContents={postData}
        onChange={(c) => setPostData(c)}
        onImageUploadBefore={handleImageUploadBefore}
        onImageUpload={handleImageUpload}
        height="500px"
        setOptions={{
          ...EDITOR_CONFIG,
          formats: [
            "p",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
          ] as FormatTagName[],
        }}
      />
    </div>
  );
}
