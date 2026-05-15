import { Sprint } from "../types/sprint.type";

interface SprintFormData {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
}

interface UseSprintHandlersProps {
  sprints: Sprint[];

  editingSprint: Sprint | null;

  setSprints: React.Dispatch<
    React.SetStateAction<Sprint[]>
  >;

  setEditingSprint: React.Dispatch<
    React.SetStateAction<Sprint | null>
  >;

  setIsSprintModalOpen: React.Dispatch<
    React.SetStateAction<boolean>
  >;
}

export const useSprintHandlers = ({
  sprints,
  editingSprint,
  setSprints,
  setEditingSprint,
  setIsSprintModalOpen,
}: UseSprintHandlersProps) => {
  const handleCreateSprint = () => {
    setEditingSprint(null);

    setIsSprintModalOpen(true);
  };

  const handleSaveSprint = (
    sprintData: SprintFormData
  ) => {
    // Edit sprint
    if (editingSprint) {
      setSprints(
        sprints.map((s) =>
          s.id === editingSprint.id
            ? {
                ...s,
                ...sprintData,
              }
            : s
        )
      );

      return;
    }

    // Create sprint
    const newSprint: Sprint = {
      id: `s${sprints.length + 1}`,
      status: "Planned",
      ...sprintData,
    };

    setSprints([...sprints, newSprint]);
  };

  return {
    handleCreateSprint,
    handleSaveSprint,
  };
};