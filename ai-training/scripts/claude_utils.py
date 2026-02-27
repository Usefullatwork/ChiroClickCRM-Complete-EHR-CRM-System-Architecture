#!/usr/bin/env python3
"""
Shared Claude API Utilities — ChiroClickCRM AI Training Pipeline

Provides reusable helpers for all training scripts:
- Cached client initialization
- Prompt caching wrapper (90% input cost savings on repeated system prompts)
- Structured extraction via tool_use (guaranteed JSON schema compliance)
- Batch API submission + polling
- PII detection (GDPR: Norwegian fødselsnummer)

Usage:
    from claude_utils import (
        get_client, cached_message, structured_generate,
        submit_batch, check_pii, ensure_anthropic,
    )
"""

import json
import os
import re
import sys
import time

# ============================================================
# Dependency management
# ============================================================

def ensure_anthropic():
    """Import anthropic SDK, installing if needed. Returns the module."""
    try:
        import anthropic
        return anthropic
    except ImportError:
        import subprocess
        subprocess.check_call(
            [sys.executable, '-m', 'pip', 'install', 'anthropic', '-q'],
            stdout=subprocess.DEVNULL,
        )
        import anthropic
        return anthropic


# ============================================================
# Client initialization (singleton per process)
# ============================================================

_client = None


def get_client():
    """Get or create a cached Anthropic client instance.

    Uses ANTHROPIC_API_KEY from environment. Exits with error if not set.
    """
    global _client
    if _client is not None:
        return _client

    anthropic = ensure_anthropic()

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print('  ERROR: ANTHROPIC_API_KEY not set')
        sys.exit(1)

    _client = anthropic.Anthropic(api_key=api_key)
    return _client


def reset_client():
    """Reset the cached client (useful for testing)."""
    global _client
    _client = None


# ============================================================
# GDPR: PII detection — Norwegian fødselsnummer
# ============================================================

FNUMMER_PATTERN = re.compile(r'\b\d{6}\s?\d{5}\b')


def check_pii(text):
    """Check for Norwegian fødselsnummer patterns.

    Raises ValueError if PII is detected. Returns True if clean.
    """
    if text and FNUMMER_PATTERN.search(text):
        raise ValueError("PII detected (fødselsnummer pattern). Refusing to process.")
    return True


def has_pii(text):
    """Check if text contains fødselsnummer patterns. Returns bool."""
    return bool(text and FNUMMER_PATTERN.search(text))


# ============================================================
# Prompt caching wrapper
# ============================================================

def cached_message(client, system_prompt, user_content, model='claude-sonnet-4-6',
                   max_tokens=1024, temperature=0.3, **kwargs):
    """Send a message with prompt caching on the system prompt.

    The system prompt gets cache_control: {"type": "ephemeral"} which means
    subsequent calls with the same system prompt reuse cached tokens at 90%
    cost reduction.

    Returns the full response object (access .content, .usage, etc.).
    """
    # Build system with cache control
    system = [
        {
            'type': 'text',
            'text': system_prompt,
            'cache_control': {'type': 'ephemeral'},
        }
    ]

    messages = [{'role': 'user', 'content': user_content}]

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
        temperature=temperature,
        **kwargs,
    )
    return response


def extract_text(response):
    """Extract text content from a Claude response object."""
    return ''.join(b.text for b in response.content if b.type == 'text')


def extract_thinking(response):
    """Extract thinking blocks from a Claude response (extended thinking)."""
    blocks = []
    for b in response.content:
        if b.type == 'thinking':
            blocks.append(b.thinking)
    return '\n'.join(blocks) if blocks else None


# ============================================================
# Structured extraction via tool_use
# ============================================================

def structured_generate(client, system_prompt, user_content, tool_definition,
                        model='claude-sonnet-4-6', max_tokens=2048,
                        temperature=0.3, cache_system=True, **kwargs):
    """Generate structured output using tool_use with forced tool choice.

    Args:
        client: Anthropic client
        system_prompt: System prompt text
        user_content: User message content
        tool_definition: Tool definition dict with 'name', 'description', 'input_schema'
        model: Model to use
        max_tokens: Max output tokens
        temperature: Sampling temperature
        cache_system: Whether to apply prompt caching to system prompt
        **kwargs: Additional kwargs passed to messages.create

    Returns:
        Parsed JSON dict from the tool call, or None if extraction failed.
    """
    # Build system prompt (with optional caching)
    if cache_system:
        system = [
            {
                'type': 'text',
                'text': system_prompt,
                'cache_control': {'type': 'ephemeral'},
            }
        ]
    else:
        system = system_prompt

    messages = [{'role': 'user', 'content': user_content}]

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
        temperature=temperature,
        tools=[tool_definition],
        tool_choice={'type': 'tool', 'name': tool_definition['name']},
        **kwargs,
    )

    # Extract the tool use result
    for block in response.content:
        if block.type == 'tool_use' and block.name == tool_definition['name']:
            return block.input

    return None


# ============================================================
# Batch API helpers
# ============================================================

def build_batch_request(custom_id, system_prompt, user_content,
                        model='claude-sonnet-4-6', max_tokens=1024,
                        temperature=0.3, tools=None, tool_choice=None):
    """Build a single request for the Batch API.

    Returns a dict ready to be included in a batch create call.
    """
    params = {
        'model': model,
        'max_tokens': max_tokens,
        'temperature': temperature,
        'system': [
            {
                'type': 'text',
                'text': system_prompt,
                'cache_control': {'type': 'ephemeral'},
            }
        ],
        'messages': [{'role': 'user', 'content': user_content}],
    }

    if tools:
        params['tools'] = tools
    if tool_choice:
        params['tool_choice'] = tool_choice

    return {
        'custom_id': custom_id,
        'params': params,
    }


def submit_batch(client, requests, poll_interval=30, max_wait=3600):
    """Submit a batch of requests and poll until completion.

    Args:
        client: Anthropic client
        requests: List of batch request dicts (from build_batch_request)
        poll_interval: Seconds between status polls
        max_wait: Maximum seconds to wait before giving up

    Returns:
        List of (custom_id, result_dict) tuples.
        result_dict has 'type' ('succeeded'|'errored'|'expired') and 'message' for succeeded.
    """
    if not requests:
        return []

    # Create the batch
    batch = client.messages.batches.create(requests=requests)
    batch_id = batch.id
    print(f'  Batch created: {batch_id} ({len(requests)} requests)')

    # Poll until complete
    start = time.time()
    while time.time() - start < max_wait:
        batch = client.messages.batches.retrieve(batch_id)
        status = batch.processing_status

        counts = batch.request_counts
        total = counts.processing + counts.succeeded + counts.errored + counts.expired + counts.canceled
        done = counts.succeeded + counts.errored + counts.expired + counts.canceled

        print(f'  Batch {batch_id}: {status} — {done}/{total} done '
              f'({counts.succeeded} ok, {counts.errored} err)', end='\r')

        if status == 'ended':
            print()  # Newline after \r
            break

        time.sleep(poll_interval)
    else:
        print(f'\n  WARNING: Batch {batch_id} timed out after {max_wait}s')

    # Collect results
    results = []
    try:
        for result in client.messages.batches.results(batch_id):
            custom_id = result.custom_id
            if result.result.type == 'succeeded':
                results.append((custom_id, {
                    'type': 'succeeded',
                    'message': result.result.message,
                }))
            elif result.result.type == 'errored':
                results.append((custom_id, {
                    'type': 'errored',
                    'error': str(result.result.error),
                }))
            else:
                results.append((custom_id, {
                    'type': result.result.type,
                }))
    except Exception as e:
        print(f'  WARNING: Error reading batch results: {e}')

    succeeded = sum(1 for _, r in results if r['type'] == 'succeeded')
    print(f'  Batch complete: {succeeded}/{len(results)} succeeded')

    return results


def extract_batch_text(result):
    """Extract text content from a batch result's message.

    Args:
        result: A result dict from submit_batch (with 'type' and 'message' keys)

    Returns:
        Extracted text string, or None if result was not successful.
    """
    if result.get('type') != 'succeeded':
        return None
    message = result.get('message')
    if not message:
        return None
    return ''.join(b.text for b in message.content if b.type == 'text')


def extract_batch_tool_use(result, tool_name):
    """Extract tool_use input from a batch result's message.

    Args:
        result: A result dict from submit_batch
        tool_name: Name of the tool to extract

    Returns:
        Parsed JSON dict from the tool call, or None.
    """
    if result.get('type') != 'succeeded':
        return None
    message = result.get('message')
    if not message:
        return None
    for block in message.content:
        if block.type == 'tool_use' and block.name == tool_name:
            return block.input
    return None


# ============================================================
# Shared tool definitions for clinical grading
# ============================================================

CLINICAL_GRADING_TOOL = {
    'name': 'clinical_grading',
    'description': (
        'Grade a clinical AI response on multiple dimensions. '
        'Score each dimension 0-100 and classify gap types.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'clinical_accuracy': {
                'type': 'integer',
                'minimum': 0,
                'maximum': 100,
                'description': 'Accuracy of clinical content (diagnoses, anatomy, treatment)',
            },
            'keyword_coverage': {
                'type': 'integer',
                'minimum': 0,
                'maximum': 100,
                'description': 'Coverage of expected clinical keywords and terms',
            },
            'safety_completeness': {
                'type': 'integer',
                'minimum': 0,
                'maximum': 100,
                'description': 'Completeness of safety warnings, red flags, contraindications',
            },
            'norwegian_quality': {
                'type': 'integer',
                'minimum': 0,
                'maximum': 100,
                'description': 'Quality of Norwegian medical terminology (vs English terms)',
            },
            'overall_pass': {
                'type': 'boolean',
                'description': 'Whether this response passes clinical quality threshold',
            },
            'gap_types': {
                'type': 'array',
                'items': {
                    'type': 'string',
                    'enum': [
                        'missing_keywords', 'hallucination', 'code_format',
                        'too_short', 'too_long', 'poor_norwegian',
                        'safety_gap', 'reasoning_gap',
                    ],
                },
                'description': 'Types of gaps identified in the response',
            },
            'reasoning': {
                'type': 'string',
                'description': 'Brief explanation of the grading decision',
            },
        },
        'required': [
            'clinical_accuracy', 'keyword_coverage', 'safety_completeness',
            'norwegian_quality', 'overall_pass', 'gap_types', 'reasoning',
        ],
    },
}

TRAINING_EXAMPLE_TOOL = {
    'name': 'training_example',
    'description': (
        'Generate a structured training example for clinical AI fine-tuning. '
        'All fields are required and must meet quality standards.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'instruction': {
                'type': 'string',
                'description': 'Clinical instruction/question (min 20 chars)',
            },
            'input': {
                'type': 'string',
                'description': 'Additional context or patient description (can be empty)',
            },
            'output': {
                'type': 'string',
                'description': 'Expected clinical response (min 50 chars)',
            },
            'category': {
                'type': 'string',
                'description': 'Training category',
            },
            'quality_self_score': {
                'type': 'integer',
                'minimum': 1,
                'maximum': 5,
                'description': 'Self-assessed quality score',
            },
            'keywords_included': {
                'type': 'array',
                'items': {'type': 'string'},
                'description': 'Key clinical terms included in the output',
            },
        },
        'required': ['instruction', 'input', 'output', 'category',
                     'quality_self_score', 'keywords_included'],
    },
}

QUALITY_JUDGE_TOOL = {
    'name': 'quality_judgment',
    'description': (
        'Judge the quality of a training example for clinical AI. '
        'Classify as ACCEPT or REJECT with a quality score.'
    ),
    'input_schema': {
        'type': 'object',
        'properties': {
            'verdict': {
                'type': 'string',
                'enum': ['ACCEPT', 'REJECT'],
                'description': 'Whether to accept or reject this training example',
            },
            'quality_score': {
                'type': 'integer',
                'minimum': 1,
                'maximum': 5,
                'description': 'Quality score (1=terrible, 5=excellent)',
            },
            'reasoning': {
                'type': 'string',
                'description': 'Brief explanation of the judgment',
            },
        },
        'required': ['verdict', 'quality_score', 'reasoning'],
    },
}
