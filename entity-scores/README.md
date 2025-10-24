# Application Scorecards

This directory contains individual JSON scorecard files for all platform applications using the improved scorecard framework v2.0.

## Overview

Each application has been assessed across 6 key areas with specific weightings that reflect their importance to platform stability and reliability:

1. **Documentation & Knowledge** (20%) - Setup docs, architecture, APIs, runbooks  
2. **Observability & Monitoring** (30%) - Application monitoring, logging, alerting, health checks
3. **CI/CD & Deployment** (25%) - Continuous integration/deployment, environment management, releases
4. **Security & Compliance** (15%) - Security scanning, authentication, data protection, configuration
5. **Testing & Quality Assurance** (15%) - Unit/integration testing, quality gates, performance testing
6. **Operations & Support** (15%) - Incident management, support docs, maintenance, knowledge transfer

## Scoring System

### Score Ranges
- **90-100%**: Excellent (Green) - Industry best practices implemented
- **75-89%**: Good (Green) - Solid implementation with room for improvement  
- **60-74%**: Adequate (Yellow) - Basic requirements met, improvements needed
- **40-59%**: Poor (Yellow) - Significant gaps requiring attention
- **0-39%**: Critical (Red) - Major deficiencies requiring immediate action

### Success Categories
- `success`: 80-100% - Meets or exceeds expectations
- `almost-success`: 70-79% - Generally good with minor improvements needed
- `partial`: 50-69% - Adequate but requires attention
- `almost-failure`: 30-49% - Poor performance requiring significant improvement
- `failure`: 0-29% - Critical issues requiring immediate action
- `unknown`: Not yet assessed

## File Structure

```
entity-scores/
├── README.md                           # This documentation
├── index.json                          # Master index of all applications
├── adminer.json                        # Adminer scorecard
├── airbyte.json                        # Airbyte scorecard
└── ...                                 # Additional application scorecards (42 total)
```

## Ownership and Responsibilities

Each scorecard includes:
- **Primary Owner**: Main person responsible for the application
- **Backup Owners**: Secondary contacts who can provide support
- **Review Process**: Regular assessment schedule and reviewer information

### Applications by Owner

**Orchide Irakoze** (Primary owner for 13 applications):
- Adminer, Airbyte, Airflow, ArgoCD, AWS, Database Backups and Restores
- Fineract UI & Backend, Growthbook, Jenkins, Kobo, Matomo, Odoo utilities
- Superset, Uptime, Weblate

**Rahma Ahmed** (Primary owner for 14 applications):
- Bytebase, Hetzner ELK, Ingress Controller, Keycloak, Kubecost, msgateway
- N8N, oauth2-proxy, Odoo 14 & 17, Openfaas, Payment Hub, SAP HANA Monitoring
- SNS & Apsheet, Timiza

**Innocent Lou** (Primary owner for 11 applications):
- APM and Fleet, Couchbase, Elasticsearch, Filebeat, Istio, Kibana
- Kong, Kubernetes Admin, Logstash, Rabbitmq

**Ivy Nzioka** (Primary owner for 4 applications):
- Alerting, Exchange rate management, Sheriff management

## How to Update Scores

### 1. Initial Assessment
- Review your application against each scorecard entry
- Assign scores based on the criteria provided (0, 50, 75, or 100)
- Provide detailed evidence in the `details` field
- Document improvement plans where scores are low

### 2. Review Process
1. Complete self-assessment by updating JSON file
2. Create PR with title: `Self-Review: {application-name}`
3. Schedule review meeting with team lead
4. Discuss scores and agree on final assessment
5. Update `scoringReviewer` and `scoringReviewDate` fields
6. Merge PR to make scores visible in dashboards

### 3. Continuous Improvement
- Implement recommendations from scorecard
- Schedule regular reviews (quarterly recommended)
- Track progress over time
- Share learnings across teams

## Review Schedule

- **Initial Reviews**: Complete by November 30, 2025
- **Regular Reviews**: Quarterly (every 3 months)
- **Emergency Reviews**: As needed for critical issues
- **Annual Reviews**: Comprehensive assessment with stakeholder input

## Next Steps

### For Application Owners
1. **Review your assigned applications** and understand current state
2. **Schedule assessment meetings** with your team
3. **Complete scorecards** with accurate, evidence-based scores
4. **Create improvement plans** for areas scoring below 75%
5. **Submit PRs** following the review process

### For Platform Team
1. **Monitor scorecard completion** across all applications
2. **Identify common gaps** and create shared solutions
3. **Provide support** to teams needing assistance
4. **Track progress** and report to leadership
5. **Update framework** based on lessons learned

## Getting Help

### Common Questions
- **Q: How do I score optional items?** A: Optional items can be marked as "unknown" if not applicable
- **Q: What if I don't have enough information?** A: Mark as "unknown" and create action items to gather data
- **Q: Can scores be between the defined ranges?** A: Use the closest defined score (0, 50, 75, 100)

### Support Contacts
- **Framework Questions**: Platform Engineering Team
- **Technical Issues**: Your backup owners or platform team
- **Process Questions**: Team leads or platform managers

## Reports and Analytics

Scorecard data is automatically displayed in **Backstage** through the score-card plugin:
- Real-time score visualization for each component
- Built-in filtering and sorting capabilities  
- Dashboard views across all applications
- Integration with your existing Backstage catalog
- Trend analysis and historical tracking

## Best Practices

### Scoring Guidelines
- **Be honest and objective** - scores should reflect reality, not aspirations
- **Provide evidence** - include specific examples and metrics where possible
- **Focus on outcomes** - what matters is the result, not just having processes
- **Consider context** - some applications may not need every feature

### Improvement Planning
- **Prioritize high-impact areas** - focus on items with higher weights first
- **Set realistic timelines** - balance urgency with resource constraints
- **Share solutions** - collaborate with other teams facing similar challenges
- **Measure progress** - track improvements over time

---

*Last updated: October 22, 2025*
*Framework version: 2.0*