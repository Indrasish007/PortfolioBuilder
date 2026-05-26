import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_resume_pdf(data: dict, template_slug: str) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # Margins setup: ATS/Developer is standard (36pt), Minimal is spacious (45pt), Modern is compact (30pt)
    margin = 36
    if template_slug == "minimal":
        margin = 45
    elif template_slug == "modern":
        margin = 30
        
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin
    )
    
    styles = getSampleStyleSheet()
    
    # Accent color based on template slug
    primary_color = colors.HexColor("#2563eb") # Blue (default Modern)
    if template_slug == "creative":
        primary_color = colors.HexColor("#db2777") # Pink/Magenta Accent
    elif template_slug == "modern":
        primary_color = colors.HexColor("#0f172a") # Slate Navy
    elif template_slug == "developer":
        primary_color = colors.HexColor("#10b981") # Emerald Green
    elif template_slug == "ats":
        primary_color = colors.HexColor("#1e293b") # Charcoal Slate
        
    body_font = "Helvetica"
    title_font = "Helvetica-Bold"
    
    # Alignments
    header_align = TA_CENTER if template_slug in ("minimal", "creative") else TA_LEFT
    
    style_name = ParagraphStyle(
        'ResumeName',
        parent=styles['Normal'],
        fontName=title_font,
        fontSize=24,
        leading=28,
        textColor=primary_color if template_slug != "ats" else colors.black,
        alignment=header_align,
        spaceAfter=4
    )
    
    style_headline = ParagraphStyle(
        'ResumeHeadline',
        parent=styles['Normal'],
        fontName=body_font,
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#475569"),
        alignment=header_align,
        spaceAfter=8
    )
    
    style_contact = ParagraphStyle(
        'ResumeContact',
        parent=styles['Normal'],
        fontName=body_font,
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569"),
        alignment=header_align,
        spaceAfter=12
    )
    
    style_section_title = ParagraphStyle(
        'ResumeSectionTitle',
        parent=styles['Normal'],
        fontName=title_font,
        fontSize=12,
        leading=14,
        textColor=primary_color if template_slug != "ats" else colors.black,
        spaceBefore=10,
        spaceAfter=4
    )
    
    style_body = ParagraphStyle(
        'ResumeBody',
        parent=styles['Normal'],
        fontName=body_font,
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6
    )
    
    style_body_bold = ParagraphStyle(
        'ResumeBodyBold',
        parent=style_body,
        fontName=title_font
    )
    
    style_body_italic = ParagraphStyle(
        'ResumeBodyItalic',
        parent=style_body,
        fontName="Helvetica-Oblique"
    )
    
    style_bullet = ParagraphStyle(
        'ResumeBullet',
        parent=style_body,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3
    )

    story = []
    
    # ── HEADER SECTION ──
    full_name = data.get("full_name", "") or "Your Name"
    headline = data.get("headline", "") or ""
    email = data.get("email", "") or ""
    phone = data.get("phone", "") or ""
    location = data.get("location", "") or ""
    
    contact_parts = []
    if email: contact_parts.append(email)
    if phone: contact_parts.append(phone)
    if location: contact_parts.append(location)
    
    socials = data.get("social_links", [])
    for s in socials:
        if isinstance(s, dict) and s.get("url"):
            url = s["url"].replace("https://", "").replace("http://", "").replace("www.", "")
            contact_parts.append(f"{s.get('platform', 'link').capitalize()}: {url}")
            
    contact_text = "  |  ".join(contact_parts)
    
    if template_slug == "creative":
        # Solid primary color background banner
        header_data = [
            [Paragraph(full_name, ParagraphStyle('CreativeName', parent=style_name, textColor=colors.white, alignment=TA_CENTER))],
            [Paragraph(headline, ParagraphStyle('CreativeHead', parent=style_headline, textColor=colors.HexColor("#f1f5f9"), alignment=TA_CENTER))] if headline else [],
            [Paragraph(contact_text, ParagraphStyle('CreativeContact', parent=style_contact, textColor=colors.HexColor("#e2e8f0"), alignment=TA_CENTER))]
        ]
        header_data = [x for x in header_data if x]
        header_table = Table(header_data, colWidths=[doc.width])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 18),
            ('BOTTOMPADDING', (0,0), (-1,-1), 18),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))
    else:
        story.append(Paragraph(full_name, style_name))
        if headline:
            story.append(Paragraph(headline, style_headline))
        story.append(Paragraph(contact_text, style_contact))
        
        # Main divider line
        divider_color = primary_color if template_slug != "ats" else colors.HexColor("#cbd5e1")
        story.append(HRFlowable(width="100%", thickness=1.5, color=divider_color, spaceAfter=15))
        
    def add_section_header(title):
        header_text_color = primary_color if template_slug != "ats" else colors.black
        story.append(Paragraph(title.upper(), ParagraphStyle('SectTitle', parent=style_section_title, textColor=header_text_color)))
        story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
        
    # ── BIO / SUMMARY ──
    bio = data.get("bio", "")
    if bio:
        add_section_header("Professional Summary")
        story.append(Paragraph(bio, style_body))
        story.append(Spacer(1, 8))
        
    # ── EXPERIENCE ──
    experience = data.get("experience", [])
    if experience:
        add_section_header("Work Experience")
        for exp in experience:
            role = exp.get("role", "")
            company = exp.get("company", "")
            start = exp.get("start_date") or ""
            end = exp.get("end_date") or "Present"
            desc = exp.get("description", "")
            
            period_str = f"{start} – {end}" if start else end
            
            # Role & Company Left, Dates Right
            subheader_data = [
                [
                    Paragraph(f"<b>{role}</b> at <b>{company}</b>", style_body),
                    Paragraph(period_str, ParagraphStyle('RightDate', parent=style_body, alignment=TA_RIGHT))
                ]
            ]
            t = Table(subheader_data, colWidths=[doc.width * 0.7, doc.width * 0.3])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
            
            if desc:
                desc_lines = [l.strip() for l in desc.split("\n") if l.strip()]
                for line in desc_lines:
                    if line.startswith(('-', '•', '*')):
                        clean_line = line.lstrip('-•*').strip()
                        story.append(Paragraph(f"&bull; {clean_line}", style_bullet))
                    else:
                        story.append(Paragraph(line, style_body))
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 4))
        
    # ── PROJECTS ──
    projects = data.get("projects", [])
    if projects:
        add_section_header("Projects")
        for proj in projects:
            title = proj.get("title", "")
            tech = proj.get("tech_stack", "")
            desc = proj.get("description", "")
            github = proj.get("github_url", "")
            live = proj.get("live_url", "")
            
            links_part = []
            if github: links_part.append(f"GitHub: {github}")
            if live: links_part.append(f"Demo: {live}")
            links_str = "  |  ".join(links_part)
            
            title_text = f"<b>{title}</b>"
            if tech:
                # Monospaced font for tech stack in Developer template
                if template_slug == "developer":
                    title_text += f" <font name='Courier'>&lt;{tech}&gt;</font>"
                else:
                    title_text += f" <i>({tech})</i>"
                
            subheader_data = [
                [
                    Paragraph(title_text, style_body),
                    Paragraph(links_str, ParagraphStyle('RightLinks', parent=style_body, alignment=TA_RIGHT, fontSize=8, textColor=primary_color))
                ]
            ]
            t = Table(subheader_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
            
            if desc:
                story.append(Paragraph(desc, style_body))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))
        
    # ── EDUCATION ──
    education = data.get("education", [])
    if education:
        add_section_header("Education")
        for edu in education:
            school = edu.get("school", "")
            degree = edu.get("degree", "")
            start = edu.get("start_date") or ""
            end = edu.get("end_date") or "Present"
            grade = edu.get("grade", "")
            
            period_str = f"{start} – {end}" if start else end
            degree_str = degree
            if grade:
                degree_str += f" (Grade: {grade})"
                
            subheader_data = [
                [
                    Paragraph(f"<b>{school}</b>", style_body),
                    Paragraph(period_str, ParagraphStyle('RightDateEdu', parent=style_body, alignment=TA_RIGHT))
                ]
            ]
            t = Table(subheader_data, colWidths=[doc.width * 0.7, doc.width * 0.3])
            t.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
            story.append(Paragraph(degree_str, style_body_italic))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 4))
        
    # ── SKILLS & LANGUAGES ──
    skills = data.get("skills", [])
    languages = data.get("languages", [])
    
    if skills or languages:
        add_section_header("Skills & Spoken Languages")
        
        if skills:
            skills_str = ", ".join(skills)
            story.append(Paragraph(f"<b>Technical Skills:</b> {skills_str}", style_body))
            
        if languages:
            lang_parts = []
            for l in languages:
                if isinstance(l, dict):
                    lang_parts.append(f"{l.get('name')} ({l.get('proficiency', 'Fluent')})")
                else:
                    lang_parts.append(str(l))
            langs_str = ", ".join(lang_parts)
            story.append(Paragraph(f"<b>Languages:</b> {langs_str}", style_body))
        story.append(Spacer(1, 8))
        
    # ── CERTIFICATIONS ──
    certs = data.get("certifications", [])
    if certs:
        add_section_header("Certifications")
        for cert in certs:
            name = cert.get("name", "")
            issuer = cert.get("issuer", "")
            year = cert.get("year", "")
            
            cert_str = f"<b>{name}</b>"
            if issuer: cert_str += f" – {issuer}"
            if year: cert_str += f" ({year})"
            
            story.append(Paragraph(f"&bull; {cert_str}", style_bullet))
            
    doc.build(story)
    buffer.seek(0)
    return buffer
