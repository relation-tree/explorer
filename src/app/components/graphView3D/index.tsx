import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonRange,
  useIonModal,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import ForceGraph3D from 'react-force-graph-3d';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import {
  optionsOutline,
  addCircleOutline,
  discOutline,
  sunnyOutline,
  chevronExpandOutline,
} from 'ionicons/icons';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';
import { GraphLink, GraphNode, DirectoryGraph } from '../../utils/appTypes';
import { useContainerRect } from '../../usefuls/useContainerRect';
import { useNodeViewer } from '../nodeViewer';

const NODE_R = 3;
const extraRenderers = [new CSS2DRenderer()];

interface GraphView3DProps {
  forKey: string;
  setForKey: (pk: string) => void;
  graph?: DirectoryGraph;
  rankingFilter: number;
}

const GraphView3D = ({
  forKey,
  setForKey,
  graph,
  rankingFilter,
}: GraphView3DProps) => {
  const [presentKV] = useNodeViewer(forKey);

  const nodes = graph?.nodes ?? [];
  const links = graph?.links ?? [];

  const handleNodeFocus = useCallback(
    (node: any, clicked: boolean = false) => {
      if (node?.pubkey === forKey && clicked) {
        presentKV({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      } else {
        setForKey(node?.pubkey);
      }
    },
    [forKey, setForKey, presentKV],
  );

  const initialNode = useMemo(
    () => nodes.find((n) => n.pubkey === forKey),
    [nodes, forKey],
  );

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const forceRef = useRef<any>();

  const maxWeight = useMemo(
    () => Math.max(...links.map((l) => l.value), 1),
    [links],
  );

  const [present, dismiss] = useIonModal(Filters, {
    onDismiss: () => dismiss(),
    value: rankingFilter,
  });

  const { ref, rect } = useContainerRect<HTMLDivElement>();
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>(
    {
      nodes: [],
      links: [],
    },
  );

  useIonViewWillEnter(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'block'; // Show portal container
    }
  }, []);

  useIonViewWillLeave(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'none'; // Remove portal container
    }
  }, []);

  const deflateNodes = () => {
    setData(() => {
      const incomingLinks = links
        .filter((l) => l.target === initialNode?.id)
        .sort((a, b) =>
          a.height !== b.height ? b.height - a.height : b.time - a.time,
        );
      const latestLink = incomingLinks[0];

      if (!latestLink || !initialNode) {
        return {
          nodes: initialNode ? [initialNode] : [],
          links: [],
        };
      }

      const sourceNode = nodes.find((n) => n.id === latestLink.source);

      return {
        nodes: sourceNode ? [sourceNode, initialNode] : [initialNode],
        links: [latestLink],
      };
    });
  };

  const inflateNodes = useCallback(() => {
    setData({
      nodes,
      links,
    });
  }, [nodes, links, setData]);

  useEffect(() => {
    inflateNodes();
  }, [inflateNodes]);

  return (
    <IonCard>
      <IonCardHeader className="ion-padding-horizontal">
        <IonCardSubtitle className="ion-no-padding">
          <IonButton
            className="ion-no-padding"
            fill="clear"
            onClick={(e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }}
          >
            <IonIcon color="primary" slot="icon-only" icon={optionsOutline} />
            <IonBadge
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                opacity: 0.9,
              }}
              className="ion-no-padding"
              color="danger"
            ></IonBadge>
          </IonButton>
          <IonButton onClick={() => deflateNodes()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={discOutline}
            />
          </IonButton>
          <IonButton onClick={() => inflateNodes()} fill="clear">
            <IonIcon
              className="ion-no-padding"
              color="primary"
              slot="icon-only"
              icon={sunnyOutline}
            />
          </IonButton>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent className="ion-no-padding">
        <div
          ref={ref}
          className="flow-graph-container"
          style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
          }}
        />
        {rect
          ? createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  pointerEvents: 'auto',
                }}
              >
                <ForceGraph3D
                  ref={forceRef}
                  nodeRelSize={NODE_R}
                  extraRenderers={extraRenderers}
                  width={rect.width}
                  height={rect.height}
                  graphData={JSON.parse(JSON.stringify(data))}
                  linkWidth={(link) => 1}
                  linkDirectionalParticles={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 5
                  }
                  linkDirectionalParticleSpeed={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 0.01
                  }
                  nodeThreeObject={(node) => {
                    let parent = null;

                    if (node.id === initialNode?.id || node.id === -1) {
                      const icon = document.createElement('ion-icon');
                      icon.slot = 'end';
                      icon.icon =
                        node.id === -1
                          ? addCircleOutline
                          : chevronExpandOutline;

                      const par = document.createElement('ion-button');
                      par.appendChild(icon);

                      par.size = 'small';
                      par.style.textTransform = 'none';

                      par.color = node.id === -1 ? 'danger' : 'primary';

                      parent = par;
                    } else {
                      parent = document.createElement('ion-badge');
                      parent.color = 'tertiary';
                    }

                    parent.addEventListener('click', function (e) {
                      e.stopPropagation();
                      handleNodeFocus(node, true);
                    });
                    parent.style.cursor = 'pointer';
                    parent.style.pointerEvents = 'auto'; // Ensure element is clickable

                    const nodeEl = document.createElement('code');
                    nodeEl.textContent = node.label || shortenB64(node.pubkey);

                    parent.appendChild(nodeEl);
                    return new CSS2DObject(parent);
                  }}
                  nodeThreeObjectExtend={true}
                />
              </div>,
              document.getElementById('fg-portal')!,
            )
          : null}
      </IonCardContent>
    </IonCard>
  );
};

const scaleEdgeWeight = (weight: number, maxWeight: number) => {
  return Math.log2(2 + weight) / Math.log2(2 + maxWeight);
};

export default GraphView3D;

export const Filters = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: number;
}) => {
  const { rankingFilter, setRankingFilter } = useContext(AppContext);

  return (
    <div className="ion-padding">
      <IonRange
        aria-label="Attention filter"
        labelPlacement="start"
        label={`Filter < ${value}%`}
        pin={true}
        pinFormatter={(value: number) => `${value}%`}
        onIonChange={({ detail }) => setRankingFilter(Number(detail.value))}
        value={rankingFilter}
      />
    </div>
  );
};
