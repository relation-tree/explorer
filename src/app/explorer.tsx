import { PageShell } from './components/pageShell';
import { useContext, useState } from 'react';
import { AppContext } from './utils/appContext';
import GraphView3D from './components/graphView3D';
import { useDirectoryGraph } from './usefuls/useDirectoryGraph';
import { DirectoryTreeView } from './components/directoryTreeView';

const Explorer = () => {
  const { rankingFilter, viewMode, setViewMode } = useContext(AppContext);

  const [peekGraphKey, setPeekGraphKey] = useState<string | null | undefined>();

  const whichKey =
    peekGraphKey || '0000000000000000000000000000000000000000000=';

  //Todo: handle inv_block updater in useGrapPath()
  const { graph, normalizedGraph } = useDirectoryGraph(whichKey);

  return (
    <PageShell
      tools={[
        {
          label: 'Toggle View',
          action: () =>
            setViewMode(viewMode === 'graph3d' ? 'tree' : 'graph3d'),
        },
      ]}
      renderBody={() => (
        <>
          {!!whichKey && (
            <>
              {!!graph && (
                <>
                  {viewMode === 'graph3d' ? (
                    <GraphView3D
                      forKey={whichKey}
                      graph={graph}
                      setForKey={setPeekGraphKey}
                      rankingFilter={rankingFilter}
                    />
                  ) : (
                    <DirectoryTreeView
                      forKey={whichKey}
                      setForKey={setPeekGraphKey}
                      normalizedGraph={normalizedGraph}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Explorer;
