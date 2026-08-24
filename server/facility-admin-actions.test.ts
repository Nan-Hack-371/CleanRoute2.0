import { describe, expect, it, vi } from "vitest";
import { FacilityAdminActions } from "../client/src/components/FacilityAdminActions";

describe("selected-facility administrator actions", () => {
  it("hides official controls from normal users and wires polished responsive administrator actions", () => {
    const openFieldCheck = vi.fn();
    expect(FacilityAdminActions({ isAdmin: false, facilityId: "khopoli-rail", onPerformFieldCheck: openFieldCheck })).toBeNull();

    const element = FacilityAdminActions({ isAdmin: true, facilityId: "khopoli rail", onPerformFieldCheck: openFieldCheck }) as any;
    const actionRow = element.props.children[1];
    const [fieldCheckButton, editButton] = actionRow.props.children;

    fieldCheckButton.props.onClick();
    expect(openFieldCheck).toHaveBeenCalledTimes(1);
    expect(editButton.props.children.props.href).toBe("/admin/toilets?edit=khopoli%20rail");
    expect(actionRow.props.className).toContain("sm:grid-cols-2");
    expect(actionRow.props.className).toContain("min-w-0");
    expect(fieldCheckButton.props.className).toContain("h-11");
    expect(fieldCheckButton.props.className).toContain("w-full");
    expect(editButton.props.className).toContain("h-11");
    expect(editButton.props.className).toContain("w-full");
  });
});
