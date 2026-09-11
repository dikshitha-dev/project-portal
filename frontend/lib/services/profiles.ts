import { supabase } from "../supabase/client";
import type { User } from "@/types";

export interface MentorAssignment {
  id: string;
  mentor_id: string;
  candidate_id: string;
  project_id?: string | null;
  created_at?: string;
  mentor?: User;
  candidate?: User;
}

export const profilesService = {
  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) throw new Error("Profile not found");
    return data as User;
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async getMentors(): Promise<User[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor");

    if (error) throw error;
    return (data || []) as User[];
  },

  async getMentorAssignments(mentorId?: string): Promise<MentorAssignment[]> {
    let query = supabase
      .from("mentor_assignments")
      .select("*, mentor:profiles!mentor_id(*), candidate:profiles!candidate_id(*)");

    if (mentorId) {
      query = query.eq("mentor_id", mentorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as MentorAssignment[];
  },

  async assignMentor(mentorId: string, candidateId: string, projectId?: string): Promise<MentorAssignment> {
    const { data, error } = await supabase
      .from("mentor_assignments")
      .insert({
        mentor_id: mentorId,
        candidate_id: candidateId,
        project_id: projectId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as MentorAssignment;
  },
};
