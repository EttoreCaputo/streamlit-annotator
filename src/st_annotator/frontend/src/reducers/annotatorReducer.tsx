import { Streamlit } from "streamlit-component-lib"
import { ActionTypes, IAction, IState } from "../types/annotatorTypes"
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
      Streamlit.setComponentValue(formatKeys(action.payload.labels, action.payload.in_snake_case))

      return {
        ...state,
        in_snake_case: action.payload.in_snake_case,
        show_label_input: action.payload.show_label_input,
        text: action.payload.text,
        labels: action.payload.labels,
        colors: action.payload.colors,
      }

    case ActionTypes.RENDER_TEXT:
      const { text, labels } = state
      const actual_text: JSX.Element[] = []
      let start = 0
      let selectedLabel = state.selectedLabel

      if (!selectedLabel) {
        if (Object.keys(labels).length > 0) {
          selectedLabel = Object.keys(labels)[0]
        } else {
          return {
            ...state,
            actual_text: [<p key={"default-text"}>{text}</p>]
          }
        }
      }

      if (!labels[selectedLabel]) {
        selectedLabel = Object.keys(labels)[Object.keys(labels).length - 1]
      }

      labels[selectedLabel]
        ?.sort((a, b) => a.start - b.start)
        .forEach((label, index) => {
          actual_text.push(
            <span key={`unlabeled-${index}`}>
              {text.substring(start, label.start)}
            </span>
          )
          actual_text.push(
            <span
              key={`labeled-${index}`}
              className="labeled border rounded"
              style={{
                backgroundColor: hexToRgba(getColor(selectedLabel), 0.2), 
                borderColor: getColor(selectedLabel),
              }}
            >
              {text.substring(label.start, label.end)}
            </span>
          )
          start = label.end
        })
      actual_text.push(
        <span key="unlabeled-end">{text.substring(start)}</span>
      )
      Streamlit.setComponentValue(formatKeys(labels, state.in_snake_case))
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
