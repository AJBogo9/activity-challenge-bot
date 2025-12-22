// import { describe, expect, test } from "bun:test";
// import validateTeamName from "../../src/utils/validate-team-name";

// describe("validateTeamName", () => {
//     test("should accept valid team names", () => {
//         const validNames = [
//             "Team A",
//             "Team-B",
//             "Team_C",
//             "Valid123",
//             "A-Simple-Team"
//         ];

//         validNames.forEach(name => {
//             const result = validateTeamName(name);
//             expect(result.isValid).toBe(true);
//             expect(result.reason).toBeUndefined();
//         });
//     });

//     test("should reject empty names", () => {
//         const result = validateTeamName("");
//         expect(result.isValid).toBe(false);
//         expect(result.reason).toBeDefined();
//     });

//     test("should reject names that are too long", () => {
//         const longName = "ThisTeamNameIsWayTooLongForTheValidationRule";
//         const result = validateTeamName(longName);
//         expect(result.isValid).toBe(false);
//         expect(result.reason).toBeDefined();
//     });

//     test("should reject names with invalid characters", () => {
//         const invalidNames = [
//             "Team$",
//             "Team!",
//             "Team@",
//             "Team#",
//             "Team%",
//             "Team^",
//             "Team&",
//             "Team*"
//         ];

//         invalidNames.forEach(name => {
//             const result = validateTeamName(name);
//             expect(result.isValid).toBe(false);
//             expect(result.reason).toBeDefined();
//         });
//     });
// });