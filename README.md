
# Streamlit Annotator
<table>
<tr>
<td>

**Download the package from PyPI:**

[![PyPI version](https://badge.fury.io/py/st-annotator.svg)](https://badge.fury.io/py/st-annotator)



</td>
<td>

**Try the demo on Streamlit Cloud:**

[![Open in Streamlit](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://st-annotator.streamlit.app)

</td>
</tr>
</table>

# Install with pip

```
pip install st-annotator
```

st-annotator is a Streamlit component usefull to annotate text, expecially for NLP and Argument Mining purposes.
Based on the original project [Streamlit Annotation Tools](https://github.com/streamlit/annotation-tools) of [rmarquet21](https://github.com/rmarquet21).


![](docs/example.png)

### Features:
- 📍 Smart positioning that stays within screen bounds
- 📊 Shows text content, label category, position, and all custom metadata
- 🎨 Matches your custom color scheme
- ⚡ Instant display on hover, disappears on mouse leave
- 🔧 Supports strings, numbers, booleans, lists, and objects

### New Features
- Key parameter to text_annotator function
- A special button to show all the annotations together
- **🆕 Hover Popup with Metadata**: Hover over annotations to see detailed information including custom metadata




### Metadata Support
You can now add custom metadata to each annotation that will appear in a hover popup:

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

# Quick Start

Run the example.py file:

```
streamlit run examples/example.py
```


