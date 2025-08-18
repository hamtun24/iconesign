import React, { createContext, useContext, useEffect, useState } from "react";
import { supabaseClient } from "../utils/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

// Profile interface matching your profiles table
interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

// Extended user interface that includes profile data
interface ExtendedUser extends User {
  profile?: Profile;
}

const AuthContext = createContext<{
  user: ExtendedUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'email'>>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}>({ 
  user: null, 
  profile: null, 
  session: null, 
  loading: true,
  updateProfile: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch or create user profile
  const fetchOrCreateProfile = async (authUser: User): Promise<Profile | null> => {
    try {
      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingProfile && !fetchError) {
        return existingProfile;
      }

      // If profile doesn't exist, create it
      if (fetchError?.code === 'PGRST116') {
        const newProfile: Omit<Profile, 'created_at'> = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          email: authUser.email || null,
        };

        const { data: createdProfile, error: createError } = await supabaseClient
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return null;
        }

        return createdProfile;
      }

      console.error('Error fetching profile:', fetchError);
      return null;
    } catch (error) {
      console.error('Unexpected error in fetchOrCreateProfile:', error);
      return null;
    }
  };

  // Function to update profile
  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'email'>>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setProfile(data);
    if (user) {
      setUser({ ...user, profile: data });
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (!user) return;

    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error refreshing profile:', error);
      return;
    }

    setProfile(data);
    if (user) {
      setUser({ ...user, profile: data });
    }
  };

  // Handle auth state changes
  const handleAuthStateChange = async (event: string, session: Session | null) => {
    setSession(session);
    setLoading(true);
console.log("Session updated:", session, "User:", session?.user);

    if (session?.user) {
      try {
        // Fetch or create profile for the authenticated user
        const userProfile = await fetchOrCreateProfile(session.user);
        const extendedUser: ExtendedUser = {
          ...session.user,
          profile: userProfile || undefined
        };
        
        setUser(extendedUser);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        setUser(session.user as ExtendedUser);
        setProfile(null);
      }
    } else {
      setUser(null);
      setProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
  const getInitialSession = async () => {
    const { data, error } = await supabaseClient.auth.getSession();
    console.log("🔐 Initial session:", data.session);

    if (error) {
      console.error("❌ Error getting session:", error);
      setLoading(false);
      return;
    }

    await handleAuthStateChange("INITIAL_SESSION", data.session);
  };

  const { data: listener } = supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log("🔁 Auth state changed:", { event, session });
    handleAuthStateChange(event, session);
  });

  getInitialSession(); // 🔄 async fetch session

  return () => {
    listener?.subscription?.unsubscribe(); // ✅ clean up
  };
}, []);


  // Set up real-time subscription for profile changes
  useEffect(() => {
    if (!user?.id) return;

    const profileSubscription = supabaseClient
      .channel(`profile_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setProfile(payload.new as Profile);
            if (user) {
              setUser({ ...user, profile: payload.new as Profile });
            }
          }
        }
      )
      .subscribe();

    return () => {
      profileSubscription.unsubscribe();
    };
  }, [user?.id]);

  const value = {
    user,
    profile,
    session,
    loading,
    updateProfile,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Additional helper hooks
export function useProfile() {
  const { profile, updateProfile, refreshProfile } = useAuth();
  return { profile, updateProfile, refreshProfile };
}

export function useUser() {
  const { user } = useAuth();
  return user;
}