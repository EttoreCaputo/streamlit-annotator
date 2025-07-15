import React, { useReducer, useEffect, useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { Streamlit } from "streamlit-component-lib"
import { useRenderData } from "../utils/StreamlitProvider"
import { ActionTypes, IAction, IState, AnnotationPopupData } from "../types/annotatorTypes"
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
  
  // States to manage the annotation popup
  const [popupVisible, setPopupVisible] = useState<boolean>(false)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [popupData, setPopupData] = useState<AnnotationPopupData | null>(null)
  const [hidePopupTimeout, setHidePopupTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showPopupTimeout, setShowPopupTimeout] = useState<NodeJS.Timeout | null>(null)

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

  // Functions to manage the annotation popup
  const showAnnotationPopup = useCallback((event: React.MouseEvent, annotationData: AnnotationPopupData) => {
    // Cancel any existing timeout to hide the popup
    if (hidePopupTimeout) {
      clearTimeout(hidePopupTimeout);
      setHidePopupTimeout(null);
    }

    // If there is already a timeout to show the popup, don't create another one
    if (showPopupTimeout) {
      return;
    }

    // Calculate the position and data of the popup
    const calculatePopupData = () => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const popupWidth = 300; // Maximum width of the popup
      const maxPopupHeight = Math.min(400, window.innerHeight * 0.6); // Maximum height of the popup
      const margin = 15; // Margin from the screen borders
      
      // Calculate the dimensions of the viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      
      // Initial preferred position (centered above the element)
      let x = rect.left + rect.width / 2;
      let y = rect.top + scrollY - margin;
      let transformX = '-50%'; // Centered horizontally
      let transformY = '-100%'; // Above the element
      
      // Horizontal border check
      const halfPopupWidth = popupWidth / 2;
      
      if (x - halfPopupWidth < margin) {
        // Too far to the left, align the popup to the left margin
        x = margin + halfPopupWidth;
        transformX = '-50%';
      } else if (x + halfPopupWidth > viewportWidth - margin) {
        // Too far to the right, align the popup to the right margin
        x = viewportWidth - margin - halfPopupWidth;
        transformX = '-50%';
      }
      
      // Vertical border check
      const estimatedPopupHeight = maxPopupHeight; // Use the maximum height for calculations
      
      // First try above the element
      const topPosition = y - estimatedPopupHeight;
      const bottomPosition = rect.bottom + scrollY + margin;
      
      if (topPosition < scrollY + margin) {
        // No space above, position below
        if (bottomPosition + estimatedPopupHeight <= scrollY + viewportHeight - margin) {
          // There is space below
          y = bottomPosition;
          transformY = '0%';
        } else {
          // No space above or below, position in the center of the viewport
          y = scrollY + viewportHeight / 2;
          transformY = '-50%';
        }
      } else {
        // There is space above, keep the original position
        transformY = '-100%';
      }
      
      // Final check: ensure the popup stays in the viewport even with the transformation
      const finalTop = y + (transformY === '-100%' ? -estimatedPopupHeight : 
                            transformY === '-50%' ? -estimatedPopupHeight/2 : 0);
      const finalBottom = finalTop + estimatedPopupHeight;
      
      if (finalTop < scrollY + margin) {
        y = scrollY + margin + (transformY === '-100%' ? estimatedPopupHeight : 
                               transformY === '-50%' ? estimatedPopupHeight/2 : 0);
      } else if (finalBottom > scrollY + viewportHeight - margin) {
        y = scrollY + viewportHeight - margin - estimatedPopupHeight + 
            (transformY === '-100%' ? estimatedPopupHeight : 
             transformY === '-50%' ? estimatedPopupHeight/2 : 0);
      }
      
      return { 
        position: { x, y }, 
        data: { ...annotationData, transformX, transformY, maxHeight: maxPopupHeight } 
      };
    };

    // Configurable delay before showing the popup
    const timeout = setTimeout(() => {
      const { position, data } = calculatePopupData();
      setPopupPosition(position);
      setPopupData(data);
      setPopupVisible(true);
      setShowPopupTimeout(null);
    }, args.popup_delay || 250); // Use popup_delay from args, fallback to 250ms
    
    setShowPopupTimeout(timeout);
  }, [hidePopupTimeout, showPopupTimeout, args.popup_delay]);

  const hideAnnotationPopup = useCallback(() => {
    // Cancel the show timeout if it exists (if the mouse exits before the popup appears)
    if (showPopupTimeout) {
      clearTimeout(showPopupTimeout);
      setShowPopupTimeout(null);
      return; // Don't show the popup if it hasn't appeared yet
    }

    // If the popup is already visible, use a delay to hide it
    const timeout = setTimeout(() => {
      setPopupVisible(false);
      setPopupData(null);
      setHidePopupTimeout(null);
    }, 150); // Delay of 150ms
    
    setHidePopupTimeout(timeout);
  }, [showPopupTimeout]);

  const cancelHidePopup = useCallback(() => {
    if (hidePopupTimeout) {
      clearTimeout(hidePopupTimeout);
      setHidePopupTimeout(null);
    }
  }, [hidePopupTimeout]);

  const forceHidePopup = useCallback(() => {
    // Cancel both timeouts
    if (hidePopupTimeout) {
      clearTimeout(hidePopupTimeout);
      setHidePopupTimeout(null);
    }
    if (showPopupTimeout) {
      clearTimeout(showPopupTimeout);
      setShowPopupTimeout(null);
    }
    setPopupVisible(false);
    setPopupData(null);
  }, [hidePopupTimeout, showPopupTimeout]);

  // Handle the click outside the popup to close it
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const popup = document.querySelector('#annotation-popup');
    if (popup && !popup.contains(event.target as Node)) {
      forceHidePopup();
    }
  }, [forceHidePopup]);

  // Cleanup the portal container and the timeouts when the component is unmounted
  useEffect(() => {
    return () => {
      if (hidePopupTimeout) {
        clearTimeout(hidePopupTimeout);
      }
      if (showPopupTimeout) {
        clearTimeout(showPopupTimeout);
      }
      const container = document.getElementById('streamlit-annotator-popup-portal');
      if (container) {
        document.body.removeChild(container);
      }
    };
  }, [hidePopupTimeout, showPopupTimeout]);

  // Add event listener to close the popup when clicking outside
  useEffect(() => {
    if (popupVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [popupVisible, handleClickOutside]);

  // Hide the popup when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (popupVisible) {
        forceHidePopup();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [popupVisible, forceHidePopup]);

  useEffect(() => {
    const fetchData = async () => {
      const { text, labels, in_snake_case, show_label_input, colors } = args
      dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text, labels, in_snake_case, show_label_input, colors } })
      dispatch({ type: ActionTypes.RENDER_TEXT, payload: { 
        showAllAnnotations: showAnnotations,
        popupCallbacks: { showPopup: showAnnotationPopup, hidePopup: hideAnnotationPopup }
      } })
      Streamlit.setComponentValue(labels)
    }

    fetchData()
  }, [args, showAnnotations, showAnnotationPopup, hideAnnotationPopup])

  useEffect(() => {
    dispatch({ type: ActionTypes.RENDER_TEXT, payload: { 
      showAllAnnotations: showAnnotations,
      popupCallbacks: { showPopup: showAnnotationPopup, hidePopup: hideAnnotationPopup }
    } })
  }, [state.labels, state.selectedLabel, showAnnotations, showAnnotationPopup, hideAnnotationPopup])

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
        dispatch({ type: ActionTypes.RENDER_TEXT, payload: { 
          showAllAnnotations: showAnnotations,
          popupCallbacks: { showPopup: showAnnotationPopup, hidePopup: hideAnnotationPopup }
        } });
      } else {
        const label = { start, end, label: selectedText };
        const newLabels = { ...state.labels };
        newLabels[state.selectedLabel] = [...newLabels[state.selectedLabel], label];
        dispatch({ type: ActionTypes.SET_TEXT_LABELS, payload: { text: state.text, labels: newLabels, in_snake_case: state.in_snake_case, show_label_input: state.show_label_input, colors: state.colors } });
        dispatch({ type: ActionTypes.RENDER_TEXT, payload: { 
          showAllAnnotations: showAnnotations,
          popupCallbacks: { showPopup: showAnnotationPopup, hidePopup: hideAnnotationPopup }
        } });
      }
    }
  }, [state, dispatch, showAnnotations, showAnnotationPopup, hideAnnotationPopup]);

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
          onMouseEnter={cancelHidePopup} // Cancel the timeout when the mouse enters the popup
          onMouseLeave={hideAnnotationPopup} // Start the timeout when the mouse exits the popup
        >
          <div className="p-3">
            <div className="font-semibold text-gray-800 mb-2">Annotation Details</div>
            <div className="space-y-1">
              <div>
                <span className="font-medium text-gray-600">Testo:</span>{' '}
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
              {popupData.metadata && Object.keys(popupData.metadata).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="font-medium text-gray-600 mb-1">Additional Information:</div>
                  {Object.entries(popupData.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                      <span className="text-gray-700">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
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
    </div>
  )
}

export default Annotator
