/**
 * Training Data Validation and Cleaning Script
 *
 * Removes development artifacts and non-clinical content from training data
 *
 * Usage: node validate-training-data.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Patterns that indicate non-clinical content (development artifacts)
const NON_CLINICAL_PATTERNS = [
  // Development/Project Management
  /bubble\.io/i,
  /codespaces/i,
  /github/i,
  /npm|yarn|pnpm/i,
  /react|vue|angular/i,
  /node\.js|nodejs/i,
  /database.*migration/i,
  /api.*endpoint/i,
  /frontend|backend/i,
  /deployment|deploy/i,
  /docker|kubernetes/i,
  /terraform|aws|azure|gcp/i,

  // Programming/Technical
  /create.*component/i,
  /generate.*code/i,
  /implement.*function/i,
  /\.jsx?|\.tsx?|\.css|\.html/i,
  /import.*from/i,
  /export.*default/i,
  /const.*=.*\{/i,
  /function.*\(\)/i,
  /class.*extends/i,

  // Project Planning
  /project.*plan/i,
  /development.*plan/i,
  /implementation.*plan/i,
  /sprint|scrum|agile/i,
  /milestone|deliverable/i,
  /user.*adoption/i,
  /data.*integrity.*migration/i,
  /test.*users/i,

  // AI Prompts (meta)
  /ask.*claude/i,
  /generate.*template.*phrases/i,
  /write.*\d+.*phrases/i,
  /create.*file.*structure/i,
  /elaborate.*plan/i,
  /would.*you.*like.*me.*to/i,

  // Non-Norwegian placeholders
  /example.*prompt/i,
  /purpose:.*generate/i
]

// Patterns that indicate valid clinical content
const CLINICAL_PATTERNS = [
  // Norwegian clinical terms
  /pasient/i,
  /smerte/i,
  /behandling/i,
  /undersøkelse/i,
  /diagnose/i,
  /symptom/i,
  /anamnese/i,
  /palpasjon/i,
  /ROM|bevegelsesutslag/i,
  /muskel|ledd|nerve/i,
  /cervikal|thorakal|lumbal|sakral/i,
  /nystagmus/i,
  /vestibulær/i,
  /BPPV/i,
  /vertigo|svimmelhet/i,
  /kiroprak/i,
  /fysiotera/i,
  /SOAP|SOPE/i,

  // English clinical terms (vestibular content)
  /nystagmus/i,
  /vestibular/i,
  /canal.*BPPV/i,
  /dix.*hallpike/i,
  /epley.*maneuver/i,
  /otolith/i,
  /semicircular/i,
  /caloric.*weakness/i,
  /labyrinthitis/i,
  /neuritis/i,
  /vertigo/i
]

// Minimum content length for valid entries
const MIN_CONTENT_LENGTH = 20

/**
 * Check if content is non-clinical (development artifact)
 */
function isNonClinical(content) {
  if (!content || typeof content !== 'string') return true
  if (content.length < MIN_CONTENT_LENGTH) return true

  // Check for non-clinical patterns
  for (const pattern of NON_CLINICAL_PATTERNS) {
    if (pattern.test(content)) {
      return true
    }
  }

  return false
}

/**
 * Check if content is clinical
 */
function isClinical(content) {
  if (!content || typeof content !== 'string') return false

  // Must match at least one clinical pattern
  for (const pattern of CLINICAL_PATTERNS) {
    if (pattern.test(content)) {
      return true
    }
  }

  return false
}

/**
 * Validate a single training entry
 */
function validateEntry(entry, lineNumber) {
  const issues = []

  try {
    // Check message structure
    if (!entry.messages || !Array.isArray(entry.messages)) {
      issues.push({ line: lineNumber, issue: 'Invalid message structure' })
      return { valid: false, issues }
    }

    // Get assistant response (the output we're training)
    const assistantMessage = entry.messages.find(m => m.role === 'assistant')
    const userMessage = entry.messages.find(m => m.role === 'user')

    if (!assistantMessage || !assistantMessage.content) {
      issues.push({ line: lineNumber, issue: 'Missing assistant response' })
      return { valid: false, issues }
    }

    const content = assistantMessage.content
    const prompt = userMessage?.content || ''

    // Check for non-clinical content
    if (isNonClinical(content)) {
      issues.push({
        line: lineNumber,
        issue: 'Non-clinical content detected',
        content: content.substring(0, 100)
      })
      return { valid: false, issues }
    }

    // Check for non-clinical prompt
    if (isNonClinical(prompt)) {
      issues.push({
        line: lineNumber,
        issue: 'Non-clinical prompt detected',
        prompt: prompt.substring(0, 100)
      })
      return { valid: false, issues }
    }

    // Prefer entries that match clinical patterns
    if (!isClinical(content) && !isClinical(prompt)) {
      issues.push({
        line: lineNumber,
        issue: 'Content does not match clinical patterns',
        content: content.substring(0, 100)
      })
      return { valid: false, issues }
    }

    return { valid: true, issues: [] }
  } catch (error) {
    issues.push({ line: lineNumber, issue: `Parse error: ${error.message}` })
    return { valid: false, issues }
  }
}

/**
 * Process a JSONL file
 */
function processJSONLFile(inputPath, outputPath) {
  console.log(`\nProcessing: ${inputPath}`)

  const content = fs.readFileSync(inputPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  const validEntries = []
  const invalidEntries = []
  const allIssues = []

  lines.forEach((line, index) => {
    try {
      const entry = JSON.parse(line)
      const { valid, issues } = validateEntry(entry, index + 1)

      if (valid) {
        validEntries.push(entry)
      } else {
        invalidEntries.push({ entry, lineNumber: index + 1, issues })
        allIssues.push(...issues)
      }
    } catch (error) {
      invalidEntries.push({
        entry: null,
        lineNumber: index + 1,
        issues: [{ line: index + 1, issue: `JSON parse error: ${error.message}` }]
      })
      allIssues.push({ line: index + 1, issue: `JSON parse error: ${error.message}` })
    }
  })

  // Write clean output
  if (outputPath) {
    const cleanContent = validEntries.map(e => JSON.stringify(e)).join('\n')
    fs.writeFileSync(outputPath, cleanContent, 'utf-8')
    console.log(`Clean data written to: ${outputPath}`)
  }

  return {
    total: lines.length,
    valid: validEntries.length,
    invalid: invalidEntries.length,
    issues: allIssues
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Training Data Validation and Cleaning')
  console.log('='.repeat(60))

  const dataDir = path.join(__dirname, '..')
  const files = [
    {
      input: path.join(dataDir, 'training-data.jsonl'),
      output: path.join(dataDir, 'data', 'cleaned_training_data.jsonl')
    }
  ]

  let totalStats = { total: 0, valid: 0, invalid: 0, issues: [] }

  for (const file of files) {
    if (fs.existsSync(file.input)) {
      const stats = processJSONLFile(file.input, file.output)

      console.log(`\nResults for ${path.basename(file.input)}:`)
      console.log(`  Total entries: ${stats.total}`)
      console.log(`  Valid entries: ${stats.valid} (${((stats.valid / stats.total) * 100).toFixed(1)}%)`)
      console.log(`  Invalid entries: ${stats.invalid} (${((stats.invalid / stats.total) * 100).toFixed(1)}%)`)

      if (stats.issues.length > 0 && stats.issues.length <= 20) {
        console.log('\n  Sample issues:')
        stats.issues.slice(0, 10).forEach(issue => {
          console.log(`    Line ${issue.line}: ${issue.issue}`)
          if (issue.content) console.log(`      Content: "${issue.content}..."`)
        })
      }

      totalStats.total += stats.total
      totalStats.valid += stats.valid
      totalStats.invalid += stats.invalid
      totalStats.issues.push(...stats.issues)
    } else {
      console.log(`\nFile not found: ${file.input}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('Summary')
  console.log('='.repeat(60))
  console.log(`Total entries processed: ${totalStats.total}`)
  console.log(`Total valid: ${totalStats.valid}`)
  console.log(`Total invalid: ${totalStats.invalid}`)
  console.log(`Overall quality: ${((totalStats.valid / totalStats.total) * 100).toFixed(1)}%`)

  // Write issues report
  const reportPath = path.join(dataDir, 'data', 'validation_report.json')
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalStats.total,
      valid: totalStats.valid,
      invalid: totalStats.invalid,
      qualityPercent: ((totalStats.valid / totalStats.total) * 100).toFixed(1)
    },
    issues: totalStats.issues.slice(0, 100) // First 100 issues
  }, null, 2), 'utf-8')
  console.log(`\nValidation report written to: ${reportPath}`)
}

main().catch(console.error)
