import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input, Select, Textarea } from "./Input";

afterEach(cleanup);

describe("shared field labels", () => {
  it("associates generated ids with Input, Textarea, and Select labels", () => {
    render(
      <>
        <Input label="Title" />
        <Textarea label="Description" />
        <Select label="Status">
          <option>Open</option>
        </Select>
      </>,
    );

    expect(screen.getByLabelText("Title")).toHaveAttribute("id");
    expect(screen.getByLabelText("Description")).toHaveAttribute("id");
    expect(screen.getByLabelText("Status")).toHaveAttribute("id");
  });

  it("preserves a caller-provided id", () => {
    render(<Input id="story-title" label="Title" />);

    expect(screen.getByLabelText("Title")).toHaveAttribute("id", "story-title");
  });
});
