#!/usr/bin/env node

/**
 * Score calculation and aggregation script
 * Calculates final scores from entity assessment files and updates all.json
 * Usage: node calculate-scores.js [options]
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

class ScoreCalculator {
  constructor(options = {}) {
    this.entityScoresDir = options.entityScoresDir || './entity-scores';
    this.outputFile = options.outputFile || './all.json';
    this.verbose = options.verbose || false;
  }

  async calculateAllScores() {
    console.log('🔢 Starting score calculation process...');

    // Get all entity score files
    const entityFiles = this.getEntityScoreFiles();
    console.log(`📁 Found ${entityFiles.length} entity score files`);

    const allScores = [];
    const errors = [];
    const entityFileMap = new Map();

    for (const file of entityFiles) {
      try {
        const entityScore = this.processEntityFile(file);
        if (entityScore) {
          allScores.push(entityScore);
          entityFileMap.set(file, entityScore);
          if (this.verbose) {
            console.log(`✅ Processed: ${entityScore.entityRef.name} (${entityScore.scorePercent}%)`);
          }
        }
      } catch (error) {
        errors.push(`Error processing ${file}: ${error.message}`);
        console.error(`❌ Error processing ${file}:`, error.message);
      }
    }

    if (errors.length > 0) {
      console.log(`\\n⚠️  ${errors.length} files had processing errors`);
      errors.forEach(error => console.log(`  ${error}`));
    }

    // Sort by entity name for consistent output
    allScores.sort((a, b) => a.entityRef.name.localeCompare(b.entityRef.name));

    // Update individual entity files with calculated scores
    await this.updateIndividualEntityFiles(entityFileMap);

    // Write output file
    await this.writeOutputFile(allScores);

    console.log(`\\n✅ Score calculation complete! Generated scores for ${allScores.length} entities`);
    this.printSummaryStats(allScores);

    return {
      scores: allScores,
      errors,
      totalEntities: allScores.length
    };
  }

  getEntityScoreFiles() {
    if (!fs.existsSync(this.entityScoresDir)) {
      throw new Error(`Entity scores directory not found: ${this.entityScoresDir}`);
    }

    return fs.readdirSync(this.entityScoresDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(this.entityScoresDir, file));
  }

  processEntityFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Validate basic structure
    if (!data.entityRef || !data.areaScores) {
      throw new Error('Invalid entity score structure');
    }

    // Calculate scores for each area and overall
    const processedAreaScores = data.areaScores.map(area => this.processAreaScore(area));
    const overallScore = this.calculateOverallScore(processedAreaScores);

    // Build final score object compatible with all.json format
    const roundedScore = Math.round(overallScore.scorePercent);
    const calculatedLabel = this.getScoreLabel(roundedScore);
    const calculatedSuccess = this.getScoreSuccess(roundedScore);

    const finalScore = {
      entityRef: {
        kind: data.entityRef.kind,
        name: data.entityRef.name,
        ...(data.entityRef.namespace && data.entityRef.namespace !== 'default' && {
          namespace: data.entityRef.namespace
        })
      },
      generatedDateTimeUtc: data.generatedDateTimeUtc || new Date().toISOString(),
      scorePercent: roundedScore,
      scoreLabel: calculatedLabel,
      scoreSuccess: calculatedSuccess,
      ...(data.scoringReviewer && { scoringReviewer: data.scoringReviewer }),
      ...(data.scoringReviewDate && { scoringReviewDate: data.scoringReviewDate }),
      areaScores: processedAreaScores.map(area => ({
        id: area.id,
        title: area.title,
        scorePercent: Math.round(area.scorePercent),
        scoreLabel: this.getScoreLabel(area.scorePercent),
        scoreSuccess: this.getScoreSuccess(area.scorePercent)
      }))
    };

    return finalScore;
  }

  processAreaScore(area) {
    const scoredEntries = area.scoreEntries.filter(entry => 
      entry.scoreSuccess !== 'unknown' && 
      entry.scorePercent !== null && 
      entry.scorePercent !== undefined &&
      !entry.isOptional
    );

    let areaScore = 0;
    if (scoredEntries.length > 0) {
      const totalScore = scoredEntries.reduce((sum, entry) => sum + entry.scorePercent, 0);
      areaScore = totalScore / scoredEntries.length;
    }

    return {
      id: area.id,
      title: area.title,
      scorePercent: areaScore,
      scoreEntries: area.scoreEntries
    };
  }

  calculateOverallScore(areaScores) {
    // Filter areas that have actual scores
    const scoredAreas = areaScores.filter(area => area.scorePercent > 0);
    
    if (scoredAreas.length === 0) {
      return { scorePercent: 0 };
    }

    // Simple average of area scores
    // You can implement weighted scoring here if needed
    const totalScore = scoredAreas.reduce((sum, area) => sum + area.scorePercent, 0);
    const averageScore = totalScore / scoredAreas.length;

    return {
      scorePercent: averageScore
    };
  }

  getScoreLabel(percent) {
    for (const [label, range] of Object.entries(COLOR_MAPPING)) {
      if (percent >= range.min && percent <= range.max) {
        return label;
      }
    }
    return 'Red'; // default
  }

  getScoreSuccess(percent) {
    for (const [success, range] of Object.entries(SCORE_SUCCESS_MAPPING)) {
      if (percent >= range.min && percent <= range.max) {
        return success;
      }
    }
    return 'failure'; // default
  }

  async updateIndividualEntityFiles(entityFileMap) {
    console.log('\\n🔄 Updating individual entity files with calculated scores...');
    let updated = 0;

    for (const [filePath, calculatedScore] of entityFileMap.entries()) {
      try {
        // Read the original file
        const content = fs.readFileSync(filePath, 'utf8');
        const originalData = JSON.parse(content);

        // Update top-level scores
        originalData.scorePercent = calculatedScore.scorePercent;
        originalData.scoreLabel = calculatedScore.scoreLabel;
        originalData.scoreSuccess = calculatedScore.scoreSuccess;

        // Update area scores while preserving scoreEntries
        if (originalData.areaScores && calculatedScore.areaScores) {
          originalData.areaScores = originalData.areaScores.map(originalArea => {
            const calculatedArea = calculatedScore.areaScores.find(
              ca => ca.id === originalArea.id
            );

            if (calculatedArea) {
              // Update area-level scores
              const updatedArea = {
                ...originalArea,
                scorePercent: calculatedArea.scorePercent,
                scoreLabel: calculatedArea.scoreLabel,
                scoreSuccess: calculatedArea.scoreSuccess
              };

              // Update scoreLabel for each scoreEntry based on its scorePercent
              if (updatedArea.scoreEntries) {
                updatedArea.scoreEntries = updatedArea.scoreEntries.map(entry => ({
                  ...entry,
                  scoreLabel: this.getScoreLabel(entry.scorePercent || 0),
                  scoreSuccess: this.getScoreSuccess(entry.scorePercent || 0)
                }));
              }

              return updatedArea;
            }

            return originalArea;
          });
        }

        // Write back to file
        const output = JSON.stringify(originalData, null, 2);
        fs.writeFileSync(filePath, output, 'utf8');
        updated++;

        if (this.verbose) {
          console.log(`   ✅ Updated ${path.basename(filePath)}`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to update ${filePath}: ${error.message}`);
      }
    }

    console.log(`📝 Updated ${updated} individual entity files`);
  }

  async writeOutputFile(scores) {
    const outputDir = path.dirname(this.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = JSON.stringify(scores, null, 2);
    fs.writeFileSync(this.outputFile, output, 'utf8');
    console.log(`📝 Written ${scores.length} entity scores to ${this.outputFile}`);
  }

  printSummaryStats(scores) {
    const stats = {
      total: scores.length,
      bySuccess: {},
      byLabel: {},
      averageScore: 0
    };

    let totalScore = 0;
    scores.forEach(score => {
      // Count by success category
      stats.bySuccess[score.scoreSuccess] = (stats.bySuccess[score.scoreSuccess] || 0) + 1;
      
      // Count by color label
      stats.byLabel[score.scoreLabel] = (stats.byLabel[score.scoreLabel] || 0) + 1;
      
      totalScore += score.scorePercent;
    });

    stats.averageScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : 0;

    console.log('\\n📊 Summary Statistics:');
    console.log(`   Total Entities: ${stats.total}`);
    console.log(`   Average Score: ${stats.averageScore}%`);
    console.log('\\n📈 Score Distribution:');
    
    Object.entries(stats.bySuccess).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} entities`);
    });
    
    console.log('\\n🎨 Color Distribution:');
    Object.entries(stats.byLabel).forEach(([label, count]) => {
      console.log(`   ${label}: ${count} entities`);
    });
  }
}

// CLI Usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--entity-scores-dir':
        options.entityScoresDir = args[++i];
        break;
      case '--output':
        options.outputFile = args[++i];
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--help':
        console.log(`
Usage: node calculate-scores.js [options]

Options:
  --entity-scores-dir <dir>    Directory containing entity score files (default: ./entity-scores)
  --output <file>              Output file path (default: ./all.json)
  --verbose                    Verbose output
  --help                       Show this help message

Examples:
  node calculate-scores.js
  node calculate-scores.js --entity-scores-dir ./scores --output ./output/all.json --verbose
        `);
        process.exit(0);
        break;
    }
  }

  const calculator = new ScoreCalculator(options);
  
  calculator.calculateAllScores()
    .then(result => {
      console.log('\\n🎉 Score calculation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Score calculation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { ScoreCalculator };