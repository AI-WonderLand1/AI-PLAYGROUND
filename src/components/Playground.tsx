import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Terminal, Copy, Check, Code, MessageSquare } from 'lucide-react';
import { Message, AIModule } from '../types';
import { ResponseView } from './ResponseView';
import { RobotScene } from './RobotScene';
import { cn, getOpenRouterModel } from '../utils';
import { isCustomModel, getCustomProviderForModel, callCustomProvider } from '../lib/providers/registry';
import { logUsage } from '../lib/usageTracker';
import { supabase, getSession } from '../lib/supabase';
import { testAgent } from '../lib/agentVaultClient';

interface PlaygroundProps {
  module: AIModule;
}

export function Playground({ module }: PlaygroundProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; cost?: number} | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const contentRef = useRef('');
  const lastUpdateRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    const refs = timeoutsRef;
    return () => { refs.current.forEach(clearTimeout); refs.current = []; };
  }, []);

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      fn();
    }, ms);
    timeoutsRef.current.push(id);
  }, []);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = module.config;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status !== 429 && res.status !== 503) return res;
      if (attempt === maxRetries) return res;
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`Rate-limited (${res.status}), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
    }
    return new Response(null, { status: 503 });
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construct few-shot prompt if training examples exist
      let prompt = input;
      if (module.training.length > 0) {
        const trainingText = module.training
          .filter(ex => ex.user && ex.model)
          .map(ex => `User: ${ex.user}\nModel: ${ex.model}`)
          .join('\n\n');
        prompt = `${trainingText}\n\nUser: ${input}\nModel:`;
      }

      // Saved agents run through an owner-scoped, server-decrypted credential.
      // Never fall back to a browser-stored provider key for a saved agent.
      const session = await getSession();
      if (session?.user && supabase) {
        const { data: agent, error: lookupError } = await supabase.from('agents')
          .select('credential_id').eq('id', module.id).eq('user_id', session.user.id).maybeSingle();
        if (lookupError) throw new Error('Could not verify your agent credential.');
        if (agent) {
          if (!agent.credential_id) throw new Error('This agent needs a credential. Open Agent Library to configure it.');
          const transcript = [...messages.slice(-6).map(m => m.role + ': ' + m.content), 'user: ' + prompt].join('\n');
          const output = await testAgent({
            credentialId: agent.credential_id, model: config.model,
            systemInstruction: config.systemInstruction || '', prompt: transcript.slice(-4000),
          });
          if (!output.trim()) throw new Error('The provider returned an empty response.');
          setMessages(prev => [...prev, { role: 'assistant', content: output, timestamp: Date.now() }]);
          return;
        }
      }

      throw new Error('This is an unsaved demo agent. Open Agent Library, choose an agent, add an encrypted credential, test, and publish it before chatting.');
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Error: " + (error instanceof Error ? error.message : "Unknown error"),
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${window.location.origin}" width="100%" height="600px" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    safeTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] relative overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[#E4E3E0]" />
          <div className="flex flex-col">
            <h1 className="font-serif italic text-xs text-[#E4E3E0] uppercase tracking-widest leading-none mb-1">{module.name}</h1>
            <span className="text-[9px] font-mono text-[#555] uppercase tracking-tighter">{config.model}</span>
          </div>
        </div>
        
        <button 
          onClick={copyEmbedCode}
          className="flex items-center gap-2 px-2 py-1 border border-[#2a2a2a] text-[9px] font-mono text-[#888] hover:text-[#E4E3E0] hover:border-[#E4E3E0] transition-all"
        >
          {copied ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}
          {copied ? 'COPIED!' : 'EMBED'}
        </button>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {config.showRobot && (
          <div className="w-full h-[300px] border border-[#2a2a2a] mb-6 bg-[#141414] overflow-hidden group relative shrink-0">
            <RobotScene isThinking={isLoading} isSpeaking={isSpeaking} />
          </div>
        )}

        {messages.length === 0 && !config.showRobot && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <div className="w-12 h-12 border border-[#E4E3E0] rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-[#E4E3E0]" />
            </div>
            <p className="font-serif italic text-sm text-[#E4E3E0]">Ready for input</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isLastModelStreaming = isStreaming && msg.role === 'assistant' && idx === messages.length - 1;
          return (
          <div 
            key={idx} 
            className={cn(
              "flex flex-col gap-2 max-w-full",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className="flex items-center gap-2 px-1">
              <span className="text-[8px] font-mono text-[#444] uppercase tracking-widest">
                {msg.role === 'user' ? 'Input' : 'Response'}
              </span>
              {msg.role === 'assistant' && msg.content && usageInfo && !isStreaming && idx === messages.length - 1 && (
                <span className="text-[8px] font-mono text-[#555]">
                  ↑ {usageInfo.prompt_tokens ?? '?'} · ↓ {usageInfo.completion_tokens ?? '?'} · {usageInfo.total_tokens ?? '?'}t{usageInfo.cost ? ` · $${usageInfo.cost.toFixed(6)}` : ''}
                </span>
              )}
            </div>
            <div className={cn(
              "p-3 border transition-all duration-300 w-fit max-w-[90%]",
              msg.role === 'user' 
                ? "bg-[#141414] border-[#2a2a2a] text-[#E4E3E0]" 
                : "bg-transparent border-[#2a2a2a] text-[#E4E3E0]"
            )}>
              {msg.role === 'user' ? (
                <p className="text-xs font-sans whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ResponseView content={msg.content} isStreaming={isLastModelStreaming} />
              )}
            </div>
          </div>
          );
        })}
        {isLoading && (
          <div className="flex flex-col gap-2 items-start animate-pulse">
             <span className="text-[8px] font-mono text-[#444] uppercase tracking-widest px-1">Processing...</span>
             <div className="p-3 border border-[#2a2a2a] w-24 h-10 bg-transparent"></div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-[#2a2a2a] bg-[#0a0a0a] shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Enter prompt..."
            className="w-full bg-[#141414] border border-[#2a2a2a] p-3 pr-12 text-xs text-[#E4E3E0] font-sans focus:outline-none focus:border-[#E4E3E0] transition-all min-h-[60px] max-h-[150px] resize-none"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="absolute right-3 bottom-3 p-1.5 bg-red-500 text-white hover:bg-red-400 transition-all"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 p-1.5 bg-[#E4E3E0] text-[#141414] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
