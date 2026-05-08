// // src/modules/categories-post/hooks/useCategoriesPost.ts

// import { useQuery } from "@tanstack/react-query";
// import {
//   getCategories,
//   getAllCategories,
//   PaginatedCategories,
// } from "../services/categories-post.service";
// import {
//   CategoryPost,
//   CategoryPostTree,
// } from "../models/categories-post.model";

// /**
//  * 🔍 Hook phân trang lấy categories-post
//  */
// export const usePaginatedCategories = (
//   page: number = 1,
//   limit: number = 10
// ) => {
//   return useQuery<PaginatedCategories>({
//     queryKey: ["category-posts", page, limit],
//     queryFn: () => getCategories(page, limit),
//     keepPreviousData: true,
//     staleTime: 1000 * 60 * 2, // cache 2 phút
//   });
// };

// /**
//  * ✨ Hook lấy trọn vẹn all categories-post (flat list)
//  */
// export const useAllCategories = () => {
//   return useQuery<CategoryPost[]>({
//     queryKey: ["all-category-posts"],
//     queryFn: async () => {
//       const res = await getAllCategories();
//       return res.data; // lấy mảng CategoryPost[]
//     },
//     staleTime: 1000 * 60 * 5,
//   });
// };

// /**
//  * 🌳 Hook lấy cây danh mục:
//  * mỗi node: CategoryPostTree { _id, name, slug, parent, children }
//  */
// export const useCategoryTree = () => {
//   return useQuery<CategoryPostTree[]>({
//     queryKey: ["category-post-tree"],
//     queryFn: async () => {
//       const res = await getAllCategories();
//       const flat = res.data;

//       // khởi tạo bản đồ id → node
//       const map = new Map<string, CategoryPostTree>();
//       flat.forEach((cat) => {
//         map.set(cat._id, {
//           ...cat,
//           parent: cat.parent ?? null, // ép undefined → null
//           children: [],
//         });
//       });

//       // xây tree
//       const roots: CategoryPostTree[] = [];
//       map.forEach((node) => {
//         if (node.parent) {
//           const parentNode = map.get(node.parent);
//           if (parentNode) {
//             parentNode.children.push(node);
//           } else {
//             roots.push(node);
//           }
//         } else {
//           roots.push(node);
//         }
//       });

//       return roots;
//     },
//     staleTime: 1000 * 60 * 5,
//   });
// };
//
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getCategories,
  getAllCategories,
} from "../services/categories-post.service";
import {
  CategoryPost,
  CategoryPostTree,
} from "../models/categories-post.model";

/**
 * Kiểu trả về của getCategories(page, limit)
 */
interface PaginatedCategories {
  data: CategoryPost[];
  total: number;
}

/**
 * 🔍 Hook phân trang lấy categories-post
 */
export const usePaginatedCategories = (
  page: number = 1,
  limit: number = 10
) => {
  return useQuery<PaginatedCategories, Error>({
    queryKey: ["category-posts", page, limit],
    queryFn: () => getCategories(page, limit),
    staleTime: 1000 * 60 * 2, // cache 2 phút
    placeholderData: keepPreviousData, // “ôm” data cũ khi page thay đổi
  });
};

/**
 * ✨ Hook lấy toàn bộ danh mục (flat list)
 */
export const useAllCategories = () => {
  return useQuery<CategoryPost[], Error>({
    queryKey: ["all-category-posts"],
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 5, // cache 5 phút
  });
};

/**
 * 🌳 Hook build cây danh mục CategoryPostTree
 */
export const useCategoryTree = () => {
  return useQuery<CategoryPostTree[], Error>({
    queryKey: ["category-post-tree"],
    queryFn: async () => {
      const flat: CategoryPost[] = await getAllCategories();

      // Khởi map để build tree
      const map = new Map<string, CategoryPostTree>();
      flat.forEach((cat) =>
        map.set(cat._id, {
          ...cat,
          parent: cat.parent ?? null,
          level: cat.level ?? 0,
          children: [],
        })
      );

      // Ghép cây & tìm roots
      const roots: CategoryPostTree[] = [];
      map.forEach((node) => {
        if (node.parent) {
          const parentNode = map.get(node.parent);
          if (parentNode) parentNode.children.push(node);
          else roots.push(node);
        } else {
          roots.push(node);
        }
      });

      return roots;
    },
    staleTime: 1000 * 60 * 5, // cache 5 phút
  });
};
