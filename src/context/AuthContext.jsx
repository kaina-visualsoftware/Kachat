import { createContext, useContext, useState, useEffect, useRef } from "react";

const lastMessageTime = { current: 0 };
const messageCount = { current: 0 };
const messageCountReset = { current: null };

const checkRateLimit = () => {
  const now = Date.now();
  const minInterval = 1000;
  const maxBurst = 5;
  const burstWindow = 10000;

  if (now - lastMessageTime.current < minInterval) {
    return { allowed: false, reason: 'Aguarde um momento antes de enviar outra mensagem.' };
  }

  if (!messageCountReset.current || now - messageCountReset.current > burstWindow) {
    messageCount.current = 1;
    messageCountReset.current = now;
    lastMessageTime.current = now;
    return { allowed: true };
  }

  messageCount.current++;
  lastMessageTime.current = now;

  if (messageCount.current > maxBurst) {
    return { allowed: false, reason: 'Muitas mensagens. Aguarde alguns segundos.' };
  }

  return { allowed: true };
};
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
        jsonc: 'application/jsonc',
        json5: 'application/jsonc',
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
    
    console.log("updateGroup - user.id:", user.id, "groupId:", groupId);
    
    // Check if current user is admin of this group
    const { data: memberCheck } = await supabase
      .from("group_members")
      .select("role, user_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();
    
    console.log("updateGroup - memberCheck:", memberCheck);
    
    if (!memberCheck) {
      return { error: new Error("You are not a member of this group") };
    }
    
    if (memberCheck.role !== 'admin') {
      return { error: new Error("Only admins can update groups") };
    }
    
    // Update the group
    const { data, error } = await supabase
      .from("groups")
      .update(updates)
      .eq("id", groupId)
      .select()
      .single();
    
    console.log("updateGroup - result:", { data, error });
    
    // Check if the update actually happened
    if (data) {
      return { data, error: null };
    }
    
    // If no explicit error, return success
    return { data: null, error: null };
  };

  const getGroupMedia = async (groupId) => {
    const { data: messages, error } = await supabase
      .from("group_messages")
      .select("id, content, created_at, sender_id")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });
    
    if (error || !messages) return { data: [], error };
    
    // Extract media from message content [file]url|name|type|size[/file]
    const allMedia = [];
    const fileRegex = /\[file\]([^|]+)\|([^|]+)\|([^|]+)\|(\d+)\[\/file\]/g;
    
    messages.forEach(msg => {
      let match;
      while ((match = fileRegex.exec(msg.content)) !== null) {
        allMedia.push({
          url: match[1],
          fileName: match[2],
          fileType: match[3],
          fileSize: parseInt(match[4]),
          messageId: msg.id,
          createdAt: msg.created_at
        });
      }
    });
    
    // Sort by date descending
    allMedia.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { data: allMedia, error: null };
  };

  const clearGroupMessages = async (groupId) => {
    if (!user) return { error: new Error("No user") };
    
    console.log("clearGroupMessages - user.id:", user.id, "groupId:", groupId);
    
    try {
      // Check if current user is admin of this group
      const { data: memberCheck, error: memberError } = await supabase
        .from("group_members")
        .select("role, user_id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();
      
      console.log("memberCheck:", memberCheck, "memberError:", memberError);
      
      // Handle case where user is not a member
      if (memberError && memberError.code === 'PGRST116') {
        return { error: new Error("You are not a member of this group") };
      }
      
      if (!memberCheck) {
        return { error: new Error("You are not a member of this group") };
      }
      
      if (memberCheck.role !== 'admin') {
        return { error: new Error("Only admins can clear messages") };
      }
      
      // Delete all messages in the group
      console.log("Deleting messages for group:", groupId);
      const { error: deleteError } = await supabase
        .from("group_messages")
        .delete()
        .eq("group_id", groupId);
      
      if (deleteError) {
        console.error("Error clearing messages:", deleteError);
        return { error: deleteError };
      }
      
      console.log("Messages cleared successfully");
      return { error: null };
    } catch (err) {
      console.error("Unexpected error:", err);
      return { error: err };
    }
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

  const sendGroupMessage = async (groupId, content, replyTo = null) => {
    if (!user) return { error: new Error("No user") };
    
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.reason) };
    }
    
    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content,
        reply_to: replyTo
      });
    
    return { error };
  };

  const updateGroupMessage = async (messageId, content) => {
    if (!user) return { error: new Error("No user") };
    
    const { error } = await supabase
      .from("group_messages")
      .update({ content })
      .eq("id", messageId)
      .eq("sender_id", user.id);
    
    return { error };
  };

  // Sticker functions
  const uploadStickerImage = async (file) => {
    if (!user) return { error: new Error("No user") };

    const fileExt = file.name.split(".").pop().toLowerCase();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("stickers")
      .upload(fileName, file, { upsert: false, contentType: file.type });

    if (uploadError) return { error: uploadError };

    const { data: { publicUrl } } = supabase.storage.from("stickers").getPublicUrl(fileName);

    return { data: { url: publicUrl, path: fileName }, error: null };
  };

  const getStickerPacks = async () => {
    const { data, error } = await supabase
      .from("sticker_packs")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    return { data: data || [], error };
  };

  const createStickerPack = async (name) => {
    if (!user) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("sticker_packs")
      .insert({ name, creator_id: user.id })
      .select()
      .single();

    return { data, error };
  };

  const getStickers = async (packId) => {
    const { data, error } = await supabase
      .from("stickers")
      .select("*")
      .eq("pack_id", packId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    return { data: data || [], error };
  };

  const addStickerToPack = async (packId, imageUrl, emoji = null) => {
    if (!user) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("stickers")
      .insert({ pack_id: packId, image_url: imageUrl, emoji })
      .select()
      .single();

    return { data, error };
  };

  const deleteStickerPack = async (packId) => {
    if (!user) return { error: new Error("No user") };

    const { error } = await supabase
      .from("sticker_packs")
      .update({ is_deleted: true })
      .eq("id", packId)
      .eq("creator_id", user.id);

    return { error };
  };

  const deleteSticker = async (stickerId) => {
    if (!user) return { error: new Error("No user") };

    const { error } = await supabase
      .from("stickers")
      .update({ is_deleted: true })
      .eq("id", stickerId);

    return { error };
  };

  // Admin functions
  const isAdmin = profile?.role === 'admin';

  const getPendingUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, approved, role, created_at")
      .eq("approved", false)
      .order("created_at", { ascending: true });

    return { data: data || [], error };
  };

  const approveUser = async (userId) => {
    if (!user || !isAdmin) return { error: new Error("Apenas admin pode aprovar usuários") };

    const { error } = await supabase
      .from("profiles")
      .update({ approved: true })
      .eq("id", userId);

    return { error };
  };

  const rejectUser = async (userId) => {
    if (!user || !isAdmin) return { error: new Error("Apenas admin pode rejeitar usuários") };

    const { error } = await supabase
      .from("profiles")
      .update({ approved: false })
      .eq("id", userId);

    return { error };
  };

  const updateDirectMessage = async (messageId, content) => {
    if (!user) return { error: new Error("No user") };
    
    const { error } = await supabase
      .from("direct_messages")
      .update({ content })
      .eq("id", messageId)
      .eq("sender_id", user.id);
    
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
        updateGroupMessage,
        updateDirectMessage,
        updateGroup,
        getGroupMedia,
        clearGroupMessages,
        getGroupMessages,
        sendGroupMessage,
        uploadStickerImage,
        getStickerPacks,
        createStickerPack,
        getStickers,
        addStickerToPack,
        deleteStickerPack,
        deleteSticker,
        isAdmin,
        getPendingUsers,
        approveUser,
        rejectUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);