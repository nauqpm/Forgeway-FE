import { Sprint } from "../types/sprint.type";

export const MOCK_SPRINTS: Sprint[] = [
  {
    id: "s1",
    name: "Sprint 1",
    status: "Active",
    startDate: "2026-05-10",
    endDate: "2026-05-24",
    duration: "2 weeks",
    goal: "Hoàn thiện UI",
  },
  {
    id: "s2",
    name: "Sprint 2",
    status: "Planned",
    startDate: "2026-05-25",
    endDate: "2026-06-08",
    duration: "2 weeks",
    goal: "",
  },
];
