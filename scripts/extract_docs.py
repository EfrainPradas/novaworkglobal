#!/usr/bin/env python3
"""
Extract text from DOCX and PPTX files without external dependencies.
Uses built-in zipfile and xml.etree.ElementTree libraries.
"""

import zipfile
import xml.etree.ElementTree as ET
import sys
from pathlib import Path

def extract_docx_text(docx_path):
    """Extract text from DOCX file."""
    try:
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            xml_content = zip_ref.read('word/document.xml')
            tree = ET.fromstring(xml_content)

            # Define namespace
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

            # Extract all text elements
            paragraphs = []
            for paragraph in tree.findall('.//w:p', ns):
                texts = []
                for text in paragraph.findall('.//w:t', ns):
                    if text.text:
                        texts.append(text.text)
                if texts:
                    paragraphs.append(''.join(texts))

            return '\n\n'.join(paragraphs)
    except Exception as e:
        return f"Error extracting DOCX: {e}"

def extract_pptx_text(pptx_path):
    """Extract text from PPTX file."""
    try:
        slides_text = []
        with zipfile.ZipFile(pptx_path, 'r') as zip_ref:
            # Get all slide XML files
            slide_files = [f for f in zip_ref.namelist() if f.startswith('ppt/slides/slide') and f.endswith('.xml')]
            slide_files.sort()

            for slide_file in slide_files:
                xml_content = zip_ref.read(slide_file)
                tree = ET.fromstring(xml_content)

                # Define namespaces
                ns = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}

                # Extract all text elements
                texts = []
                for text_elem in tree.findall('.//a:t', ns):
                    if text_elem.text:
                        texts.append(text_elem.text)

                if texts:
                    slide_num = slide_file.split('slide')[1].split('.xml')[0]
                    slides_text.append(f"## Slide {slide_num}\n\n" + '\n'.join(texts))

        return '\n\n---\n\n'.join(slides_text)
    except Exception as e:
        return f"Error extracting PPTX: {e}"

def main():
    # Paths
    source_dir = Path('/mnt/c/CarrersA')
    output_dir = Path('/home/efraiprada/carreerstips/docs')

    # Extract DOCX
    docx_file = source_dir / 'Questions to Define the CareerTipsAI App.docx'
    if docx_file.exists():
        print(f"Extracting {docx_file.name}...")
        docx_text = extract_docx_text(docx_file)
        output_file = output_dir / 'source-requirements-questions.md'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Questions to Define the CareerTipsAI App\n\n")
            f.write(f"*Extracted from: {docx_file.name}*\n\n")
            f.write("---\n\n")
            f.write(docx_text)
        print(f"✓ Saved to {output_file}")

    # Extract PPTX
    pptx_file = source_dir / 'How-AI-Helps-You-Shape-Your-Future-Career (1).pptx'
    if pptx_file.exists():
        print(f"Extracting {pptx_file.name}...")
        pptx_text = extract_pptx_text(pptx_file)
        output_file = output_dir / 'source-presentation.md'
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# How AI Helps You Shape Your Future Career\n\n")
            f.write(f"*Extracted from: {pptx_file.name}*\n\n")
            f.write("---\n\n")
            f.write(pptx_text)
        print(f"✓ Saved to {output_file}")

    print("\n✓ All documents extracted successfully!")

if __name__ == '__main__':
    main()
