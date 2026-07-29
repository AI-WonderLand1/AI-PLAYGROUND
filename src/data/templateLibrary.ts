export interface LibTemplate {
  file: string;
  name: string;
  slug: string;
  visibility: 'public' | 'private';
  description: string;
  tags: string[];
  todo: TodoItem[];
  size: number;
  modified: number;
}

export interface TodoItem {
  text: string;
  done: boolean;
}

const LS_KEY = 'wonderland_template_library';

export function loadLocalState(): Record<string, any> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveLocalState(state: Record<string, any>) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}