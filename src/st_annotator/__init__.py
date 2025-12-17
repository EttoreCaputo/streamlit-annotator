import os

import streamlit.components.v1 as components

RELEASE = os.environ.get("ST_ANNOTATOR_RELEASE", "true") == "true"

if not RELEASE:
    _component = components.declare_component(
        "st_annotator", url="http://localhost:3001"
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component = components.declare_component("st_annotator", path=build_dir)


def text_annotator(text: str, labels=[], in_snake_case=False, show_label_input=True, colors={}, popup_delay=250, key=None):
    """Create a new instance of "text_annotator".

    Parameters
    ----------
    text : str
        The text to be annotated

    labels : list
        If the text has already been annotated, the labels can be passed to the component in the form of a list of dictionaries with the following structure:
        {
            "label1": [
                {
                    label: "label",
                    start: 0,
                    end: 10
                },
                {
                    label: "label",
                    start: 0,
                    end: 10
                }
            ],
        }

    in_snake_case : bool
        If True, the labels will be converted to snake case before being returned.

    show_label_input : bool
        If True, the textbox for adding new labels will be visible. If False, it will be hidden.

    colors : dict
        A dictionary of colors for the labels. The keys are the labels and the values are the colors in hex format.
        There is a special key "label_input" that is used to color the input textbox.

    popup_delay : int
        The delay in milliseconds before showing the annotation popup when hovering over an annotation. Default is 250ms.

    key : str or None
        An optional string to use as the unique key for the widget.
        If this is None, and the widget's arguments are changed, 
        the widget will be recreated.

    Returns
    -------
    list or None
        The labels made by the user in the form of a list of dictionaries with the following structure:
        {
            "label1": [
                {
                    label: "label",
                    start: 0,
                    end: 10
                },
                {
                    label: "label",
                    start: 0,
                    end: 10
                }
            ],
        }
    """

    # Call through to our private component function. Arguments we pass here
    # will be sent to the frontend, where they'll be available in an "args"
    # dictionary.
    #
    # "default" is a special argument that specifies the initial return
    # value of the component before the user has interacted with it.
    component_value = _component(
        text=text, labels=labels, in_snake_case=in_snake_case, show_label_input=show_label_input, colors=colors, popup_delay=popup_delay, mode="text_annotator", key=key
    )

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value


if __name__ == "__main__":
    # This is an example of how to use the component in a Streamlit app.
    # It's not required for the component to work.
    import streamlit as st

    def annotator_page():
        st.title("Text Annotator Tool")

        text = "Effects of globalization During the history of the world , every change has its own positive and negative sides . Globalization as a gradual change affecting all over the world is not an exception . Although it has undeniable effects on the economics of the world ; it has side effects which make it a controversial issue . <AC0> Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country </AC0> . They think that <AC1> the idea of globalization put their inherited culture in danger of uncontrolled change and make them vulnerable against the attack of imperialistic governments </AC1> . Those who disagree , believe that <AC2> globalization contribute effectively to the global improvement of the world in many aspects </AC2> . <AC3> Developing globalization , people can have more access to many natural resources of the world and it leads to increasing the pace of scientific and economic promotions of the entire world </AC3> . In addition , <AC4> they admit that globalization can be considered a chance for people of each country to promote their lifestyle through the stuffs and services imported from other countries </AC4> . Moreover , the proponents of globalization idea point out <AC5> globalization results in considerable decrease in global tension </AC5> due to <AC6> convergence of benefits of people of the world which is a natural consequence of globalization </AC6> . In conclusion , <AC7> I would rather classify myself in the proponents of globalization as a speeding factor of global progress </AC7> . I think it is more likely to solve the problems of the world rather than intensifying them ."

        labels = {
            "Major Claim": [
                {
                    "start": 1467, 
                    "end": 1572, 
                    "label": "I would rather classify myself in the proponents of globalization as a speeding factor of global progress",
                }
            ],
            "Claim": [
                {
                    "start": 330, 
                    "end": 445, 
                    "label": "Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country",
                    "metadata": {}
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
        labels_with_delay = text_annotator(text, labels, in_snake_case=False, show_label_input=True,
                                        colors={"Major Claim": "#a457d7", "Claim": "#3478f6", "Premise": "#5ac4be"},
                                        popup_delay=500,  # 500ms delay instead of default 250ms
                                        key="annotator_with_delay")
        st.write("Labels (500ms popup delay):")
        st.write(labels_with_delay)
    annotator_page()
