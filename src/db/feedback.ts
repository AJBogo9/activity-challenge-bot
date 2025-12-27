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

/**
 * Get all feedback (for admin use)
 */
export async function getAllFeedback(limit = 50): Promise<Feedback[]> {
  const result = await sql<Feedback[]>`
    SELECT 
      id,
      user_id as "userId",
      ease_of_use as "easeOfUse",
      usefulness,
      overall_satisfaction as "overallSatisfaction",
      text_feedback as "textFeedback",
      created_at as "createdAt",
      reviewed
    FROM feedback
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return result;
}

/**
 * Get feedback from a specific user
 */
export async function getUserFeedback(userId: number): Promise<Feedback[]> {
  const result = await sql<Feedback[]>`
    SELECT 
      id,
      user_id as "userId",
      ease_of_use as "easeOfUse",
      usefulness,
      overall_satisfaction as "overallSatisfaction",
      text_feedback as "textFeedback",
      created_at as "createdAt",
      reviewed
    FROM feedback
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return result;
}

/**
 * Mark feedback as reviewed
 */
export async function markFeedbackAsReviewed(feedbackId: number): Promise<void> {
  await sql`
    UPDATE feedback SET reviewed = TRUE WHERE id = ${feedbackId}
  `;
}

/**
 * Get unreviewed feedback count
 */
export async function getUnreviewedCount(): Promise<number> {
  const result = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count FROM feedback WHERE reviewed = FALSE
  `;

  return parseInt(result[0].count);
}