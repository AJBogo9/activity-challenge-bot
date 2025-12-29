import { sql } from "./index";

export interface FeedbackData {
  userId: number; // users.id (not telegram_id)
  easeOfUse?: number; // 1-5
  usefulness?: number; // 1-5
  overallSatisfaction?: number; // 1-5
  textFeedback: string;
}

export interface Feedback extends FeedbackData {
  id: number;
  createdAt: Date;
  reviewed: boolean;
}

/**
 * Save user feedback to the database
 */
export async function saveFeedback(data: FeedbackData): Promise<number> {
  const result = await sql<{ id: number }[]>`
    INSERT INTO feedback 
      (user_id, ease_of_use, usefulness, overall_satisfaction, text_feedback)
    VALUES (
      ${data.userId},
      ${data.easeOfUse ?? null},
      ${data.usefulness ?? null},
      ${data.overallSatisfaction ?? null},
      ${data.textFeedback}
    )
    RETURNING id
  `;

  return result[0].id;
}