import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      // If session exists but email not confirmed, sign out
      if (session?.user && !session.user.email_confirmed_at) {
        supabase.auth.signOut();
        setUser(null);
      } else {
        setUser(session?.user ?? null);
        if (session?.user) loadProfile(session.user.id);
      }
      setLoading(false);
    });
    // Escutar mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);
  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  };
  const signUp = (email, password, username) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { username },
        emailRedirectTo: 'https://kaina-visualsoftware.github.io/Kachat/'
      },
    });
  };
  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };
  const signOut = () => supabase.auth.signOut();
  const updateProfile = async (updates) => {
    if (!user) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date() })
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };
  const uploadAvatar = async (file) => {
    if (!user) return { error: new Error("No user") };

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) return { error: uploadError };
    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);
    // Update profile with avatar URL
    return updateProfile({ avatar_url: publicUrl });
  };
  const uploadChatFiles = async (files, receiverId) => {
    if (!user) return { error: new Error("No user") };

    const maxSize = 100 * 1024 * 1024; // 100MB

    // Validate all files first
    for (const file of files) {
      if (file.size > maxSize) {
        return { error: new Error(`File ${file.name} too large. Max 100MB`) };
      }
    }

    // Upload all files in parallel
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-files").getPublicUrl(fileName);

      return {
        url: publicUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
    });

    try {
      const results = await Promise.all(uploadPromises);
      return { data: results, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }; // ← Esta chave fecha a função uploadChatFiles
  return (
    <AuthContext.Provider
      value={{
        user,
        signUp,
        signIn,
        signOut,
        loading,
        profile,
        updateProfile,
        uploadAvatar,
        loadProfile,
        uploadChatFiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);