import Prism from "prismjs";

// ── Base languages (no dependencies) ──
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-c";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-toml";
import "prismjs/components/prism-ini";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-git";
import "prismjs/components/prism-regex";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-graphql";
import "prismjs/components/prism-lua";
import "prismjs/components/prism-r";
import "prismjs/components/prism-haskell";
import "prismjs/components/prism-clojure";
import "prismjs/components/prism-makefile";
import "prismjs/components/prism-docker";
import "prismjs/components/prism-latex";
import "prismjs/components/prism-vim";

// ── Languages with dependencies ──
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-xml-doc";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-less";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-shell-session";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-php";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-scala";
import "prismjs/components/prism-dart";
import "prismjs/components/prism-perl";
import "prismjs/components/prism-elixir";
import "prismjs/components/prism-nginx";
import "prismjs/components/prism-powershell";

// ── Alias map ──
const ALIASES: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    rb: "ruby",
    rs: "rust",
    cs: "csharp",
    "c++": "cpp",
    "c#": "csharp",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    fish: "bash",
    yml: "yaml",
    dockerfile: "docker",
    html: "markup",
    xml: "markup",
    svg: "markup",
    tex: "latex",
    objc: "c",
    "objective-c": "c",
};

// ── Display labels ──
const LABELS: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    jsx: "JSX",
    tsx: "TSX",
    python: "Python",
    ruby: "Ruby",
    rust: "Rust",
    go: "Go",
    java: "Java",
    csharp: "C#",
    cpp: "C++",
    c: "C",
    php: "PHP",
    swift: "Swift",
    kotlin: "Kotlin",
    scala: "Scala",
    bash: "Bash",
    sql: "SQL",
    graphql: "GraphQL",
    json: "JSON",
    yaml: "YAML",
    toml: "TOML",
    css: "CSS",
    scss: "SCSS",
    less: "Less",
    markup: "HTML",
    docker: "Dockerfile",
    diff: "Diff",
    git: "Git",
    lua: "Lua",
    perl: "Perl",
    r: "R",
    dart: "Dart",
    elixir: "Elixir",
    haskell: "Haskell",
    clojure: "Clojure",
    makefile: "Makefile",
    nginx: "Nginx",
    ini: "INI",
    latex: "LaTeX",
    powershell: "PowerShell",
    markdown: "Markdown",
};

/** Resolve a user-provided language string to a Prism grammar key. */
export function resolveLanguage(lang: string): string {
    const lower = lang.toLowerCase().trim();
    return ALIASES[lower] ?? lower;
}

/** Get a human-readable label for a resolved language key. */
export function getLanguageLabel(lang: string): string {
    return LABELS[lang] ?? lang.toUpperCase();
}

/** Check whether Prism has a grammar loaded for the given key. */
export function hasGrammar(lang: string): boolean {
    return lang in Prism.languages;
}

export { Prism };
