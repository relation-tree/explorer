import { IonChip, IonIcon, IonText } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { useClipboard } from '../../usefuls/useClipboard';
import { shortenB64 } from '../../utils/compat';
import MemoChip from '../memoChip';
import { useDirectoryGraph } from '../../usefuls/useDirectoryGraph';
import { toDirectoryEntry } from '../../domain/directoryEntry';

export const KeyAbbrev = ({ value }: { value: string }) => {
  const abbrevKey = shortenB64(value);

  return <code>{abbrevKey}</code>;
};

const PathInfo = ({ value }: { value: string }) => {
  const { copyToClipboard } = useClipboard();
  const { pkNode, normalizedGraph } = useDirectoryGraph(value);
  const entry = pkNode
    ? toDirectoryEntry(
        pkNode,
        normalizedGraph?.incoming.get(pkNode.id),
        normalizedGraph?.outgoing.get(pkNode.id),
      )
    : null;

  return (
    <>
      <span>
        <IonChip onClick={() => copyToClipboard(value)}>
          <KeyAbbrev value={value} />
          <IonIcon icon={copyOutline} color="primary"></IonIcon>
        </IonChip>
      </span>
      {entry?.memo && <MemoChip value={entry.memo} label={entry.label} />}
      {entry && (
        <IonText color="primary">
          <p>
            <strong>Attention: </strong>
            <i>{entry.attentionPct.toFixed(2)}%</i>
          </p>
        </IonText>
      )}
    </>
  );
};

export default PathInfo;
