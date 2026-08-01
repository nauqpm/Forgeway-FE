import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal, ModalFooter } from "./Modal";

describe("Modal focus containment", () => {
  it("moves initial focus inside when the consumer does not manage focus", async () => {
    render(
      <Modal open onClose={vi.fn()} title="Confirm action" hideCloseButton>
        <button type="button">First action</button>
      </Modal>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "First action" })).toHaveFocus());
  });

  it("cycles Shift+Tab from focused body content to the last control and Tab back to the first", () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Confirm action"
        hideCloseButton
        footer={<ModalFooter onCancel={vi.fn()} onConfirm={vi.fn()} />}
      >
        <p tabIndex={-1}>Review this action</p>
      </Modal>,
    );

    const body = screen.getByText("Review this action");
    const cancel = screen.getByRole("button", { name: "Cancel" });
    const confirm = screen.getByRole("button", { name: "Confirm" });

    body.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab" });
    expect(cancel).toHaveFocus();
  });
});
