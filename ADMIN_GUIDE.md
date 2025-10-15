# Admin Guide: Self-Review Process Management

## 🎯 Overview
This guide is for team leads, platform engineers, and administrators managing the self-review process for entity assessments.

## 🔧 Setup and Configuration

### Initial Repository Setup

1. **Copy the self-review-process folder** to your repository root
2. **Update configuration** in scripts to match your setup:
   ```javascript
   // In scripts/calculate-scores.js
   const calculator = new ScoreCalculator({
     entityScoresDir: './path/to/your/entity-scores',
     outputFile: './path/to/your/all.json'
   });
   ```

3. **Configure GitHub Actions** permissions in repository settings:
   - Enable Actions if not already enabled
   - Set Actions permissions to "Allow all actions and reusable workflows"
   - Grant GITHUB_TOKEN write permissions for contents and pull-requests

4. **Set up branch protection** (recommended):
   - Require PR reviews for main branch
   - Require status checks to pass before merging
   - Include the validation workflow as a required check

### Backstage Plugin Configuration

Update your `app-config.yaml` to point to the generated scores:

```yaml
scorecards:
  jsonDataUrl: https://raw.githubusercontent.com/your-org/your-repo/main/
  # This will make the plugin read from your-repo/main/all.json
```

Or for individual entity overrides, use annotations in catalog entities:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component
  annotations:
    scorecard/jsonDataUrl: https://raw.githubusercontent.com/your-org/your-repo/main/my-component.json
```

## 👥 Managing the Review Process

### Setting Up Review Teams

1. **Assign reviewers** based on domain expertise:
   - Platform/SRE teams for Operations scores
   - Architecture teams for Code and Design scores  
   - Technical writers for Documentation scores
   - QA teams for Quality scores

2. **Create reviewer guidelines** document with:
   - Scoring standards and examples
   - Common questions and answers
   - Escalation procedures for disagreements

3. **Establish meeting cadence**:
   - Schedule regular review slots
   - Provide meeting templates
   - Set expectations for meeting duration (typically 30-60 minutes)

### Review Meeting Best Practices

#### Pre-Meeting Preparation
- Review the self-assessment in advance
- Prepare questions about specific scores
- Gather relevant evidence or examples
- Check for consistency with similar entities

#### During the Meeting
- Start with strengths and positive aspects
- Discuss scoring rationale for key areas
- Focus on improvement opportunities, not criticism
- Document agreements and action items
- Set realistic timelines for improvements

#### Post-Meeting Actions
1. Update the entity score file with agreed scores
2. Add reviewer information and meeting date
3. Document meeting notes and action items
4. Approve and merge the PR
5. Follow up on action items in subsequent sprints

### Handling Edge Cases

#### Scoring Disagreements
1. **Developer scores higher than evidence suggests**:
   - Ask for specific evidence
   - Provide examples of higher scoring implementations
   - Focus on improvement plan rather than exact score
   - Consider external perspective or second reviewer

2. **Developer scores lower than warranted**:
   - Highlight positive aspects they may have missed
   - Provide comparison with similar entities
   - Acknowledge areas where they excel
   - Adjust scores to reflect actual state

3. **Unable to reach agreement**:
   - Document the disagreement in meeting notes
   - Escalate to technical leadership
   - Consider splitting the difference
   - Schedule follow-up meeting with additional stakeholders

#### Non-Standard Entities
- **Legacy systems**: Focus on realistic improvements within constraints
- **Third-party services**: Score based on configuration and integration quality
- **Experimental projects**: Adjust expectations and mark more items as optional
- **Shared services**: Consider impact radius in scoring decisions

## 📊 Monitoring and Analytics

### Process Health Metrics

Track these metrics to ensure process effectiveness:

```bash
# Number of entities assessed per quarter
find entity-scores -name "*.json" -type f | wc -l

# Average time from PR creation to merge
# (Use GitHub API or manual tracking)

# Score improvement trends over time
# (Compare quarterly assessment results)

# Action item completion rates  
# (Track improvement commitments)
```

### Quality Indicators

Monitor for these quality signals:
- **High variation in scores**: May indicate inconsistent standards
- **No improvement over time**: Process may not be driving action
- **Consistently low engagement**: May need process simplification
- **Frequent scoring disputes**: May need clearer guidelines

### Reporting Dashboard

Create a simple dashboard to track:
1. **Completion Status**: Which entities have been assessed
2. **Score Distribution**: Histogram of scores by area
3. **Improvement Trends**: Score changes over time
4. **Action Item Status**: Progress on committed improvements

## 🔧 Technical Administration

### Script Maintenance

The automation scripts require periodic maintenance:

#### validate-scores.js
- **Update scoring rubrics** as standards evolve
- **Add new validation rules** for emerging best practices
- **Adjust thresholds** based on organizational maturity

#### calculate-scores.js  
- **Modify weighting algorithms** if certain areas become more critical
- **Add new aggregation logic** for specialized entity types
- **Update output format** if Backstage plugin requirements change

#### process-pr-merge.js
- **Update git configuration** for your organization
- **Modify commit messages** to match your conventions
- **Adjust notification logic** for your communication tools

### GitHub Actions Maintenance

Monitor workflow execution and update as needed:

```yaml
# Add to your dependabot.yml to keep actions updated
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/.github/workflows"
    schedule:
      interval: "monthly"
```

### Backup and Recovery

Implement backup procedures for critical data:

1. **Entity scores**: Regular backup of entity-scores directory
2. **Historical data**: Preserve assessment history for trend analysis
3. **Configuration**: Version control all configuration files
4. **Process documentation**: Keep assessment standards versioned

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### Validation Failures
```bash
# Check common validation issues
node scripts/validate-scores.js entity-scores/problematic-entity.json

# Common fixes:
# - Missing required fields
# - Invalid date formats  
# - Scores outside 0-100 range
# - Missing entity reference
```

#### Score Calculation Problems
```bash
# Debug score calculation
node scripts/calculate-scores.js --verbose

# Check for:
# - Division by zero (all scores unknown)
# - Circular references in data
# - Memory issues with large datasets
```

#### GitHub Actions Failures
```bash
# Check workflow logs for:
# - Permission issues (GITHUB_TOKEN scope)
# - Node.js version compatibility
# - Missing dependencies
# - Git configuration problems
```

#### Backstage Integration Issues
- **Scores not appearing**: Check jsonDataUrl configuration
- **Outdated scores**: Verify all.json is being updated and accessible
- **Loading errors**: Check JSON format and CORS settings
- **Performance issues**: Consider CDN or caching for large score files

### Emergency Procedures

#### Manual Score Processing
If automation fails, process scores manually:

```bash
# 1. Validate individual files
for file in entity-scores/*.json; do
  node scripts/validate-scores.js "$file"
done

# 2. Generate aggregated scores
node scripts/calculate-scores.js --output all.json

# 3. Commit and push manually
git add all.json
git commit -m "Manual score update"
git push origin main
```

#### Rollback Procedures
```bash
# 1. Identify last good commit
git log --oneline -- all.json

# 2. Revert to previous version
git revert <commit-hash>

# 3. Or restore from backup
cp backup/all.json ./all.json
git add all.json
git commit -m "Restore scores from backup"
```

## 📈 Continuous Improvement

### Process Evolution

Regular review and improvement of the process:

#### Quarterly Process Review
1. **Gather feedback** from participants
2. **Analyze completion rates** and time-to-complete
3. **Review scoring consistency** across teams
4. **Identify automation opportunities**
5. **Update documentation** based on learnings

#### Annual Standards Review  
1. **Update assessment criteria** based on industry evolution
2. **Revise scoring rubrics** for organizational maturity
3. **Add new assessment areas** as practices emerge
4. **Retire obsolete assessments** that no longer apply

#### Success Metrics
- **Increased entity coverage**: More entities participating
- **Improved scores over time**: Evidence of continuous improvement  
- **Reduced assessment time**: Process becomes more efficient
- **Higher satisfaction**: Positive feedback from participants
- **Actionable outcomes**: Assessments drive real improvements

### Scaling the Process

As the organization grows:

#### Decentralization
- Train multiple reviewers per domain
- Create domain-specific guidelines
- Enable team-level process ownership
- Provide self-service tooling

#### Automation Enhancement
- Integrate with CI/CD pipelines for automatic scoring
- Connect to monitoring systems for objective metrics
- Use AI/ML for initial score suggestions
- Automate action item tracking and follow-up

#### Integration
- Connect to performance management systems
- Link to technical debt tracking
- Integrate with architectural decision records
- Combine with security and compliance frameworks

## 📞 Support and Escalation

### Support Channels
- **Process questions**: Platform team Slack channel
- **Technical issues**: GitHub repository issues
- **Scoring disputes**: Technical leadership escalation
- **Process improvements**: Architecture review board

### Contact Information
- **Process Owner**: [Your platform team contact]
- **Technical Support**: [Your DevOps team contact]  
- **Assessment Standards**: [Your architecture team contact]

Remember: The goal is continuous improvement, not perfect scores. Focus on creating a culture of transparency, learning, and collaborative enhancement of your systems and processes! 🚀