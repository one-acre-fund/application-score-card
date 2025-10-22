# Entity Self-Review Process

## Overview
This document outlines the process for developers and entity owners to perform self-assessments of their components through GitHub Pull Requests, followed by review meetings and score consolidation.

## Process Flow

### 1. Self-Assessment Submission (Developer)
1. Developer creates a new branch from `main`
2. Copies the template from `templates/entity-score-template.json`
3. Renames it to `entity-scores/{entity-name}.json` 
4. Fills in their self-assessment scores and comments
5. Creates a Pull Request with the title: `Self-Review: {entity-name}`
6. Assigns the PR to their team lead/reviewer

### 2. Review Meeting
1. Team lead schedules a review meeting with the developer
2. During the meeting, they discuss:
   - Developer's self-assessment rationale
   - Evidence for claimed scores
   - Areas for improvement
   - Action items for score improvements
3. Scores are agreed upon and documented in the PR

### 3. Score Consolidation (Automated)
1. After meeting agreement, team lead approves and merges the PR
2. GitHub Action automatically triggers the score calculation script
3. Script validates the entity score file format
4. Script updates the main `all.json` file with aggregated scores
5. Updated scores become visible in the Backstage score-card plugin

## File Structure
```
self-review-process/
├── entity-scores/           # Individual entity self-assessments
│   ├── elasticsearch.json   # Example entity score
│   └── kibana.json         # Another example
├── scripts/                # Automation scripts
│   ├── validate-scores.js   # Validation script
│   ├── calculate-scores.js  # Score calculation and aggregation
│   └── update-all-json.js   # Updates the main all.json file
├── templates/              # Templates for developers
│   └── entity-score-template.json
└── README.md              # This documentation
```

## Rules and Guidelines

### Scoring Guidelines
- Scores must be between 0-100
- Provide detailed comments for scores below 50
- Unknown/Not Applicable items should use `scoreSuccess: "unknown"`
- Optional items should be marked with `isOptional: true`

### PR Requirements
- PR title must follow format: `Self-Review: {entity-name}`
- PR description must include:
  - Summary of current score
  - Key areas of strength
  - Areas identified for improvement
  - Action items with timelines

### Validation Rules
- Entity name must match existing Backstage catalog entity
- All required score areas must be completed
- Score percentages must align with scoreSuccess enum values
- Reviewer information must be provided after meeting

## Score Success Mapping
- `success`: 80-100%
- `almost-success`: 70-79%
- `partial`: 50-69%  
- `almost-failure`: 30-49%
- `failure`: 0-29%
- `unknown`: Not assessed/Not applicable

## Meeting Outcomes
After the review meeting, the entity score file should include:
- `scoringReviewer`: Name/ID of the reviewer
- `scoringReviewDate`: ISO date of the review meeting
- `meetingNotes`: Summary of discussion and agreements
- `actionItems`: List of improvement tasks with owners and deadlines# Test
