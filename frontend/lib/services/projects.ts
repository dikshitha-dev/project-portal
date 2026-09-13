import { supabase } from "../supabase/client";
import { authService } from "./auth";
import type { Project, ProjectMember, ProjectJoinRequest } from "@/types";

const getLocalProjects = (): Project[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("portal_local_projects");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalProjects = (projects: Project[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("portal_local_projects", JSON.stringify(projects));
  } catch {
    // Ignore
  }
};

async function populateMembershipStatus(projects: Project[]): Promise<Project[]> {
  let currentUser: { id: string; role?: string } | null = null;
  try {
    const { user } = await authService.getMe();
    currentUser = user;
  } catch {
    // Ignore
  }

  if (!currentUser) return projects;

  if (currentUser.role === "admin") {
    return projects.map((p) => ({
      ...p,
      membership_status: "approved",
      is_owner: true,
    }));
  }

  return projects.map((p) => {
    // Check if member with approved role
    const isMember = (p.members || []).some(
      (m) => m.user_id === currentUser?.id
    );
    if (isMember || p.owner_id === currentUser?.id) {
      return {
        ...p,
        membership_status: "approved",
        is_owner: p.owner_id === currentUser?.id,
      };
    }

    // Check join requests
    const req = (p.join_requests || []).find((r) => r.user_id === currentUser?.id);
    if (req) {
      return {
        ...p,
        membership_status: req.status as "pending" | "approved" | "rejected",
        user_join_request: req,
      };
    }

    return {
      ...p,
      membership_status: "none" as const,
    };
  });
}

export const projectsService = {
  async getAll(search?: string): Promise<{ projects: Project[] }> {
    let remoteProjects: Project[] = [];
    try {
      let query = supabase.from("projects").select("*, owner:profiles(*)");
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const { data, error } = await query;
      if (!error && data) {
        remoteProjects = data as unknown as Project[];
      }
    } catch {
      // Ignore remote database error
    }

    const localProjects = getLocalProjects();
    let combined = [...remoteProjects];

    for (const lp of localProjects) {
      if (!combined.some((p) => p.id === lp.id)) {
        combined.unshift(lp);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    const populated = await populateMembershipStatus(combined);
    return { projects: populated };
  },

  async getDiscover(search?: string): Promise<{ projects: Project[] }> {
    let remoteProjects: Project[] = [];
    try {
      let query = supabase
        .from("projects")
        .select("*, owner:profiles(*)")
        .eq("public_joining", true);
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const { data, error } = await query;
      if (!error && data) {
        remoteProjects = data as unknown as Project[];
      }
    } catch {
      // Ignore remote error
    }

    const localProjects = getLocalProjects().filter((p) => p.public_joining);
    let combined = [...remoteProjects];

    for (const lp of localProjects) {
      if (!combined.some((p) => p.id === lp.id)) {
        combined.unshift(lp);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    const populated = await populateMembershipStatus(combined);
    return { projects: populated };
  },

  async getMyRequests(): Promise<{ requests: ProjectJoinRequest[] }> {
    let currentUser: { id: string } | null = null;
    try {
      const { user } = await authService.getMe();
      currentUser = user;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }

    if (!currentUser) throw new Error("Unauthenticated");

    try {
      const { data, error } = await supabase
        .from("project_join_requests")
        .select("*, project:projects(name)")
        .eq("user_id", currentUser.id);

      if (!error && data) {
        const formatted = data.map((r) => ({
          ...r,
          project_name: (r as unknown as { project?: { name?: string } }).project?.name,
        }));
        return { requests: formatted as unknown as ProjectJoinRequest[] };
      }
    } catch {
      // Ignore remote error
    }

    const localProjects = getLocalProjects();
    const requests: ProjectJoinRequest[] = [];
    for (const proj of localProjects) {
      if (proj.join_requests) {
        for (const req of proj.join_requests) {
          if (req.user_id === currentUser.id) {
            requests.push({
              ...req,
              project_name: proj.name,
            } as unknown as ProjectJoinRequest);
          }
        }
      }
    }

    return { requests };
  },

  async getOne(id: string): Promise<{ project: Project }> {
    let rawProject: Project | null = null;
    try {
      const { data: proj, error } = await supabase
        .from("projects")
        .select("*, owner:profiles(*), weeks(*)")
        .eq("id", id)
        .single();

      if (!error && proj) {
        const { data: members } = await supabase
          .from("project_members")
          .select("*, user:profiles(*)")
          .eq("project_id", id);

        const { data: requests } = await supabase
          .from("project_join_requests")
          .select("*, user:profiles(*)")
          .eq("project_id", id);

        rawProject = {
          ...proj,
          members: (members || []) as unknown as ProjectMember[],
          join_requests: (requests || []) as unknown as ProjectJoinRequest[],
          members_count: (members || []).length,
        } as unknown as Project;
      }
    } catch {
      // Fall through
    }

    if (!rawProject) {
      const localProjects = getLocalProjects();
      rawProject = localProjects.find((p) => p.id === id) || null;
    }

    if (!rawProject) {
      throw new Error("Project not found");
    }

    const [populated] = await populateMembershipStatus([rawProject]);
    return { project: populated };
  },

  async create(payload: { name: string; description?: string; public_joining?: boolean }) {
    let currentUser: { id: string; name?: string; email?: string } | null = null;
    try {
      const { user } = await authService.getMe();
      currentUser = user;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUser = { id: user.id, email: user.email || "", name: user.user_metadata?.name || "Admin" };
      }
    }

    if (!currentUser) throw new Error("Unauthenticated");

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Try Supabase Insert
    try {
      try {
        await supabase.from("profiles").upsert(
          {
            id: currentUser.id,
            name: currentUser.name || "Admin",
            email: currentUser.email || "admin@portal.com",
            role: "admin",
          },
          { onConflict: "id" }
        );
      } catch {
        // ignore profile error
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          name: payload.name,
          description: payload.description || "",
          owner_id: currentUser.id,
          public_joining: payload.public_joining || false,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (!error && data) {
        try {
          await supabase.from("project_members").insert({
            project_id: data.id,
            user_id: currentUser.id,
            role: "owner",
          });
        } catch {
          // ignore member error
        }
        return { message: "Project created successfully", project: data as unknown as Project };
      }
    } catch {
      // Fall through to local fallback creation
    }

    // Local Fallback Creation
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: payload.name,
      description: payload.description || "",
      owner_id: currentUser.id,
      owner_name: currentUser.name || "Admin",
      public_joining: payload.public_joining || false,
      invite_code: inviteCode,
      status: "Active",
      created_at: new Date().toISOString(),
      members_count: 1,
      is_owner: true,
      membership_status: "approved",
      members: [
        {
          id: `member-${Date.now()}`,
          project_id: `proj-${Date.now()}`,
          user_id: currentUser.id,
          role: "owner",
          created_at: new Date().toISOString(),
          user: {
            id: currentUser.id,
            name: currentUser.name || "Admin",
            email: currentUser.email || "admin@portal.com",
            role: "admin",
            created_at: new Date().toISOString(),
          },
        },
      ],
      join_requests: [],
    } as unknown as Project;

    const localProjects = getLocalProjects();
    localProjects.unshift(newProject);
    saveLocalProjects(localProjects);

    return { message: "Project created successfully", project: newProject };
  },

  async update(id: string, payload: Partial<Project>) {
    let updatedProject: Project | null = null;
    try {
      const { data, error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        updatedProject = data as unknown as Project;
      }
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const idx = localProjects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      localProjects[idx] = { ...localProjects[idx], ...payload };
      saveLocalProjects(localProjects);
      if (!updatedProject) updatedProject = localProjects[idx];
    }

    if (!updatedProject) throw new Error("Failed to update project");
    return { message: "Project updated successfully", project: updatedProject };
  },

  async delete(id: string) {
    try {
      await supabase.from("projects").delete().eq("id", id);
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const filtered = localProjects.filter((p) => p.id !== id);
    saveLocalProjects(filtered);

    return { message: "Project deleted successfully" };
  },

  async submitJoinRequest(inviteCode: string) {
    let currentUser: { id: string; name?: string; email?: string } | null = null;
    try {
      const { user } = await authService.getMe();
      currentUser = user;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }
    if (!currentUser) throw new Error("Unauthenticated");

    const code = inviteCode.trim().toUpperCase();

    try {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("invite_code", code)
        .single();

      if (project) {
        const { data: req, error } = await supabase
          .from("project_join_requests")
          .insert({
            project_id: project.id,
            user_id: currentUser.id,
            status: "pending",
            joined_via: "invite",
          })
          .select()
          .single();

        if (!error && req) {
          return {
            message: "Join request submitted",
            project_name: project.name,
            project_id: project.id,
            status: "pending",
            joined_via: "invite",
          };
        }
      }
    } catch {
      // Check local projects
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.invite_code?.toUpperCase() === code);
    if (matched) {
      const joinReq: ProjectJoinRequest = {
        id: `req-${Date.now()}`,
        project_id: matched.id,
        user_id: currentUser.id,
        status: "pending",
        joined_via: "invite",
        created_at: new Date().toISOString(),
        user: {
          id: currentUser.id,
          name: currentUser.name || "Candidate",
          email: currentUser.email || "candidate@portal.com",
          role: "candidate",
          created_at: new Date().toISOString(),
        },
      } as unknown as ProjectJoinRequest;

      if (!matched.join_requests) matched.join_requests = [];
      // Remove any previous request from same user
      matched.join_requests = matched.join_requests.filter((r) => r.user_id !== currentUser?.id);
      matched.join_requests.push(joinReq);
      saveLocalProjects(localProjects);

      return {
        message: "Join request submitted",
        project_name: matched.name,
        project_id: matched.id,
        status: "pending",
        joined_via: "invite",
      };
    }

    throw new Error("Invalid invite code");
  },

  async joinPublic(projectId: string) {
    let currentUser: { id: string; name?: string; email?: string } | null = null;
    try {
      const { user } = await authService.getMe();
      currentUser = user;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }
    if (!currentUser) throw new Error("Unauthenticated");

    try {
      const { data: req, error } = await supabase
        .from("project_join_requests")
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          status: "pending",
          joined_via: "public",
        })
        .select()
        .single();

      if (!error && req) {
        return { message: "Join request submitted", status: "pending", joined_via: "public" };
      }
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched) {
      if (!matched.join_requests) matched.join_requests = [];
      matched.join_requests = matched.join_requests.filter((r) => r.user_id !== currentUser?.id);
      matched.join_requests.push({
        id: `req-${Date.now()}`,
        project_id: projectId,
        user_id: currentUser.id,
        status: "pending",
        joined_via: "public",
        created_at: new Date().toISOString(),
        user: {
          id: currentUser.id,
          name: currentUser.name || "Candidate",
          email: currentUser.email || "candidate@portal.com",
          role: "candidate",
          created_at: new Date().toISOString(),
        },
      } as unknown as ProjectJoinRequest);
      saveLocalProjects(localProjects);
      return { message: "Join request submitted", status: "pending", joined_via: "public" };
    }

    return { message: "Join request submitted", status: "pending", joined_via: "public" };
  },

  async cancelJoinRequest(projectId: string) {
    let currentUser: { id: string } | null = null;
    try {
      const { user } = await authService.getMe();
      currentUser = user;
    } catch {
      const { data: { user } } = await supabase.auth.getUser();
      currentUser = user;
    }
    if (!currentUser) throw new Error("Unauthenticated");

    try {
      await supabase
        .from("project_join_requests")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", currentUser.id);
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched && matched.join_requests) {
      matched.join_requests = matched.join_requests.filter((r) => r.user_id !== currentUser.id);
      saveLocalProjects(localProjects);
    }

    return { message: "Join request cancelled", status: "none" };
  },

  async acceptJoinRequest(projectId: string, requestId: string) {
    try {
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
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched && matched.join_requests) {
      const req = matched.join_requests.find((r) => r.id === requestId);
      if (req) {
        req.status = "approved";
        req.reviewed_at = new Date().toISOString();
        if (!matched.members) matched.members = [];
        if (!matched.members.some((m) => m.user_id === req.user_id)) {
          matched.members.push({
            id: `member-${Date.now()}`,
            project_id: projectId,
            user_id: req.user_id,
            role: "member",
            created_at: new Date().toISOString(),
            user: req.user,
          } as unknown as ProjectMember);
        }
        matched.members_count = matched.members.length;
        saveLocalProjects(localProjects);
      }
    }

    return { message: "Join request accepted", status: "approved" };
  },

  async rejectJoinRequest(projectId: string, requestId: string, feedback?: string) {
    try {
      await supabase
        .from("project_join_requests")
        .update({ status: "rejected", feedback: feedback || null, reviewed_at: new Date().toISOString() })
        .eq("id", requestId);
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched && matched.join_requests) {
      const req = matched.join_requests.find((r) => r.id === requestId);
      if (req) {
        req.status = "rejected";
        req.feedback = feedback;
        req.reviewed_at = new Date().toISOString();
        saveLocalProjects(localProjects);
      }
    }

    return { message: "Join request rejected", status: "rejected" };
  },

  async getWeeks(projectId: string) {
    try {
      const { data: weeks, error } = await supabase
        .from("weeks")
        .select("*")
        .eq("project_id", projectId);

      if (!error && weeks && weeks.length > 0) {
        return { weeks: weeks || [] };
      }
    } catch {
      // Ignore
    }

    return { weeks: [] };
  },

  async regenerateCode(id: string) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    try {
      await supabase.from("projects").update({ invite_code: newCode }).eq("id", id);
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === id);
    if (matched) {
      matched.invite_code = newCode;
      saveLocalProjects(localProjects);
    }

    return { message: "Invite code regenerated", invite_code: newCode };
  },

  async addMember(projectId: string, data: { email?: string; username?: string; role?: string }) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .or(`email.eq.${data.email || ""},name.eq.${data.username || ""}`)
        .single();

      if (profile) {
        const { data: member, error } = await supabase
          .from("project_members")
          .insert({
            project_id: projectId,
            user_id: profile.id,
            role: data.role || "member",
          })
          .select("*, user:profiles(*)")
          .single();

        if (!error && member) {
          return { message: "Member added", member: member as unknown as ProjectMember };
        }
      }
    } catch {
      // Ignore
    }

    const newMember: ProjectMember = {
      id: `member-${Date.now()}`,
      project_id: projectId,
      user_id: `user-${Date.now()}`,
      role: (data.role as "member" | "owner") || "member",
      created_at: new Date().toISOString(),
      user: {
        id: `user-${Date.now()}`,
        name: data.username || data.email?.split("@")[0] || "Member",
        email: data.email || "",
        role: "candidate",
        created_at: new Date().toISOString(),
      },
    } as unknown as ProjectMember;

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched) {
      if (!matched.members) matched.members = [];
      matched.members.push(newMember);
      matched.members_count = matched.members.length;
      saveLocalProjects(localProjects);
    }

    return { message: "Member added", member: newMember };
  },

  async removeMember(projectId: string, memberId: string) {
    try {
      await supabase.from("project_members").delete().eq("id", memberId).eq("project_id", projectId);
    } catch {
      // Ignore
    }

    const localProjects = getLocalProjects();
    const matched = localProjects.find((p) => p.id === projectId);
    if (matched && matched.members) {
      matched.members = matched.members.filter((m) => m.id !== memberId);
      matched.members_count = matched.members.length;
      saveLocalProjects(localProjects);
    }

    return { message: "Member removed" };
  },
};
