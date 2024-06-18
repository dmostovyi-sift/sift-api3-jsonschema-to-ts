## Compile Sift API3 JSONSchemas to TypeScript type defenitions

### Generation steps

1. Copy all JSONSchema files to a temporary directory
2. Parse YAML files and get JSON representation
3. Normalize the schemas
   1. Set the schema header in accordance with the Java class specified in the `javaType` field
   2. Correct `$ref` according to the specification
   3. Clean the schema from unnecessary fields that may cause errors during type generation.
   4. Transform all `javaTypes` in their respective JSONSchema
4. Save the selected objects to a temporary directory
5. Compile the generated files into TypeScript type definitions
6. Save the generated files to the target directory.

### TODO

- [ ] Import referenced types, not redeclare them
- [ ] Create CLI tool
- [ ] Add tests
- [ ] Add generic type support
