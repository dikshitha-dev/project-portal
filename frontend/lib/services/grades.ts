import { supabase } from "../supabase/client";
import type { Grade } from "@/types";

function calculateGradeLetter(total: number): string {
  if (total >= 90) return "A+";
  if (total >= 80) return "A";
  if (total >= 70) return "B";
  if (total >= 60) return "C";
  return "Needs Improvement";
}

export const gradesService = {
  async createOrUpdate(data: Record<string, unknown>): Promise<{ message: string; grade: Grade }> {
    const submissionId = data.submission_id as string;
    const ui = Number(data.ui || 0);
    const functionality = Number(data.functionality || 0);
    const github = Number(data.github || 0);
    const documentation = Number(data.documentation || 0);
    const innovation = Number(data.innovation || 0);
    const weeklyProgress = Number(data.weekly_progress || 0);
    const published = Boolean(data.published ?? false);

    const total = ui + functionality + github + documentation + innovation + weeklyProgress;
    const gradeLetter = calculateGradeLetter(total);

    const { data: existing } = await supabase
      .from("grades")
      .select("id")
      .eq("submission_id", submissionId)
      .single();

    let gradeObj;
    if (existing) {
      const { data: updated, error } = await supabase
        .from("grades")
        .update({
          ui,
          functionality,
          github,
          documentation,
          innovation,
          weekly_progress: weeklyProgress,
          total,
          grade: gradeLetter,
          published,
        })
        .eq("id", existing.id)
        .select("*, submission:submissions(*, week:weeks(*), user:profiles(*))")
        .single();
      if (error) throw error;
      gradeObj = updated;
    } else {
      const { data: inserted, error } = await supabase
        .from("grades")
        .insert({
          submission_id: submissionId,
          ui,
          functionality,
          github,
          documentation,
          innovation,
          weekly_progress: weeklyProgress,
          total,
          grade: gradeLetter,
          published,
        })
        .select("*, submission:submissions(*, week:weeks(*), user:profiles(*))")
        .single();
      if (error) throw error;
      gradeObj = inserted;
    }

    return { message: "Grade saved", grade: gradeObj as unknown as Grade };
  },

  async getBySubmission(submissionId: string): Promise<{ grade: Grade }> {
    const { data, error } = await supabase
      .from("grades")
      .select("*, submission:submissions(*, week:weeks(*), user:profiles(*))")
      .eq("submission_id", submissionId)
      .single();

    if (error || !data) throw new Error("Grade not found");
    return { grade: data as unknown as Grade };
  },

  async publish(submissionId: string): Promise<{ message: string; grade: Grade }> {
    const { data, error } = await supabase
      .from("grades")
      .update({ published: true })
      .eq("submission_id", submissionId)
      .select("*, submission:submissions(*, week:weeks(*), user:profiles(*))")
      .single();

    if (error || !data) throw new Error("Failed to publish grade");
    return { message: "Grade published", grade: data as unknown as Grade };
  },

  async getCandidateGrades(candidateId: string, projectId?: string): Promise<{ grades: Grade[] }> {
    let query = supabase
      .from("grades")
      .select("*, submission:submissions!inner(*, week:weeks!inner(*))")
      .eq("submission.user_id", candidateId);

    if (projectId) {
      query = query.eq("submission.week.project_id", projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { grades: (data || []) as unknown as Grade[] };
  },

  async getAll(): Promise<{ grades: Grade[] }> {
    const { data, error } = await supabase
      .from("grades")
      .select("*, submission:submissions(*, week:weeks(*), user:profiles(*))");

    if (error) throw error;
    return { grades: (data || []) as unknown as Grade[] };
  },

  async getCandidateStats(candidateId: string, projectId?: string) {
    const { grades } = await this.getCandidateGrades(candidateId, projectId);
    const published = grades.filter((g) => g.published);

    const weeklyScores = published.map((g) => ({
      week: g.submission_id,
      total: g.total,
      grade: g.grade,
    }));

    const totalScore = published.reduce((acc, curr) => acc + curr.total, 0);
    const avgScore = published.length ? totalScore / published.length : 0;

    return {
      weekly_scores: weeklyScores,
      average_score: Math.round(avgScore * 100) / 100,
      total_graded: published.length,
    };
  },

  async getOverviewStats() {
    const { data: candidates } = await supabase.from("profiles").select("id").eq("role", "candidate");
    const { data: subs } = await supabase.from("submissions").select("id");
    const { data: grades } = await supabase.from("grades").select("total").eq("published", true);

    const avg = grades && grades.length ? grades.reduce((a, b) => a + b.total, 0) / grades.length : 0;

    return {
      total_candidates: candidates?.length || 0,
      total_submissions: subs?.length || 0,
      pending_reviews: Math.max(0, (subs?.length || 0) - (grades?.length || 0)),
      average_grade: Math.round(avg * 100) / 100,
    };
  },
};
