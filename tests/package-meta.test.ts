import { describe, expect, it } from "vitest";

import { readPackageVersion } from "../src/package-meta.js";

describe("readPackageVersion", () => {
  it("reads version from package.json", () => {
    expect(readPackageVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
