import {
  getSimpleSchemaType,
  isFixedItems,
  type Validator,
} from "@/core/index.js";

import type { FormInternalContext } from "../context/index.js";
import type { ResolveFieldType } from "../fields.js";

export function resolver<V extends Validator>(
  _: FormInternalContext<V>
): ResolveFieldType {
  return ;
}
