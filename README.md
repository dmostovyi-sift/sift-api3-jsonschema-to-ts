## jyst · Java YAML Schema → TypeScript

Converts Sift API3 JSONSchema YAML files (with Java `javaType` metadata) into TypeScript interface definitions.

---

### Installation

```bash
npm install -g jyst
```

Or run without installing:

```bash
npx jyst -i <input> -o <output>
```

---

### CLI Usage

```
jyst · Java YAML Schema → TypeScript

Usage: jyst -i <inputDir> -o <outputDir>

Options:
  -i, --input   Input directory containing YAML schema files
  -o, --output  Output directory for TypeScript files
  -v, --version Print version
  -h, --help    Show this help message
```

#### Basic example

```bash
jyst -i ./schemas -o ./src/types
```

#### Sift API3 schemas → console types

```bash
jyst \
  -i ~/sift/code/java/sift-json/src/main/json \
  -o ~/sift/console/src/schema
```

---

### Bash script examples

#### Watch mode (re-compile on change)

```bash
#!/usr/bin/env bash
INPUT=~/sift/code/java/sift-json/src/main/json
OUTPUT=~/sift/console/src/schema

echo "Watching $INPUT for changes..."
fswatch -o "$INPUT" | while read; do
  jyst -i "$INPUT" -o "$OUTPUT"
done
```

#### CI pipeline step

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=src/main/json
OUTPUT=generated/types

echo "Generating TypeScript types..."
jyst -i "$INPUT" -o "$OUTPUT"

echo "Checking for uncommitted changes..."
if ! git diff --quiet "$OUTPUT"; then
  echo "ERROR: Generated types are out of date. Run 'jyst -i $INPUT -o $OUTPUT' and commit the result."
  exit 1
fi

echo "Types are up to date."
```

#### Generate and copy to multiple targets

```bash
#!/usr/bin/env bash
set -euo pipefail

INPUT=~/sift/code/java/sift-json/src/main/json
TARGETS=(
  ~/sift/console/src/schema
  ~/sift/admin/src/schema
)

TMPOUT=$(mktemp -d)
trap "rm -rf $TMPOUT" EXIT

jyst -i "$INPUT" -o "$TMPOUT"

for TARGET in "${TARGETS[@]}"; do
  mkdir -p "$TARGET"
  cp -r "$TMPOUT/." "$TARGET/"
  echo "  → $TARGET"
done
```

---

### How it works

1. Copy source YAMLs to a temp directory
2. Parse each YAML into a schema object, extracting `javaType` metadata
3. Build a cross-file reference map (`javaType` → file path)
4. Transform schemas:
   - Set `title` from `javaType`
   - Build `required` arrays from property metadata
   - Fix `$ref` paths to point to temp JSON files
   - Resolve circular and self-references using `tsType` annotations
   - Strip Java-only fields (`readonly`, `scope`, etc.)
   - Convert remaining `javaType` values to proper JSON Schema types
5. Save intermediate JSON to a temp directory
6. Compile each JSON schema to TypeScript via `json-schema-to-typescript`
7. Rewrite generic interface signatures (e.g. `MyClass` → `MyClass<T = unknown>`)
8. Resolve and emit relative `import type` statements for cross-file references
9. Write `.ts` files to the output directory

### Supported Java type mappings

| Java type | TypeScript |
|---|---|
| `String`, `UUID` | `string` |
| `Integer`, `Long`, `Double`, `Float` | `number` |
| `Boolean` | `boolean` |
| `List<T>` | `T[]` |
| `Map<K, V>` | `{ [k: string]: V }` |
| Custom class | Interface reference |
| Generic class `Foo<T>` | `Foo<T = unknown>` |

---

### Project status

- [x] CLI tool
- [x] Java type → TypeScript type mapping
- [x] Generic type support
- [x] Cross-file `import type` resolution
- [x] Required fields handling
- [x] Circular / self-reference handling
- [x] Subdirectory schema support
- [x] E2E golden-file tests
- [ ] Comprehensive unit test coverage
- [ ] npm publish / installation docs
