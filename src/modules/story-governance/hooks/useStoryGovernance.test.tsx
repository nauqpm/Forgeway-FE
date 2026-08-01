import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStoryDecisions } from "./useStoryGovernance";

const service = vi.hoisted(() => ({
  createDecisionProposal: vi.fn(),
  updateDecisionProposal: vi.fn(),
  approveDecisionProposal: vi.fn(),
  supersedeDecision: vi.fn(),
}));

vi.mock("../services/storyGovernance.service", () => ({
  storyGovernanceService: service,
}));

describe("useStoryDecisions invalidation", () => {
  beforeEach(() => {
    service.createDecisionProposal.mockResolvedValue({});
    service.updateDecisionProposal.mockResolvedValue({});
    service.approveDecisionProposal.mockResolvedValue({});
    service.supersedeDecision.mockResolvedValue({});
  });

  it("refreshes Draft authority for every mutation and Versions after supersede", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => useStoryDecisions("ws", "sc", false), { wrapper });
    const draftKey = JSON.stringify(["story-governance", "ws", "contracts", "sc", "drafts"]);
    const versionsKey = JSON.stringify(["story-governance", "ws", "contracts", "sc", "versions"]);
    const invalidatedKeys = () => invalidate.mock.calls.map(([options]) => JSON.stringify(options?.queryKey));

    await act(() => result.current.createProposal.mutateAsync({ question: "Q?", options: [{ key: "yes", label: "Yes" }] }));
    expect(invalidatedKeys()).toContain(draftKey);
    expect(invalidatedKeys()).not.toContain(versionsKey);
    invalidate.mockClear();

    await act(() => result.current.updateProposal.mutateAsync({ proposalId: "proposal", input: { question: "Q?", options: [{ key: "yes", label: "Yes" }] } }));
    expect(invalidatedKeys()).toContain(draftKey);
    expect(invalidatedKeys()).not.toContain(versionsKey);
    invalidate.mockClear();

    await act(() => result.current.approveProposal.mutateAsync({ proposalId: "proposal", input: { selectedOption: "yes", rationale: "Approved" } }));
    expect(invalidatedKeys()).toContain(draftKey);
    expect(invalidatedKeys()).not.toContain(versionsKey);
    invalidate.mockClear();

    await act(() => result.current.supersedeDecision.mutateAsync({ decisionId: "decision", input: { selectedOption: "yes", rationale: "Updated" } }));
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([draftKey, versionsKey]));
  });
});
