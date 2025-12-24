import { createContext } from 'react';
import { GraphClient } from '../data/graphClient';
import { GraphStore } from '../state/graphStore';

interface AppState {
  graphClient: GraphClient;
  graphStore: GraphStore;
  rankingFilter: number;
  setRankingFilter: (rankingFilter: number) => void;
  selectedDirectory: string;
  setSelectedDirectory: (node: string) => void;
  colorScheme: 'light' | 'dark';
  viewMode: 'graph3d' | 'tree';
  setViewMode: (mode: 'graph3d' | 'tree') => void;
}

export const AppContext = createContext<AppState>({
  graphClient: new GraphClient(),
  graphStore: new GraphStore(),
  rankingFilter: 0,
  setRankingFilter: () => {},
  selectedDirectory: '',
  setSelectedDirectory: () => {},
  colorScheme: 'light',
  viewMode: 'graph3d',
  setViewMode: () => {},
});
