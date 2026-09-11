import { supabase } from "../supabase/client";
import type { Week } from "@/types";

export const weeksService = {
  async getAll(projectId?: string): Promise<{ weeks: Week[] }> {
    let query = supabase.from("weeks").select("*");
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return { weeks: (data || []) as Week[] };
  },

  async getOne(id: string): Promise<{ week: Week }> {
    const { data, error } = await supabase.from("weeks").select("*").eq("id", id).single();
    if (error || !data) throw new Error("Week not found");
    return { week: data as Week };
  },

  async create(data: Partial<Week>): Promise<{ week: Week }> {
    const { data: week, error } = await supabase
      .from("weeks")
      .insert({
        project_id: data.project_id || null,
        week_title: data.week_title,
        objective: data.objective,
        resources: data.resources || null,
        deadline: data.deadline,
      })
      .select()
      .single();

    if (error) throw error;
    return { week: week as Week };
  },

  async update(id: string, data: Partial<Week>): Promise<{ week: Week }> {
    const { data: week, error } = await supabase
      .from("weeks")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { week: week as Week };
  },

  async delete(id: string) {
    const { error } = await supabase.from("weeks").delete().eq("id", id);
    if (error) throw error;
    return { message: "Week deleted successfully" };
  },
};
