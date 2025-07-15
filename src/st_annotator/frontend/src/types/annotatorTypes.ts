export enum ActionTypes {
    SET_TEXT_LABELS = 'SET_TEXT_LABELS',
    RENDER_TEXT = 'RENDER_TEXT',
    ADD_LABEL = 'ADD_LABEL',
    SELECT_LABEL = 'SELECT_LABEL',
    REMOVE_LABEL = 'REMOVE_LABEL',
}

export type ILabel = {
    start: number;
    end: number;
    label: string;
    metadata?: { [key: string]: any }; // Additional metadata
}

// Tipo per i dati del popup dell'annotazione
export interface AnnotationPopupData {
    text: string;
    labelClass: string;
    startIndex: number;
    endIndex: number;
    metadata?: { [key: string]: any }; // Additional metadata
    transformX?: string; // CSS horizontal transformation for positioning
    transformY?: string; // CSS vertical transformation for positioning
    maxHeight?: number; // Maximum height of the popup in pixels
}

// Tipo per i callback del popup
export interface PopupCallbacks {
    showPopup: (event: React.MouseEvent, data: AnnotationPopupData) => void;
    hidePopup: () => void;
}

export interface IState {
    text: string;
    actual_text: JSX.Element[];
    selectedLabel: string;
    labels: { [key: string]: ILabel[]};
    in_snake_case: boolean;
    show_label_input: boolean;
    colors: { [key: string]: string };
}

export interface IAction {
    type: ActionTypes;
    payload?: any;
  }