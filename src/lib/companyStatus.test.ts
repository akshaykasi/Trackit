import { describe, expect, it } from "vitest";
import { adjacentStatus, STATUS_ORDER } from "./companyStatus";

describe("adjacentStatus", () => {
  it("steps through the pipeline in order", () => {
    for (let i = 0; i < STATUS_ORDER.length - 1; i++) {
      expect(adjacentStatus(STATUS_ORDER[i]).next).toBe(STATUS_ORDER[i + 1]);
      expect(adjacentStatus(STATUS_ORDER[i + 1]).prev).toBe(STATUS_ORDER[i]);
    }
  });
  it("has no neighbours at the edges", () => {
    expect(adjacentStatus("wishlist").prev).toBeNull();
    expect(adjacentStatus("rejected").next).toBeNull();
  });
});
