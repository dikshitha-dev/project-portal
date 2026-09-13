import { supabase } from "../supabase/client";
import type { Annotation, Issue } from "@/types";

export const reviewsService = {
  async getAnnotations(imageId: string): Promise<{ annotations: Annotation[] }> {
    const { data, error } = await supabase
      .from("annotations")
      .select("*, issue:issues(*)")
      .eq("image_id", imageId);

    if (error) throw error;
    return { annotations: (data || []) as unknown as Annotation[] };
  },

  async createAnnotation(data: Record<string, unknown>): Promise<{ annotation: Annotation }> {
    const { data: ann, error } = await supabase
      .from("annotations")
      .insert({
        image_id: data.image_id,
        tool_type: data.tool_type,
        coordinates: data.coordinates,
        color: data.color || "#7C3AED",
        text: data.text || null,
      })
      .select("*, issue:issues(*)")
      .single();

    if (error) throw error;
    return { annotation: ann as unknown as Annotation };
  },

  async updateAnnotation(id: string, data: Record<string, unknown>): Promise<{ annotation: Annotation }> {
    const { data: ann, error } = await supabase
      .from("annotations")
      .update(data)
      .eq("id", id)
      .select("*, issue:issues(*)")
      .single();

    if (error) throw error;
    return { annotation: ann as unknown as Annotation };
  },

  async deleteAnnotation(id: string) {
    const { error } = await supabase.from("annotations").delete().eq("id", id);
    if (error) throw error;
    return { message: "Annotation deleted" };
  },

  async createIssue(data: Partial<Issue>): Promise<{ issue: Issue }> {
    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        annotation_id: data.annotation_id,
        title: data.title,
        description: data.description || null,
        priority: data.priority || "Medium",
        status: data.status || "To Do",
        reference_file_url: data.reference_file_url || null,
        mark_deduction: data.mark_deduction || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { issue: issue as Issue };
  },

  async updateIssue(id: string, data: Partial<Issue>): Promise<{ issue: Issue }> {
    const { data: issue, error } = await supabase
      .from("issues")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { issue: issue as Issue };
  },

  async deleteIssue(id: string) {
    const { error } = await supabase.from("issues").delete().eq("id", id);
    if (error) throw error;
    return { message: "Issue deleted" };
  },

  async getIssuesBySubmission(submissionId: string): Promise<{ issues: Issue[] }> {
    // Join review_files -> annotations -> issues
    const { data: rFiles } = await supabase.from("review_files").select("id").eq("submission_id", submissionId);
    const rfIds = (rFiles || []).map((rf) => rf.id);
    if (rfIds.length === 0) return { issues: [] };

    const { data: anns } = await supabase.from("annotations").select("id").in("image_id", rfIds);
    const annIds = (anns || []).map((a) => a.id);
    if (annIds.length === 0) return { issues: [] };

    const { data: issues, error } = await supabase.from("issues").select("*").in("annotation_id", annIds);
    if (error) throw error;

    return { issues: (issues || []) as Issue[] };
  },

  async getIssuesByCandidate(candidateId: string): Promise<{ issues: Issue[] }> {
    const { data: subs } = await supabase.from("submissions").select("id").eq("user_id", candidateId);
    const subIds = (subs || []).map((s) => s.id);
    if (subIds.length === 0) return { issues: [] };

    const { data: rFiles } = await supabase.from("review_files").select("id").in("submission_id", subIds);
    const rfIds = (rFiles || []).map((rf) => rf.id);
    if (rfIds.length === 0) return { issues: [] };

    const { data: anns } = await supabase.from("annotations").select("id").in("image_id", rfIds);
    const annIds = (anns || []).map((a) => a.id);
    if (annIds.length === 0) return { issues: [] };

    const { data: issues, error } = await supabase.from("issues").select("*").in("annotation_id", annIds);
    if (error) throw error;

    return { issues: (issues || []) as Issue[] };
  },
};
