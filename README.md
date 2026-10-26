# PORTUWiC-BR

Initial LaTeX project for the paper "PORTUWiC-BR: A Word-in-Context Benchmark for Brazilian Portuguese".

## Files

- `main.tex`: main paper file, including the full background section.
- `references.bib`: BibTeX references.

## Compile

With `latexmk`:

```bash
latexmk -pdf main.tex
```

Or manually:

```bash
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```
