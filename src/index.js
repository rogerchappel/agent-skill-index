import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SECTION_ALIASES = {
  description: ["description", "overview", "purpose"],
  whenToUse: ["when to use", "triggers", "use when", "when"],
  requiredTools: ["required tools", "tools", "requirements"],
  inputs: ["inputs", "required inputs"],
  sideEffects: ["side-effect boundaries", "side effects", "side effects and safety"],
  approvals: ["approval requirements", "approvals", "approval"],
  examples: ["examples", "example"],
  validation: ["validation workflow", "verification", "validation"]
};

const REQUIRED_FIELDS = [
  ["description", "Missing description"],
  ["whenToUse", "Missing when-to-use guidance"],
  ["requiredTools", "Missing required tools"],
  ["sideEffects", "Missing side-effect boundaries"],
  ["approvals", "Missing approval requirements"],
  ["examples", "Missing examples"],
  ["validation", "Missing validation workflow"]
];

export async function buildSkillIndex(root, options = {}) {
  const absoluteRoot = path.resolve(root);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(absoluteRoot, entry.name, "SKILL.md");
    const source = await readOptional(skillPath);
    if (!source) continue;
    skills.push(parseSkillMarkdown(source, {
      directory: entry.name,
      sourcePath: path.relative(process.cwd(), skillPath)
    }));
  }

  skills.sort((left, right) => left.name.localeCompare(right.name));

  return {
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    root: absoluteRoot,
    skillCount: skills.length,
    warningCount: skills.reduce((count, skill) => count + skill.warnings.length, 0),
    skills
  };
}

export function parseSkillMarkdown(markdown, context = {}) {
  const sections = splitSections(markdown);
  const title = firstHeading(markdown) ?? context.directory ?? "unknown-skill";
  const metadata = {
    name: normalizeTitle(title),
    slug: slugify(context.directory ?? title),
    sourcePath: context.sourcePath ?? null,
    description: firstContent(sections.description) ?? firstParagraphAfterTitle(markdown),
    whenToUse: normalizeBlock(sections.whenToUse),
    requiredTools: listItems(sections.requiredTools),
    inputs: listItems(sections.inputs),
    sideEffects: normalizeBlock(sections.sideEffects),
    approvals: normalizeBlock(sections.approvals),
    examples: codeBlocks(sections.examples),
    validation: normalizeBlock(sections.validation)
  };

  const warnings = REQUIRED_FIELDS
    .filter(([field]) => isEmpty(metadata[field]))
    .map(([, message]) => message);

  return {
    ...metadata,
    safetyLevel: inferSafetyLevel(metadata),
    warnings
  };
}

export function renderMarkdownCatalog(index) {
  const lines = [
    "# Agent Skill Catalog",
    "",
    `Generated: ${index.generatedAt}`,
    `Skills: ${index.skillCount}`,
    `Warnings: ${index.warningCount}`,
    ""
  ];

  for (const skill of index.skills) {
    lines.push(`## ${skill.name}`, "");
    if (skill.description) lines.push(skill.description, "");
    lines.push(`- Slug: ${skill.slug}`);
    lines.push(`- Safety: ${skill.safetyLevel}`);
    lines.push(`- Source: ${skill.sourcePath}`);
    lines.push(`- Required tools: ${skill.requiredTools.length ? skill.requiredTools.join(", ") : "Not specified"}`);
    lines.push(`- Warnings: ${skill.warnings.length ? skill.warnings.join("; ") : "None"}`);
    if (skill.whenToUse) lines.push("", "### When To Use", "", skill.whenToUse);
    if (skill.sideEffects) lines.push("", "### Side Effects", "", skill.sideEffects);
    if (skill.approvals) lines.push("", "### Approvals", "", skill.approvals);
    if (skill.validation) lines.push("", "### Validation", "", skill.validation);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function splitSections(markdown) {
  const sections = {};
  const headingPattern = /^#{2,3}\s+(.+)$/gm;
  const matches = [...markdown.matchAll(headingPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const title = match[1].trim();
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const key = sectionKey(title);
    if (key) sections[key] = markdown.slice(start, end).trim();
  }

  return sections;
}

function sectionKey(title) {
  const normalized = title.toLowerCase().replace(/[:#]/g, "").trim();
  return Object.entries(SECTION_ALIASES)
    .find(([, aliases]) => aliases.includes(normalized))?.[0];
}

function firstHeading(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function firstParagraphAfterTitle(markdown) {
  return markdown
    .replace(/^#\s+.+$/m, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith("#") && !block.startsWith("```"));
}

function normalizeTitle(title) {
  return title.replace(/^Skill:\s*/i, "").trim();
}

function normalizeBlock(block) {
  return block?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
}

function firstContent(block) {
  return normalizeBlock(block).split(/\n{2,}/)[0]?.trim() ?? "";
}

function listItems(block = "") {
  return [...block.matchAll(/^\s*[-*]\s+(.+)$/gm)]
    .map((match) => match[1].replace(/`/g, "").trim())
    .filter(Boolean);
}

function codeBlocks(block = "") {
  return [...block.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function inferSafetyLevel(skill) {
  const haystack = `${skill.sideEffects} ${skill.approvals} ${skill.requiredTools.join(" ")}`.toLowerCase();
  if (/(credentials?|secrets?|external writes?|send|delete|publish|payment|production)/.test(haystack)) return "high";
  if (/(network|write|commit|filesystem|browser|api)/.test(haystack)) return "medium";
  return "low";
}

function isEmpty(value) {
  return Array.isArray(value) ? value.length === 0 : !value;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}
