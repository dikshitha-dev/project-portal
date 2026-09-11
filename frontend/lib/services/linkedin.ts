import { supabase } from "../supabase/client";
import { storageService } from "./storage";
import type { PostSubmission } from "@/types";

export const linkedinService = {
  async candidateGetSubmissions(): Promise<{ submissions: PostSubmission[] }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");

    const { data, error } = await supabase
      .from("post_submissions")
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { submissions: (data || []) as unknown as PostSubmission[] };
  },

  async getSubmission(id: string): Promise<{ submission: PostSubmission }> {
    const { data, error } = await supabase
      .from("post_submissions")
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Post submission not found");
    return { submission: data as unknown as PostSubmission };
  },

  async uploadMedia(formData: FormData): Promise<{ urls: string[]; message: string }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const files = formData.getAll("files") as File[];
    const urls: string[] = [];

    for (const file of files) {
      if (file && file.name) {
        const publicUrl = await storageService.uploadFile("post-media", file, `${user.id}`);
        urls.push(publicUrl);
      }
    }

    return { urls, message: `${urls.length} media files uploaded` };
  },

  async saveDraft(data: Partial<PostSubmission> & { media_urls?: string[] }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data: sub, error } = await supabase
      .from("post_submissions")
      .insert({
        user_id: user.id,
        platform: data.platform || "LinkedIn",
        caption: data.caption || "",
        status: "Draft",
        posting_date: data.posting_date || data.postingDate || null,
        posting_time: data.posting_time || data.postingTime || null,
      })
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .single();

    if (error || !sub) throw error;

    if (data.media_urls) {
      for (const url of data.media_urls) {
        await supabase.from("post_media").insert({ submission_id: sub.id, image_url: url });
      }
    }

    await supabase.from("submission_activities").insert({
      submission_id: sub.id,
      action: "Draft Created",
      actor_id: user.id,
      actor_name: user.email?.split("@")[0],
    });

    return { submission: sub as unknown as PostSubmission, message: "Draft saved" };
  },

  async submitForApproval(data: Partial<PostSubmission> & { media_urls?: string[] }) {
    const res = await this.saveDraft(data);
    await supabase.from("post_submissions").update({ status: "Pending Review" }).eq("id", res.submission.id);

    await supabase.from("submission_activities").insert({
      submission_id: res.submission.id,
      action: "Submitted for Approval",
      actor_id: res.submission.user_id,
    });

    return { ...res, message: "Submitted for approval" };
  },

  async resubmit(id: string, data: Partial<PostSubmission> & { media_urls?: string[] }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data: sub, error } = await supabase
      .from("post_submissions")
      .update({
        caption: data.caption || "",
        status: "Pending Review",
        posting_date: data.posting_date || data.postingDate || null,
        posting_time: data.posting_time || data.postingTime || null,
      })
      .eq("id", id)
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .single();

    if (error || !sub) throw error;

    await supabase.from("submission_activities").insert({
      submission_id: id,
      action: "Resubmitted",
      actor_id: user.id,
    });

    return { submission: sub as unknown as PostSubmission, message: "Resubmitted successfully" };
  },

  async adminGetSubmissions(statusFilter?: string): Promise<{ submissions: PostSubmission[] }> {
    let query = supabase
      .from("post_submissions")
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;

    return { submissions: (data || []) as unknown as PostSubmission[] };
  },

  async adminReviewSubmission(id: string, payload: { decision: "Approved" | "Needs Changes"; feedback?: string }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    await supabase.from("post_reviews").insert({
      submission_id: id,
      admin_id: user.id,
      decision: payload.decision,
      feedback: payload.feedback || null,
    });

    const newStatus = payload.decision === "Approved" ? "Approved" : "Needs Changes";

    const { data: sub, error } = await supabase
      .from("post_submissions")
      .update({ status: newStatus })
      .eq("id", id)
      .select("*, user:profiles(*), media:post_media(*), reviews:post_reviews(*), activities:submission_activities(*)")
      .single();

    if (error) throw error;

    await supabase.from("submission_activities").insert({
      submission_id: id,
      action: `Review: ${payload.decision}`,
      actor_id: user.id,
      details: payload.feedback || "",
    });

    return { submission: sub as unknown as PostSubmission, message: `Review updated to ${payload.decision}` };
  },

  async adminMarkViewed(id: string) {
    return { message: "Marked as viewed" };
  },
};
