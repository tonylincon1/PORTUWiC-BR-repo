import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Papa from 'papaparse';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import './styles.css';

const DATASET_URL = '/data/portuwic_br_monolingual_splits.csv';

function stripTargetMarkup(text = '') {
  return text.replaceAll('<target>', '').replaceAll('</target>', '');
}

function markFirstTarget(sentence = '', target = '') {
  if (!target) return sentence;

  const start = sentence.toLocaleLowerCase('pt-BR').indexOf(target.toLocaleLowerCase('pt-BR'));
  if (start < 0) return sentence;

  const end = start + target.length;
  return `${sentence.slice(0, start)}<target>${sentence.slice(start, end)}</target>${sentence.slice(end)}`;
}

function renderMarkedSentence(marked, fallback) {
  const source = marked || fallback || '';
  const parts = source.split(/(<target>|<\/target>)/g);
  let insideTarget = false;

  return parts.map((part, index) => {
    if (part === '<target>') {
      insideTarget = true;
      return null;
    }
    if (part === '</target>') {
      insideTarget = false;
      return null;
    }
    if (!part) return null;

    return insideTarget ? (
      <mark key={index}>{part}</mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    );
  });
}

function App() {
  const [entered, setEntered] = useState(false);
  const [rows, setRows] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [loadingState, setLoadingState] = useState('loading');
  const [passcode, setPasscode] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    Papa.parse(DATASET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsedRows = result.data.map((row, index) => ({
          ...row,
          id: row.id || `${row.source || 'row'}-${index}`,
          rowNumber: index + 1,
        }));
        setRows(parsedRows);
        setLoadingState('ready');
      },
      error: () => setLoadingState('error'),
    });
  }, []);

  const currentRow = rows[currentIndex];
  const completedCount = Object.keys(decisions).length;
  const progress = rows.length ? Math.round((completedCount / rows.length) * 100) : 0;

  const counts = useMemo(() => {
    return Object.values(decisions).reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { approved: 0, edited: 0, rejected: 0 },
    );
  }, [decisions]);

  function goToNext() {
    setIsEditing(false);
    setDraft(null);
    setCurrentIndex((index) => Math.min(index + 1, Math.max(rows.length - 1, 0)));
  }

  function goToPrevious() {
    setIsEditing(false);
    setDraft(null);
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function handleEnter(event) {
    event.preventDefault();
    if (passcode.trim() === 'antonio') {
      setEntered(true);
      setAccessError('');
      return;
    }
    setAccessError('Palavra-chave invalida.');
  }

  function registerDecision(status, updatedRow = currentRow) {
    if (!currentRow) return;

    setRows((previousRows) =>
      previousRows.map((row, index) => (index === currentIndex ? updatedRow : row)),
    );
    setDecisions((previousDecisions) => ({
      ...previousDecisions,
      [currentRow.id]: {
        status,
        row: updatedRow,
        decidedAt: new Date().toISOString(),
      },
    }));
    goToNext();
  }

  function startEditing() {
    setDraft({
      ...currentRow,
      sentence1_marked: stripTargetMarkup(currentRow.sentence1_marked || currentRow.sentence1),
      sentence2_marked: stripTargetMarkup(currentRow.sentence2_marked || currentRow.sentence2),
    });
    setIsEditing(true);
  }

  function submitEdit() {
    const editedRow = {
      ...currentRow,
      ...draft,
      sentence1: draft.sentence1_marked,
      sentence2: draft.sentence2_marked,
      sentence1_marked: markFirstTarget(draft.sentence1_marked, draft.target_word),
      sentence2_marked: markFirstTarget(draft.sentence2_marked, draft.target_word),
    };
    registerDecision('edited', editedRow);
  }

  if (!entered) {
    return (
      <main className="entry-screen">
        <form className="entry-panel" aria-label="Access panel" onSubmit={handleEnter}>
          <div className="brand-badge">antonio</div>
          <h1>PORTUWiC-BR Validation</h1>
          <p>Interface simples para revisão linguística dos pares Word-in-Context.</p>
          <label className="access-field">
            Palavra-chave
            <input
              autoFocus
              value={passcode}
              onChange={(event) => {
                setPasscode(event.target.value);
                setAccessError('');
              }}
              type="password"
            />
          </label>
          {accessError ? <span className="access-error">{accessError}</span> : null}
          <button className="primary-button" type="submit">
            Entrar
            <ArrowRight size={18} />
          </button>
        </form>
      </main>
    );
  }

  if (loadingState === 'loading') {
    return <main className="status-screen">Carregando dataset...</main>;
  }

  if (loadingState === 'error') {
    return <main className="status-screen">Nao foi possivel carregar o dataset.</main>;
  }

  if (!currentRow) {
    return <main className="status-screen">Nenhum exemplo encontrado.</main>;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">antonio</p>
          <h1>PORTUWiC-BR Validation</h1>
        </div>
        <button className="save-button" type="button" title="Salvar">
          <Save size={18} />
          Salvar
        </button>
      </header>

      <section className="progress-section" aria-label="Validation progress">
        <div className="progress-copy">
          <strong>{progress}% concluido</strong>
          <span>
            {completedCount} de {rows.length} pares respondidos
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="summary-row">
          <span>Aprovados {counts.approved}</span>
          <span>Editados {counts.edited}</span>
          <span>Reprovados {counts.rejected}</span>
        </div>
      </section>

      <section className="review-layout">
        <aside className="metadata-panel" aria-label="Example metadata">
          <div>
            <p className="meta-label">Par</p>
            <strong>
              {currentIndex + 1} / {rows.length}
            </strong>
          </div>
          <div>
            <p className="meta-label">Palavra alvo</p>
            <strong>{currentRow.target_word}</strong>
          </div>
          <div>
            <p className="meta-label">Rotulo</p>
            <strong>{currentRow.label === 'T' ? 'Mesmo sentido' : 'Sentidos diferentes'}</strong>
          </div>
          <div>
            <p className="meta-label">Origem</p>
            <strong>{currentRow.source}</strong>
          </div>
        </aside>

        <section className="pair-panel" aria-label="Current pair">
          {!isEditing ? (
            <>
              <article className="sentence-block">
                <span>Sentenca 1</span>
                <p>{renderMarkedSentence(currentRow.sentence1_marked, currentRow.sentence1)}</p>
                <small>{currentRow.sense1}</small>
              </article>
              <article className="sentence-block">
                <span>Sentenca 2</span>
                <p>{renderMarkedSentence(currentRow.sentence2_marked, currentRow.sentence2)}</p>
                <small>{currentRow.sense2}</small>
              </article>
            </>
          ) : (
            <div className="edit-panel">
              <label>
                Palavra alvo
                <input
                  value={draft.target_word}
                  onChange={(event) => setDraft({ ...draft, target_word: event.target.value })}
                />
              </label>
              <label>
                Sentenca 1
                <textarea
                  value={draft.sentence1_marked}
                  onChange={(event) => setDraft({ ...draft, sentence1_marked: event.target.value })}
                />
              </label>
              <label>
                Sentenca 2
                <textarea
                  value={draft.sentence2_marked}
                  onChange={(event) => setDraft({ ...draft, sentence2_marked: event.target.value })}
                />
              </label>
              <label>
                Rotulo
                <select
                  value={draft.label}
                  onChange={(event) => setDraft({ ...draft, label: event.target.value })}
                >
                  <option value="T">Mesmo sentido</option>
                  <option value="F">Sentidos diferentes</option>
                </select>
              </label>
            </div>
          )}

          <div className="action-row">
            <button
              type="button"
              className="icon-button"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              title="Voltar"
            >
              <ChevronLeft size={20} />
            </button>
            {!isEditing ? (
              <>
                <button
                  className="approve-button"
                  type="button"
                  onClick={() => registerDecision('approved')}
                >
                  <Check size={18} />
                  Aprovar
                </button>
                <button className="edit-button" type="button" onClick={startEditing}>
                  <Edit3 size={18} />
                  Editar
                </button>
                <button
                  className="reject-button"
                  type="button"
                  onClick={() => registerDecision('rejected')}
                >
                  <X size={18} />
                  Reprovar
                </button>
              </>
            ) : (
              <>
                <button className="edit-button" type="button" onClick={submitEdit}>
                  <BadgeCheck size={18} />
                  Confirmar edicao
                </button>
                <button className="ghost-button" type="button" onClick={() => setIsEditing(false)}>
                  <CircleSlash size={18} />
                  Cancelar
                </button>
              </>
            )}
            <button
              type="button"
              className="icon-button"
              onClick={goToNext}
              disabled={currentIndex === rows.length - 1}
              title="Pular"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
