import { supabaseClient } from "../utils/supabaseClient";
import type { UserAction } from "../types/actions";
import type { User } from "@supabase/supabase-js";

// Helper function to ensure user has a profile
async function ensureUserProfile(authUser: User) {
  try {
    const { data, error } = await supabaseClient
      .rpc('get_or_create_profile', {
        user_id: authUser.id,
        user_email: authUser.email,
        user_full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null
      });

    if (error) {
      console.warn('Could not ensure user profile:', error);
    }

    return data;
  } catch (error) {
    console.warn('Error ensuring user profile:', error);
    return null;
  }
}

export async function trackUserAction(action: UserAction) {
  try {
    // Get current user from auth
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Ensure user has a profile (create if needed)
    if (user) {
      await ensureUserProfile(user);
    }
    
    let table = "";
    let payload: any = {};

    switch (action.type) {
      case "quicksign":
        table = "quicksign_actions";
        payload = {
          user_id: user?.id || null,
          action: action.data.action,
          file_count: action.data.file_count || null,
          total_size: action.data.total_size || null,
          file_names: action.data.file_names || null,
          success_count: action.data.success_count || null,
          error_count: action.data.error_count || null,
          processing_time_ms: action.data.processing_time_ms || null,
          error_message: action.data.error_message || null,
          details: action.data.details || null,
          timestamp: action.data.timestamp
        };
        break;
        
      case "simplesign":
        table = "simplesign_actions";
        payload = {
          user_id: user?.id || null,
          action: action.data.action,
          file_name: action.data.file_name || null,
          file_size: action.data.file_size || null,
          processing_time_ms: action.data.processing_time_ms || null,
          error_message: action.data.error_message || null,
          details: action.data.details || null,
          timestamp: action.data.timestamp
        };
        break;
        
      case "validation":
        table = "validation_actions";
        payload = {
          user_id: user?.id || null,
          action: action.data.action,
          file_name: action.data.file_name || null,
          file_size: action.data.file_size || null,
          processing_time_ms: action.data.processing_time_ms || null,
          error_message: action.data.error_message || null,
          details: action.data.details || null,
          timestamp: action.data.timestamp
        };
        break;
        
      default:
        console.warn('Unknown action type:', action);
        return;
    }

    const { data, error } = await supabaseClient
      .from(table)
      .insert([payload]);

    if (error) {
      console.error('Failed to track user action:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in trackUserAction:', error);
    // Don't throw here to avoid breaking the main application flow
  }
}

// Helper function to get user activity summary
export async function getUserActivitySummary(userId?: string) {
  try {
    const targetUserId = userId || (await supabaseClient.auth.getUser()).data.user?.id;
    
    if (!targetUserId) {
      throw new Error('No user ID provided');
    }

    const { data, error } = await supabaseClient
      .rpc('get_user_activity_summary', { target_user_id: targetUserId });

    if (error) {
      console.error('Failed to get user activity summary:', error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getUserActivitySummary:', error);
    throw error;
  }
}

// Helper function to get recent user actions
export async function getRecentUserActions(limit: number = 50, userId?: string) {
  try {
    const targetUserId = userId || (await supabaseClient.auth.getUser()).data.user?.id;
    
    if (!targetUserId) {
      throw new Error('No user ID provided');
    }

    // Get recent actions from all tables
    const [quicksignActions, simplesignActions, validationActions] = await Promise.all([
      supabaseClient
        .from('quicksign_actions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('timestamp', { ascending: false })
        .limit(limit),
      supabaseClient
        .from('simplesign_actions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('timestamp', { ascending: false })
        .limit(limit),

      supabaseClient
        .from('validation_actions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('timestamp', { ascending: false })
        .limit(limit)
    ]);

    // Combine and sort all actions
    const allActions = [
      ...(quicksignActions.data || []).map(action => ({ ...action, type: 'quicksign' })),
      ...(simplesignActions.data || []).map(action => ({ ...action, type: 'simplesign' })),
      ...(validationActions.data || []).map(action => ({ ...action, type: 'validation' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, limit);

    return allActions;
  } catch (error) {
    console.error('Error in getRecentUserActions:', error);
    throw error;
  }
}

// Helper function to get system-wide analytics (admin only)
export async function getSystemAnalytics(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [quicksignSummary, simplesignSummary, validationSummary] = await Promise.all([
      supabaseClient
        .from('quicksign_summary')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false }),

      supabaseClient
        .from('simplesign_summary')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false }),
      supabaseClient
        .from('validation_summary')
        .select('*')
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false })
    ]);

    return {
      quicksign: quicksignSummary.data || [],
      simplesign: simplesignSummary.data || [],
      validation: validationSummary.data || []
    };
  } catch (error) {
    console.error('Error in getSystemAnalytics:', error);
    throw error;
  }
}