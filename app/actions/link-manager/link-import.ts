// app/actions/link-import.ts
'use server'

import { db } from '@/db';
import { links } from '@/db/schema/link-manager';
import { requireTeamAccess } from '@/app/(auth)/lib/auth';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { ImportLinkData, ParsedLink, ImportResult, ImportSettings } from '@/components/link-manager/types/link-import';
import { batchClassifyLinks } from '@/components/link-manager/lib/intelligent-classifier'
import { applications } from '@/db/schema/teams';

// ✅ Remove onProgress parameter from server action
export async function importLinks(
  teamId: string,
  linksData: Array<{
    title: string;
    url: string;
    description?: string;
    applicationIds?: string[];
    category?: string;
    tags?: string[];
    status?: string;
    isPinned?: boolean;
    isPublic?: boolean;
  }>
): Promise<{
  success: boolean;
  successCount: number;
  errorCount: number;
  duplicateCount?: number; // ✅ REMOVED: No longer tracking duplicates
  errors?: string[];
}> {
  try {
    const { user } = await requireTeamAccess(teamId, { admin: false });
    const userEmail = user.user.email;

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // ✅ REMOVED: Duplicate URL checking logic
    // No longer checking for existing URLs in the database

    // Get all valid applications for this team once
    const teamApplicationsData = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.teamId, teamId),
          eq(applications.status, 'active')
        )
      );
    
    const validAppIds = new Set(teamApplicationsData.map(app => app.id));

    // Process each link
    for (const [index, linkData] of linksData.entries()) {
      try {
        // Validate application IDs
        const validApplicationIds = (linkData.applicationIds || [])
          .filter(appId => validAppIds.has(appId));

        // ✅ Simply create the link without duplicate checking
        await db
          .insert(links)
          .values({
            teamId,
            title: linkData.title.trim(),
            url: linkData.url.trim(),
            description: linkData.description?.trim() || null,
            applicationIds: validApplicationIds,
            category: (linkData.category as any) || 'other',
            tags: linkData.tags || [],
            status: (linkData.status as any) || 'active',
            isPinned: linkData.isPinned || false,
            isPublic: linkData.isPublic !== undefined ? linkData.isPublic : true,
            createdBy: userEmail,
            updatedBy: userEmail,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    revalidatePath(`/tools/teams/${teamId}/link-manager`);

    return {
      success: successCount > 0,
      successCount,
      errorCount,
      // ✅ REMOVED: duplicateCount field
      errors: errorCount > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Error importing links:', error);
    return {
      success: false,
      successCount: 0,
      errorCount: linksData.length,
      errors: ['Failed to import links: ' + (error instanceof Error ? error.message : 'Unknown error')]
    };
  }
}
// ✅ Keep the parseImportFile function unchanged
export async function parseImportFile(
  data: ImportLinkData,
  settings?: ImportSettings
): Promise<{
  success: boolean;
  links?: ParsedLink[];
  error?: string;
}> {
  try {
    await requireTeamAccess(data.teamId, { admin: false });

    let content = '';

    if (data.type === 'file' && data.file) {
      content = await data.file.text();
    } else if (data.content) {
      content = data.content;
    }

    if (!content.trim()) {
      return { success: false, error: 'No content provided' };
    }

    let parsedLinks: ParsedLink[] = [];

    // Parse content (existing logic)
    if (data.file?.type === 'application/json' || isJsonContent(content)) {
      parsedLinks = parseJsonContent(content);
    } else if (data.file?.type === 'text/csv' || isCsvContent(content)) {
      parsedLinks = parseCsvContent(content);
    } else if (data.file?.name.endsWith('.md') || isMarkdownContent(content)) {
      parsedLinks = parseMarkdownContent(content);
    } else if (data.type === 'urls') {
      parsedLinks = parseUrlList(content);
    } else {
      parsedLinks = parseGenericText(content);
    }

    // Validate URLs
    for (const link of parsedLinks) {
      link.isValid = isValidUrl(link.url);
    }

    // ✅ Apply intelligent classification if enabled
    if (settings?.enableIntelligentCategorization || settings?.enableIntelligentTagging) {
      parsedLinks = batchClassifyLinks(parsedLinks);

      // Auto-apply high confidence suggestions if enabled
      if (settings.autoApplyHighConfidence) {
        parsedLinks = parsedLinks.map(link => {
          if (link.confidence && link.confidence > 80) {
            return {
              ...link,
              category: settings.enableIntelligentCategorization ?
                (link.suggestedCategory || link.category) : link.category,
              tags: settings.enableIntelligentTagging ?
                [...(link.tags || []), ...(link.suggestedTags || [])] : link.tags
            };
          }
          return link;
        });
      }
    }

    return { success: true, links: parsedLinks };
  } catch (error) {
    console.error('Error parsing import file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse content'
    };
  }
}

// ... keep all the parsing helper functions unchanged
function isJsonContent(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

function isCsvContent(content: string): boolean {
  const lines = content.split('\n');
  return lines.length > 1 && (
    lines[0].includes(',') ||
    lines[0].toLowerCase().includes('title') ||
    lines[0].toLowerCase().includes('url')
  );
}

function isMarkdownContent(content: string): boolean {
  return content.includes('[') && content.includes('](');
}

function parseJsonContent(content: string): ParsedLink[] {
  try {
    const data = JSON.parse(content);
    const links: ParsedLink[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (item.url || item.link) {
          links.push({
            title: item.title || item.name || extractTitleFromUrl(item.url || item.link),
            url: item.url || item.link,
            description: item.description || item.desc,
            category: item.category,
            tags: Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : undefined,
            isValid: false,
            source: 'JSON',
            lineNumber: index + 1,
          });
        }
      });
    }

    return links;
  } catch {
    return [];
  }
}

function parseCsvContent(content: string): ParsedLink[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('name'));
  const urlIndex = headers.findIndex(h => h.includes('url') || h.includes('link'));
  const descIndex = headers.findIndex(h => h.includes('desc') || h.includes('description'));
  const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('type'));

  if (urlIndex === -1) return [];

  const links: ParsedLink[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

    if (cells[urlIndex] && isValidUrl(cells[urlIndex])) {
      links.push({
        title: titleIndex >= 0 ? cells[titleIndex] : extractTitleFromUrl(cells[urlIndex]),
        url: cells[urlIndex],
        description: descIndex >= 0 ? cells[descIndex] : undefined,
        category: categoryIndex >= 0 ? cells[categoryIndex] : undefined,
        isValid: false,
        source: 'CSV',
        lineNumber: i + 1,
      });
    }
  }

  return links;
}

function parseMarkdownContent(content: string): ParsedLink[] {
  const links: ParsedLink[] = [];

  // ✅ Improved regex to handle trailing punctuation
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  let lineNumber = 1;

  const lines = content.split('\n');

  for (const line of lines) {
    markdownLinkRegex.lastIndex = 0;
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      let [, title, url] = match;

      // ✅ Clean up URL - remove trailing punctuation that's not part of URL
      url = cleanUrlFromTrailingPunctuation(url.trim());
      title = title.trim();

      if (isValidUrl(url)) {
        links.push({
          title,
          url,
          isValid: false,
          source: 'Markdown',
          lineNumber,
        });
      }
    }
    lineNumber++;
  }

  // Also extract plain URLs with better punctuation handling
  const plainUrlRegex = /https?:\/\/[^\s<>"]+/g;
  lineNumber = 1;

  for (const line of lines) {
    plainUrlRegex.lastIndex = 0;
    while ((match = plainUrlRegex.exec(line)) !== null) {
      let url = cleanUrlFromTrailingPunctuation(match[0]);

      // Don't duplicate if already found as markdown link
      if (!links.some(l => l.url === url) && isValidUrl(url)) {
        links.push({
          title: extractTitleFromUrl(url),
          url: url.trim(),
          isValid: false,
          source: 'Markdown (plain)',
          lineNumber,
        });
      }
    }
    lineNumber++;
  }

  return links;
}

function cleanUrlFromTrailingPunctuation(url: string): string {
  // Remove common trailing punctuation that's often not part of the URL
  const trailingPunctuationRegex = /[.,;:!?)\]}'"]+$/;

  // Keep removing trailing punctuation until we get a valid URL or can't remove more
  let cleanedUrl = url;
  let previousUrl = '';

  while (cleanedUrl !== previousUrl && trailingPunctuationRegex.test(cleanedUrl)) {
    previousUrl = cleanedUrl;
    cleanedUrl = cleanedUrl.replace(trailingPunctuationRegex, '');

    // Stop if removing punctuation makes it invalid
    if (!cleanedUrl || cleanedUrl.length < 10) {
      cleanedUrl = previousUrl;
      break;
    }
  }

  return cleanedUrl;
}


function parseUrlList(content: string): ParsedLink[] {
  const lines = content.split('\n').filter(line => line.trim());
  const links: ParsedLink[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (trimmedLine.includes(' | ')) {
      // Format: "Title | URL"
      const [title, url] = trimmedLine.split(' | ').map(s => s.trim());
      if (isValidUrl(url)) {
        links.push({
          title,
          url,
          isValid: false,
          source: 'URL List',
          lineNumber: index + 1,
        });
      }
    } else if (isValidUrl(trimmedLine)) {
      // Plain URL
      links.push({
        title: extractTitleFromUrl(trimmedLine),
        url: trimmedLine,
        isValid: false,
        source: 'URL List',
        lineNumber: index + 1,
      });
    }
  });

  return links;
}

function parseGenericText(content: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const urlRegex = /https?:\/\/[^\s<>"]+/g;
  let match;
  let lineNumber = 1;

  const lines = content.split('\n');

  for (const line of lines) {
    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(line)) !== null) {
      let url = cleanUrlFromTrailingPunctuation(match[0]);

      if (isValidUrl(url)) {
        // Try to extract title from surrounding text
        const beforeUrl = line.substring(0, match.index).trim();
        const titleMatch = beforeUrl.match(/([^.\n]+)[\s]*$/);
        let title = titleMatch ? titleMatch[1].trim() : extractTitleFromUrl(url);

        // Clean title from common prefixes
        title = title.replace(/^[-•*]\s*/, '').trim();

        links.push({
          title,
          url: url.trim(),
          isValid: false,
          source: 'Generic Text',
          lineNumber,
        });
      }
    }
    lineNumber++;
  }

  return links;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const pathname = urlObj.pathname.replace(/\/$/, '');

    if (pathname && pathname !== '/') {
      const pathParts = pathname.split('/').filter(p => p);
      const lastPart = pathParts[pathParts.length - 1];
      return lastPart.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return hostname.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  } catch {
    return url;
  }
}
