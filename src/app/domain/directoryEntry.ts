import { GraphLink, GraphNode } from '../utils/appTypes';
import { shortenB64 } from '../utils/compat';

export interface DirectoryEntry {
  id: number;
  pubkey: string;
  label?: string;
  memo?: string;
  attentionPct: number;
  displayName: string;
  abbreviatedKey: string;
  incomingCount: number;
  outgoingCount: number;
}

export const toDirectoryEntry = (
  node: GraphNode,
  incoming: GraphLink[] = [],
  outgoing: GraphLink[] = [],
): DirectoryEntry => {
  const abbreviatedKey = shortenB64(node.pubkey);
  return {
    id: node.id,
    pubkey: node.pubkey,
    label: node.label,
    memo: node.memo,
    attentionPct: Number((node.ranking ?? 0) * 100),
    displayName: node.label || abbreviatedKey,
    abbreviatedKey,
    incomingCount: incoming.length,
    outgoingCount: outgoing.length,
  };
};
