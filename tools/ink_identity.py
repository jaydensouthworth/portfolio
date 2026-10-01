"""Content-led reading layer for the selected Ink direction. Other concepts stay intact."""
from html import escape as e
import re


def diagram(kind):
    # These are accessible conceptual flow summaries, not fabricated UI screenshots.
    content = {
        'vendo': ('Vending flow', ['Inventory file', 'Deposit', 'Select', 'Change / log'],
                  'Inventory is loaded from a file; a deposit and selection lead to change and a transaction log.'),
        'tenmo': ('Client and API flow', ['CLI client', 'REST API', 'Transfer', 'PostgreSQL'],
                  'A command-line client sends transfer requests to a REST API backed by PostgreSQL.'),
        'shopper': ('Storefront and order flow', ['Catalog', 'Basket', 'Order', 'Manager'],
                    'A searchable catalog leads to a basket and simulated order, which joins the manager order queue.'),
    }[kind]
    title, labels, description = content
    positions = [(10 + i*125, 36, 110, 58) for i in range(4)]
    paths = 'M120 65H135 M245 65H260 M370 65H385'
    boxes = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}"/><text x="{x+w/2}" y="{y+h/2+5}">{e(label)}</text>' for (x,y,w,h),label in zip(positions, labels))
    mobile = ''.join(f'<span>{e(label)}</span>' for label in labels)
    return f'''<figure class="project-flow"><svg viewBox="0 0 500 140" role="img" aria-label="{e(description)}"><path class="flow-line" d="{paths}"/>{boxes}</svg><div class="flow-mobile" role="img" aria-label="{e(description)}">{mobile}</div><figcaption>{title} <span>Conceptual summary</span></figcaption></figure>'''


def apply_identity(html, data):
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-identity.css?v=30"></head>')
    html = html.replace('Java, React, and the space between them.', 'Java &amp; React projects.<br>A writing-tool experiment. A few other worlds.')
    html = html.replace('Explore the work <svg', 'Enter selected work <svg')
    # The registration detail belongs to the title, rather than filling empty corners.
    html = html.replace('<h1 id="entry-title">', '<div class="ink-imprint" aria-hidden="true"><i></i><span>PROGRAMS / EXPERIMENTS</span></div><h1 id="entry-title">', 1)
    byid = {p['id']: p for p in data['projects']}
    featured = byid['shopper']
    def focus_notes(project, reader=False):
        detail = project['notes'].get('detail')
        if not detail:
            return ''
        cls = 'reader-only note-focus' if reader else 'note-focus'
        return f'<div class="{cls}"><h4>{e(detail["title"])}</h4><p>{e(detail["body"])}</p></div>'
    origin = ''.join(f'<p>{e(text)}</p>' for text in data['origin'])
    experiment = data['experiment']
    experiment_sections = ''.join(f'<section class="prototype-section"><h3>{e(item["title"])}</h3><p>{e(item["body"])}</p><a class="note-source" href="{e(item["source"])}" target="_blank" rel="noreferrer">{e(item["sourceLabel"])}</a></section>' for item in experiment['sections'])
    experiment_body = f'<p class="prototype-status">Public prototype · Structured writing</p><p class="case-intro">{e(experiment["summary"])}</p><div class="prototype-reference" aria-label="Conceptual sequence: a typed reference becomes a linked object chip and can be saved with the project"><span>[[character]]</span><span aria-hidden="true">→</span><strong>Linked object</strong><span aria-hidden="true">→</span><span>Project file</span></div><p class="prototype-caption">Conceptual reference flow</p>{experiment_sections}<p><a class="external-link" href="{e(experiment["source"])}" target="_blank" rel="noreferrer">Explore Aethel on GitHub</a></p><p class="case-note">Public prototype · Implementation notes from the repository.</p>'
    reader_experiment_body = experiment_body.replace('<h3>', '<h4>').replace('</h3>', '</h4>')
    reader_experiment = f'<article class="reader-only reader-prototype" aria-labelledby="reader-aethel-title"><p class="ink-section-label">A PERSONAL EXPERIMENT</p><h3 id="reader-aethel-title">Aethel</h3>{reader_experiment_body}</article>'

    feature = f'''<article class="ink-feature"><div class="ink-feature-copy"><div class="ink-note-top"><span>01 / {e(featured['type'])}</span></div><h3 id="project-shopper">{e(featured['name'])}</h3><p id="summary-shopper">{e(featured['summary'])}</p><p class="ink-role"><span>What I built</span>{e(featured['contribution'])}</p><p class="reader-only project-detail">{e(featured['notes']['overview'])}</p>{focus_notes(featured,True)}<div class="ink-feature-bottom"><span class="ink-stack">{e(' · '.join(featured['stack']))}</span><div class="ink-project-actions"><button type="button" data-case="shopper" class="ink-case-link" aria-label="View Store Shoppers project details" aria-haspopup="dialog">Project notes <span aria-hidden="true">↗</span></button><a class="ink-case-link" href="{e(featured['source'])}" target="_blank" rel="noreferrer" aria-label="View Store Shoppers source on GitHub">GitHub <span aria-hidden="true">↗</span></a></div></div></div><div class="ink-feature-visual">{diagram('shopper')}</div></article>'''
    index = []
    for number, ident, summary in [('02','tenmo','A client, an API, and the transfer flow between them.'), ('03','vendo','Inventory, program state, and the details of a transaction.')]:
        p = byid[ident]
        index.append(f'''<article class="ink-index-entry"><span class="ink-index-number">{number}</span><div class="ink-index-copy"><p class="ink-project-kind">{e(p['type'])}</p><h3 id="project-{ident}"><button data-case="{ident}" type="button" aria-label="View {e(p['name'])} project details" aria-haspopup="dialog">{e(p['name'])}<span aria-hidden="true">↗</span></button></h3><p id="summary-{ident}">{summary}</p><span class="ink-stack">{' · '.join(p['stack'])}</span><div class="reader-only project-detail"><p>{e(p['notes']['overview'])}</p><h4>What I worked on</h4><p>{e(p['contribution'])}</p>{focus_notes(p)}</div></div><div class="reader-only ink-index-visual">{diagram(ident)}</div></article>''')
    work = f'''<section id="work" class="realm work" aria-labelledby="work-title"><div class="ink-work-sheet"><div class="ink-sheet-heading"><div><p class="ink-section-label">THE PROJECT FOLIO</p><h2 id="work-title">Selected work<span aria-hidden="true">.</span></h2></div><p class="ink-training-note">Personal projects<br>&amp; training</p></div><div class="ink-work-grid">{feature}<div class="ink-index">{''.join(index)}</div></div>{reader_experiment}<div class="ink-sheet-footer"><button class="prototype-link" type="button" data-case="aethel" aria-haspopup="dialog" aria-label="View Aethel prototype notes">Aethel <span>· Prototype notes</span></button><button class="text-button" data-go="2" data-travel type="button">Get in touch <span aria-hidden="true">→</span></button></div></div></section>'''
    html = re.sub(r'<section id="work".*?</section>', work, html, flags=re.S)
    about = f'''<section id="contact" class="realm about contact" aria-labelledby="contact-title"><div class="about-content ink-about ink-contact"><p class="ink-person-label">JAYDEN SOUTHWORTH</p><h2 id="contact-title">Say hello<span>.</span></h2><p class="about-intro">An idea to build. A problem to solve.<br>I’d like to hear about it.</p><a class="contact-email" href="mailto:jaydensouthworth@jaydensrealm.com"><span>Email me</span><strong>jaydensouthworth<wbr>@jaydensrealm.com</strong><svg aria-hidden="true" viewBox="0 0 20 20"><path d="M3 17L17 3M3 3h14v14" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a><div class="contact-links"><a href="https://github.com/jaydensouthworth" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a><a href="https://www.linkedin.com/in/jayden-southworth" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div><div class="about-actions"><button class="text-button" data-background type="button" aria-haspopup="dialog">Background &amp; skills</button><button class="text-button" type="button" data-go="0">Back to the beginning</button></div></div></section>'''
    html = re.sub(r'<section id="about".*?</section>', about, html, flags=re.S)
    for p in data['projects']:
        ident = p['id']
        source_link = f'<p><a class="external-link" href="{e(p["source"])}" target="_blank" rel="noreferrer">View {e(p["name"])} on GitHub <span aria-hidden="true">↗</span></a></p>' if p.get('source') else ''
        status = p.get('status', 'Full-stack training project · Merit America, 2022.')
        replacement = f'''<dialog id="case-{ident}" class="case-dialog ink-case" aria-labelledby="case-title-{ident}"><button class="dialog-close" data-close aria-label="Close project details">Close <span aria-hidden="true">×</span></button><div class="case-kicker">PROJECT NOTE / {['shopper','tenmo','vendo'].index(ident)+1:02d}</div><h2 id="case-title-{ident}">{e(p['name'])}</h2><p class="ink-case-stack">{e(' / '.join(p['stack']))}</p><p class="case-intro">{e(p['notes']['overview'])}</p>{diagram(ident)}<div class="ink-contribution"><h3>What I worked on</h3><p>{e(p['contribution'])}</p></div>{focus_notes(p)}{source_link}<p class="case-note">{e(status)}</p></dialog>'''
        html = re.sub(rf'<dialog id="case-{ident}".*?</dialog>', replacement, html, flags=re.S)
    prototype_dialog = f'<dialog id="case-aethel" class="case-dialog ink-case ink-prototype-note" aria-labelledby="case-title-aethel"><button class="dialog-close" data-close aria-label="Close prototype notes">Close <span aria-hidden="true">×</span></button><div class="case-kicker">PUBLIC PROTOTYPE</div><h2 id="case-title-aethel">Aethel</h2><p class="ink-case-stack">SvelteKit / TypeScript / TipTap</p>{experiment_body}</dialog>'
    html = html.replace('</body>', prototype_dialog + '</body>')
    html = html.replace('<p class="case-intro">'+e(data['background'])+'</p>', '<p>'+e(data['originCaption'])+'</p>'+origin+'<p>'+e(data['background'])+'</p>')
    skilltext = ''.join(f'<div><h3>{e(s["name"])}</h3><p>{e(" · ".join(s["items"]))}</p><p class="skill-example">{e(s["example"])}</p></div>' for s in data['skills'])
    html = html.replace('<h3>Learning &amp; development</h3>', '<details class="contact-explore"><summary>Explore the work behind the skills</summary><div><button type="button" data-case="shopper" aria-haspopup="dialog">Store Shoppers <span>Go, HTMX &amp; SQLite storefront and order workflow</span></button><button type="button" data-case="tenmo" aria-haspopup="dialog">TEnmo <span>Java client/server request flow</span></button><button type="button" data-case="aethel" aria-haspopup="dialog">Aethel <span>Linked references, undo/redo &amp; project files</span></button></div></details><h3>Learning &amp; development</h3>')
    html = html.replace('<h3>Learning &amp; development</h3>', f'<div class="ink-background-skills">{skilltext}</div><h3>Learning &amp; development</h3>')
    html = html.replace('id="background" class="case-dialog"', 'id="background" class="case-dialog ink-background"')
    html = html.replace('The human<br>behind the systems.', 'Background<br>&amp; skills')
    reader_skills = ''.join(f'<div><h3>{e(s["name"])}</h3><p>{e(" · ".join(s["items"]))}</p><p class="skill-example">{e(s["example"])}</p></div>' for s in data['skills'])
    reader_background = f'''<details class="contact-explore"><summary>Explore the work behind the skills</summary><div><button type="button" data-case="shopper" aria-haspopup="dialog">Store Shoppers <span>Go, HTMX &amp; SQLite storefront and order workflow</span></button><button type="button" data-case="tenmo" aria-haspopup="dialog">TEnmo <span>Java client/server request flow</span></button><button type="button" data-case="aethel" aria-haspopup="dialog">Aethel <span>Linked references, undo/redo &amp; project files</span></button></div></details><div class="reader-only reader-background"><div class="reader-background-story"><h3>Background &amp; learning</h3><p>{e(data['background'])}</p><p>{e(data['educationDetail'])}</p><div class="reader-links"><a href="{e(data['github'])}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a><a href="{e(data['portfolioSource'])}" target="_blank" rel="noreferrer">Portfolio source <span aria-hidden="true">↗</span></a></div></div><div class="reader-skills">{reader_skills}</div></div>'''
    html = html.replace('<div class="about-actions">', reader_background + '<div class="about-actions">', 1)
    letters = lambda word: ''.join(f'<b class="letter letter-{i}" data-letter="{e(letter)}">{e(letter)}</b>' for i, letter in enumerate(word))
    poster = f'''<section id="entry" class="realm entry ink-poster" aria-labelledby="entry-title"><h1 id="entry-title" aria-label="Jayden’s Realm"><span class="poster-word poster-jayden" aria-hidden="true">{letters('JAYDEN’S')}</span><span class="poster-word poster-realm" aria-hidden="true">{letters('REALM')}</span></h1><div class="ink-portal-slot" aria-hidden="true"></div><div class="reader-only reader-intro"><p class="reader-kicker">THE WORK OF JAYDEN SOUTHWORTH</p><h2>I like to write,<br><em>and build things,</em><br>sometimes.</h2>{origin}</div><svg class="reader-only reader-current" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true"><path fill="#754bb1" d="M-100 600C150 380 250 690 550 440S670 0 1260 60V650Z"/><path fill="#38d1df" d="M-100 650C150 430 250 740 550 490S670 50 1260 110V145C690 85 710 320 580 515S150 475-100 680Z"/><path fill="#e331c4" d="M-100 710C180 480 290 770 595 535S745 140 1260 175V230C780 190 760 440 630 575S200 535-100 760Z"/></svg><div class="entry-caption"><p class="eyebrow"><strong>Jayden Southworth</strong><span>{e(data["identityCaption"])}</span><button class="entry-origin" type="button" data-background aria-haspopup="dialog" aria-label="About Jayden’s coding background">{e(data["originCaption"])}</button></p><button class="enter-button" type="button" data-go="1" data-travel aria-label="Explore Jayden’s selected work">View my work<svg class="entry-arrow" aria-hidden="true" viewBox="0 0 20 20"><path d="M3 10h13M10 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></div></section>'''
    html = re.sub(r'<section id="entry".*?</section>', poster, html, flags=re.S)
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-content.css?v=119"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-poster.css?v=34"></head>')
    html = html.replace('</head>', '<link rel="preload" href="../assets/realm-overprint.woff" as="font" type="font/woff" crossorigin><link rel="stylesheet" href="../shared/ink-chromatic.css?v=40"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-details.css?v=119"></head>')
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-folio.css?v=75"><link rel="stylesheet" href="../shared/ink-reading.css?v=48"></head>')
    html = html.replace('<span aria-hidden="true">↗</span>', '<svg class="folio-arrow" aria-hidden="true" viewBox="0 0 16 16"><path d="M3 13L13 3M3 3h10v10" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>')
    html = html.replace('<a class="skip-link"', '<script>if(new URL(location.href).searchParams.get("view")==="reading"||matchMedia("(prefers-reduced-motion: reduce)").matches)document.body.classList.add("reduced");</script><a class="skip-link"', 1)
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-palette.css?v=75"></head>')
    html = html.replace('href="#about" data-go="2">About</a>', 'href="#contact" data-go="2">Contact</a>')
    html = html.replace('</head>', '<link rel="stylesheet" href="../shared/ink-contact.css?v=119"></head>')
    html = html.replace('<p class="case-note">This is a portfolio design study. A direct contact channel can be added to the chosen direction.</p>', '')
    return html
