import streamlit as st
from st_annotator import text_annotator



def annotator_page():
    st.title("Text Annotator Tool")

    st.markdown("""
    ## Features
    - **Hover over annotations** to see detailed popup with additional information
    - **Metadata support**: Each annotation can include custom metadata that appears in the popup
    - **Flexible information**: Add confidence scores, author info, categorization, or any custom data
    """)

    text = "Effects of globalization During the history of the world , every change has its own positive and negative sides . Globalization as a gradual change affecting all over the world is not an exception . Although it has undeniable effects on the economics of the world ; it has side effects which make it a controversial issue . <AC0> Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country </AC0> . They think that <AC1> the idea of globalization put their inherited culture in danger of uncontrolled change and make them vulnerable against the attack of imperialistic governments </AC1> . Those who disagree , believe that <AC2> globalization contribute effectively to the global improvement of the world in many aspects </AC2> . <AC3> Developing globalization , people can have more access to many natural resources of the world and it leads to increasing the pace of scientific and economic promotions of the entire world </AC3> . In addition , <AC4> they admit that globalization can be considered a chance for people of each country to promote their lifestyle through the stuffs and services imported from other countries </AC4> . Moreover , the proponents of globalization idea point out <AC5> globalization results in considerable decrease in global tension </AC5> due to <AC6> convergence of benefits of people of the world which is a natural consequence of globalization </AC6> . In conclusion , <AC7> I would rather classify myself in the proponents of globalization as a speeding factor of global progress </AC7> . I think it is more likely to solve the problems of the world rather than intensifying them ."

    labels = {
        "Major Claim": [
            {
                "start": 1467, 
                "end": 1572, 
                "label": "I would rather classify myself in the proponents of globalization as a speeding factor of global progress",
                "metadata": {
                    "confidence": 0.95,
                    "author": "Student",
                    "stance": "Pro-globalization",
                    "argumentType": "Personal position"
                }
            }
        ],
        "Claim": [
            {
                "start": 330, 
                "end": 445, 
                "label": "Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country",
                "metadata": {
                    "confidence": 0.88,
                    "tone": "Negative",
                    "perspective": "Cultural preservationist"
                }
            },
            {
                "start": 686, 
                "end": 777, 
                "label": "globalization contribute effectively to the global improvement of the world in many aspects",
                "metadata": {
                    "confidence": 0.92,
                    "tone": "Positive",
                    "scope": "Global"
                }
            },
            {
                "start": 1256, 
                "end": 1320, 
                "label": "globalization results in considerable decrease in global tension",
                "metadata": {
                    "confidence": 0.85,
                    "topic": "International relations",
                    "evidenceType": "Predicted outcome"
                }
            }
        ],
        "Premise": [
            {
                "start": 477, 
                "end": 636, 
                "label": "the idea of globalization put their inherited culture in danger of uncontrolled change and make them vulnerable against the attack of imperialistic governments",
                "metadata": {
                    "confidence": 0.80,
                    "concern": "Cultural preservation",
                    "threat": "Imperialism"
                }
            },
            {
                "start": 793, 
                "end": 980, 
                "label": "Developing globalization , people can have more access to many natural resources of the world and it leads to increasing the pace of scientific and economic promotions of the entire world",
                "metadata": {
                    "confidence": 0.90,
                    "benefits": ["Resource access", "Scientific progress", "Economic growth"],
                    "scope": "Worldwide"
                }
            },
            {
                "start": 1010, 
                "end": 1182, 
                "label": "they admit that globalization can be considered a chance for people of each country to promote their lifestyle through the stuffs and services imported from other countries",
                "metadata": {
                    "confidence": 0.83,
                    "focus": "Lifestyle improvement",
                    "mechanism": "Import of goods and services"
                }
            },
            {
                "start": 1341, 
                "end": 1435, 
                "label": "convergence of benefits of people of the world which is a natural consequence of globalization",
                "metadata": {
                    "confidence": 0.87,
                    "concept": "Benefit convergence",
                    "causality": "Natural consequence"
                }
            }
        ]
    }

    # Example with label input visible (default)
    st.subheader("Annotator with input textbox (default)")
    labels_with_input = text_annotator(text, labels, in_snake_case=False, key="annotator_with_input")

    st.write("Labels (with input):")
    st.write(labels_with_input)

    # Example with label input hidden
    st.subheader("Annotator without input textbox and custom colors")
    labels_without_input = text_annotator(text, labels, in_snake_case=False, show_label_input=False,
                                        colors={"Major Claim": "#a457d7", "Claim": "#3478f6", "Premise": "#5ac4be"},
                                        key="annotator_without_input")

    st.write("Labels (without input):")
    st.write(labels_without_input)



    # Example with label input hidden
    st.subheader("Annotator with custom colors")
    labels_with_input_and_colors = text_annotator(text, labels, in_snake_case=False, show_label_input=True,
                                        colors={"label_input":"#ff9500", "Major Claim": "#a457d7", "Claim": "#3478f6", "Premise": "#5ac4be"},
                                        key="annotator_with_colors")
    st.write("Labels (colors):")
    st.write(labels_with_input_and_colors)

    # Example with custom popup delay
    st.subheader("Annotator with custom popup delay")
    st.markdown("""
    You can customize the delay before the popup appears when hovering over annotations.
    Default delay is 250ms. Try hovering over annotations below (500ms delay):
    """)
    labels_with_delay = text_annotator(text, labels, in_snake_case=False, show_label_input=False,
                                    colors={"Major Claim": "#a457d7", "Claim": "#3478f6", "Premise": "#5ac4be"},
                                    popup_delay=500,  # 500ms delay instead of default 250ms
                                    key="annotator_with_delay")
    st.write("Labels (500ms popup delay):")
    st.write(labels_with_delay)

    # Show how to use metadata
    st.subheader("How to add metadata to annotations")
    st.markdown("""
    You can add custom metadata to each annotation that will appear in the hover popup:
    
    ```python
    labels = {
        "Sentiment": [
            {
                "start": 0,
                "end": 20,
                "label": "This is amazing!",
                "metadata": {
                    "confidence": 0.95,
                    "emotion": "Joy",
                    "intensity": "High",
                    "source": "Customer feedback"
                }
            }
        ]
    }
    ```
    
    **Supported metadata types:**
    - Strings, numbers, booleans
    - Lists (will be displayed as JSON)
    - Objects (will be displayed as JSON)
    
    **Try hovering over the annotations above to see the metadata in action!**
    """)

annotator_page()

