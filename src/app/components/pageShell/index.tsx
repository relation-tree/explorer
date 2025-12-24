import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonToolbar,
  useIonModal,
} from '@ionic/react';
import { OverlayEventDetail } from '@ionic/core/components';
import { sunnyOutline } from 'ionicons/icons';
import Navigator from '../navigator';
import { useCallback, useContext, useEffect } from 'react';
import { AppContext } from '../../utils/appContext';

interface ToolBarButton {
  label: string;
  renderIcon?: () => JSX.Element;
  action: () => void;
  key?: string;
}

interface Props {
  onDismissModal?: () => void;
  renderBody: () => JSX.Element;
  tools?: ToolBarButton[];
}

export const PageShell = ({ onDismissModal, renderBody, tools }: Props) => {
  const { selectedDirectory, setSelectedDirectory } = useContext(AppContext);

  const [present, dismiss] = useIonModal(Navigator, {
    onDismiss: (data: string, role: string) => dismiss(data, role),
    currentDirectory: selectedDirectory,
  });

  const openModal = useCallback(() => {
    present({
      onWillDismiss: (ev: CustomEvent<OverlayEventDetail>) => {
        if (ev.detail.role === 'confirm') {
          setSelectedDirectory(ev.detail.data!);
        }
      },
    });
  }, [present, setSelectedDirectory]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!selectedDirectory) {
        openModal();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [selectedDirectory, openModal]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {onDismissModal ? (
              <IonButton color="medium" onClick={() => onDismissModal()}>
                Close
              </IonButton>
            ) : (
              <IonChip onClick={openModal}>
                <IonIcon icon={sunnyOutline} color="primary" />
                <IonLabel>Explorer</IonLabel>
              </IonChip>
            )}
          </IonButtons>

          {!!tools?.length && (
            <IonButtons slot="end">
              {tools.map((tool) => (
                <IonButton key={tool.key ?? tool.label} onClick={tool.action}>
                  {tool.renderIcon ? tool.renderIcon() : tool.label}
                </IonButton>
              ))}
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>{renderBody()}</IonContent>
    </IonPage>
  );
};
