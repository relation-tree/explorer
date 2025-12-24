import { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../utils/appContext';
import { DirectoryGraph, GraphNode } from '../utils/appTypes';
import { NormalizedGraph } from '../state/graphStore';
import { shortenB64 } from '../utils/compat';

export const useDirectoryGraph = (pubKey: string) => {
  const {
    graphClient,
    graphStore,
    selectedDirectory,
    rankingFilter,
  } = useContext(AppContext);

  const [graph, setGraph] = useState<DirectoryGraph>();
  const [normalized, setNormalized] = useState<NormalizedGraph>();
  const cacheKey = useMemo(
    () => graphStore.keyFor(selectedDirectory, pubKey, rankingFilter),
    [graphStore, pubKey, rankingFilter, selectedDirectory],
  );

  useEffect(() => {
    const cached = graphStore.getGraph(cacheKey);
    if (cached) {
      setGraph(cached.raw);
      setNormalized(cached);
    }
  }, [cacheKey, graphStore]);

  useEffect(() => {
    if (!pubKey) return;
    const unsubscribe = graphClient.subscribeToGraph(
      pubKey,
      selectedDirectory,
      rankingFilter,
      (data) => {
        setGraph(data);
        const normalizedGraph = graphStore.setGraph(cacheKey, data);
        setNormalized(normalizedGraph);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [cacheKey, graphClient, graphStore, pubKey, rankingFilter, selectedDirectory]);

  const pkNode =
    normalized?.nodesByPubKey.get(pubKey) ??
    graph?.nodes.find((n) => n.pubkey === pubKey) ??
    null;

  const paths = useMemo(() => {
    if (!normalized) return [];
    return normalized.raw.links.map((link) => ({
      ...link,
      from: nodeName(link.source, normalized.raw.nodes),
      to: nodeName(link.target, normalized.raw.nodes),
    }));
  }, [normalized]);

  return { graph, normalizedGraph: normalized, paths, pkNode };
};

function nodeName(linkId: number, nodes: GraphNode[]): string {
  const targetNode = nodes.find((n) => n.id === linkId);
  if (!targetNode) return 'unknown';
  return targetNode.label || shortenB64(targetNode.pubkey);
}
