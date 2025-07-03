
# st-annotator
[![PyPI version](https://badge.fury.io/py/st-annotator.svg)](https://badge.fury.io/py/st-annotator)

st-annotator is a Streamlit component usefull to annotate text, expecially for NLP and Argument Mining purposes.
Based on the original project [Streamlit Annotation Tools](https://github.com/streamlit/annotation-tools) of [rmarquet21](https://github.com/rmarquet21).


# Demo on Streamlit Cloud
[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://app-annotator.streamlit.app)

## New Features
- Key parameter to text_annotator function
- A special button to show all the annotations together

## Animated Examples
![](docs/ann_without_input.gif)

![](docs/ann_with_custom_colors.gif)

![](docs/show_all_button.gif)

# Install

```
pip install st-annotator
```

# Quick Use

## Text Annotator

Create an example.py file

```python
from st_annotator import text_labeler

text = "Effects of globalization During the history of the world , every change has its own positive and negative sides . Globalization as a gradual change affecting all over the world is not an exception . Although it has undeniable effects on the economics of the world ; it has side effects which make it a controversial issue . <AC0> Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country </AC0> . They think that <AC1> the idea of globalization put their inherited culture in danger of uncontrolled change and make them vulnerable against the attack of imperialistic governments </AC1> . Those who disagree , believe that <AC2> globalization contribute effectively to the global improvement of the world in many aspects </AC2> . <AC3> Developing globalization , people can have more access to many natural resources of the world and it leads to increasing the pace of scientific and economic promotions of the entire world </AC3> . In addition , <AC4> they admit that globalization can be considered a chance for people of each country to promote their lifestyle through the stuffs and services imported from other countries </AC4> . Moreover , the proponents of globalization idea point out <AC5> globalization results in considerable decrease in global tension </AC5> due to <AC6> convergence of benefits of people of the world which is a natural consequence of globalization </AC6> . In conclusion , <AC7> I would rather classify myself in the proponents of globalization as a speeding factor of global progress </AC7> . I think it is more likely to solve the problems of the world rather than intensifying them ."

labels = text_annotator(text, labels, in_snake_case=False, show_label_input=True, colors={"label_input":"#ff9500", "Major Claim": "#a457d7", "Claim": "#3478f6", "Premise": "#5ac4be"})
    
```

Run:

```
streamlit run example.py
```

Output:

```python
{
    "Major Claim": [
      {"start": 1467, "end": 1572, "label": "I would rather classify myself in the proponents of globalization as a speeding factor of global progress"}
    ],
    "Claim": [
      {"start": 330, "end": 445, "label": "Some people prefer to recognize globalization as a threat to ethnic and religious values of people of their country"},
      {"start": 686, "end": 777, "label": "globalization contribute effectively to the global improvement of the world in many aspects"},
      {"start": 1256, "end": 1320, "label": "globalization results in considerable decrease in global tension"}
    ],
    "Premise": [
      {"start": 477, "end": 636, "label": "the idea of globalization put their inherited culture in danger of uncontrolled change and make them vulnerable against the attack of imperialistic governments"},
      {"start": 793, "end": 980, "label": "Developing globalization , people can have more access to many natural resources of the world and it leads to increasing the pace of scientific and economic promotions of the entire world"},
      {"start": 1010, "end": 1182, "label": "they admit that globalization can be considered a chance for people of each country to promote their lifestyle through the stuffs and services imported from other countries"},
      {"start": 1341, "end": 1435, "label": "convergence of benefits of people of the world which is a natural consequence of globalization"}
    ],
}
```

# Development

## Install

```
git clone <your-repository-url>
cd st-annotator
pip install -e .
```

## Run

```
streamlit run example.py
```

# License

MIT

# Author

Ettore Caputo

