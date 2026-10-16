import React, { useEffect, useState } from 'react';
import { getSession } from '../lib/supabase';
type Usage = { plan: string; period_reset: string; tokens_used: number; render_credits_used: number; purchased_tokens: number; purchased_render_credits: number; recent_activity: Array<{ source: string; action: string; tokens_used: number; render_credits_used: number; api_calls: number; created_at: string }> };
export function ActivityView() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null); setUsage(null);
    void (async () => {
      try {
        const session = await getSession();
        if (!session?.access_token) throw new Error('Sign in to view your account activity.');
        const response = await fetch('/api/account/usage', { headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal });
        const body = await response.json().catch(() => null);
        if (!response.ok || body?.ok !== true || !body.usage) throw new Error(body?.error || 'Account usage is unavailable.');
        if (!controller.signal.aborted) setUsage(body.usage);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Account usage is unavailable.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [refresh]);
  return <section className="mx-auto w-full max-w-6xl space-y-6 p-6 text-slate-100">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold">Account activity</h1><p className="mt-2 text-sm text-slate-400">Recorded usage across AI WONDERLAND apps.</p></div><button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="rounded-lg border border-slate-700 px-4 py-2 disabled:opacity-50">Refresh</button></div>
    {loading && <p role="status">Loading account usage…</p>}
    {error && <p role="alert" className="rounded-lg border border-amber-700 p-4">{error}</p>}
    {usage && <><p className="text-sm text-slate-400">{usage.plan} plan · Current UTC billing month · Resets {new Date(usage.period_reset).toLocaleDateString()}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([['AI credits used', usage.tokens_used], ['3D credits used', usage.render_credits_used], ['Purchased AI balance', usage.purchased_tokens], ['Purchased 3D balance', usage.purchased_render_credits]] as const).map(([label, value]) => <div key={label} className="rounded-xl border border-slate-700 bg-slate-900 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-3xl">{value.toLocaleString()}</p></div>)}</div>
      <p className="text-sm text-slate-400">Credits include reserved budgets and model multipliers. They are not an invoice or an exact token count.</p>
      <div className="overflow-x-auto rounded-xl border border-slate-700"><table className="w-full text-left text-sm"><caption className="p-4 text-left font-semibold">Recent usage reservations</caption><thead><tr>{['Time', 'App', 'Feature', 'Credits / requests'].map(label => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{usage.recent_activity.map((event, index) => <tr key={`${event.created_at}-${index}`} className="border-t border-slate-800"><td className="p-3">{new Date(event.created_at).toLocaleString()}</td><td className="p-3">{event.source}</td><td className="p-3">{event.action}</td><td className="p-3">{(event.tokens_used || event.render_credits_used || event.api_calls).toLocaleString()}</td></tr>)}</tbody></table>{!usage.recent_activity.length && <p className="p-4">No usage recorded this month.</p>}</div>
    </>}
  </section>;
}
