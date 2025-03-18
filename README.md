## Sift Schema - JSONSchema to TypeScript Compiler

A tool to compile Sift API3 JSONSchemas to TypeScript type definitions.

### Installation

TODO

### Usage

#### Command Line Interface

TODO

```bash
# Using global installation
sift-schema -i <input-directory> -o <output-directory>

# Using local installation
npx sift-schema -i <input-directory> -o <output-directory>

```

#### Options

- `-i, --input`: Input directory containing JSON Schema YAML files
- `-o, --output`: Output directory for generated TypeScript files

#### Example

```bash
# Convert schemas from a source directory to TypeScript definitions
sift-schema -i ~/sift/code/java/sift-json/src/main/json/ -o ~/sift/console/src/schema/

```

### Generation Process

1. Copy all JSONSchema files to a temporary directory
2. Parse YAML files and get JSON representation
3. Normalize the schemas
   1. Set the schema header in accordance with the Java class specified in the `javaType` field
   2. Correct `$ref` according to the specification 3. Clean the schema from unnecessary fields that may cause errors during type generation
   3. Transform all `javaTypes` in their respective JSONSchema
4. Save the selected objects to a temporary directory
5. Compile the generated files into TypeScript type definitions
6. Save the generated files to the target directory

### Features

- Converts Java types to TypeScript types
- Handles nested references between schemas
- Supports generic types
- Properly handles required fields
- Maintains type relationships across files

### Project Status

- [x] Proper required fields handling
- [x] CLI tool
- [x] Basic tests
- [x] Generic type support
- [ ] Import referenced types, not redeclare them
- [ ] Comprehensive test coverage
      `
