import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, getSession } from '../lib/supabase';

export interface SyncedAgent {
  id: string;
  user_id: string;
  name: string;
  model: string;
  system_instruction: string;
  temperature: number;
  top_p: number;
  top_k: number;
  show_robot: boolean;
  created_at: string;
  updated_at: string;
}

export interface SyncedWorkflow {
  id: string;
  user_id: string;
  name: string;
  nodes: any[];
  connections: any[];
  created_at: string;
  updated_at: string;
}

export interface SyncedMemory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

type Table = 'agents' | 'workflows' | 'memories';

interface SyncCallbacks {
  onAgentsChange?: (agents: SyncedAgent[]) => void;
  onWorkflowsChange?: (workflows: SyncedWorkflow[]) => void;
  onMemoriesChange?: (memories: SyncedMemory[]) => void;
}

export function useRealtimeSync(callbacks: SyncCallbacks) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    let channel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;
    let mounted = true;

    async function init() {
      const session = await getSession();
      if (!mounted || !session?.user) {
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      const db = supabase;
      const uid = session.user.id;
      setUserId(uid);

      // Load initial data
      const [agentsRes, workflowsRes, memoriesRes] = await Promise.all([
        db.from('agents').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        db.from('workflows').select('*').eq('user_id', uid).order('updated_at', { ascending: false }),
        db.from('memories').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);

      if (mounted) {
        callbacksRef.current.onAgentsChange?.((agentsRes.data as SyncedAgent[]) || []);
        callbacksRef.current.onWorkflowsChange?.((workflowsRes.data as SyncedWorkflow[]) || []);
        callbacksRef.current.onMemoriesChange?.((memoriesRes.data as SyncedMemory[]) || []);
      }

      // Subscribe to realtime changes on all three tables
      channel = db
        .channel('cross-app-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'agents', filter: `user_id=eq.${uid}` },
          async () => {
            const { data } = await db.from('agents').select('*').eq('user_id', uid).order('created_at', { ascending: false });
            callbacksRef.current.onAgentsChange?.((data as SyncedAgent[]) || []);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'workflows', filter: `user_id=eq.${uid}` },
          async () => {
            const { data } = await db.from('workflows').select('*').eq('user_id', uid).order('updated_at', { ascending: false });
            callbacksRef.current.onWorkflowsChange?.((data as SyncedWorkflow[]) || []);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'memories', filter: `user_id=eq.${uid}` },
          async () => {
            const { data } = await db.from('memories').select('*').eq('user_id', uid).order('created_at', { ascending: false });
            callbacksRef.current.onMemoriesChange?.((data as SyncedMemory[]) || []);
          }
        )
        .subscribe();

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
      channel?.unsubscribe();
    };
  }, []);

  const upsertAgent = useCallback(async (agent: Partial<SyncedAgent>) => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from('agents')
      .upsert({ ...agent, user_id: userId })
      .select()
      .single();
    if (error) console.error('upsertAgent error:', error);
    return data;
  }, [userId]);

  const deleteAgent = useCallback(async (agentId: string) => {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)
      .eq('user_id', userId);
    if (error) console.error('deleteAgent error:', error);
  }, [userId]);

  const upsertWorkflow = useCallback(async (workflow: Partial<SyncedWorkflow>) => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from('workflows')
      .upsert({ ...workflow, user_id: userId })
      .select()
      .single();
    if (error) console.error('upsertWorkflow error:', error);
    return data;
  }, [userId]);

  const deleteWorkflow = useCallback(async (workflowId: string) => {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', workflowId)
      .eq('user_id', userId);
    if (error) console.error('deleteWorkflow error:', error);
  }, [userId]);

  const upsertMemory = useCallback(async (memory: Partial<SyncedMemory>) => {
    if (!userId || !supabase) return;
    const { data, error } = await supabase
      .from('memories')
      .upsert({ ...memory, user_id: userId })
      .select()
      .single();
    if (error) console.error('upsertMemory error:', error);
    return data;
  }, [userId]);

  const deleteMemory = useCallback(async (memoryId: string) => {
    if (!userId || !supabase) return;
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId)
      .eq('user_id', userId);
    if (error) console.error('deleteMemory error:', error);
  }, [userId]);

  return {
    userId,
    loading,
    upsertAgent,
    deleteAgent,
    upsertWorkflow,
    deleteWorkflow,
    upsertMemory,
    deleteMemory,
  };
}
