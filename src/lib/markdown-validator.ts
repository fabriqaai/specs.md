/**
 * Template-based markdown validator
 * Validates markdown files against YAML schema definitions
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import type { Root, Heading, Text } from 'mdast';

// Schema types
export interface SectionRequirement {
  heading: string;
  children?: string[];
}

export interface MarkdownSchema {
  name: string;
  description: string;
  file_pattern: string;
  required_sections: SectionRequirement[];
  optional_sections?: SectionRequirement[];
  rules?: {
    min_content_length?: number;
    must_start_with_h1?: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  file?: string;
}

/**
 * Extract all headings from markdown AST
 */
function extractHeadings(tree: Root): { text: string; depth: number }[] {
  const headings: { text: string; depth: number }[] = [];

  visit(tree, 'heading', (node: Heading) => {
    const text = node.children
      .filter((child): child is Text => child.type === 'text')
      .map(child => child.value)
      .join('');
    headings.push({ text, depth: node.depth });
  });

  return headings;
}

/**
 * Normalize heading for comparison
 */
function normalizeHeading(heading: string): string {
  return heading.toLowerCase().replace(/^#+\s*/, '').trim();
}

/**
 * Check if headings contain a section
 */
function hasSection(
  headings: { text: string; depth: number }[],
  sectionPattern: string
): boolean {
  const normalized = normalizeHeading(sectionPattern);
  return headings.some(h => normalizeHeading(h.text).includes(normalized));
}

/**
 * Validate markdown content against a schema
 */
export function validateMarkdown(
  content: string,
  schema: MarkdownSchema,
  fileName?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = fileName ? `${fileName}: ` : '';

  // Parse markdown
  const tree = unified().use(remarkParse).parse(content) as Root;
  const headings = extractHeadings(tree);

  // Check required sections
  for (const req of schema.required_sections) {
    const sectionExists = hasSection(headings, req.heading);

    if (!sectionExists) {
      errors.push(`${prefix}Missing required section "${req.heading}"`);
    } else if (req.children) {
      // Check child sections
      for (const child of req.children) {
        if (!hasSection(headings, child)) {
          errors.push(`${prefix}Missing required subsection "${child}"`);
        }
      }
    }
  }

  // Check optional sections (warnings only)
  if (schema.optional_sections) {
    for (const opt of schema.optional_sections) {
      if (!hasSection(headings, opt.heading)) {
        warnings.push(`${prefix}Missing optional section "${opt.heading}"`);
      }
    }
  }

  // Check rules
  if (schema.rules) {
    if (schema.rules.min_content_length && content.length < schema.rules.min_content_length) {
      errors.push(`${prefix}Content too short (${content.length} < ${schema.rules.min_content_length})`);
    }

    if (schema.rules.must_start_with_h1) {
      const firstHeading = headings[0];
      if (!firstHeading || firstHeading.depth !== 1) {
        errors.push(`${prefix}Must start with H1 heading`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    file: fileName,
  };
}

/**
 * Load a schema from YAML file
 */
export function loadSchema(schemaPath: string): MarkdownSchema {
  const content = fs.readFileSync(schemaPath, 'utf-8');
  return yaml.load(content) as MarkdownSchema;
}

/**
 * Validate a file against a schema
 */
export function validateFile(
  filePath: string,
  schema: MarkdownSchema
): ValidationResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  return validateMarkdown(content, schema, filePath);
}

/**
 * Validate multiple files against a schema
 */
export function validateFiles(
  filePaths: string[],
  schema: MarkdownSchema
): { results: ValidationResult[]; summary: ValidationResult } {
  const results = filePaths.map(fp => validateFile(fp, schema));

  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);

  return {
    results,
    summary: {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    },
  };
}
