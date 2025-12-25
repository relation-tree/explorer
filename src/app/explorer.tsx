import { PageShell } from './components/pageShell';
import { useContext, useMemo, useState } from 'react';
import { AppContext } from './utils/appContext';
import GraphView3D from './components/graphView3D';
import { useDirectoryGraph } from './usefuls/useDirectoryGraph';
import { DirectoryTreeView } from './components/directoryTreeView';
import { toDirectoryEntry } from './domain/directoryEntry';
import { IonIcon, IonLabel } from '@ionic/react';
import { folderOutline, gitNetworkOutline } from 'ionicons/icons';

const Explorer = () => {
  const { rankingFilter, viewMode, setViewMode } = useContext(AppContext);

  const [peekGraphKey, setPeekGraphKey] = useState<string | null | undefined>();

  const whichKey =
    peekGraphKey || '0000000000000000000000000000000000000000000=';

  //Todo: handle inv_block updater in useGrapPath()
  const { graph, normalizedGraph } = useDirectoryGraph(whichKey);

  const incomingEntries = useMemo(() => {
    if (!normalizedGraph) return [];
    const rootNode = normalizedGraph.nodesByPubKey.get(whichKey);
    if (!rootNode) return [];

    const incomingLinks = normalizedGraph.incoming.get(rootNode.id) ?? [];
    const seen = new Set<number>();

    const entries = incomingLinks
      .map((link) => {
        const node = normalizedGraph.nodesById.get(link.source);
        if (!node || seen.has(node.id)) return null;
        seen.add(node.id);
        return toDirectoryEntry(
          node,
          normalizedGraph.incoming.get(node.id),
          normalizedGraph.outgoing.get(node.id),
        );
      })
      .filter(Boolean) as ReturnType<typeof toDirectoryEntry>[];

    return entries.sort(
      (a, b) =>
        b.attentionPct - a.attentionPct ||
        a.displayName.localeCompare(b.displayName),
    );
  }, [normalizedGraph, whichKey]);

  return (
    <PageShell
      headerTools={[
        {
          action: () =>
            setViewMode(viewMode === 'graph3d' ? 'tree' : 'graph3d'),
          key: 'toggle-view',
          renderIcon: () => (
            <>
              <IonIcon
                slot="start"
                icon={viewMode === 'graph3d' ? folderOutline : gitNetworkOutline}
              />
              <IonLabel>
                {viewMode === 'graph3d' ? 'As list' : 'As tree'}
              </IonLabel>
            </>
          ),
        },
      ]}
      tools={
        viewMode === 'tree'
          ? incomingEntries.map((entry) => ({
              label: `${entry.displayName} (${entry.attentionPct.toFixed(1)}%)`,
              action: () => setPeekGraphKey(entry.pubkey),
              key: entry.pubkey,
            }))
          : []
      }
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
