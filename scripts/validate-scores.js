#!/usr/bin/env node

/**
 * Validation script for entity score files
 * Usage: node validate-scores.js <entity-score-file.json>
 */

const fs = require('fs');
const path = require('path');

// Score success mapping based on percentage
const SCORE_SUCCESS_MAPPING = {
  success: { min: 80, max: 100 },
  'almost-success': { min: 70, max: 79 },
  partial: { min: 50, max: 69 },
  'almost-failure': { min: 30, max: 49 },
  failure: { min: 0, max: 29 }
};

// Color mapping based on percentage  
const COLOR_MAPPING = {
  Green: { min: 70, max: 100 },
  Yellow: { min: 30, max: 69 },
  Red: { min: 0, max: 29 }
};

class ScoreValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateFile(filePath) {
    console.log(`🔍 Validating score file: ${filePath}`);
    
    // Check file exists
    if (!fs.existsSync(filePath)) {
      this.addError(`File not found: ${filePath}`);
      return false;
    }

    let data;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    } catch (error) {
      this.addError(`Invalid JSON: ${error.message}`);
      return false;
    }

    return this.validateEntityScore(data);
  }

  validateEntityScore(data) {
    // Validate required fields
    this.validateRequired(data, ['entityRef', 'generatedDateTimeUtc', 'areaScores']);
    
    // Validate entity reference
    this.validateEntityRef(data.entityRef);
    
    // Validate date format
    this.validateDateTime(data.generatedDateTimeUtc, 'generatedDateTimeUtc');
    
    if (data.scoringReviewDate) {
      this.validateDateTime(data.scoringReviewDate, 'scoringReviewDate');
    }

    // Validate area scores
    if (Array.isArray(data.areaScores)) {
      data.areaScores.forEach((area, index) => {
        this.validateAreaScore(area, index);
      });
    } else {
      this.addError('areaScores must be an array');
    }

    // Calculate and validate overall scores
    this.validateCalculatedScores(data);

    return this.errors.length === 0;
  }

  validateRequired(obj, fields) {
    fields.forEach(field => {
      if (!(field in obj) || obj[field] === null || obj[field] === undefined) {
        this.addError(`Missing required field: ${field}`);
      }
    });
  }

  validateEntityRef(entityRef) {
    if (!entityRef || typeof entityRef !== 'object') {
      this.addError('entityRef must be an object');
      return;
    }

    this.validateRequired(entityRef, ['kind', 'name']);
    
    if (entityRef.kind && !['component', 'api', 'system', 'resource'].includes(entityRef.kind)) {
      this.addWarning(`Unusual entity kind: ${entityRef.kind}. Expected one of: component, api, system, resource`);
    }
  }

  validateDateTime(dateStr, fieldName) {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        this.addError(`${fieldName} is not a valid ISO date`);
      }
    } catch (error) {
      this.addError(`${fieldName} is not a valid date: ${error.message}`);
    }
  }

  validateAreaScore(area, index) {
    const prefix = `areaScores[${index}]`;
    
    this.validateRequired(area, ['id', 'title', 'scoreEntries']);
    
    if (typeof area.id !== 'number') {
      this.addError(`${prefix}.id must be a number`);
    }

    if (!Array.isArray(area.scoreEntries)) {
      this.addError(`${prefix}.scoreEntries must be an array`);
      return;
    }

    if (area.scoreEntries.length === 0) {
      this.addError(`${prefix}.scoreEntries cannot be empty`);
    }

    area.scoreEntries.forEach((entry, entryIndex) => {
      this.validateScoreEntry(entry, `${prefix}.scoreEntries[${entryIndex}]`);
    });
  }

  validateScoreEntry(entry, prefix) {
    this.validateRequired(entry, ['id', 'title', 'scoreSuccess', 'details']);
    
    if (typeof entry.id !== 'number') {
      this.addError(`${prefix}.id must be a number`);
    }

    if (entry.scorePercent !== null && entry.scorePercent !== undefined) {
      if (typeof entry.scorePercent !== 'number' || entry.scorePercent < 0 || entry.scorePercent > 100) {
        this.addError(`${prefix}.scorePercent must be a number between 0-100`);
      }
    }

    if (!['success', 'almost-success', 'partial', 'almost-failure', 'failure', 'unknown'].includes(entry.scoreSuccess)) {
      this.addError(`${prefix}.scoreSuccess must be one of: success, almost-success, partial, almost-failure, failure, unknown`);
    }

    // Validate score consistency
    if (entry.scorePercent !== null && entry.scoreSuccess !== 'unknown') {
      const expectedCategory = this.getScoreCategory(entry.scorePercent);
      if (expectedCategory !== entry.scoreSuccess) {
        this.addWarning(`${prefix}: scorePercent (${entry.scorePercent}) suggests '${expectedCategory}' but scoreSuccess is '${entry.scoreSuccess}'`);
      }
    }

    // Check for TODO placeholders
    if (entry.selfAssessmentComments && entry.selfAssessmentComments.includes('TODO:')) {
      this.addWarning(`${prefix}: Self-assessment comments contain TODO placeholder`);
    }
  }

  validateCalculatedScores(data) {
    // This would calculate and validate the aggregated scores
    // Implementation depends on your specific scoring algorithm
    const calculatedScores = this.calculateScores(data);
    
    if (data.scorePercent && Math.abs(data.scorePercent - calculatedScores.overall) > 1) {
      this.addWarning(`Overall scorePercent (${data.scorePercent}) differs from calculated value (${calculatedScores.overall.toFixed(1)})`);
    }
  }

  calculateScores(data) {
    // Simple weighted average calculation
    let totalScore = 0;
    let totalWeight = 0;

    data.areaScores.forEach(area => {
      let areaScore = 0;
      let areaWeight = 0;

      area.scoreEntries.forEach(entry => {
        if (entry.scorePercent !== null && entry.scoreSuccess !== 'unknown' && !entry.isOptional) {
          areaScore += entry.scorePercent;
          areaWeight += 1;
        }
      });

      if (areaWeight > 0) {
        const avgAreaScore = areaScore / areaWeight;
        totalScore += avgAreaScore;
        totalWeight += 1;
      }
    });

    return {
      overall: totalWeight > 0 ? totalScore / totalWeight : 0
    };
  }

  getScoreCategory(percent) {
    for (const [category, range] of Object.entries(SCORE_SUCCESS_MAPPING)) {
      if (percent >= range.min && percent <= range.max) {
        return category;
      }
    }
    return 'unknown';
  }

  addError(message) {
    this.errors.push(`❌ ERROR: ${message}`);
  }

  addWarning(message) {
    this.warnings.push(`⚠️  WARNING: ${message}`);
  }

  printResults() {
    console.log('\\n📊 Validation Results:');
    
    if (this.errors.length > 0) {
      console.log('\\n🚨 Errors:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\\n⚠️  Warnings:');  
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
    }

    console.log(`\\n📈 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    return this.errors.length === 0;
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validate-scores.js <entity-score-file.json> [<file2.json> ...]');
    console.error('   or: node validate-scores.js entity-scores/*.json');
    process.exit(1);
  }

  const validator = new ScoreValidator();
  let allValid = true;
  
  // Validate each file
  args.forEach((filePath, index) => {
    if (index > 0) console.log('\n' + '='.repeat(50));
    const isValid = validator.validateFile(filePath);
    if (!isValid) allValid = false;
  });
  
  validator.printResults();
  process.exit(allValid ? 0 : 1);
}

module.exports = { ScoreValidator };