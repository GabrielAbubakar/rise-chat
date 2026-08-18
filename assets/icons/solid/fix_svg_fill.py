#!/usr/bin/env python3
"""Replace SVG fill colors with currentColor.

Usage: python fix_svg_fill.py [path] [-r] [--backup]
Defaults to current directory.
"""
import re
import argparse
from pathlib import Path
import shutil
import sys


def process_text(text):
    changed = False

    # Replace fill="..." or fill='...'
    def repl_fill_attr(m):
        nonlocal changed
        key = m.group(1)
        quote = m.group(2)
        val = m.group(3)
        if val.strip().lower() in ("none", "currentcolor", "transparent"):
            return m.group(0)
        changed = True
        return f'{key}={quote}currentColor{quote}'

    text = re.sub(r'(fill)\s*=\s*(\"|\')(.*?)(\2)', repl_fill_attr, text, flags=re.IGNORECASE)

    # Replace style="...fill: ...;..." (double quotes)
    def repl_style_double(m):
        nonlocal changed
        content = m.group(1)
        def repl_fill_in_style(mm):
            nonlocal changed
            v = mm.group(1)
            if v.strip().lower() in ("none", "currentcolor", "transparent"):
                return mm.group(0)
            changed = True
            return 'fill:currentColor'
        new = re.sub(r'fill\s*:\s*([^;"\']+)', repl_fill_in_style, content, flags=re.IGNORECASE)
        return f'style="{new}"'

    text = re.sub(r'style\s*=\s*"(.*?)"', repl_style_double, text, flags=re.IGNORECASE | re.DOTALL)

    # Replace style='...'
    def repl_style_single(m):
        nonlocal changed
        content = m.group(1)
        def repl_fill_in_style(mm):
            nonlocal changed
            v = mm.group(1)
            if v.strip().lower() in ("none", "currentcolor", "transparent"):
                return mm.group(0)
            changed = True
            return "fill:currentColor"
        new = re.sub(r"fill\s*:\s*([^;\"']+)", repl_fill_in_style, content, flags=re.IGNORECASE)
        return f"style='{new}'"

    text = re.sub(r"style\s*=\s*'(.*?)'", repl_style_single, text, flags=re.IGNORECASE | re.DOTALL)

    # Replace fills inside <style> ... </style> blocks
    def repl_css_block(m):
        nonlocal changed
        block = m.group(0)
        def repl_fill_css(mm):
            nonlocal changed
            v = mm.group(1)
            if v.strip().lower() in ("none", "currentcolor", "transparent"):
                return mm.group(0)
            changed = True
            return 'fill:currentColor;'
        new_block = re.sub(r'fill\s*:\s*([^;\n}]+)\s*;', repl_fill_css, block, flags=re.IGNORECASE)
        return new_block

    text = re.sub(r'<style[^>]*>.*?</style>', repl_css_block, text, flags=re.IGNORECASE | re.DOTALL)

    return text, changed


def process_file(path: Path, backup: bool = True):
    data = path.read_text(encoding='utf-8')
    new, changed = process_text(data)
    if changed:
        if backup:
            bak = path.with_suffix(path.suffix + '.bak')
            if not bak.exists():
                shutil.copy2(path, bak)
        path.write_text(new, encoding='utf-8')
    return changed


def main():
    p = argparse.ArgumentParser(description='Replace SVG fill colors with currentColor')
    p.add_argument('target', nargs='?', default='.', help='Target folder or file (default: current directory)')
    p.add_argument('-r', '--recursive', action='store_true', help='Recurse into subdirectories')
    p.add_argument('--backup', action='store_true', help='Create .bak backups of modified files')
    args = p.parse_args()

    target = Path(args.target)
    if target.is_file() and target.suffix.lower() == '.svg':
        files = [target]
    elif target.is_dir():
        if args.recursive:
            files = list(target.rglob('*.svg'))
        else:
            files = list(target.glob('*.svg'))
    else:
        print('No SVG files found at target:', target)
        sys.exit(1)

    total = 0
    modified = 0
    for f in files:
        total += 1
        try:
            if process_file(f, backup=args.backup):
                modified += 1
                print('Modified:', f)
        except Exception as e:
            print('Error processing', f, e)

    print(f'Done. Processed {total} files, modified {modified} files.')


if __name__ == '__main__':
    main()
