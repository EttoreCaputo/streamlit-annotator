#!/usr/bin/env python3
"""
Test script to verify that the original text is never modified during annotations.
This test checks that:
1. The text remains exactly the same after creating annotations
2. The text remains exactly the same after removing annotations
3. The text remains exactly the same after multiple operations
"""

import streamlit as st
from src.st_annotator import text_annotator

st.title("Text Preservation Test")
st.markdown("""
## Test: Text Must Never Be Modified

This test verifies that the original text from input remains **exactly the same** 
throughout all annotation operations.

### Test Steps:
1. **Original Text**: Displayed below - this is the input text
2. **Create Annotations**: Select text and create annotations
3. **Verify**: Check that the text in annotations matches the original text exactly
4. **Remove Annotations**: Remove some annotations
5. **Verify Again**: Ensure text still matches
""")

# Test text with special characters and various content
original_text = """This is a test sentence with special characters: !@#$%^&*()_+-=[]{}|;':\",./<>?
It also has multiple lines and    multiple   spaces.
Numbers: 1234567890
Unicode: àáâãäåæçèéêë 中文 العربية 🚀"""

st.subheader("Original Input Text:")
st.code(original_text, language=None)
st.write(f"**Length**: {len(original_text)} characters")

# Store original text in session state to compare later
if 'original_text' not in st.session_state:
    st.session_state.original_text = original_text

# Initial labels
initial_labels = {
    "Test": [
        {
            "start": 0,
            "end": 4,
            "label": "This"
        }
    ]
}

st.subheader("Annotator Component:")
result = text_annotator(original_text, initial_labels, key="text_preservation_test")

if result:
    st.subheader("Test Results:")
    
    # Verify text preservation by checking all annotations
    all_text_matches = True
    text_modifications = []
    
    for label_type, annotations in result.items():
        for ann in annotations:
            start = ann.get('start', 0)
            end = ann.get('end', 0)
            label_text = ann.get('label', '')
            
            # Extract the corresponding text from original
            original_slice = st.session_state.original_text[start:end]
            
            if label_text != original_slice:
                all_text_matches = False
                text_modifications.append({
                    'label_type': label_type,
                    'start': start,
                    'end': end,
                    'expected': repr(original_slice),
                    'got': repr(label_text),
                    'match': False
                })
    
    if all_text_matches:
        st.success("✅ **PASS**: All annotation text matches the original text exactly!")
    else:
        st.error("❌ **FAIL**: Text modifications detected!")
        st.write("**Differences found:**")
        for diff in text_modifications:
            st.write(f"- Label '{diff['label_type']}' at position {diff['start']}-{diff['end']}:")
            st.write(f"  - Expected: {diff['expected']}")
            st.write(f"  - Got: {diff['got']}")
    
    # Display all annotations for manual verification
    st.subheader("Current Annotations:")
    st.json(result)
    
    # Show a comparison
    st.subheader("Text Comparison:")
    st.write("**Original text (first 100 chars):**")
    st.code(st.session_state.original_text[:100])
    
    if result:
        # Reconstruct text from annotations to verify
        st.write("**Text extracted from annotations:**")
        annotation_texts = []
        for label_type, annotations in result.items():
            for ann in annotations:
                annotation_texts.append(f"[{ann['start']}-{ann['end']}]: {repr(ann.get('label', ''))}")
        st.code('\n'.join(annotation_texts[:10]))  # Show first 10

else:
    st.info("Create some annotations to see the test results.")

