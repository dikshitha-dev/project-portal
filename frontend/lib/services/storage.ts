import { supabase } from "../supabase/client";

export const storageService = {
  async uploadFile(bucket: "project-screenshots" | "post-media", file: File, pathPrefix: string): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${pathPrefix}/${fileName}`;

    const { error } = await supabase.storage.from(bucket).upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  async deleteFile(bucket: "project-screenshots" | "post-media", filePath: string): Promise<void> {
    await supabase.storage.from(bucket).remove([filePath]);
  },
};
