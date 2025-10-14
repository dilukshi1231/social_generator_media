import { create } from 'zustand';
import { User, Content, SocialAccount, Post } from '@/types';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false });
  },
}));

interface ContentStore {
  contents: Content[];
  selectedContent: Content | null;
  setContents: (contents: Content[]) => void;
  setSelectedContent: (content: Content | null) => void;
  addContent: (content: Content) => void;
  updateContent: (id: number, updates: Partial<Content>) => void;
  removeContent: (id: number) => void;
}

export const useContentStore = create<ContentStore>((set) => ({
  contents: [],
  selectedContent: null,
  setContents: (contents) => set({ contents }),
  setSelectedContent: (content) => set({ selectedContent: content }),
  addContent: (content) =>
    set((state) => ({ contents: [content, ...state.contents] })),
  updateContent: (id, updates) =>
    set((state) => ({
      contents: state.contents.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      selectedContent:
        state.selectedContent?.id === id
          ? { ...state.selectedContent, ...updates }
          : state.selectedContent,
    })),
  removeContent: (id) =>
    set((state) => ({
      contents: state.contents.filter((c) => c.id !== id),
      selectedContent: state.selectedContent?.id === id ? null : state.selectedContent,
    })),
}));

interface SocialAccountsStore {
  accounts: SocialAccount[];
  setAccounts: (accounts: SocialAccount[]) => void;
  addAccount: (account: SocialAccount) => void;
  removeAccount: (id: number) => void;
}

export const useSocialAccountsStore = create<SocialAccountsStore>((set) => ({
  accounts: [],
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
  removeAccount: (id) =>
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
}));

interface PostsStore {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: number, updates: Partial<Post>) => void;
}

export const usePostsStore = create<PostsStore>((set) => ({
  posts: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
}));