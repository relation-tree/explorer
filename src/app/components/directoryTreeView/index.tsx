import { useMemo, useState } from 'react';
import {
  IonCard,
  IonCardContent,
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

  const childrenByNode = useMemo(() => {
    const map = new Map<number, ReturnType<typeof toDirectoryEntry>[]>();
    if (!normalizedGraph) return map;

    normalizedGraph.nodesById.forEach((node) => {
      const outgoingLinks = normalizedGraph.outgoing.get(node.id) ?? [];
      const uniqueIds = new Set<number>();

      const children = outgoingLinks
        .map((link) => {
          const target = normalizedGraph.nodesById.get(link.target);
          if (!target || uniqueIds.has(target.id)) return null;
          uniqueIds.add(target.id);
          return toDirectoryEntry(
            target,
            normalizedGraph.incoming.get(target.id),
            normalizedGraph.outgoing.get(target.id),
          );
        })
        .filter(Boolean) as ReturnType<typeof toDirectoryEntry>[];

      map.set(node.id, children);
    });

    return map;
  }, [normalizedGraph]);

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

  const renderEntry = (
    entry: ReturnType<typeof toDirectoryEntry>,
    depth = 0,
    ancestors: Set<number> = new Set(),
  ) => {
    const children =
      childrenByNode.get(entry.id)?.filter((child) => !ancestors.has(child.id)) ??
      [];
    const hasChildren = children.length > 0;
    const nextAncestors = new Set(ancestors).add(entry.id);

    return (
      <>
        <TreeRow
          entry={entry}
          onSelect={() => setForKey(entry.pubkey)}
          onToggle={() => hasChildren && toggleExpanded(entry.id)}
          isExpanded={expanded.has(entry.id)}
          hasChildren={hasChildren}
          depth={depth}
          isRoot={entry.id === rootEntry.id}
        />
        {hasChildren &&
          expanded.has(entry.id) &&
          children.map((child) => renderEntry(child, depth + 1, nextAncestors))}
      </>
    );
  };

  return (
    <IonCard>
      <IonCardContent>
        <IonList>
          {renderEntry(rootEntry)}
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
  hasChildren: boolean;
}

const TreeRow = ({
  entry,
  onSelect,
  onToggle,
  isExpanded,
  hasChildren,
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
      {hasChildren ? (
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
      ) : (
        <div style={{ width: 40 }} />
      )}
      <IonLabel>
        <strong>{entry.displayName}</strong>
        <p>{entry.memo?.trim() || entry.abbreviatedKey}</p>
      </IonLabel>
      <IonNote slot="end">
        <IonBadge color={isRoot ? 'primary' : 'tertiary'}>
          {entry.attentionPct.toFixed(2)}%
        </IonBadge>
      </IonNote>
    </IonItem>
  );
};
