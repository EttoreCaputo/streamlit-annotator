import React, { useReducer, useEffect, useCallback, useState } from "react"
import { Streamlit } from "streamlit-component-lib"
import { useRenderData } from "../utils/StreamlitProvider"
import { ActionTypes, IAction, IState } from "../types/annotatorTypes"
import { initialState, reducer } from "../reducers/annotatorReducer"
import { adjustSelectionBounds, getCharactersCountUntilNode, isLabeled, removeLabelData } from "../helpers/annotatorHelpers"

const Annotator: React.FC = () => {
  const { args } = useRenderData()
  const [labelName, setLabelName] = useState<string>("")
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true)
  const [state, dispatch] = useReducer<React.Reducer<IState, IAction>>(
    reducer,
    initialState
  )

  useEffect(() => {
    const fetchData = async () => {
      const { text, labels, in_snake_case, show_label_input, colors } = args
      dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text, labels, in_snake_case, show_label_input, colors } })
      dispatch({ type: ActionTypes.RENDER_TEXT, payload: { showAllAnnotations: showAnnotations } })
      Streamlit.setComponentValue(labels)
    }

    fetchData()
  }, [])

  useEffect(() => {
    dispatch({ type: ActionTypes.RENDER_TEXT, payload: { showAllAnnotations: showAnnotations } })
  }, [state.labels, state.selectedLabel, showAnnotations])

  const handleMouseUp = useCallback(async () => {
    if (!state.selectedLabel) return
    const selection = document.getSelection()?.getRangeAt(0);

    if (selection && selection.toString().trim() !== "") {
      const container = document.getElementById("actual-text");
      const charsBeforeStart = getCharactersCountUntilNode(selection.startContainer, container);
      const charsBeforeEnd = getCharactersCountUntilNode(selection.endContainer, container);

      const finalStartIndex = selection.startOffset + charsBeforeStart;
      const finalEndIndex = selection.endOffset + charsBeforeEnd;

      const textContent = container?.textContent || "";

      const { start, end } = adjustSelectionBounds(textContent, finalStartIndex, finalEndIndex);
      const selectedText = textContent.slice(start, end);

      if (isLabeled(finalStartIndex, finalEndIndex, state.labels[state.selectedLabel])) {
        const labels = removeLabelData(start, end, state.labels[state.selectedLabel]);
        const newLabels = { ...state.labels };
        newLabels[state.selectedLabel] = labels;
        dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text: state.text, labels: newLabels, in_snake_case: state.in_snake_case, show_label_input: state.show_label_input, colors: state.colors } });
        dispatch({ type: ActionTypes.RENDER_TEXT, payload: { showAllAnnotations: showAnnotations } });
      } else {
        const label = { start, end, label: selectedText };
        const newLabels = { ...state.labels };
        newLabels[state.selectedLabel] = [...newLabels[state.selectedLabel], label];
        dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text: state.text, labels: newLabels, in_snake_case: state.in_snake_case, show_label_input: state.show_label_input, colors: state.colors } });
        dispatch({ type: ActionTypes.RENDER_TEXT, payload: { showAllAnnotations: showAnnotations } });
      }
    }
  }, [state, dispatch, showAnnotations]);

  const addLabel = (name: string) => {
    if (name.trim() === "") return

    setLabelName("")
    dispatch({ type: ActionTypes.ADD_LABEL, payload: name })
  }

  const selectLabel = (name: string) => {
    dispatch({ type: ActionTypes.SELECT_LABEL, payload: name })
  }

  const removeLabel = (name: string) => {
    dispatch({ type: ActionTypes.REMOVE_LABEL, payload: name })
  }

  const getTailwindColor = (className: string): string => {
    const temp = document.createElement("div");
    temp.className = className;
    document.body.appendChild(temp);
  
    const color = getComputedStyle(temp).backgroundColor;
  
    document.body.removeChild(temp);
    return color;
  };

  const primaryColor = getTailwindColor("bg-primary");

  const getColor = (label: string | undefined | null) => {
    if (!label || typeof label !== "string") return primaryColor;
    const color = state.colors?.[label];
    return color || primaryColor;
  };
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-row flex-wrap">
        {state.show_label_input && (
          <div className="flex flex-wrap justify-between items-center cursor-pointer mr-2 mb-2 pr-3 rounded-lg text-white text-base" style={{ backgroundColor: getColor("label_input"), borderColor: getColor("label_input") }}>
            <input
              type="text"
              placeholder="Enter Label Name"
              className="text-black p-1 mr-2 focus:outline-none rounded-lg"
              style={{ border: "1px solid " + getColor("label_input")}}
              onChange={(e) => setLabelName(e.target.value)}
              value={labelName}
            />
            <button onClick={() => addLabel(labelName)}>Add Label</button>
          </div>
        )}

        {Object.keys(state.labels).map((label, index) => {
          const isHovered = hoveredLabel === label;
          return (<span
            onMouseEnter={() => setHoveredLabel(label)}
            onMouseLeave={() => setHoveredLabel(null)}
            key={index}
            className={
              "flex flex-wrap justify-between items-center cursor-pointer py-1 px-3 mr-2 mb-2 rounded-lg text-base" +
              (state.selectedLabel === label
                ? " text-white"
                : " border border-primary text-primary hover:bg-primary hover:text-white")
            }
            style={
              state.selectedLabel === label
                ? { backgroundColor: getColor(label), borderColor: getColor(label), color: ""}
                : { borderColor: getColor(label), color: isHovered ? "" : getColor(label), backgroundColor: isHovered ? getColor(label) : "" }
            }
            onClick={() => selectLabel(label)}
          >
            {label}
            {state.show_label_input && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-3 hover:text-gray-300"
                viewBox="0 0 20 20"
                fill="currentColor"
                onClick={() => removeLabel(label)}
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                />
              </svg>
            )}
          </span>);
})}
        
        <div className="mx-2"></div>
        
        <div 
          className={
            "flex items-center cursor-pointer py-1 px-3 mr-2 mb-2 rounded-lg text-base border" +
            (showAnnotations
              ? " text-white"
              : " border-primary text-primary hover:bg-primary hover:text-white")
          }
          style={
            showAnnotations
              ? { backgroundColor: getColor(null), borderColor: getColor(null) }
              : { borderColor: getColor(null) }
          }
        >
          <input
            type="checkbox"
            id="show-annotations"
            checked={showAnnotations}
            onChange={(e) => setShowAnnotations(e.target.checked)}
            className="hidden"
          />
          <label htmlFor="show-annotations" className="cursor-pointer">
            Show All
          </label>
        </div>
      </div>
      <div id="actual-text" className="mt-5 h-full" onMouseUp={handleMouseUp}>
        {state.actual_text}
      </div>
    </div>
  )
}

export default Annotator
