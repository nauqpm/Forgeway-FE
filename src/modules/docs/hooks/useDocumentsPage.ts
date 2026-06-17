import { useDocumentData } from "./useDocumentData";
import { useDocumentFilters } from "./useDocumentFilters";
import { useDocumentActions } from "./useDocumentActions";
import { useDocumentModals } from "./useDocumentModals";

export function useDocumentsPage() {
  const data = useDocumentData();
  const filters = useDocumentFilters(data.documents);
  const actions = useDocumentActions(data.refetch);
  const modals = useDocumentModals();

  return {
    ...data,
    ...filters,
    ...actions,
    ...modals,
  };
}

export type DocumentsPageProps = ReturnType<typeof useDocumentsPage>;
