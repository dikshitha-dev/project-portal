import { supabase } from "../supabase/client";
import type { Project, ProjectMember, ProjectJoinRequest } from "@/types";

export const projectsService = {
  async getAll(search?: string): Promise<{ projects: Project[] }> {
    let query = supabase.from("projects").select("*, owner:profiles(*)");
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { projects: (data || []) as unknown as Project[] };
  },

  async getDiscover(search?: string): Promise<{ projects: Project[] }> {
    let query = supabase
      .from("projects")
      .select("*, owner:profiles(*)")
      .eq("public_joining", true);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { projects: (data || []) as unknown as Project[] };
  },

  async getMyRequests(): Promise<{ requests: ProjectJoinRequest[] }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");

    const { data, error } = await supabase
      .from("project_join_requests")
      .select("*, project:projects(name)")
      .eq("user_id", user.id);

    if (error) throw error;

    const formatted = (data || []).map((r) => ({
      ...r,
      project_name: (r as unknown as { project?: { name?: string } }).project?.name,
    }));

    return { requests: formatted as unknown as ProjectJoinRequest[] };
  },

  async getOne(id: string): Promise<{ project: Project }> {
    const { data: proj, error } = await supabase
      .from("projects")
      .select("*, owner:profiles(*), weeks(*)")
      .eq("id", id)
      .single();

    if (error || !proj) throw new Error("Project not found");

    const { data: members } = await supabase
      .from("project_members")
      .select("*, user:profiles(*)")
      .eq("project_id", id);

    const { data: requests } = await supabase
      .from("project_join_requests")
      .select("*, user:profiles(*)")
      .eq("project_id", id)
      .eq("status", "pending");

    const project: Project = {
      ...proj,
      members: (members || []) as unknown as ProjectMember[],
      join_requests: (requests || []) as unknown as ProjectJoinRequest[],
      members_count: (members || []).length,
    } as unknown as Project;

    return { project };
  },

  async create(payload: { name: string; description?: string; public_joining?: boolean }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthenticated");

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: payload.name,
        description: payload.description || "",
        owner_id: user.id,
        public_joining: payload.public_joining || false,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (error) throw error;

    // Add owner as project member
    await supabase.from("project_members").insert({
      project_id: data.id,
      user_id: user.id,
      role: "owner",
    });

    return { message: "Project created successfully", project: data as unknown as Project };
  },

  async update(id: string, payload: Partial<Project>) {
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { message: "Project updated successfully", project: data as unknown as Project };
  },

  async delete(id: string) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return { message: "Project deleted successfully" };
  },

  async submitJoinRequest(inviteCode: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("invite_code", inviteCode.trim().toUpperCase())
      .single();

    if (!project) throw new Error("Invalid invite code");

    const { data: req, error } = await supabase
      .from("project_join_requests")
      .insert({
        project_id: project.id,
        user_id: user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return {
      message: "Join request submitted",
      project_name: project.name,
      project_id: project.id,
      status: "pending",
    };
  },

  async joinPublic(projectId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: user.id,
      role: "member",
    });

    if (error) throw error;
    return { message: "Joined project successfully", status: "approved" };
  },

  async cancelJoinRequest(projectId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthenticated");

    const { error } = await supabase
      .from("project_join_requests")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id);

    if (error) throw error;
    return { message: "Join request cancelled", status: "none" };
  },

  async acceptJoinRequest(projectId: string, requestId: string) {
    const { data: req } = await supabase
      .from("project_join_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", requestId)
      .select()
      .single();

    if (req) {
      await supabase.from("project_members").insert({
        project_id: projectId,
        user_id: req.user_id,
        role: "member",
      });
    }

    return { message: "Join request accepted", status: "approved" };
  },

  async rejectJoinRequest(projectId: string, requestId: string, feedback?: string) {
    await supabase
      .from("project_join_requests")
      .update({ status: "rejected", feedback: feedback || null, reviewed_at: new Date().toISOString() })
      .eq("id", requestId);

    return { message: "Join request rejected", status: "rejected" };
  },

  async getWeeks(projectId: string) {
    const { data: weeks, error } = await supabase
      .from("weeks")
      .select("*")
      .eq("project_id", projectId);

    if (error) throw error;
    return { weeks: weeks || [] };
  },

  async regenerateCode(id: string) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from("projects").update({ invite_code: newCode }).eq("id", id);
    return { message: "Invite code regenerated", invite_code: newCode };
  },

  async addMember(projectId: string, data: { email?: string; username?: string; role?: string }) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${data.email || ""},name.eq.${data.username || ""}`)
      .single();

    if (!profile) throw new Error("User not found");

    const { data: member, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: profile.id,
        role: data.role || "member",
      })
      .select("*, user:profiles(*)")
      .single();

    if (error) throw error;
    return { message: "Member added", member: member as unknown as ProjectMember };
  },

  async removeMember(projectId: string, memberId: string) {
    await supabase.from("project_members").delete().eq("id", memberId).eq("project_id", projectId);
    return { message: "Member removed" };
  },
};
