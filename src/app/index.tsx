import { IonApp, setupIonicReact } from '@ionic/react';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

import { useState, useEffect, useMemo } from 'react';
import { AppContext } from './utils/appContext';
import { DEFAULT_CRUZBIT_NODE, DEFAULT_DIRECTORY_ID } from './utils/constants';
import Explorer from './explorer';
import { GraphClient } from './data/graphClient';
import { GraphStore } from './state/graphStore';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => {
  const [selectedDirectory, setSelectedDirectory] = useState(
    DEFAULT_DIRECTORY_ID,
  );

  const [rankingFilter, setRankingFilter] = useState(0);
  const [viewMode, setViewMode] = useState<'graph3d' | 'tree'>('graph3d');
  const graphClient = useMemo(
    () => new GraphClient(`wss://${DEFAULT_CRUZBIT_NODE}`),
    [],
  );
  const graphStore = useMemo(() => new GraphStore(), []);

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
    prefersDark.matches ? 'dark' : 'light',
  );

  useEffect(() => {
    const eventHandler = (mediaQuery: MediaQueryListEvent) =>
      setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    prefersDark.addEventListener('change', eventHandler);

    return () => {
      prefersDark.removeEventListener('change', eventHandler);
    };
  }, [prefersDark, setColorScheme]);

  const appState = {
    graphClient,
    graphStore,
    rankingFilter,
    setRankingFilter,
    selectedDirectory,
    setSelectedDirectory,
    colorScheme,
    viewMode,
    setViewMode,
  };

  useEffect(() => {
    graphClient.connect();
    return () => graphClient.close();
  }, [graphClient]);

  return (
    <AppContext.Provider value={appState}>
      <IonApp>
        <Explorer />
        <div id="fg-portal"></div>
      </IonApp>
    </AppContext.Provider>
  );
};

export default App;
