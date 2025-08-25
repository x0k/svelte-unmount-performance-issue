// This file was copied and modified from https://github.com/rjsf-team/react-jsonschema-form/blob/f4229bf6e067d31b24de3ef9d3ca754ee52529ac/packages/utils/src/schema/isFilesArray.ts
// Licensed under the Apache License, Version 2.0.
// Modifications made by Roman Krasilnikov.

import type { Merger } from './merger.js';
import { retrieveSchema } from "./resolve.js";
import { DATA_URL_FORMAT, isNormalArrayItems, type Schema } from "./schema.js";
import type { Validator } from "./validator.js";

export function isFileSchema({ type, format }: Schema) {
  return type === "string" && format === DATA_URL_FORMAT;
}

export function isFilesArray(
  validator: Validator,
  merger: Merger,
  schema: Schema,
  rootSchema?: Schema
) {
  const { items } = schema;
  if (isNormalArrayItems(items)) {
    const itemsSchema = retrieveSchema(validator, merger, items, rootSchema);
    return isFileSchema(itemsSchema);
  }
  return false;
}
