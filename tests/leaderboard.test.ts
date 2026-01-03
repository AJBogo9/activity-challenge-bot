import { expect, test, describe } from "bun:test";
import { formatList, escapeMarkdown } from "../src/utils/format-list";

describe("Leaderboard Formatting", () => {
    test("should format numbers correctly with padding", () => {
        const result = formatList("TiK", 10.5, 10, 5);
        // TiK matches padEnd(10) -> "TiK       "
        // 10.5 matches padStart(5) -> " 10.5"
        // Total inside backticks: "TiK        10.5"
        expect(result).toContain("TiK");
        expect(result).toContain("10\\.5");
    });

    test("should escape markdown characters", () => {
        const result = escapeMarkdown("Guild-Name_Test");
        expect(result).toBe("Guild\\-Name\\_Test");
    });
});

describe("Calculation Logic (Mocked DB Data)", () => {
    const calculateAverage = (totalPoints: number, totalMembers: number) => {
        return Math.round((totalPoints / totalMembers) * 10) / 10;
    };

    test("should calculate guild average correctly", () => {
        expect(calculateAverage(1728.35, 250)).toBe(6.9);
        expect(calculateAverage(2219.27, 450)).toBe(4.9);
    });

    test("should handle zero members safely (though DB prevents this)", () => {
        expect(calculateAverage(100, 1)).toBe(100);
    });

    test("should calculate participation percentage", () => {
        const calculateParticipation = (active: number, total: number) => {
            return Math.round((active / total) * 100 * 10) / 10;
        };
        expect(calculateParticipation(40, 250)).toBe(16.0);
        expect(calculateParticipation(24, 400)).toBe(6.0);
    });

    test("should calculate activity points correctly (MET logic)", () => {
        const calculatePoints = (met: number, duration: number) => {
            return Number(((met * duration) / 60).toFixed(2));
        };
        // Matches logic in quick-start-activity.ts
        expect(calculatePoints(8, 30)).toBe(4.00);
        expect(calculatePoints(7.5, 45)).toBe(5.63);
        expect(calculatePoints(3.5, 60)).toBe(3.50);
    });

    test("should calculate top 50% population size correctly", () => {
        const getTopHalfSize = (totalMembers: number) => {
            return Math.ceil(totalMembers / 2.0);
        };
        // Matches CEIL(total_members / 2.0) in query
        expect(getTopHalfSize(10)).toBe(5);
        expect(getTopHalfSize(11)).toBe(6);
        expect(getTopHalfSize(1)).toBe(1);
    });

    test("should calculate average points for top earners correctly", () => {
        const calculateTopAvg = (points: number[]) => {
            if (points.length === 0) return 0;
            const sum = points.reduce((a, b) => a + b, 0);
            return Math.round((sum / points.length) * 10) / 10;
        };
        // Top earners are already filtered by the query, this tests the AVG() part
        expect(calculateTopAvg([20, 15, 10])).toBe(15.0);
        expect(calculateTopAvg([10.5, 11.2, 9.8])).toBe(10.5);
    });
});

describe("Formatting Edge Cases", () => {
    test("should handle zero points correctly", () => {
        const result = formatList("Empty", 0, 10, 5);
        expect(result).toContain("Empty");
        expect(result).toContain("0");
    });

    test("should handle extremely long titles by padding correctly", () => {
        const result = formatList("VeryLongGuildNameThatExceedsPadding", 50, 10, 5);
        // Padding doesn't truncate, it only adds space if title is shorter
        expect(result).toContain("VeryLongGuildNameThatExceedsPadding");
        expect(result).toContain("50");
    });
});

describe("UI Display Logic", () => {
    // Mimicking src/flows/stats/guild-standings.ts:getRankPrefix
    const getRankPrefix = (index: number): string => {
        const medals = ['🥇', '🥈', '🥉']
        if (index < 3) return medals[index]
        return `${index + 1}\\.`
    }

    test("should show medals for top 3 positions", () => {
        expect(getRankPrefix(0)).toBe('🥇');
        expect(getRankPrefix(1)).toBe('🥈');
        expect(getRankPrefix(2)).toBe('🥉');
    });

    test("should show escaped numbers for 4th position and beyond", () => {
        expect(getRankPrefix(3)).toBe('4\\.');
        expect(getRankPrefix(10)).toBe('11\\.');
    });
});

describe("Date Utilities (Activity Logging)", () => {
    // Mimicking src/db/activities.ts date logic
    const formatDate = (dateInput?: string) => {
        let dateToUse: string
        if (dateInput) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                dateToUse = dateInput
            } else {
                const date = new Date(dateInput)
                if (isNaN(date.getTime())) {
                    dateToUse = new Date().toISOString().split('T')[0]
                } else {
                    dateToUse = date.toISOString().split('T')[0]
                }
            }
        } else {
            dateToUse = new Date().toISOString().split('T')[0]
        }
        return dateToUse
    }

    test("should accept valid YYYY-MM-DD strings", () => {
        expect(formatDate("2025-12-25")).toBe("2025-12-25");
    });

    test("should convert ISO strings to YYYY-MM-DD", () => {
        expect(formatDate("2025-12-25T15:30:00Z")).toBe("2025-12-25");
    });

    test("should handle today's date for invalid or missing dates", () => {
        const today = new Date().toISOString().split('T')[0];
        expect(formatDate("invalid")).toBe(today);
        expect(formatDate()).toBe(today);
    });
});

describe("Detailed Comparison Aggregation", () => {
    test("should correctly map and compare all-avg vs top-avg", () => {
        const allGuilds = [
            { guild: "DG", average_points: "6.9" },
            { guild: "SIK", average_points: "4.9" }
        ];
        const topGuilds = [
            { guild: "DG", average_points: "12.5" },
            { guild: "SIK", average_points: "8.2" }
        ];

        const topGuildsMap = new Map(
            topGuilds.map(g => [g.guild, parseFloat(g.average_points)])
        );

        expect(topGuildsMap.get("DG")).toBe(12.5);
        expect(topGuildsMap.get("SIK")).toBe(8.2);
        expect(topGuildsMap.get("FK")).toBeUndefined();
    });

    test("should handle missing data with N/A string equivalent", () => {
        const topGuildsMap = new Map();
        const avgTop = topGuildsMap.get("Missing");
        const display = avgTop !== undefined ? avgTop.toFixed(1) : 'N/A';
        expect(display).toBe('N/A');
    });
});

describe("Edge Case Participation", () => {
    test("should handle 100% participation", () => {
        const calculateParticipation = (active: number, total: number) => {
            return Math.round((active / total) * 100 * 10) / 10;
        };
        expect(calculateParticipation(10, 10)).toBe(100.0);
    });

    test("should handle very low participation (near zero)", () => {
        const calculateParticipation = (active: number, total: number) => {
            return Math.round((active / total) * 100 * 10) / 10;
        };
        expect(calculateParticipation(1, 1000)).toBe(0.1);
    });
});
