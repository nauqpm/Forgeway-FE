import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal, ModalFooter } from "./Modal";

afterEach(cleanup);

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

  it("closes only the topmost modal on Escape", () => {
    const closeParent = vi.fn();
    const closeChild = vi.fn();

    render(
      <Modal open onClose={closeParent} title="Parent modal">
        <Modal open onClose={closeChild} title="Child modal">
          Child content
        </Modal>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(closeChild).toHaveBeenCalledOnce();
    expect(closeParent).not.toHaveBeenCalled();
  });

  it("keeps Tab focus handling inside only the topmost modal", () => {
    render(
      <Modal open onClose={vi.fn()} title="Parent modal" hideCloseButton>
        <button type="button">Parent first</button>
        <Modal open onClose={vi.fn()} title="Child modal" hideCloseButton>
          <button type="button">Child first</button>
          <button type="button">Child last</button>
        </Modal>
      </Modal>,
    );

    const parentFirst = screen.getByRole("button", { name: "Parent first" });
    const childFirst = screen.getByRole("button", { name: "Child first" });
    const childLast = screen.getByRole("button", { name: "Child last" });
    const parentFocus = vi.spyOn(parentFirst, "focus");

    childLast.focus();
    fireEvent.keyDown(document, { key: "Tab" });

    expect(childFirst).toHaveFocus();
    expect(parentFocus).not.toHaveBeenCalled();
  });
});

describe("Modal accessible naming", () => {
  it("gives nested dialog titles and descriptions unique referenced ids", () => {
    render(
      <Modal
        open
        onClose={vi.fn()}
        title="Parent modal"
        description="Parent description"
      >
        <Modal
          open
          onClose={vi.fn()}
          title="Child modal"
          description="Child description"
        >
          Child content
        </Modal>
      </Modal>,
    );

    const parent = screen.getByRole("dialog", { name: "Parent modal" });
    const child = screen.getByRole("dialog", { name: "Child modal" });
    const parentTitleId = parent.getAttribute("aria-labelledby");
    const childTitleId = child.getAttribute("aria-labelledby");
    const parentDescriptionId = parent.getAttribute("aria-describedby");
    const childDescriptionId = child.getAttribute("aria-describedby");

    expect(parentTitleId).toBeTruthy();
    expect(childTitleId).toBeTruthy();
    expect(parentTitleId).not.toBe(childTitleId);
    expect(parentDescriptionId).toBeTruthy();
    expect(childDescriptionId).toBeTruthy();
    expect(parentDescriptionId).not.toBe(childDescriptionId);
    expect(document.getElementById(parentDescriptionId!)).toHaveTextContent("Parent description");
    expect(document.getElementById(childDescriptionId!)).toHaveTextContent("Child description");
  });
});

describe("ModalFooter", () => {
  it("keeps the confirm label as its accessible name while loading", () => {
    render(
      <ModalFooter
        onConfirm={vi.fn()}
        confirmLabel="Create requirement"
        loading
      />,
    );

    expect(
      screen.getByRole("button", { name: "Create requirement" }),
    ).toBeDisabled();
  });
});
