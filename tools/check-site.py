"""Validate the buildless static payload without network access."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import re

root = Path(__file__).resolve().parents[1]
site = root / 'dist'
errors = []
refs = []
class Page(HTMLParser):
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag in ('script', 'link', 'img'):
            value = values.get('src') or values.get('href', '')
            if value.startswith('/'):
                refs.append(urlsplit(value).path)

page = Page()
page.feed((site / 'index.html').read_text())
for ref in refs:
    if not (site / ref.lstrip('/')).is_file():
        errors.append('Missing asset: ' + ref)
for css in (site / 'shared').glob('*.css'):
    for match in re.findall(r'url\([\"\']?([^\)\"\']+)', css.read_text()):
        if not match.startswith(('data:', 'https:', 'http:')) and not (css.parent / match.split('?')[0]).resolve().is_file():
            errors.append('Missing CSS asset: ' + match)
for route in ('ink', 'archive', 'eclipse', 'garden', 'tidal', 'counterform', 'checkpoint'):
    text = (site / route / 'index.html').read_text()
    if 'location.replace' not in text:
        errors.append('Missing legacy redirect: ' + route)
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(refs)} page asset references, CSS assets, and 7 legacy redirects')
