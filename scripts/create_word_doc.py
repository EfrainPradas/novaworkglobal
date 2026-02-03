#!/usr/bin/env python3
"""
Create a Word document from markdown files using only built-in libraries.
Since python-docx is not available, we'll create an HTML file that can be
opened in Word and saved as DOCX.
"""

from pathlib import Path
import html

def markdown_to_html(md_text):
    """Very basic markdown to HTML conversion."""
    lines = md_text.split('\n')
    html_lines = []
    in_code_block = False
    in_list = False

    for line in lines:
        # Code blocks
        if line.startswith('```'):
            if in_code_block:
                html_lines.append('</pre>')
                in_code_block = False
            else:
                html_lines.append('<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">')
                in_code_block = True
            continue

        if in_code_block:
            html_lines.append(html.escape(line))
            continue

        # Headers
        if line.startswith('# '):
            html_lines.append(f'<h1 style="color: #007bff; margin-top: 20px;">{html.escape(line[2:])}</h1>')
        elif line.startswith('## '):
            html_lines.append(f'<h2 style="color: #0056b3; margin-top: 18px;">{html.escape(line[3:])}</h2>')
        elif line.startswith('### '):
            html_lines.append(f'<h3 style="color: #212529; margin-top: 16px;">{html.escape(line[4:])}</h3>')
        elif line.startswith('#### '):
            html_lines.append(f'<h4 style="color: #495057; margin-top: 14px;">{html.escape(line[5:])}</h4>')

        # Horizontal rule
        elif line.strip() == '---':
            html_lines.append('<hr style="border: 1px solid #e9ecef; margin: 20px 0;">')

        # Lists
        elif line.startswith('- ') or line.startswith('* '):
            if not in_list:
                html_lines.append('<ul style="margin-left: 20px;">')
                in_list = True
            html_lines.append(f'<li>{html.escape(line[2:])}</li>')
        elif line.startswith('  - ') or line.startswith('  * '):
            html_lines.append(f'<li style="margin-left: 20px;">{html.escape(line[4:])}</li>')

        # Numbered lists
        elif line and line[0].isdigit() and '. ' in line:
            if in_list and html_lines[-1].startswith('<ul'):
                html_lines[-1] = '<ol style="margin-left: 20px;">'
            elif not in_list:
                html_lines.append('<ol style="margin-left: 20px;">')
                in_list = True
            html_lines.append(f'<li>{html.escape(line.split(". ", 1)[1])}</li>')

        # End list
        elif in_list and line.strip() == '':
            if '<ul' in html_lines[-2] if len(html_lines) > 1 else '':
                html_lines.append('</ul>')
            else:
                html_lines.append('</ol>')
            in_list = False
            html_lines.append('<br>')

        # Bold
        elif '**' in line:
            processed = line
            while '**' in processed:
                processed = processed.replace('**', '<strong>', 1)
                processed = processed.replace('**', '</strong>', 1)
            html_lines.append(f'<p>{processed}</p>')

        # Blockquote
        elif line.startswith('> '):
            html_lines.append(f'<blockquote style="border-left: 4px solid #007bff; padding-left: 15px; margin-left: 0; color: #6c757d;">{html.escape(line[2:])}</blockquote>')

        # Table detection (basic)
        elif '|' in line and line.strip().startswith('|'):
            # Simple table row
            cells = [c.strip() for c in line.split('|')[1:-1]]
            if all(c == '-' or c.startswith('-') for c in cells):
                continue  # Skip separator row
            row_html = '<tr>' + ''.join(f'<td style="border: 1px solid #dee2e6; padding: 8px;">{html.escape(c)}</td>' for c in cells) + '</tr>'
            if '<table' not in ''.join(html_lines[-3:]):
                html_lines.append('<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">')
            html_lines.append(row_html)

        # Regular paragraph
        elif line.strip():
            html_lines.append(f'<p style="line-height: 1.6;">{html.escape(line)}</p>')
        else:
            html_lines.append('<br>')

    # Close any open lists
    if in_list:
        html_lines.append('</ul>')

    # Close any open tables
    if '<table' in ''.join(html_lines[-10:]):
        html_lines.append('</table>')

    return '\n'.join(html_lines)

def create_comprehensive_doc():
    """Create a comprehensive HTML document with all documentation."""

    # Read all documentation
    docs_dir = Path('/home/efraiprada/carreerstips/docs')

    req_content = ''
    source_q_content = ''
    source_p_content = ''

    req_file = docs_dir / 'requirements.md'
    if req_file.exists():
        with open(req_file, 'r', encoding='utf-8') as f:
            req_content = f.read()

    source_q_file = docs_dir / 'source-requirements-questions.md'
    if source_q_file.exists():
        with open(source_q_file, 'r', encoding='utf-8') as f:
            source_q_content = f.read()

    source_p_file = docs_dir / 'source-presentation.md'
    if source_p_file.exists():
        with open(source_p_file, 'r', encoding='utf-8') as f:
            source_p_content = f.read()

    # Create HTML document
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CareerTipsAI - Complete Documentation Package</title>
    <style>
        body {{
            font-family: 'Calibri', 'Arial', sans-serif;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            color: #212529;
            background: white;
        }}
        .cover-page {{
            text-align: center;
            padding: 100px 0;
            page-break-after: always;
        }}
        .cover-page h1 {{
            font-size: 42px;
            color: #007bff;
            margin-bottom: 20px;
            font-weight: 800;
        }}
        .cover-page p {{
            font-size: 18px;
            color: #6c757d;
            margin: 10px 0;
        }}
        .toc {{
            page-break-after: always;
            margin: 40px 0;
        }}
        .toc h2 {{
            color: #007bff;
            border-bottom: 3px solid #007bff;
            padding-bottom: 10px;
        }}
        .toc ul {{
            list-style: none;
            padding: 0;
        }}
        .toc li {{
            padding: 8px 0;
            border-bottom: 1px dotted #dee2e6;
        }}
        .section {{
            page-break-before: always;
            margin-top: 40px;
        }}
        .section-title {{
            background: #007bff;
            color: white;
            padding: 15px;
            margin: 30px -20px 20px -20px;
            font-size: 24px;
            font-weight: bold;
        }}
        h1, h2, h3, h4 {{
            page-break-after: avoid;
        }}
        table {{
            page-break-inside: avoid;
        }}
        pre {{
            page-break-inside: avoid;
        }}
        @media print {{
            body {{
                margin: 0;
                padding: 0.5in;
            }}
            .section {{
                page-break-before: always;
            }}
        }}
    </style>
</head>
<body>
    <!-- Cover Page -->
    <div class="cover-page">
        <h1>CareerTipsAI</h1>
        <p style="font-size: 24px; color: #007bff; font-weight: 600;">Complete Documentation Package</p>
        <p style="margin-top: 60px; font-size: 16px;">Phase 0: Foundation & Planning</p>
        <p>Generated: November 17, 2025</p>
        <p style="margin-top: 40px; color: #495057;">
            AI-Powered Career Transformation Platform<br>
            Human Experience + Intelligent Tools
        </p>
    </div>

    <!-- Table of Contents -->
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><strong>Section 1:</strong> Comprehensive Requirements Document</li>
            <li><strong>Section 2:</strong> Source Material - Requirements Questions</li>
            <li><strong>Section 3:</strong> Source Material - Presentation</li>
            <li><strong>Appendix A:</strong> Project Structure</li>
            <li><strong>Appendix B:</strong> Technology Stack Summary</li>
        </ul>
    </div>

    <!-- Section 1: Requirements -->
    <div class="section">
        <div class="section-title">Section 1: Comprehensive Requirements Document</div>
        {markdown_to_html(req_content)}
    </div>

    <!-- Section 2: Source Questions -->
    <div class="section">
        <div class="section-title">Section 2: Source Material - Requirements Questions</div>
        {markdown_to_html(source_q_content)}
    </div>

    <!-- Section 3: Source Presentation -->
    <div class="section">
        <div class="section-title">Section 3: Source Material - Presentation</div>
        {markdown_to_html(source_p_content)}
    </div>

    <!-- Appendix A -->
    <div class="section">
        <div class="section-title">Appendix A: Project Structure</div>
        <h3>Directory Layout</h3>
        <pre>/home/efraiprada/carreerstips/
├── frontend/          (React application)
├── backend/           (Supabase Edge Functions)
├── docs/              (Documentation)
│   ├── requirements.md
│   ├── source-requirements-questions.md
│   └── source-presentation.md
├── ai-pipeline/       (AI integration layer)
├── shared/            (Shared types and constants)
├── assets/
│   ├── brand/         (Logo, images, landing page)
│   └── content/       (Content assets)
├── .gitignore
├── extract_docs.py
└── create_word_doc.py</pre>
    </div>

    <!-- Appendix B -->
    <div class="section">
        <div class="section-title">Appendix B: Technology Stack Summary</div>
        <h3>Core Technologies</h3>
        <ul>
            <li><strong>Frontend:</strong> React 18 + Vite + Tailwind CSS</li>
            <li><strong>Backend:</strong> Supabase (PostgreSQL + Auth + Edge Functions)</li>
            <li><strong>AI Providers:</strong> OpenAI GPT-4o, Anthropic Claude, Open-source models</li>
            <li><strong>Payments:</strong> Stripe</li>
            <li><strong>Hosting:</strong> Vercel (frontend), Supabase (backend)</li>
            <li><strong>Monitoring:</strong> Sentry</li>
            <li><strong>Analytics:</strong> Mixpanel or Amplitude</li>
        </ul>

        <h3>Development Timeline</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #007bff; color: white;">
                <th style="border: 1px solid #dee2e6; padding: 10px;">Phase</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Duration</th>
                <th style="border: 1px solid #dee2e6; padding: 10px;">Key Deliverable</th>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 0: Foundation</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">2 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Documentation & Setup</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 1: Infrastructure</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">2 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Auth & Database</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 2: Onboarding</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">2 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">60-second Experience</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 3: AI Agent Core</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">4 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Job Matching & Resume</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 4: Automation</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">2 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Weekly Cycles & Metrics</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 5: Polish</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">3 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Interview Prep & UX</td>
            </tr>
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Phase 6: Launch</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">1 week</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">Beta Deployment</td>
            </tr>
            <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td style="border: 1px solid #dee2e6; padding: 8px;">TOTAL</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">16 weeks</td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">MVP Launch</td>
            </tr>
        </table>
    </div>

    <!-- Footer -->
    <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
        <p><strong>CareerTipsAI</strong> - Redefining how professionals shape their future</p>
        <p>© 2025 CareerTipsAI. Confidential and Proprietary.</p>
    </div>
</body>
</html>"""

    # Save HTML file
    output_file = Path('/home/efraiprada/carreerstips/CareerTipsAI_Documentation_Package.html')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html_template)

    print(f"✓ Documentation package created: {output_file}")
    print(f"\nTo convert to Word (.docx):")
    print(f"  1. Open the HTML file in Microsoft Word")
    print(f"  2. Go to File > Save As")
    print(f"  3. Choose 'Word Document (.docx)' as the format")
    print(f"  4. Save to your desired location")
    print(f"\nAlternatively, you can open it in LibreOffice Writer and save as .docx")

    return output_file

if __name__ == '__main__':
    create_comprehensive_doc()
