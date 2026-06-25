import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, ShieldAlert, Copy, Sparkles } from 'lucide-react';
import { cn } from '../utils';

function generateMasterKey(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 4, 12];
  return 'wl-' + segments.map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
}

function getOrCreateMasterKey(): string {
  let key = localStorage.getItem('wonderland_master_key');
  if (!key) {
    key = generateMasterKey();
    localStorage.setItem('wonderland_master_key', key);
  }
  return key;
}

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  const [masterKey, setMasterKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);

  const [openrouterKey, setOpenrouterKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [groqKey, setGroqKey] = useState('');

  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setMasterKey(getOrCreateMasterKey());
      setOpenrouterKey(localStorage.getItem('mc_key_openrouter') || '');
      setOpenaiKey(localStorage.getItem('mc_key_openai') || '');
      setAnthropicKey(localStorage.getItem('mc_key_anthropic') || '');
      setGroqKey(localStorage.getItem('mc_key_groq') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (provider: 'openrouter' | 'openai' | 'anthropic' | 'groq', value: string) => {
    localStorage.setItem(`mc_key_${provider}`, value.trim());
    setSavedStatus(prev => ({ ...prev, [provider]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [provider]: false }));
    }, 2000);
  };

  const handleClear = (provider: 'openrouter' | 'openai' | 'anthropic' | 'groq') => {
    localStorage.removeItem(`mc_key_${provider}`);
    if (provider === 'openrouter') setOpenrouterKey('');
    if (provider === 'openai') setOpenaiKey('');
    if (provider === 'anthropic') setAnthropicKey('');
    if (provider === 'groq') setGroqKey('');
    setSavedStatus(prev => ({ ...prev, [provider]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [provider]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#141414] border border-[#2a2a2a] max-w-md w-full p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#555] hover:text-[#E4E3E0] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[#E4E3E0] mb-2">
          <Key className="w-5 h-5 text-[#b8ff57]" />
          <h3 className="font-serif italic text-sm uppercase tracking-wider">Your Wonderland Key</h3>
        </div>
        <p className="text-[10px] text-[#555] font-mono uppercase tracking-widest mb-5">
          One key for all models. Automatically generated — unique to you.
        </p>

        {/* Master Key Display */}
        <div className="bg-[#0a0a0a] border border-[#b8ff57]/30 p-4 mb-6 rounded-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b8ff57]" />
              <span className="text-[9px] font-mono text-[#b8ff57] uppercase tracking-widest font-bold">Master Key</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(masterKey);
                setKeyCopied(true);
                setTimeout(() => setKeyCopied(false), 2000);
              }}
              className="flex items-center gap-1 text-[9px] font-mono text-[#888] hover:text-[#b8ff57] transition-colors"
            >
              {keyCopied ? <Check className="w-3 h-3 text-[#b8ff57]" /> : <Copy className="w-3 h-3" />}
              <span>{keyCopied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-[#E4E3E0] bg-[#0c0d12] border border-[#1f2235] px-3 py-2.5 tracking-wider select-all break-all">
            {masterKey}
          </div>
          <p className="text-[8px] text-[#555] font-mono mt-2 leading-relaxed">
            This key identifies your session across all AI providers. Models route through the Wonderland unified gateway using your unique identifier.
          </p>
        </div>

        <div className="border-t border-[#1f2235] pt-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-3.5 h-3.5 text-[#555]" />
            <span className="text-[9px] font-mono text-[#555] uppercase tracking-widest">Provider Keys (Optional Fallback)</span>
          </div>
          <p className="text-[8px] text-[#555] font-mono mb-4">
            Only needed if you want direct API calls instead of Wonderland routing.
          </p>
        </div>

        <div className="space-y-6">
          {/* OpenRouter Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-mono text-[#888] uppercase tracking-wider">OpenRouter API Key (Unified Gateway)</label>
              {openrouterKey && (
                <span className="text-[8px] font-mono text-[#00e5a0] uppercase tracking-widest">Active</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showOpenrouter ? 'text' : 'password'}
                placeholder="sk-or-v1-..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2.5 pr-20 focus:outline-none focus:border-[#b8ff57] font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOpenrouter(!showOpenrouter)}
                  className="p-1 text-[#555] hover:text-[#888]"
                >
                  {showOpenrouter ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('openrouter', openrouterKey)}
                  className="bg-[#2a2a2a] hover:bg-[#b8ff57] hover:text-[#0a0a0a] text-xs font-mono text-[#888] px-2 py-1 transition-all"
                >
                  {savedStatus['openrouter'] ? 'SAVED' : 'SAVE'}
                </button>
              </div>
            </div>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-mono text-[#888] uppercase tracking-wider">OpenAI API Key (ChatGPT)</label>
              {openaiKey && (
                <span className="text-[8px] font-mono text-[#00e5a0] uppercase tracking-widest">Active</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showOpenai ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2.5 pr-20 focus:outline-none focus:border-[#b8ff57] font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="p-1 text-[#555] hover:text-[#888]"
                >
                  {showOpenai ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('openai', openaiKey)}
                  className="bg-[#2a2a2a] hover:bg-[#b8ff57] hover:text-[#0a0a0a] text-xs font-mono text-[#888] px-2 py-1 transition-all"
                >
                  {savedStatus['openai'] ? 'SAVED' : 'SAVE'}
                </button>
              </div>
            </div>
          </div>

          {/* Anthropic Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-mono text-[#888] uppercase tracking-wider">Anthropic API Key (Claude)</label>
              {anthropicKey && (
                <span className="text-[8px] font-mono text-[#00e5a0] uppercase tracking-widest">Active</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showAnthropic ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2.5 pr-20 focus:outline-none focus:border-[#b8ff57] font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="p-1 text-[#555] hover:text-[#888]"
                >
                  {showAnthropic ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('anthropic', anthropicKey)}
                  className="bg-[#2a2a2a] hover:bg-[#b8ff57] hover:text-[#0a0a0a] text-xs font-mono text-[#888] px-2 py-1 transition-all"
                >
                  {savedStatus['anthropic'] ? 'SAVED' : 'SAVE'}
                </button>
              </div>
            </div>
          </div>

          {/* Groq Key */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] font-mono text-[#888] uppercase tracking-wider">Groq API Key (Llama / Gemma)</label>
              {groqKey && (
                <span className="text-[8px] font-mono text-[#00e5a0] uppercase tracking-widest">Active</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showGroq ? 'text' : 'password'}
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-xs text-[#E4E3E0] p-2.5 pr-20 focus:outline-none focus:border-[#b8ff57] font-mono"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowGroq(!showGroq)}
                  className="p-1 text-[#555] hover:text-[#888]"
                >
                  {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('groq', groqKey)}
                  className="bg-[#2a2a2a] hover:bg-[#b8ff57] hover:text-[#0a0a0a] text-xs font-mono text-[#888] px-2 py-1 transition-all"
                >
                  {savedStatus['groq'] ? 'SAVED' : 'SAVE'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 p-3 border border-[#2a2a2a] bg-[#0d0d0d] rounded-sm items-start">
          <ShieldAlert className="w-4 h-4 text-[#ffc147] shrink-0 mt-0.5" />
          <p className="text-[9px] text-[#555] font-mono leading-relaxed uppercase">
            Your Wonderland Master Key identifies your session. The OpenRouter key enables real model routing across 400+ models. Provider keys (below) are only for direct API access without OpenRouter.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#E4E3E0] text-[#141414] text-xs font-mono py-2.5 font-bold transition-all uppercase tracking-wider mt-6 hover:bg-white"
        >
          CONFIRM SETUP
        </button>
      </div>
    </div>
  );
}
