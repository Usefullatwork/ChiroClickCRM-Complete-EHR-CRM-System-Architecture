#!/usr/bin/env python3
"""
SOAP-Aware Clinical Document Chunker
Hierarchical chunking that respects clinical document structure.

Based on CLI-RAG framework (2025) for optimal medical RAG retrieval.

Usage:
    from chunker import SOAPChunker

    chunker = SOAPChunker()
    chunks = chunker.chunk_note(
        note="SOAP note text...",
        patient_id="PAT-001",
        visit_date="2026-01-29"
    )
"""

import re
import tiktoken
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ClinicalChunk:
    """A chunk of clinical text with metadata."""
    chunk_id: int
    patient_id: str
    visit_date: str
    note_type: str
    soap_section: str
    chunk_index: int
    text: str
    tokens: int
    start_char: int
    end_char: int
    metadata: Dict


class SOAPChunker:
    """
    Hierarchical chunking respecting SOAP structure.

    Prevents semantic leakage by keeping SOAP sections together
    and using appropriate overlap for clinical continuity.
    """

    # SOAP section patterns (Norwegian + English)
    SOAP_PATTERNS = {
        'Subjective': [
            r'(?:^|\n)\s*(Subjektiv|Subjective|S:|Anamnese|Sykehistorie|HPI|History)',
            r'(?:^|\n)\s*(Hovedklage|Chief Complaint|CC:)',
            r'(?:^|\n)\s*(Pasientens beskrivelse|Patient reported)',
        ],
        'Objective': [
            r'(?:^|\n)\s*(Objektiv|Objective|O:|Undersøkelse|Kliniske funn)',
            r'(?:^|\n)\s*(Funn|Findings|Exam|Physical Exam|PE:)',
            r'(?:^|\n)\s*(Vitalia|Vital Signs|VS:)',
            r'(?:^|\n)\s*(ROM|Range of Motion|Palpasjon|Palpation)',
            r'(?:^|\n)\s*(VNG|Test Results|Lab)',
        ],
        'Assessment': [
            r'(?:^|\n)\s*(Vurdering|Assessment|A:|Analyse|Diagnose)',
            r'(?:^|\n)\s*(Impression|Inntrykk|Diagnosis|Dx:)',
            r'(?:^|\n)\s*(Konklusjon|Conclusion)',
        ],
        'Plan': [
            r'(?:^|\n)\s*(Plan|P:|Behandling|Treatment|Tiltak)',
            r'(?:^|\n)\s*(Behandlingsplan|Treatment Plan|Rx:)',
            r'(?:^|\n)\s*(Oppfølging|Follow-up|Neste time)',
            r'(?:^|\n)\s*(Anbefalinger|Recommendations)',
        ],
    }

    # Optimal chunk sizes per section (based on CLI-RAG research)
    CHUNK_CONFIG = {
        'Subjective': {'target_tokens': 500, 'overlap_tokens': 50},
        'Objective': {'target_tokens': 600, 'overlap_tokens': 75},
        'Assessment': {'target_tokens': 400, 'overlap_tokens': 50},
        'Plan': {'target_tokens': 300, 'overlap_tokens': 25},
        'Unlabeled': {'target_tokens': 500, 'overlap_tokens': 50},
    }

    def __init__(self, tokenizer_model: str = "gpt-3.5-turbo"):
        """Initialize chunker with tokenizer."""
        try:
            self.tokenizer = tiktoken.encoding_for_model(tokenizer_model)
        except Exception:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.tokenizer.encode(text))

    def parse_soap_structure(self, note: str) -> Dict[str, List[Dict]]:
        """
        Parse clinical note into SOAP sections.

        Returns dict with sections and their text/positions.
        """
        sections = {
            'Subjective': [],
            'Objective': [],
            'Assessment': [],
            'Plan': [],
            'Unlabeled': [],
        }

        # Find all section headers and their positions
        header_positions = []

        for section_name, patterns in self.SOAP_PATTERNS.items():
            for pattern in patterns:
                for match in re.finditer(pattern, note, re.IGNORECASE | re.MULTILINE):
                    header_positions.append({
                        'section': section_name,
                        'start': match.start(),
                        'header_end': match.end(),
                        'header_text': match.group(0).strip()
                    })

        # Sort by position
        header_positions.sort(key=lambda x: x['start'])

        # Extract text between headers
        for i, header in enumerate(header_positions):
            start = header['header_end']

            # End at next header or document end
            if i + 1 < len(header_positions):
                end = header_positions[i + 1]['start']
            else:
                end = len(note)

            section_text = note[start:end].strip()

            if section_text:
                sections[header['section']].append({
                    'text': section_text,
                    'start': start,
                    'end': end,
                    'tokens': self.count_tokens(section_text),
                    'header': header['header_text'],
                })

        # Handle unlabeled text (before first header or gaps)
        if header_positions:
            first_header_start = header_positions[0]['start']
            if first_header_start > 0:
                unlabeled_text = note[:first_header_start].strip()
                if unlabeled_text:
                    sections['Unlabeled'].append({
                        'text': unlabeled_text,
                        'start': 0,
                        'end': first_header_start,
                        'tokens': self.count_tokens(unlabeled_text),
                        'header': 'Preamble',
                    })
        else:
            # No headers found - entire document is unlabeled
            sections['Unlabeled'].append({
                'text': note.strip(),
                'start': 0,
                'end': len(note),
                'tokens': self.count_tokens(note),
                'header': 'Full Document',
            })

        return sections

    def chunk_section(
        self,
        text: str,
        target_tokens: int = 500,
        overlap_tokens: int = 50
    ) -> List[Tuple[str, int, int]]:
        """
        Chunk a section into smaller pieces while respecting sentence boundaries.

        Returns list of (chunk_text, start_char, end_char) tuples.
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?:;\n])\s+', text)

        chunks = []
        current_chunk = []
        current_tokens = 0
        chunk_start = 0
        char_pos = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            sentence_tokens = self.count_tokens(sentence)

            # If adding this sentence exceeds target, save current chunk
            if current_tokens + sentence_tokens > target_tokens and current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunk_end = char_pos
                chunks.append((chunk_text, chunk_start, chunk_end))

                # Create overlap from end of current chunk
                overlap_text = []
                overlap_count = 0
                for sent in reversed(current_chunk):
                    sent_tokens = self.count_tokens(sent)
                    if overlap_count + sent_tokens <= overlap_tokens:
                        overlap_text.insert(0, sent)
                        overlap_count += sent_tokens
                    else:
                        break

                current_chunk = overlap_text
                current_tokens = overlap_count
                chunk_start = chunk_end - len(' '.join(overlap_text))

            current_chunk.append(sentence)
            current_tokens += sentence_tokens
            char_pos += len(sentence) + 1  # +1 for space

        # Add final chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append((chunk_text, chunk_start, char_pos))

        return chunks

    def chunk_note(
        self,
        note: str,
        patient_id: str,
        visit_date: str,
        note_type: str = "clinical_encounter",
        encounter_id: Optional[str] = None,
    ) -> List[ClinicalChunk]:
        """
        Chunk a clinical note with SOAP-aware hierarchy.

        Args:
            note: The clinical note text
            patient_id: Patient identifier
            visit_date: Date of the visit
            note_type: Type of note (clinical_encounter, discharge_summary, etc.)
            encounter_id: Optional encounter identifier

        Returns:
            List of ClinicalChunk objects with metadata
        """
        # Parse SOAP structure
        sections = self.parse_soap_structure(note)

        all_chunks = []
        chunk_id = 0

        # Process sections in order
        for section_name in ['Subjective', 'Objective', 'Assessment', 'Plan', 'Unlabeled']:
            section_items = sections.get(section_name, [])

            if not section_items:
                continue

            config = self.CHUNK_CONFIG.get(section_name, self.CHUNK_CONFIG['Unlabeled'])

            for section_item in section_items:
                section_text = section_item['text']
                section_start = section_item['start']

                # Chunk within this section
                sub_chunks = self.chunk_section(
                    section_text,
                    target_tokens=config['target_tokens'],
                    overlap_tokens=config['overlap_tokens']
                )

                for chunk_idx, (chunk_text, start_offset, end_offset) in enumerate(sub_chunks):
                    chunk = ClinicalChunk(
                        chunk_id=chunk_id,
                        patient_id=patient_id,
                        visit_date=visit_date,
                        note_type=note_type,
                        soap_section=section_name,
                        chunk_index=chunk_idx,
                        text=chunk_text,
                        tokens=self.count_tokens(chunk_text),
                        start_char=section_start + start_offset,
                        end_char=section_start + end_offset,
                        metadata={
                            'section_header': section_item.get('header', ''),
                            'total_section_chunks': len(sub_chunks),
                            'encounter_id': encounter_id,
                            'created_at': datetime.now().isoformat(),
                        }
                    )
                    all_chunks.append(chunk)
                    chunk_id += 1

        return all_chunks

    def chunks_to_dict(self, chunks: List[ClinicalChunk]) -> List[Dict]:
        """Convert chunks to dictionary format for database insertion."""
        return [
            {
                'chunk_id': c.chunk_id,
                'patient_id': c.patient_id,
                'visit_date': c.visit_date,
                'note_type': c.note_type,
                'soap_section': c.soap_section,
                'chunk_index': c.chunk_index,
                'chunk_text': c.text,
                'tokens': c.tokens,
                'start_char': c.start_char,
                'end_char': c.end_char,
                'metadata': c.metadata,
            }
            for c in chunks
        ]


# Convenience function for Node.js integration
def chunk_clinical_note(
    note: str,
    patient_id: str,
    visit_date: str,
    note_type: str = "clinical_encounter"
) -> List[Dict]:
    """
    Convenience function for chunking a clinical note.

    Returns list of chunk dictionaries ready for database insertion.
    """
    chunker = SOAPChunker()
    chunks = chunker.chunk_note(note, patient_id, visit_date, note_type)
    return chunker.chunks_to_dict(chunks)


if __name__ == '__main__':
    # Example usage
    example_note = """
    KLINISK NOTAT

    Subjektiv:
    45 år gammel mann presenterer seg med 3 ukers historie med svimmelhet og balanseproblemer.
    Debuten var plutselig, pasienten våknet med at rommet snurret rundt.
    Ingen hørselstap eller tinnitus. Kan ikke gå uten støtte for øyeblikket.
    Tidligere frisk, ingen medikamenter.

    Objektiv:
    Vitalia stabile. Nevrologisk undersøkelse: positiv Dix-Hallpike test høyre side.
    Nystagmus til stede - oppadslagende, rotatorisk, latens 3-5 sekunder, varighet 45 sekunder.
    VHIT: Gain 0,82 (redusert). Dynamisk visuell skarphet: nedsatt.
    VNG-testing bekrefter BPPV høyre bakre halvbuegang.

    Vurdering:
    Benign Paroksysmal Posisjons Vertigo (BPPV), høyre bakre kanal.
    Etiologi: Idiopatisk. Første episode.

    Plan:
    1. Canalith Repositioning Procedure (CRP) x2 i dag
    2. Pasientopplæring om hodestillingsrestriksjoner
    3. Vestibulære øvelser x1 uke
    4. Oppfølging VNG-testing om 1 uke
    5. Kontakt ved nye nevrologiske symptomer
    """

    chunker = SOAPChunker()
    chunks = chunker.chunk_note(
        note=example_note,
        patient_id="PAT-001",
        visit_date="2026-01-29",
        note_type="clinical_encounter"
    )

    print(f"Generated {len(chunks)} chunks:\n")
    for chunk in chunks:
        print(f"[{chunk.soap_section}] Chunk {chunk.chunk_id}")
        print(f"  Tokens: {chunk.tokens}")
        print(f"  Text: {chunk.text[:80]}...")
        print()
