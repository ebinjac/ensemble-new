// app/lib/intelligent-classifier.ts
export interface ClassificationRule {
    keywords: string[];
    category: string;
    tags: string[];
    priority: number;
  }
  
  export const classificationRules: ClassificationRule[] = [
    // Monitoring & Analytics
    {
      keywords: ['splunk', 'splunk.aexp.com', 'search', 'logs'],
      category: 'tool',
      tags: ['monitoring', 'logs', 'analytics', 'splunk'],
      priority: 10
    },
    {
      keywords: ['dynatrace', 'dynatrace.aexp.com', 'apm', 'performance'],
      category: 'tool', 
      tags: ['monitoring', 'apm', 'performance', 'dynatrace'],
      priority: 10
    },
    {
      keywords: ['grafana', 'grafana.aexp.com', 'dashboard', 'metrics'],
      category: 'dashboard',
      tags: ['monitoring', 'metrics', 'dashboard', 'grafana'],
      priority: 10
    },
    {
      keywords: ['kibana', 'kibana.aexp.com', 'elasticsearch'],
      category: 'tool',
      tags: ['monitoring', 'logs', 'search', 'kibana'],
      priority: 10
    },
    {
      keywords: ['datadog', 'datadog.aexp.com'],
      category: 'tool',
      tags: ['monitoring', 'metrics', 'alerts', 'datadog'],
      priority: 10
    },
  
    // Development Tools
    {
      keywords: ['gitlab', 'gitlab.aexp.com', 'git', 'repository', 'repo'],
      category: 'repository',
      tags: ['git', 'code', 'repository', 'version-control'],
      priority: 10
    },
    {
      keywords: ['github', 'github.com', 'github.aexp.com'],
      category: 'repository',
      tags: ['git', 'code', 'repository', 'version-control'],
      priority: 10
    },
    {
      keywords: ['jenkins', 'jenkins.aexp.com', 'build', 'ci/cd', 'pipeline'],
      category: 'tool',
      tags: ['ci-cd', 'build', 'deployment', 'automation'],
      priority: 10
    },
    {
      keywords: ['artifactory', 'artifactory.aexp.com', 'artifacts'],
      category: 'tool',
      tags: ['artifacts', 'packages', 'repository', 'build'],
      priority: 10
    },
  
    // Documentation
    {
      keywords: ['confluence', 'confluence.aexp.com', 'wiki', 'documentation', 'docs'],
      category: 'documentation',
      tags: ['documentation', 'wiki', 'knowledge-base'],
      priority: 10
    },
    {
      keywords: ['readme', 'doc', 'documentation', 'guide', 'manual'],
      category: 'documentation',
      tags: ['documentation', 'guide', 'reference'],
      priority: 8
    },
  
    // Project Management
    {
      keywords: ['jira', 'jira.aexp.com', 'tickets', 'issues'],
      category: 'tool',
      tags: ['project-management', 'tickets', 'issues', 'jira'],
      priority: 10
    },
    {
      keywords: ['servicenow', 'servicenow.aexp.com', 'itsm'],
      category: 'service',
      tags: ['itsm', 'tickets', 'service-management'],
      priority: 10
    },
  
    // Infrastructure
    {
      keywords: ['vault', 'vault.aexp.com', 'secrets'],
      category: 'service',
      tags: ['security', 'secrets', 'vault', 'infrastructure'],
      priority: 10
    },
    {
      keywords: ['consul', 'consul.aexp.com', 'service-discovery'],
      category: 'service',
      tags: ['infrastructure', 'service-discovery', 'consul'],
      priority: 10
    },
    {
      keywords: ['kubernetes', 'k8s', 'container', 'docker'],
      category: 'tool',
      tags: ['kubernetes', 'containers', 'orchestration', 'infrastructure'],
      priority: 9
    },
  
    // Databases
    {
      keywords: ['database', 'db', 'sql', 'mysql', 'postgres', 'mongodb'],
      category: 'service',
      tags: ['database', 'data', 'storage'],
      priority: 8
    },
  
    // API & Services
    {
      keywords: ['api', 'rest', 'graphql', 'swagger', 'openapi'],
      category: 'service',
      tags: ['api', 'service', 'integration'],
      priority: 8
    },
  
    // Dashboards
    {
      keywords: ['dashboard', 'reporting', 'analytics', 'bi'],
      category: 'dashboard',
      tags: ['dashboard', 'analytics', 'reporting'],
      priority: 7
    },
  
    // General categorization by URL patterns
    {
      keywords: ['.aexp.com', 'internal'],
      category: 'other',
      tags: ['internal'],
      priority: 1
    }
  ];
  
  export interface IntelligentClassification {
    suggestedCategory: string;
    suggestedTags: string[];
    confidence: number;
    matchedRules: string[];
  }
  
  export function classifyLink(
    title: string, 
    url: string, 
    description?: string
  ): IntelligentClassification {
    const content = `${title} ${url} ${description || ''}`.toLowerCase();
    
    let bestCategory = 'other';
    let allTags = new Set<string>();
    let totalPriority = 0;
    let matchedRules: string[] = [];
  
    // Find matching rules
    for (const rule of classificationRules) {
      const matches = rule.keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      );
  
      if (matches.length > 0) {
        // Higher priority rules override category
        if (rule.priority > totalPriority) {
          bestCategory = rule.category;
          totalPriority = rule.priority;
        }
  
        // Add all tags from matching rules
        rule.tags.forEach(tag => allTags.add(tag));
        matchedRules.push(`${rule.keywords[0]} (${matches.join(', ')})`);
      }
    }
  
    // Calculate confidence based on matches
    const confidence = Math.min(100, Math.max(0, (matchedRules.length * 20) + (totalPriority * 5)));
  
    return {
      suggestedCategory: bestCategory,
      suggestedTags: Array.from(allTags).slice(0, 5), // Limit to 5 tags
      confidence,
      matchedRules
    };
  }
  
  export function batchClassifyLinks(links: ParsedLink[]): ParsedLink[] {
    return links.map(link => {
      const classification = classifyLink(link.title, link.url, link.description);
      
      return {
        ...link,
        suggestedCategory: classification.suggestedCategory,
        suggestedTags: classification.suggestedTags,
        confidence: classification.confidence,
        matchedRules: classification.matchedRules
      };
    });
  }
  