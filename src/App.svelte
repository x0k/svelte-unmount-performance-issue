<script lang="ts">
  import {
    createForm,
    setFormContext2,
    FORM_CONTEXT,
    type Config,
  } from "./form";
  import * as components from "./components/exports";
  import * as fields from "./fields/exports";
  import * as templates from "./templates/exports";
  import * as widgets from "./widgets/exports";
  import { identity, noop } from "./lib/function";
  import { bigSchema, initialValue } from "./schema";
  import { getSimpleSchemaType, isFixedItems } from "./core";
  import { createFormMerger } from "./mergers/modern";

  const themeComponents = {
    ...components,
    ...fields,
    ...templates,
    ...widgets,
  };

  let schema = $state.raw(bigSchema);

  const resolver = ({ schema }: Config) => {
    if (schema.oneOf !== undefined) {
      return "oneOfField";
    }
    if (schema.anyOf !== undefined) {
      return "anyOfField";
    }
    const type = getSimpleSchemaType(schema);
    if (type === "array") {
      return isFixedItems(schema) ? "tupleField" : "arrayField";
    }
    return `${type}Field`;
  };

  const validator = {
    isValid: () => true,
  };

  const theme = (type) => themeComponents[type];

  const form = createForm({
    get schema() {
      return schema;
    },
    initialValue,
    resolver: () => resolver,
    theme,
    translation: identity,
    createValidator: () => validator,
    createMerger: createFormMerger,
  });
  setFormContext2(form);
  const ctx = form[FORM_CONTEXT];

  const config = $derived({
    id: ctx.rootId,
    title: "",
    schema: ctx.schema,
    uiSchema: ctx.uiSchema,
    required: false,
  });

  const Field = $derived(theme(resolver(config)));
</script>

<button
  onclick={() => {
    schema = {};
  }}
>
  Unmount
</button>

<Field
  type="field"
  bind:value={ctx.value}
  {config}
  uiOption={noop}
  translate={identity}
/>
