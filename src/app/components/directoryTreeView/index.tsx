import { useMemo, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { chevronForward, chevronDown } from 'ionicons/icons';
import { NormalizedGraph } from '../../state/graphStore';
import { toDirectoryEntry } from '../../domain/directoryEntry';
import { shortenB64 } from '../../utils/compat';

interface DirectoryTreeViewProps {
  forKey: string;
  setForKey: (pk: string) => void;
  normalizedGraph?: NormalizedGraph;
}

export const DirectoryTreeView = ({
  forKey,
  setForKey,
  normalizedGraph,
}: DirectoryTreeViewProps) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const rootNode = normalizedGraph?.nodesByPubKey.get(forKey);

  const rootEntry = useMemo(() => {
    if (!normalizedGraph || !rootNode) return null;
    return toDirectoryEntry(
      rootNode,
      normalizedGraph.incoming.get(rootNode.id),
      normalizedGraph.outgoing.get(rootNode.id),
    );
  }, [normalizedGraph, rootNode]);

  const neighbors = useMemo(() => {
    if (!normalizedGraph || !rootNode) return [];
    const outgoingLinks = normalizedGraph.outgoing.get(rootNode.id) ?? [];
    const incomingLinks = normalizedGraph.incoming.get(rootNode.id) ?? [];

    const uniqueIds = new Set<number>();
    const collect = (links: typeof outgoingLinks, fromSource: boolean) =>
      links
        .map((link) => ({
          link,
          nodeId: fromSource ? link.target : link.source,
        }))
        .filter(({ nodeId }) => {
          if (uniqueIds.has(nodeId)) return false;
          uniqueIds.add(nodeId);
          return true;
        });

    return [...collect(outgoingLinks, true), ...collect(incomingLinks, false)]
      .map(({ nodeId, link }) => {
        const node = normalizedGraph.nodesById.get(nodeId);
        if (!node) return null;
        return {
          link,
          entry: toDirectoryEntry(
            node,
            normalizedGraph.incoming.get(node.id),
            normalizedGraph.outgoing.get(node.id),
          ),
        };
      })
      .filter(Boolean) as {
      link: typeof outgoingLinks[number];
      entry: ReturnType<typeof toDirectoryEntry>;
    }[];
  }, [normalizedGraph, rootNode]);

  const toggleExpanded = (nodeId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (!rootEntry || !normalizedGraph) return null;

  return (
    <IonCard>
      <IonCardHeader className="ion-padding-horizontal">
        <IonCardSubtitle className="ion-no-padding">
          <IonBadge color="primary">{neighbors.length} peers</IonBadge>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <TreeRow
            entry={rootEntry}
            onSelect={() => setForKey(rootEntry.pubkey)}
            onToggle={() => toggleExpanded(rootEntry.id)}
            isExpanded={expanded.has(rootEntry.id)}
            isRoot
          />
          {expanded.has(rootEntry.id) &&
            neighbors.map(({ entry }) => (
              <TreeRow
                key={entry.id}
                entry={entry}
                depth={1}
                onSelect={() => setForKey(entry.pubkey)}
                onToggle={() => toggleExpanded(entry.id)}
                isExpanded={expanded.has(entry.id)}
              />
            ))}
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};

interface TreeRowProps {
  entry: ReturnType<typeof toDirectoryEntry>;
  onSelect: () => void;
  onToggle: () => void;
  isExpanded: boolean;
  depth?: number;
  isRoot?: boolean;
}

const TreeRow = ({
  entry,
  onSelect,
  onToggle,
  isExpanded,
  depth = 0,
  isRoot = false,
}: TreeRowProps) => {
  const paddingStart = 12 + depth * 12;
  return (
    <IonItem
      button
      detail={false}
      onClick={onSelect}
      style={{ paddingInlineStart: paddingStart }}
    >
      <IonButton
        fill="clear"
        slot="start"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <IonIcon
          icon={isExpanded ? chevronDown : chevronForward}
          slot="icon-only"
        />
      </IonButton>
      <IonLabel>
        <strong>{entry.displayName}</strong>
        <p>{entry.label ? entry.pubkey : shortenB64(entry.pubkey)}</p>
      </IonLabel>
      <IonNote slot="end">
        <IonBadge color={isRoot ? 'primary' : 'tertiary'}>
          {entry.attentionPct.toFixed(2)}%
        </IonBadge>
      </IonNote>
    </IonItem>
  );
};
