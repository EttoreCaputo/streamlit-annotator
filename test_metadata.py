#!/usr/bin/env python3

import streamlit as st
from src.st_annotator import text_annotator

st.title("Metadata Test")

text = "This is a test sentence for metadata preservation."

# Initial labels with metadata
labels = {
    "Test": [
        {
            "start": 0,
            "end": 4,
            "label": "This",
            "metadata": {
                "confidence": 0.95,
                "source": "test",
                "type": "important"
            }
        }
    ]
}

st.write("Input labels with metadata:")
st.json(labels)

# Use the annotator
result = text_annotator(text, labels, key="metadata_test")

st.write("Output labels (should preserve metadata):")
st.json(result)

if result:
    # Check if metadata is preserved
    for label_type, annotations in result.items():
        for ann in annotations:
            if 'metadata' in ann:
                st.success(f"✅ Metadata preserved for annotation: {ann['label']}")
                st.json(ann['metadata'])
            else:
                st.warning(f"⚠️ No metadata found for annotation: {ann['label']}")


