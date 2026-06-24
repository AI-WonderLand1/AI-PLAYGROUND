import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
import { cn } from '../utils';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiKeysModal({ isOpen, onClose }: ApiKeysModalProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [groqKey, setGroqKey] = useState('');

  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setOpenaiKey(localStorage.getItem('mc_key_openai') || '');
      setAnthropicKey(localStorage.getItem('mc_key_anthropic') || '');
      setGroqKey(localStorage.getItem('mc_key_groq') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (provider: 'openai' | 'anthropic' | 'groq', value: string) => {
    localStorage.setItem(`mc_key_${provider}`, value.trim());
    setSavedStatus(prev => ({ ...prev, [provider]: true }));
    setTimeout(() => {
      setSavedStatus(prev => ({ ...prev, [provider]: false }));
    }, 2000);
  };

  const handleClear = (provider: 'openai' | 'anthropic' | 'groq') => {
    localStorage.removeItem(`mc_key_${provider}`);
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
          <h3 className="font-serif italic text-sm uppercase tracking-wider">Provider Keys (Device-Only)</h3>
        </div>
        <p className="text-[10px] text-[#555] font-mono uppercase tracking-widest mb-6">
          Stored locally in your browser. Sent directly to API endpoints.
        </p>

        <div className="space-y-6">
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
            If a key is missing for your selected provider, the Playground will automatically fall back to Gemini model preview simulation to maintain robust execution context.
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
