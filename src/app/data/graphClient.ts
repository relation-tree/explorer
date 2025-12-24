import { DirectoryGraph, GraphLink, GraphNode } from '../utils/appTypes';
import { DEFAULT_CRUZBIT_NODE } from '../utils/constants';
import fromDot from 'ngraph.fromdot';

type GraphSubscriber = {
  rankingFilter: number;
  handler: (graph: DirectoryGraph) => void;
};

export class GraphClient {
  private url: string;
  private protocols: string[];
  private socket: WebSocket | null = null;
  private subscribers: Map<string, Set<GraphSubscriber>> = new Map();
  private pendingRequests: Set<string> = new Set();

  constructor(
    url: string = `wss://${DEFAULT_CRUZBIT_NODE}`,
    protocols: string[] = ['cruzbit.1'],
  ) {
    this.url = url;
    this.protocols = protocols;
  }

  connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.socket = new WebSocket(this.url, this.protocols);

    this.socket.onopen = () => {
      this.flushPendingRequests();
    };

    this.socket.onclose = () => {
      // attempt a simple reconnect
      setTimeout(() => this.connect(), 2000);
    };

    this.socket.onmessage = (event) => {
      try {
        const { type, body } = JSON.parse(event.data);
        if (type !== 'graph') return;

        const subscribers = this.subscribers.get(body.public_key);
        if (!subscribers || subscribers.size === 0) return;

        subscribers.forEach((subscriber) => {
          const parsed = parseGraphDOT(
            body.graph,
            body.public_key,
            subscriber.rankingFilter,
          );
          subscriber.handler({
            public_key: body.public_key,
            nodes: parsed.nodes,
            links: parsed.links,
          });
        });
      } catch (err) {
        console.error('GraphClient message error', err);
      }
    };
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribeToGraph(
    publicKeyB64: string,
    directoryId: string,
    rankingFilter: number,
    handler: (graph: DirectoryGraph) => void,
  ): () => void {
    if (!publicKeyB64) {
      throw new Error('missing publicKey');
    }

    this.connect();
    this.queueGraphRequest(publicKeyB64, directoryId);

    const subscriber: GraphSubscriber = { rankingFilter, handler };
    if (!this.subscribers.has(publicKeyB64)) {
      this.subscribers.set(publicKeyB64, new Set());
    }

    this.subscribers.get(publicKeyB64)!.add(subscriber);

    return () => {
      const subs = this.subscribers.get(publicKeyB64);
      if (!subs) return;
      subs.delete(subscriber);
      if (subs.size === 0) {
        this.subscribers.delete(publicKeyB64);
      }
    };
  }

  private queueGraphRequest(publicKeyB64: string, directoryId: string) {
    const requestKey = `${publicKeyB64}|${directoryId}`;
    this.pendingRequests.add(requestKey);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendGetGraph(publicKeyB64, directoryId);
      this.pendingRequests.delete(requestKey);
    }
  }

  private flushPendingRequests() {
    this.pendingRequests.forEach((req) => {
      const [publicKeyB64, directoryId] = req.split('|');
      this.sendGetGraph(publicKeyB64, directoryId);
      this.pendingRequests.delete(req);
    });
  }

  private sendGetGraph(publicKeyB64: string, directoryId: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(
      JSON.stringify({
        type: 'get_graph',
        body: {
          public_key: publicKeyB64,
          directory_id: directoryId,
        },
      }),
    );
  }
}

export const parseGraphDOT = (
  dotString: string,
  forKey: string,
  rankingFilter: number,
) => {
  const graph = fromDot(dotString || 'digraph{}');

  const nodes: GraphNode[] = [];

  graph.forEachNode((node: any) => {
    const pubkey = node.data.pubkey as string;
    const label = node.data.label as string;
    const ranking = Number(node.data.ranking);
    const memo = node.data.memo as string;

    if (forKey !== pubkey && rankingFilter / 100 > ranking) return;

    nodes.push({
      id: node.id,
      group: 1,
      label,
      pubkey,
      ranking,
      memo,
    });
  });

  const links: GraphLink[] = [];
  graph.forEachLink((link: any) => {
    const source = link.fromId;
    const target = link.toId;

    if (!nodes.map((n) => n.id).includes(source)) return;
    if (!nodes.map((n) => n.id).includes(target)) return;

    links.push({
      source,
      target,
      value: Number(link.data.weight),
      height: Number(link.data.height),
      time: Number(link.data.time),
    });
  });

  return { nodes, links };
};
