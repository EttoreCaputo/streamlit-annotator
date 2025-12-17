import { Streamlit } from "streamlit-component-lib"
import { ActionTypes, IAction, IState, AnnotationPopupData, PopupCallbacks } from "../types/annotatorTypes"
import React from "react"
import { formatKeys } from "../helpers/annotatorHelpers"

// Define the initial state of the component
export const initialState: IState = {
  text: "",
  actual_text: [],
  labels: {},
  selectedLabel: "",
  show_label_input: true,
  in_snake_case: false,
  colors: {}
}



// Reducer function to handle state transitions
export const reducer = (state: IState, action: IAction): IState => {
  

  const getTailwindColor = (className: string): string => {
    const temp = document.createElement("div");
    temp.className = className;
    document.body.appendChild(temp);
  
    const color = getComputedStyle(temp).backgroundColor;
  
    document.body.removeChild(temp);
    return color;
  };

  const primaryColor = getTailwindColor("bg-primary");
  const primaryColorAlpha = getTailwindColor("bg-primary/20");

  const getColor = (label: string | undefined | null) => {
    if (!label || typeof label !== "string") return primaryColor;
    const color = state.colors?.[label];
    return color || primaryColor;
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || !/^#([A-Fa-f0-9]{6})$/.test(hex)) return primaryColorAlpha;
  
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
  
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }


  switch (action.type) {
    case ActionTypes.SET_TEXT_LABELS:
      const { text, labels, in_snake_case, show_label_input, colors } = action.payload;
      // CRITICAL: Preserve the original text to ensure it's never modified during annotations.
      // Only update text if:
      // 1. state.text is empty (initial load from args), OR
      // 2. The new text matches state.text (preserving it during label updates)
      // This prevents any accidental text modifications during annotation operations.
      const preservedText = (state.text && state.text !== "" && text !== state.text)
        ? state.text  // Preserve original text if it exists and differs (shouldn't happen in normal flow)
        : text;       // Use new text on initial load, or preserve existing text when text === state.text
      Streamlit.setComponentValue(formatKeys(labels, in_snake_case))
      return {
        ...state,
        text: preservedText,
        labels: labels || {},
        in_snake_case,
        show_label_input,
        colors,
      };

    case ActionTypes.RENDER_TEXT:
      const actual_text: JSX.Element[] = []
      let start = 0
      let selectedLabel = state.selectedLabel
      const showAllAnnotations = action.payload?.showAllAnnotations
      const popupCallbacks: PopupCallbacks | undefined = action.payload?.popupCallbacks

      if (!selectedLabel) {
        if (state.labels && Object.keys(state.labels).length > 0) {
          selectedLabel = Object.keys(state.labels)[0]
        } else {
          return {
            ...state,
            actual_text: [<p key={"default-text"}>{state.text}</p>]
          }
        }
      }

      if (!state.labels[selectedLabel]) {
        selectedLabel = Object.keys(state.labels)[Object.keys(state.labels).length - 1]
      }

      // Get all annotations if showAllAnnotations is true, otherwise just the selected label's annotations
      let allAnnotations: { start: number; end: number; label: string; labelClass: string; metadata?: { [key: string]: any } }[] = []
      
      if (showAllAnnotations) {
        Object.entries(state.labels).forEach(([labelClass, annotations]) => {
            allAnnotations.push(...annotations.map(ann => ({ ...ann, labelClass })))
        })
      } else {
        allAnnotations = state.labels[selectedLabel]?.map(ann => ({ ...ann, labelClass: selectedLabel })) || []
      }

      // Sort all annotations by start position
      allAnnotations.sort((a, b) => a.start - b.start)

      allAnnotations.forEach((annotation, index) => {
        actual_text.push(
          <span key={`unlabeled-${index}`}>
            {state.text.substring(start, annotation.start)}
          </span>
        )
        
        // Create the popup data for this annotation
        const annotationPopupData: AnnotationPopupData = {
          text: state.text.substring(annotation.start, annotation.end),
          labelClass: annotation.labelClass,
          startIndex: annotation.start,
          endIndex: annotation.end,
          metadata: annotation.metadata // Include metadata if present
        };

        actual_text.push(
          <span
            key={`labeled-${index}`}
            className="labeled border rounded cursor-pointer"
            style={{
              backgroundColor: hexToRgba(getColor(annotation.labelClass), 0.2),
              borderColor: getColor(annotation.labelClass),
            }}
            onContextMenu={popupCallbacks ? (e) => popupCallbacks.showPopup(e, annotationPopupData) : undefined}
          >
            {state.text.substring(annotation.start, annotation.end)}
          </span>
        )
        start = annotation.end
      })

      actual_text.push(
        <span key="unlabeled-end">{state.text.substring(start)}</span>
      )
      return {
        ...state,
        actual_text,
        selectedLabel,
      }

    case ActionTypes.ADD_LABEL:
      const newLabels = { ...state.labels }
      // strip whitespace
      newLabels[action.payload.trim()] = []

      return {
        ...state,
        labels: newLabels,
        selectedLabel: action.payload,
      }

    case ActionTypes.SELECT_LABEL:
      return {
        ...state,
        selectedLabel: action.payload,
      }

    case ActionTypes.REMOVE_LABEL:
      const updatedLabels = { ...state.labels }
      delete updatedLabels[action.payload]

      return {
        ...state,
        labels: updatedLabels
      }

    default:
      return state
  }
}
