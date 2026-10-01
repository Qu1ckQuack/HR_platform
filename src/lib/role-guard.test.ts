import assert from "node:assert/strict";

import { isHrRole } from "./role-guard";

assert.equal(isHrRole("hr"), true);
assert.equal(isHrRole("super_admin"), true);
assert.equal(isHrRole("user"), false);
assert.equal(isHrRole(""), false);

console.log("role guard checks passed");
