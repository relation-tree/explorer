import { DirectoryGraph, GraphLink, GraphNode } from '../utils/appTypes';

export interface NormalizedGraph {
  raw: DirectoryGraph;
  nodesById: Map<number, GraphNode>;
  nodesByPubKey: Map<string, GraphNode>;
  incoming: Map<number, GraphLink[]>;
  outgoing: Map<number, GraphLink[]>;
}

export class GraphStore {
  private cache = new Map<string, NormalizedGraph>();

  keyFor(directoryId: string, publicKey: string, rankingFilter: number) {
    return `${directoryId}|${publicKey}|${rankingFilter}`;
  }

  setGraph(key: string, raw: DirectoryGraph): NormalizedGraph {
    const normalized = normalizeGraph(raw);
    this.cache.set(key, normalized);
    return normalized;
  }

  getGraph(key: string): NormalizedGraph | undefined {
    return this.cache.get(key);
  }
}

export const normalizeGraph = (graph: DirectoryGraph): NormalizedGraph => {
  const nodesById = new Map<number, GraphNode>();
  const nodesByPubKey = new Map<string, GraphNode>();
  const incoming = new Map<number, GraphLink[]>();
  const outgoing = new Map<number, GraphLink[]>();

  graph.nodes.forEach((node) => {
    nodesById.set(node.id, node);
    nodesByPubKey.set(node.pubkey, node);
  });

  graph.links.forEach((link) => {
    const from = outgoing.get(link.source) ?? [];
    const to = incoming.get(link.target) ?? [];
    outgoing.set(link.source, [...from, link]);
    incoming.set(link.target, [...to, link]);
  });

  return { raw: graph, nodesById, nodesByPubKey, incoming, outgoing };
};
