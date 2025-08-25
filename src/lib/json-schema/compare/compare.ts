import type {
  JSONSchema7Type as SchemaValue,
  JSONSchema7TypeName as SchemaType,
  JSONSchema7Definition,
  JSONSchema7,
  JSONSchema7Object,
} from "json-schema";

import type { Comparator } from "@/lib/ord.js";
import { isAllowAnySchema, isSchemaObject } from "@/lib/json-schema/index.js";
import { createDeduplicator, isArrayEmpty } from "@/lib/array.js";
import { isRecordEmpty } from "@/lib/object.js";
import { weakMemoize } from "@/lib/memoize.js";

const zero = () => 0;
const isUndefined = <T>(v: T | undefined): v is undefined => v === undefined;

type SchemaPrimitiveTypeExceptNullType = Extract<
  SchemaType,
  "string" | "number" | "boolean"
>;
type SchemaPrimitiveTypeExceptNull = string | number | boolean;

const isSchemaPrimitiveExceptNull = (
  value: Exclude<SchemaValue, null>
): value is SchemaPrimitiveTypeExceptNull => typeof value !== "object";

const PRIMITIVE_TYPE_ORDER: Record<
  SchemaPrimitiveTypeExceptNullType,
  0 | 1 | 2
> = {
  boolean: 0,
  number: 1,
  string: 2,
};

function compareSameTypeSchemaPrimitives<
  T extends SchemaPrimitiveTypeExceptNull,
>(a: T, b: T) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareSchemaPrimitive(
  a: SchemaPrimitiveTypeExceptNull,
  b: SchemaPrimitiveTypeExceptNull
) {
  const ta = typeof a as SchemaPrimitiveTypeExceptNullType;
  const tb = typeof b as SchemaPrimitiveTypeExceptNullType;
  return ta === tb
    ? compareSameTypeSchemaPrimitives(a, b)
    : PRIMITIVE_TYPE_ORDER[ta] - PRIMITIVE_TYPE_ORDER[tb];
}

function createArrayComparator<T>(compare: (a: T, b: T) => number) {
  return (a: T[], b: T[]) => {
    const d = a.length - b.length;
    if (d !== 0) {
      return d;
    }
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        const d = compare(a[i]!, b[i]!);
        if (d !== 0) {
          return d;
        }
      }
    }
    return 0;
  };
}

function insertUniqueValues<K>(mutableTarget: K[], mutableSource: K[]): K[] {
  const tl = mutableTarget.length;
  if (tl === 0) return mutableSource;
  let sl = mutableSource.length;
  if (sl === 0) return mutableTarget;
  if (sl > tl) {
    const t = mutableTarget;
    mutableTarget = mutableSource;
    mutableSource = t;
  }
  const seen = new Set(mutableTarget);
  const l = mutableSource.length;
  for (let i = 0; i < l; i++) {
    const key = mutableSource[i]!;
    if (!seen.has(key)) {
      mutableTarget.push(key);
    }
  }
  return mutableTarget;
}

function createCmpMatcher<T, E extends T>(
  isEmpty: (v: T) => v is E,
  compare: Comparator<Exclude<T, E>>,
  compareEmpty: Comparator<E> = zero
) {
  return (a: T, b: T) => {
    if (isEmpty(a)) {
      if (isEmpty(b)) {
        return compareEmpty(a, b);
      }
      return -1;
    }
    if (isEmpty(b)) {
      return 1;
    }
    return compare(a as Exclude<T, E>, b as Exclude<T, E>);
  };
}

function createOptionalComparator<T>(compare: Comparator<T>) {
  return createCmpMatcher<T | undefined, undefined>(isUndefined, compare);
}

function createNarrowingOptionalComparator<T, E extends T>(
  isEmpty: (v: T) => v is E,
  compare: Comparator<Exclude<T, E | undefined>>
) {
  return createCmpMatcher<T | undefined, E | undefined>(
    (v: T | undefined): v is undefined | E => v === undefined || isEmpty(v),
    compare
  );
}

function createArrayOrItemComparator<T, T1>(
  compare: Comparator<T>,
  compareArray: Comparator<T1[]>
) {
  return createCmpMatcher<T | T1[], T1[]>(Array.isArray, compare, compareArray);
}

const compareOptionalSameTypeSchemaPrimitives = createOptionalComparator(
  compareSameTypeSchemaPrimitives
);

const compareNumbersWithZeroDefault = createNarrowingOptionalComparator(
  (v: number): v is 0 => v === 0,
  (a, b) => a - b
);

export interface ComparatorOptions {
  deduplicationCache?: WeakMap<any[], any[]>;
  sortedKeysCache?: WeakMap<Record<string, any>, string[]>;
}

export function createComparator({
  deduplicationCache = new WeakMap(),
  sortedKeysCache = new WeakMap(),
}: ComparatorOptions = {}) {
  const getSortedKeys = weakMemoize(sortedKeysCache, (obj) =>
    Object.keys(obj).sort()
  );

  function createRecordsComparator<R extends Record<string, any>>(
    compare: <K extends keyof R>(a: R[K], b: R[K]) => number
  ) {
    return (a: R, b: R) => {
      const aKeys = getSortedKeys(a);
      const bKeys = getSortedKeys(b);
      const l = Math.min(aKeys.length, bKeys.length);
      for (let i = 0; i < l; i++) {
        const cmp = compareSameTypeSchemaPrimitives(aKeys[i]!, bKeys[i]!);
        if (cmp !== 0) {
          return cmp;
        }
      }
      if (aKeys.length !== bKeys.length) {
        return aKeys.length - bKeys.length;
      }
      for (let i = 0; i < l; i++) {
        const key = aKeys[i]!;
        const cmp = compare(a[key]!, b[key]!);
        if (cmp !== 0) {
          return cmp;
        }
      }
      return 0;
    };
  }

  function createArrayComparatorWithDeduplication<T>(compare: Comparator<T>) {
    const cmp = createArrayComparator(compare);
    const deduplicate = weakMemoize(
      deduplicationCache as WeakMap<T[], T[]>,
      // NOTE: Always sort output
      createDeduplicator(compare, { threshold: 0 })
    );
    return (a: T[], b: T[]) => cmp(deduplicate(a), deduplicate(b));
  }

  const compareArrayOfSameTypePrimitivesWithDeduplication =
    createArrayComparatorWithDeduplication(compareSameTypeSchemaPrimitives);

  function compareSchemaDefinitions(
    a: JSONSchema7Definition,
    b: JSONSchema7Definition
  ) {
    if (isSchemaObject(a)) {
      if (isSchemaObject(b)) {
        const aKeys = Object.keys(a) as (keyof JSONSchema7)[];
        const bKeys = Object.keys(b) as (keyof JSONSchema7)[];
        const allKeys = insertUniqueValues(aKeys, bKeys);
        const l = allKeys.length;
        for (let i = 0; i < l; i++) {
          const key = allKeys[i]!;
          if (a[key] === b[key]) {
            continue;
          }
          const cmp = COMPARATORS[key] ?? compareOptionalSchemaValues;
          // @ts-expect-error
          const d = cmp(a[key], b[key]);
          if (d !== 0) {
            return d;
          }
        }
        return 0;
      }
      return b === true && isRecordEmpty(a) ? 0 : 1;
    }
    if (isSchemaObject(b)) {
      return a === true && isRecordEmpty(b) ? 0 : -1;
    }
    return compareSameTypeSchemaPrimitives(a, b);
  }

  const compareOptionalSchemaValues =
    createOptionalComparator(compareSchemaValues);

  const compareNonNullSchemaValue = createCmpMatcher(
    isSchemaPrimitiveExceptNull,
    createArrayOrItemComparator(
      createRecordsComparator<JSONSchema7Object>(compareOptionalSchemaValues),
      createArrayComparator(compareSchemaValues)
    ),
    compareSchemaPrimitive
  );

  function compareSchemaValues(a: SchemaValue, b: SchemaValue): number {
    if (a === null) {
      return -1;
    }
    if (b === null) {
      return 1;
    }
    return compareNonNullSchemaValue(a, b);
  }

  const compareOptionalSchemaDefinitions = createOptionalComparator(
    compareSchemaDefinitions
  );

  const compareRecordOfOptionalSchemasWithEmptyRecordDefault =
    createNarrowingOptionalComparator(
      isRecordEmpty,
      createRecordsComparator<Record<string, JSONSchema7Definition>>(
        compareOptionalSchemaDefinitions
      )
    );

  const compareOptionalArrayOfSchemasWithDeduplication =
    createOptionalComparator(
      createArrayComparatorWithDeduplication(compareSchemaDefinitions)
    );

  const compareSchemaDefinitionsWithEmptyDefinitionDefault =
    createNarrowingOptionalComparator(
      isAllowAnySchema,
      compareSchemaDefinitions
    );

  const COMPARATORS: {
    [K in keyof JSONSchema7]-?: Comparator<JSONSchema7[K]>;
  } = {
    $id: compareOptionalSameTypeSchemaPrimitives,
    $comment: compareOptionalSameTypeSchemaPrimitives,
    $defs: compareRecordOfOptionalSchemasWithEmptyRecordDefault,
    $ref: compareOptionalSameTypeSchemaPrimitives,
    $schema: compareOptionalSameTypeSchemaPrimitives,
    const: compareOptionalSchemaValues,
    contains: compareOptionalSchemaDefinitions,
    contentEncoding: compareOptionalSameTypeSchemaPrimitives,
    contentMediaType: compareOptionalSameTypeSchemaPrimitives,
    default: compareOptionalSchemaValues,
    definitions: compareRecordOfOptionalSchemasWithEmptyRecordDefault,
    description: compareOptionalSameTypeSchemaPrimitives,
    else: compareOptionalSchemaDefinitions,
    examples: compareOptionalSchemaValues,
    exclusiveMaximum: compareOptionalSameTypeSchemaPrimitives,
    exclusiveMinimum: compareOptionalSameTypeSchemaPrimitives,
    format: compareOptionalSameTypeSchemaPrimitives,
    if: compareOptionalSchemaDefinitions,
    maximum: compareOptionalSameTypeSchemaPrimitives,
    maxItems: compareOptionalSameTypeSchemaPrimitives,
    maxLength: compareOptionalSameTypeSchemaPrimitives,
    maxProperties: compareOptionalSameTypeSchemaPrimitives,
    minimum: compareOptionalSameTypeSchemaPrimitives,
    multipleOf: compareOptionalSameTypeSchemaPrimitives,
    not: compareOptionalSchemaDefinitions,
    pattern: compareOptionalSameTypeSchemaPrimitives,
    propertyNames: compareOptionalSchemaDefinitions,
    readOnly: compareOptionalSameTypeSchemaPrimitives,
    then: compareOptionalSchemaDefinitions,
    title: compareOptionalSameTypeSchemaPrimitives,
    writeOnly: compareOptionalSameTypeSchemaPrimitives,
    uniqueItems: createNarrowingOptionalComparator(
      (v): v is false => v === false,
      zero
    ),
    minLength: compareNumbersWithZeroDefault,
    minItems: compareNumbersWithZeroDefault,
    minProperties: compareNumbersWithZeroDefault,
    required: createNarrowingOptionalComparator(
      isArrayEmpty,
      compareArrayOfSameTypePrimitivesWithDeduplication
    ),
    enum: createNarrowingOptionalComparator(
      isArrayEmpty,
      createArrayComparatorWithDeduplication(compareSchemaValues)
    ),
    type: createOptionalComparator((a, b) => {
      const isAArr = Array.isArray(a);
      const isBArr = Array.isArray(b);
      if (!isAArr && !isBArr) {
        return compareSameTypeSchemaPrimitives(a, b);
      }
      return compareArrayOfSameTypePrimitivesWithDeduplication(
        isAArr ? a : [a],
        isBArr ? b : [b]
      );
    }),
    items: createNarrowingOptionalComparator(
      (v): v is true | JSONSchema7 => !Array.isArray(v) && isAllowAnySchema(v),
      createArrayOrItemComparator(
        compareSchemaDefinitions,
        createArrayComparator(compareSchemaDefinitions)
      )
    ),
    anyOf: compareOptionalArrayOfSchemasWithDeduplication,
    allOf: compareOptionalArrayOfSchemasWithDeduplication,
    oneOf: compareOptionalArrayOfSchemasWithDeduplication,
    properties: compareRecordOfOptionalSchemasWithEmptyRecordDefault,
    patternProperties: compareRecordOfOptionalSchemasWithEmptyRecordDefault,
    additionalProperties: compareSchemaDefinitionsWithEmptyDefinitionDefault,
    additionalItems: compareSchemaDefinitionsWithEmptyDefinitionDefault,
    dependencies: createNarrowingOptionalComparator(
      isRecordEmpty,
      createRecordsComparator(
        createOptionalComparator(
          createArrayOrItemComparator(
            compareSchemaDefinitions,
            compareArrayOfSameTypePrimitivesWithDeduplication
          )
        )
      )
    ),
  };

  return {
    compareSchemaValues,
    compareSchemaDefinitions,
  };
}
