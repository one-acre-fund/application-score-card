#!/usr/bin/env node

/**
 * GitHub Action workflow script for automated score processing
 * Triggered on PR merge to process entity score changes
 * Usage: node process-pr-merge.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ScoreValidator } = require('./validate-scores');
const { ScoreCalculator } = require('./calculate-scores');

class PRMergeProcessor {
  constructor() {
    this.changedFiles = [];
    this.errors = [];
    this.warnings = [];
  }

  async processPRMerge() {
    console.log('🔄 Processing PR merge for score updates...');
    
    try {
      // Get changed files from the PR
      this.getChangedFiles();
      
      // Filter for entity score files
      const entityScoreFiles = this.filterEntityScoreFiles();
      
      if (entityScoreFiles.length === 0) {
        console.log('ℹ️  No entity score files changed in this PR');
        return { success: true, message: 'No score files to process' };
      }

      console.log(`📝 Processing ${entityScoreFiles.length} changed entity score files:`);
      entityScoreFiles.forEach(file => console.log(`   - ${file}`));

      // Validate all changed score files
      const validationResult = await this.validateChangedFiles(entityScoreFiles);
      if (!validationResult.success) {
        return validationResult;
      }

      // Calculate and update scores
      const calculationResult = await this.updateScores();
      if (!calculationResult.success) {
        return calculationResult;
      }

      // Commit updated all.json if there are changes
      await this.commitUpdatedScores();

      console.log('✅ PR merge processing completed successfully!');
      return { 
        success: true, 
        message: `Processed ${entityScoreFiles.length} entity score files`,
        processedFiles: entityScoreFiles,
        updatedScores: calculationResult.totalEntities
      };

    } catch (error) {
      console.error('❌ Error processing PR merge:', error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  getChangedFiles() {
    try {
      // Get the list of changed files in the PR
      // This assumes the script runs in a GitHub Action with proper git setup
      const output = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      this.changedFiles = output.trim().split('\n').filter(file => file.length > 0);
      
      console.log(`📋 Changed files in PR: ${this.changedFiles.length}`);
      if (this.changedFiles.length <= 10) {
        this.changedFiles.forEach(file => console.log(`   - ${file}`));
      }
    } catch (error) {
      console.warn('⚠️  Could not get changed files from git. Processing all entity score files.');
      this.changedFiles = [];
    }
  }

  filterEntityScoreFiles() {
    // Matches files in the entity-scores directory ending with .json
    const entityScorePattern = /^entity-scores\/[^/]+\.json$/;
    
    if (this.changedFiles.length === 0) {
      // If we can't get changed files, process all entity score files
      const entityScoresDir = './entity-scores';
      if (fs.existsSync(entityScoresDir)) {
        return fs.readdirSync(entityScoresDir)
          .filter(file => file.endsWith('.json'))
          .map(file => path.join(entityScoresDir, file));
      }
      return [];
    }

    console.log('🔍 Debugging file filtering:');
    this.changedFiles.forEach(file => {
      const matches = entityScorePattern.test(file);
      const exists = fs.existsSync(file);
      console.log(`   File: ${file} | Pattern match: ${matches} | Exists: ${exists}`);
    });

    let changedFiles = this.changedFiles
      .filter(file => entityScorePattern.test(file))
      .filter(file => fs.existsSync(file)); // Only existing files
    
      console.log(`📂 Found ${changedFiles.length} changed entity score files`);
    return changedFiles;
  }

  async validateChangedFiles(files) {
    console.log('\\n🔍 Validating changed entity score files...');
    
    let hasErrors = false;
    
    for (const file of files) {
      console.log(`\\n📋 Validating: ${file}`);
      
      const validator = new ScoreValidator();
      const isValid = validator.validateFile(file);
      
      if (!isValid) {
        console.log(`❌ Validation failed for ${file}`);
        validator.printResults();
        hasErrors = true;
      } else {
        console.log(`✅ Validation passed for ${file}`);
      }
    }

    if (hasErrors) {
      return {
        success: false,
        error: 'One or more entity score files failed validation. Please fix the errors and try again.'
      };
    }

    console.log('\\n✅ All entity score files passed validation!');
    return { success: true };
  }

  async updateScores() {
    console.log('\\n🔢 Calculating and updating scores...');
    
    const calculator = new ScoreCalculator({
      entityScoresDir: './entity-scores',
      outputFile: './all.json',
      verbose: true
    });

    try {
      const result = await calculator.calculateAllScores();
      
      if (result.errors && result.errors.length > 0) {
        console.log('\\n⚠️  Some files had calculation errors:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }

      return {
        success: true,
        totalEntities: result.totalEntities,
        errors: result.errors || []
      };
    } catch (error) {
      return {
        success: false,
        error: `Score calculation failed: ${error.message}`
      };
    }
  }

  async commitUpdatedScores() {
    console.log('\\n📤 Committing updated scores...');
    
    try {
      // Check if all.json has changes
      const hasChanges = this.hasGitChanges('./all.json');
      
      if (!hasChanges) {
        console.log('ℹ️  No changes to all.json, skipping commit');
        return;
      }

      // Configure git if needed (for GitHub Actions)
      execSync('git config --global user.email "action@github.com"', { stdio: 'inherit' });
      execSync('git config --global user.name "GitHub Action"', { stdio: 'inherit' });
      
      // Add and commit the updated all.json
      execSync('git add all.json', { stdio: 'inherit' });
      execSync('git commit -m "🤖 Update aggregated scores from entity assessments [skip ci]"', { stdio: 'inherit' });
      
      // Push the commit
      execSync('git push origin main -f', { stdio: 'inherit' });
      
      console.log('✅ Updated scores committed and pushed to main branch');
      
    } catch (error) {
      console.warn('⚠️  Could not commit updated scores automatically:', error.message);
      console.log('ℹ️  The all.json file has been updated but needs to be committed manually');
    }
  }

  hasGitChanges(filePath) {
    try {
      const output = execSync(`git status --porcelain ${filePath}`, { encoding: 'utf8' });
      return output.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  generatePRComment(result) {
    if (!result.success) {
      return `## ❌ Score Processing Failed
      
**Error:** ${result.error}

Please fix the validation errors and try again.`;
    }

    return `## ✅ Score Processing Completed

**Summary:**
- Processed ${result.processedFiles && result.processedFiles.length || 0} entity score files
- Updated scores for ${result.updatedScores} entities
- All.json has been updated with the latest scores

The updated scores are now visible in the Backstage score-card plugin.`;
  }
}

// CLI Usage
if (require.main === module) {
  const processor = new PRMergeProcessor();
  
  processor.processPRMerge()
    .then(result => {
      console.log('\\n' + processor.generatePRComment(result));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Processing failed:', error);
      process.exit(1);
    });
}

module.exports = { PRMergeProcessor };