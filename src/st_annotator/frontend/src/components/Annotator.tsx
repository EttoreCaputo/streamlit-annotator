import React, { useReducer, useEffect, useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { useRenderData } from "../utils/StreamlitProvider"
import { ActionTypes, IAction, IState, AnnotationPopupData } from "../types/annotatorTypes"
import { initialState, reducer } from "../reducers/annotatorReducer"
import { adjustSelectionBounds, getCharactersCountUntilNode, isLabeled, removeLabelData, isLabeledByAny } from "../helpers/annotatorHelpers"

const Annotator: React.FC = () => {
  const { args } = useRenderData()
  const [labelName, setLabelName] = useState<string>("")
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true)
  const [state, dispatch] = useReducer<React.Reducer<IState, IAction>>(
    reducer,
    initialState
  )
  
  // States to manage the annotation popup
  const [popupVisible, setPopupVisible] = useState<boolean>(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [popupData, setPopupData] = useState<AnnotationPopupData | null>(null)
  
  // States to manage the context menu
  const [contextMenuVisible, setContextMenuVisible] = useState<boolean>(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [contextMenuData, setContextMenuData] = useState<AnnotationPopupData | null>(null)

  // Create or get the portal container for the popup
  const getPopupPortalContainer = useCallback(() => {
    let container = document.getElementById('streamlit-annotator-popup-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'streamlit-annotator-popup-portal';
      container.style.position = 'relative';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    return container;
  }, []);

  // Function to handle right-click on annotations
  const handleAnnotationRightClick = useCallback((event: React.MouseEvent, annotationData: AnnotationPopupData) => {
    event.preventDefault(); // Prevent the default context menu
    event.stopPropagation(); // Stop event from bubbling up
    
    // Clear any text selection to prevent interference with annotation logic
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    
    // const rect = (event.target as HTMLElement).getBoundingClientRect();
    const contextMenuWidth = 150;
    const contextMenuHeight = 40;
    const margin = 10;
    
    // Calculate position for context menu
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust if context menu would go outside viewport
    if (x + contextMenuWidth > window.innerWidth - margin) {
      x = window.innerWidth - contextMenuWidth - margin;
    }
    if (y + contextMenuHeight > window.innerHeight - margin) {
      y = window.innerHeight - contextMenuHeight - margin;
    }
    
    setContextMenuPosition({ x, y });
    setContextMenuData(annotationData);
    setContextMenuVisible(true);
    
    // Hide popup if it's visible
    setPopupVisible(false);
    setPopupData(null);
  }, []);

  // Function to show the popup from context menu
  const showPopupFromContextMenu = useCallback(() => {
    if (!contextMenuData) return;
    
    const popupWidth = 300;
    const maxPopupHeight = Math.min(400, window.innerHeight * 0.6);
    const margin = 15;
    
    // Use the context menu position as a starting point
    let x = contextMenuPosition.x;
    let y = contextMenuPosition.y;
    let transformX = '0%';
    let transformY = '0%';
    
    // Adjust horizontal position
    if (x + popupWidth > window.innerWidth - margin) {
      x = window.innerWidth - popupWidth - margin;
    }
    
    // Adjust vertical position
    if (y + maxPopupHeight > window.innerHeight - margin) {
      y = y - maxPopupHeight - 10; // Position above the context menu
      transformY = '0%';
    }
    
    setPopupPosition({ x, y });
    setPopupData({ 
      ...contextMenuData, 
      transformX, 
      transformY, 
      maxHeight: maxPopupHeight 
    });
    setPopupVisible(true);
    
    // Hide context menu
    setContextMenuVisible(false);
    setContextMenuData(null);
    
    // Clear any text selection when showing popup
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, [contextMenuData, contextMenuPosition]);

  // Function to hide context menu
  const hideContextMenu = useCallback(() => {
    setContextMenuVisible(false);
    setContextMenuData(null);
    
    // Clear any text selection when hiding context menu
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, []);

  // Function to hide popup
  const hidePopup = useCallback(() => {
    setPopupVisible(false);
    setPopupData(null);
  }, []);

  // Handle clicks outside context menu and popup
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const contextMenu = document.querySelector('#annotation-context-menu');
    const popup = document.querySelector('#annotation-popup');
    
    if (contextMenu && !contextMenu.contains(event.target as Node)) {
      hideContextMenu();
    }
    
    if (popup && !popup.contains(event.target as Node)) {
      hidePopup();
    }
  }, [hideContextMenu, hidePopup]);

  // Cleanup the portal container when the component is unmounted
  useEffect(() => {
    return () => {
      const container = document.getElementById('streamlit-annotator-popup-portal');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Add event listener to close menus when clicking outside
  useEffect(() => {
    if (contextMenuVisible || popupVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [contextMenuVisible, popupVisible, handleClickOutside]);

  // Hide menus when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (contextMenuVisible) {
        hideContextMenu();
      }
      if (popupVisible) {
        hidePopup();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [contextMenuVisible, popupVisible, hideContextMenu, hidePopup]);

  useEffect(() => {
    const fetchData = async () => {
      const { text, labels, in_snake_case, show_label_input, colors } = args
      dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text, labels, in_snake_case, show_label_input, colors } })
    }

    fetchData()
  }, [args])

  useEffect(() => {
    dispatch({ type: ActionTypes.RENDER_TEXT, payload: { 
      showAllAnnotations: showAnnotations,
      popupCallbacks: { showPopup: handleAnnotationRightClick, hidePopup: () => {} }
    } })
  }, [state.labels, state.selectedLabel, showAnnotations, handleAnnotationRightClick])

  const handleMouseUp = useCallback(async () => {
    if (!state.selectedLabel) return
    
    // Don't process mouse up events when context menu is visible
    if (contextMenuVisible) return
    
    const selection = document.getSelection()?.getRangeAt(0);

    if (selection && selection.toString().trim() !== "") {
      const container = document.getElementById("actual-text");
      const charsBeforeStart = getCharactersCountUntilNode(selection.startContainer, container);
      const charsBeforeEnd = getCharactersCountUntilNode(selection.endContainer, container);

      const finalStartIndex = selection.startOffset + charsBeforeStart;
      const finalEndIndex = selection.endOffset + charsBeforeEnd;

      // CRITICAL: Always use state.text (original text) instead of DOM textContent
      // This ensures the text is never modified during annotations
      const { start, end } = adjustSelectionBounds(state.text, finalStartIndex, finalEndIndex);
      // Use state.text to extract the selected text, ensuring it matches the original
      const selectedText = state.text.slice(start, end);

      // Check if the range is already labeled by the current label
      const isLabeledByCurrent = isLabeled(start, end, state.labels[state.selectedLabel] || []);
      
      // Check if the range is labeled by ANY other label (excluding current label)
      const otherLabels = { ...state.labels };
      delete otherLabels[state.selectedLabel];
      const isLabeledByOtherLabel = isLabeledByAny(start, end, otherLabels);

      if (isLabeledByCurrent) {
        // Remove annotation from current label (toggle off)
        const labels = removeLabelData(start, end, state.labels[state.selectedLabel] || []);
        const newLabels = { ...state.labels };
        newLabels[state.selectedLabel] = labels;
        dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text: state.text, labels: newLabels, in_snake_case: state.in_snake_case, show_label_input: state.show_label_input, colors: state.colors } });
      } else if (isLabeledByOtherLabel) {
        // Text is already annotated with a different label - block the annotation
        // Do nothing to prevent text duplication and preserve existing annotations
        return;
      } else {
        // Text is not annotated - add the new annotation
        const label = { start, end, label: selectedText };
        const newLabels = { ...state.labels };
        newLabels[state.selectedLabel] = [...(newLabels[state.selectedLabel] || []), label];
        dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text: state.text, labels: newLabels, in_snake_case: state.in_snake_case, show_label_input: state.show_label_input, colors: state.colors } });
      }
    }
  }, [state, dispatch, contextMenuVisible]);

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
      
      {/* Popup per i dettagli dell'annotazione renderizzato tramite Portal */}
      {popupVisible && popupData && createPortal(
        <div
          id="annotation-popup"
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg pointer-events-auto"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: `translate(${popupData.transformX || '-50%'}, ${popupData.transformY || '-100%'})`,
            maxWidth: '300px',
            maxHeight: `${popupData.maxHeight || 400}px`,
            fontSize: '14px',
            zIndex: 10000,
            overflowY: 'auto' // Add vertical scroll if necessary
          }}
        >
          <div className="p-3">
            <div className="font-semibold text-gray-800 mb-2">Annotation Details</div>
            <div className="space-y-1">
              <div>
                <span className="font-medium text-gray-600">Text:</span>{' '}
                <span className="text-gray-800">"{popupData.text}"</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Label:</span>{' '}
                <span 
                  className="px-2 py-1 rounded text-white text-xs font-medium"
                  style={{ backgroundColor: getColor(popupData.labelClass) }}
                >
                  {popupData.labelClass}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Position:</span>{' '}
                <span className="text-gray-800">
                  {popupData.startIndex} - {popupData.endIndex} ({popupData.endIndex - popupData.startIndex} chars)
                </span>
              </div>
              {/* Show additional metadata if present */}
              {popupData.metadata && typeof popupData.metadata === 'object' && Object.keys(popupData.metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="font-medium text-gray-600 mb-1">Additional Information:</div>
                  {popupData.metadata && Object.entries(popupData.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                      <span className="text-gray-700">
                        {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        getPopupPortalContainer()
      )}

      {/* Context Menu */}
      {contextMenuVisible && contextMenuData && createPortal(
        <div
          id="annotation-context-menu"
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg pointer-events-auto"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
            zIndex: 10001,
                     }}
        >
          <div className="p-2">
            <button
              className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
              onClick={showPopupFromContextMenu}
            >
              More Info
            </button>
          </div>
        </div>,
        getPopupPortalContainer()
      )}
    </div>
  )
}

export default Annotator
