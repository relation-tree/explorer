import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTextarea,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline } from 'ionicons/icons';
import { useInputValidationProps } from '../../usefuls/useInputValidation';

const Navigator = ({
  currentDirectory,
  onDismiss,
}: {
  currentDirectory: string;
  onDismiss: (data?: string | null | undefined, role?: string) => void;
}) => {
  const {
    value: directory,
    isValid: isDirectoryValid,
    isTouched: isDirectoryTouched,
    onBlur: onBlurDirectory,
    onInputChange: setDirectory,
  } = useInputValidationProps((node: string) => !!node);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              color="medium"
              disabled={!currentDirectory && !directory}
              onClick={() => onDismiss(null, 'cancel')}
            >
              Cancel
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              disabled={!directory}
              onClick={() => onDismiss(directory, 'confirm')}
              strong={true}
            >
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  className="ion-no-padding"
                  size="large"
                  icon={sunnyOutline}
                  color="primary"
                />
                <h1
                  style={{
                    margin: '0 0 0 5px',
                  }}
                >
                  Explorer
                </h1>
              </div>
              <IonText color="secondary">
                <h6>An explorer for logical directory systems</h6>
              </IonText>
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>
        <section className="ion-padding">
          <IonText color="primary">
            <p>
              Enter a{' '}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://github.com/relation-tree/directory"
              >
                Directory
              </a>{' '}
              to continue.
            </p>
          </IonText>
          <IonTextarea
            className={`${isDirectoryValid && 'ion-valid'} ${
              isDirectoryValid === false && 'ion-invalid'
            } ${isDirectoryTouched && 'ion-touched'}`}
            label="Directory"
            labelPlacement="stacked"
            placeholder="..."
            value={directory}
            onIonBlur={onBlurDirectory}
            enterkeyhint="go"
            onIonInput={(event) => setDirectory(event.target.value! ?? '')}
            rows={5}
          />
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;
