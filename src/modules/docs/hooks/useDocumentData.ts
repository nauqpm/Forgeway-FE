import { useQuery } from "@tanstack/react-query";
import { documentService } from "../services/documentService";

export const DOCUMENTS_QUERY_KEY = ["documents", "mine"];

export function useDocumentData() {
  const { data: documents = [], isLoading, error, refetch } = useQuery({
    queryKey: DOCUMENTS_QUERY_KEY,
    queryFn: documentService.listMine,
  });

  return { documents, isLoading, error, refetch };
}
