import { expect, test, describe } from "bun:test";
import { getRankPrefix, escapeMarkdown } from "../src/utils";

describe("Ranking Utilities", () => {
    test("should return medals for top 3 rankings", () => {
        expect(getRankPrefix(1)).toBe('🥇');
        expect(getRankPrefix(2)).toBe('🥈');
        expect(getRankPrefix(3)).toBe('🥉');
    });

    test("should return escaped number for other rankings", () => {
        expect(getRankPrefix(4)).toBe('4\\.');
        expect(getRankPrefix(10)).toBe('10\\.');
    });

    test("should handle string numbers via parseInt in the flow", () => {
        // This mimics the flow where parseInt is used
        expect(getRankPrefix(parseInt("1"))).toBe('🥇');
        expect(getRankPrefix(parseInt("5"))).toBe('5\\.');
    });
});

describe("Markdown Escaping (Review)", () => {
    test("should escape special characters including dots", () => {
        expect(escapeMarkdown("User.Name")).toBe("User\\.Name");
        expect(escapeMarkdown("Guild_Name")).toBe("Guild\\_Name");
        expect(escapeMarkdown("10.5")).toBe("10\\.5");
    });
});
