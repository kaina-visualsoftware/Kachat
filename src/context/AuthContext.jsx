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
      if (session?.user && !session.user.email_confirmed_at) {
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
    const filePath = `${user.id}/${fileName}`;
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) return { error: uploadError };
    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);
    
    // Update profile with avatar URL and reload profile
    const result = await updateProfile({ avatar_url: publicUrl });
    if (!result.error) {
      await loadProfile(user.id);
    }
    return result;
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
      const fileExt = file.name.split(".").pop().toLowerCase();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-files").getPublicUrl(fileName);

      // Infer MIME type from extension if browser didn't detect it
      const mimeTypeMap = {
        xml: 'text/xml',
        json: 'application/json',
        csv: 'text/csv',
        svg: 'image/svg+xml',
        ico: 'image/x-icon',
        zip: 'application/zip',
        pdf: 'application/pdf',
        txt: 'text/plain',
        md: 'text/markdown',
        html: 'text/html',
        htm: 'text/html',
        js: 'text/javascript',
        ts: 'text/typescript',
        css: 'text/css',
        py: 'text/x-python',
        java: 'text/x-java',
        cpp: 'text/x-c++',
        c: 'text/x-c',
        h: 'text/x-c',
        php: 'text/x-php',
        rb: 'text/x-ruby',
        go: 'text/x-go',
        rs: 'text/x-rust',
        sql: 'text/x-sql',
        sh: 'text/x-sh',
        yaml: 'text/yaml',
        yml: 'text/yaml',
        toml: 'text/toml',
        ini: 'text/plain',
        log: 'text/plain',
      };

      const inferredType = file.type || mimeTypeMap[fileExt] || 'application/octet-stream';

      return {
        url: publicUrl,
        fileName: file.name,
        fileType: inferredType,
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

  // Group functions
  const createGroup = async (name, description, memberIds = []) => {
    if (!user) return { error: new Error("No user") };
    
    // Create group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ 
        name, 
        description, 
        created_by: user.id 
      })
      .select()
      .single();
    
    if (groupError) return { data: null, error: groupError };
    
    // Add members (trigger already adds creator as admin, so only add other users)
    const uniqueMembers = memberIds;
    const memberInserts = uniqueMembers.map(userId => ({
      group_id: group.id,
      user_id: userId,
      role: userId === user.id ? 'admin' : 'member'
    }));
    
    const { error: membersError } = await supabase
      .from("group_members")
      .insert(memberInserts);
    
    if (membersError) return { data: null, error: membersError };
    
    return { data: group, error: null };
  };

  const getGroups = async () => {
    if (!user) return { data: [], error: new Error("No user") };
    
    const { data, error } = await supabase
      .from("group_members")
      .select(`
        group_id,
        role,
        groups:group_id (
          id, name, description, avatar_url, created_by, created_at
        )
      `)
      .eq("user_id", user.id);
    
    if (error) return { data: [], error };
    
    // Get member counts for each group
    const groupsWithCounts = await Promise.all(
      data.map(async (gm) => {
        const { count } = await supabase
          .from("group_members")
          .select("*", { count: 'exact', head: true })
          .eq("group_id", gm.group_id);
        
        return {
          ...gm.groups,
          member_count: count || 0,
          role: gm.role
        };
      })
    );
    
    return { data: groupsWithCounts, error: null };
  };

  const getGroupMembers = async (groupId) => {
    const { data: members, error } = await supabase
      .from("group_members")
      .select("user_id, role")
      .eq("group_id", groupId);
    
    if (error || !members) return { data: [], error };
    
    const userIds = members.map(m => m.user_id).filter(Boolean);
    if (userIds.length === 0) return { data: [], error: null };
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    
    const data = members.map(m => {
      const profile = profiles?.find(p => p.id === m.user_id);
      return {
        ...profile,
        user_id: m.user_id,
        role: m.role
      };
    }).filter(m => m.id);
    
    return { data, error: null };
  };

  const addGroupMember = async (groupId, userId) => {
    if (!user) return { error: new Error("No user") };
    
    // Check if current user is admin
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    if (!memberCheck || memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can add members") };
    }
    
    const { error } = await supabase
      .from("group_members")
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member'
      });
    
    return { error };
  };

  const removeGroupMember = async (groupId, userId) => {
    if (!user) return { error: new Error("No user") };
    
    // Can't remove yourself (use leaveGroup instead)
    if (userId === user.id) {
      return { error: new Error("Use leaveGroup to leave") };
    }
    
    // Check if current user is admin
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    if (!memberCheck || memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can remove members") };
    }
    
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    
    return { error };
  };

  const leaveGroup = async (groupId) => {
    if (!user) return { error: new Error("No user") };
    
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    
    return { error };
  };

  const deleteGroup = async (groupId) => {
    if (!user) return { error: new Error("No user") };
    
    // Check if current user is admin of this group
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    if (!memberCheck || memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can delete groups") };
    }
    
    // Delete group (cascades to members and messages)
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);
    
    return { error };
  };

  const updateGroup = async (groupId, updates) => {
    if (!user) return { error: new Error("No user") };
    
    // Check if current user is admin of this group
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    if (!memberCheck || memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can update groups") };
    }
    
    const { data, error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();
    
    // Return success even if error is null (update succeeded)
    return { data, error: null };
  };

  const getGroupMedia = async (groupId) => {
    const { data: messages, error } = await supabase
      .from("group_messages")
      .select("id, content, created_at, sender_id, attachments")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    
    if (error || !messages) return { data: [], error };
    
    // Extract media from messages
    const allMedia = [];
    messages.forEach(msg => {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        msg.attachments.forEach(file => {
          allMedia.push({
            ...file,
            messageId: msg.id,
            createdAt: msg.created_at
          });
        });
      }
    });
    
    // Sort by date descending
    allMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { data: allMedia, error: null };
  };

  const clearGroupMessages = async (groupId) => {
    if (!user) return { error: new Error("No user") };
    
    // Check if current user is admin of this group
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    if (!memberCheck || memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can clear messages") };
    }
    
    const { error } = await supabase
      .from("group_messages")
      .delete()
      .eq("group_id", groupId);
    
    return { error };
  };

  const getGroupMessages = async (groupId, limit = 50) => {
    const { data: messages, error } = await supabase
      .from("group_messages")
      .select("id, content, created_at, sender_id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(limit);
    
    if (error || !messages) return { data: [], error };
    
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    if (senderIds.length === 0) return { data: [], error: null };
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", senderIds);
    
    const data = messages.map(m => ({
      ...m,
      sender: profiles?.find(p => p.id === m.sender_id)
    }));
    
    return { data, error: null };
  };

  const sendGroupMessage = async (groupId, content) => {
    if (!user) return { error: new Error("No user") };
    
    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content
      });
    
    return { error };
  };

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
        createGroup,
        getGroups,
        getGroupMembers,
        addGroupMember,
        removeGroupMember,
        leaveGroup,
        deleteGroup,
        updateGroup,
        getGroupMedia,
        clearGroupMessages,
        getGroupMessages,
        sendGroupMessage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);