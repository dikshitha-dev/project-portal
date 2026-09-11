import { supabase } from "../supabase/client";
import { storageService } from "./storage";
import type { Submission } from "@/types";

export const submissionsService = {
  async create(formData: FormData): Promise<{ submission: Submission }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");

    const weekId = formData.get("week_id") as string;
    const githubUrl = formData.get("github_url") as string;
    const deployedUrl = formData.get("deployed_url") as string;
    const linkedinUrl = (formData.get("linkedin_url") as string) || null;
    const projectDescription = (formData.get("project_description") as string) || "";
    const reflection = (formData.get("reflection") as string) || projectDescription;
    const whatLearned = (formData.get("what_learned") as string) || "";
    const difficultiesFaced = (formData.get("difficulties_faced") as string) || "";

    const { data: sub, error } = await supabase
      .from("submissions")
      .insert({
        user_id: user.id,
        week_id: weekId,
        github_url: githubUrl,
        deployed_url: deployedUrl,
        linkedin_url: linkedinUrl,
        reflection,
        project_description: projectDescription,
        what_learned: whatLearned,
        difficulties_faced: difficultiesFaced,
        status: "Submitted",
      })
      .select("*, user:profiles(*), week:weeks(*)")
      .single();

    if (error || !sub) throw error;

    // Upload screenshots to Supabase Storage
    const screenshots = formData.getAll("screenshots") as File[];
    for (const file of screenshots) {
      if (file && file.name) {
        try {
          const publicUrl = await storageService.uploadFile("project-screenshots", file, `${user.id}/${sub.id}`);
          await supabase.from("review_files").insert({
            submission_id: sub.id,
            image_url: publicUrl,
            file_name: file.name,
          });
        } catch (err) {
          console.warn("Screenshot upload error:", err);
        }
      }
    }

    return { submission: sub as unknown as Submission };
  },

  async getAll(projectId?: string): Promise<{ submissions: Submission[] }> {
    let query = supabase.from("submissions").select("*, user:profiles(*), week:weeks(*), review_files(*), grade:grades(*)");
    if (projectId) {
      // Filter via weeks
      const { data: weekIds } = await supabase.from("weeks").select("id").eq("project_id", projectId);
      const ids = (weekIds || []).map((w) => w.id);
      query = query.in("week_id", ids);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { submissions: (data || []) as unknown as Submission[] };
  },

  async getOne(id: string): Promise<{ submission: Submission }> {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, user:profiles(*), week:weeks(*), review_files(*), grade:grades(*)")
      .eq("id", id)
      .single();

    if (error || !data) throw new Error("Submission not found");
    return { submission: data as unknown as Submission };
  },

  async update(id: string, data: Partial<Submission> | FormData): Promise<{ message: string; submission: Submission }> {
    let updateFields: Record<string, unknown> = {};

    if (data instanceof FormData) {
      if (data.get("github_url")) updateFields.github_url = data.get("github_url");
      if (data.get("deployed_url")) updateFields.deployed_url = data.get("deployed_url");
      if (data.get("linkedin_url")) updateFields.linkedin_url = data.get("linkedin_url");
      if (data.get("project_description")) updateFields.project_description = data.get("project_description");
      if (data.get("status")) updateFields.status = data.get("status");
    } else {
      updateFields = { ...data };
    }

    const { data: updated, error } = await supabase
      .from("submissions")
      .update(updateFields)
      .eq("id", id)
      .select("*, user:profiles(*), week:weeks(*), review_files(*), grade:grades(*)")
      .single();

    if (error) throw error;
    return { message: "Submission updated successfully", submission: updated as unknown as Submission };
  },

  async deleteScreenshot(submissionId: string, fileId: string) {
    await supabase.from("review_files").delete().eq("id", fileId).eq("submission_id", submissionId);
    return { message: "Screenshot deleted" };
  },

  async uploadScreenshots(id: string, formData: FormData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const screenshots = formData.getAll("screenshots") as File[];
    const uploaded = [];

    for (const file of screenshots) {
      if (file && file.name) {
        const publicUrl = await storageService.uploadFile("project-screenshots", file, `${user.id}/${id}`);
        const { data: rf } = await supabase
          .from("review_files")
          .insert({
            submission_id: id,
            image_url: publicUrl,
            file_name: file.name,
          })
          .select()
          .single();

        if (rf) uploaded.push(rf);
      }
    }

    return { message: `${uploaded.length} screenshots uploaded`, files: uploaded };
  },

  async getByWeek(weekId: string): Promise<{ submissions: Submission[] }> {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, user:profiles(*), week:weeks(*), review_files(*), grade:grades(*)")
      .eq("week_id", weekId);

    if (error) throw error;
    return { submissions: (data || []) as unknown as Submission[] };
  },

  async getByCandidate(candidateId: string, projectId?: string): Promise<{ submissions: Submission[] }> {
    let query = supabase
      .from("submissions")
      .select("*, user:profiles(*), week:weeks(*), review_files(*), grade:grades(*)")
      .eq("user_id", candidateId);

    if (projectId) {
      const { data: weekIds } = await supabase.from("weeks").select("id").eq("project_id", projectId);
      const ids = (weekIds || []).map((w) => w.id);
      query = query.in("week_id", ids);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { submissions: (data || []) as unknown as Submission[] };
  },
};
