# PORTUWiC-BR Generation Architecture

## Scope

PORTUWiC-BR uses three candidate-generation branches. Each branch emits provisional Word-in-Context pairs with a binary relation: `T` for the same sense and `F` for different senses. A pair is retained only when the target can be linked unambiguously in its context. Linguistic validation occurs after generation and is outside the scope of this document.

## Shared Candidate Representation

All source records are normalized into a lemma, a sense identifier, a Portuguese definition or gloss, one or more contexts, and provenance metadata. The generator accepts a context only when the target lemma occurs exactly once, using a Unicode-aware exact-match expression. It stores both the raw context and a version with the target enclosed in `<target>...</target>`. Same-sense pairs are built from compatible contexts attached to one sense identifier. Different-sense pairs are built from contexts attached to distinct senses of the same lemma. Sampling is deterministic with seed `13`.

## General PT-BR Generation

The general Brazilian Portuguese branch merges sense records from OpenWordNet-PT and Brazilian Portuguese entries in Kaikki/Wiktionary. It filters out templates and candidates without authentic example contexts. Records are indexed by normalized target word and sense. The generator samples `T` and `F` candidates independently, then removes duplicate combinations of target, label, and contexts.

## Regional PT-BR Generation

The regional branch first extracts Portuguese senses whose labels explicitly associate them with Brazil or a Brazilian geographic area. Its ranking favors the `Regionalismo` label, geographic specificity, and colloquial or slang annotations. The top-ranked unique lemmas become regional seeds.

For every selected seed, an LLM generates two Brazilian Portuguese contexts. The prompt provides the documented regional label, notes, and evidence excerpt. For `T`, both contexts must instantiate the documented sense. For `F`, the target must occur once in two clearly distinct senses. The response is constrained by a JSON schema and rejected when either target occurrence fails the exact-match check. Generation uses `gpt-5-mini` with temperature `0.7` and remains explicitly marked as LLM-generated candidate material.

## Portuguese--Indigenous Languages Cross-Lingual Generation

The cross-lingual branch constructs Portuguese--Indigenous Languages WiC candidates from public bilingual lexicographic entries in DicWeb. It covers Aikanã, Arikapú, Aruá, Cinta Larga, Djeoromitxi, Kanoé, Karitiana, Karo-Arara, Kawahiwa-Amondawa, Kaxarari, Makurap, Ofaié, Oro Win, Paiter, Tupari, Wajuru, Wari’ (Oro Nao’, Oro Eo’, Oro At, Oro Yowin), Wari’ (Oro Waram, Oro Waram Xijein, Oro Mon, Cao Oro Waje), and Zoró.

The collector queries each dictionary as structured lexical data and extracts the Indigenous lemma, Portuguese definition, Indigenous example, direct Portuguese translation, entry identifier, sense number, example number, dictionary identity, and source URL. A source example is eligible only if the Indigenous lemma appears exactly once. A Portuguese target is selected from the sense definition only if that lexical item appears exactly once in the direct Portuguese translation.

Each cross-lingual candidate contains three contexts: `sentence_indigenous`, the authentic Indigenous example; `sentence_indigenous_translation_pt`, its direct authentic Portuguese translation; and `sentence_pt`, the Portuguese context used in the WiC comparison. The direct translation is preserved even when it is not the compared Portuguese context.

For an authentic `T` candidate, the Indigenous and Portuguese contexts are attached to the same entry and sense. For an authentic `F` candidate, the Indigenous context belongs to one sense and the Portuguese context belongs to another documented sense of the same Indigenous lemma. The generator retains entry, sense, and example identifiers for both sides of the pair, allowing the semantic relation to be audited.

## Cross-Lingual Coverage Completion

The targeted cross-lingual subset aims for 100 `T` and 100 `F` candidates for Wari’ (Oro Waram, Oro Waram Xijein, Oro Mon, Cao Oro Waje), Zoró, Paiter, Cinta Larga, Karitiana, Aikanã, Karo-Arara, Kawahiwa-Amondawa, and Tupari. Authentic rows are selected before any completion step.

When a label is below the target, the system preserves the Indigenous sentence and its direct Portuguese translation and generates only a replacement `sentence_pt`. If two documented senses exist, the LLM receives the registered sense information and produces a Portuguese context for the required sense. This is an attested-sense completion. If no authentic `F` evidence exists, the LLM may produce a different-sense Portuguese hypothesis anchored in an authentic Indigenous example. This is an unattested different-sense proposal and does not assert an additional Indigenous lexical sense.

The completion generator uses `gpt-5-mini` with temperature `0.7`, one structured JSON response per candidate, retry-based validation, and an exact-once check for the Portuguese target. Each completed row records whether the Portuguese comparison context is authentic or generated, whether its sense contrast is attested or proposed, and the model configuration used.
