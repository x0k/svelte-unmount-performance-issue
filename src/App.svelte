<script lang="ts">
  import {
    createForm,
    setFormContext2,
    FORM_CONTEXT,
    type Config,
    type FormMerger,
  } from "./form";
  import * as components from "./components/exports";
  import * as fields from "./fields/exports";
  import * as templates from "./templates/exports";
  import * as widgets from "./widgets/exports";
  import { array } from "./lib/array";
  import { identity, noop } from "./lib/function";

  const themeComponents = {
    ...components,
    ...fields,
    ...templates,
    ...widgets,
  };

  let schema = $state.raw({
    type: "object",
    properties: {
      foo: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
  });

  const resolver = ({ schema }: Config) =>
    schema.type === "array" ? "arrayField" : `${schema.type ?? "null"}Field`;

  const validator = {
    isValid: () => true,
  };

  const merger: FormMerger = {
    mergeAllOf: identity,
    mergeSchemas: identity,
    mergeFormDataAndSchemaDefaults: identity,
  };

  const theme = (type) => themeComponents[type];

  const form = createForm({
    get schema() {
      return schema;
    },
    resolver: () => resolver,
    theme,
    initialValue: { foo: array(400, () => crypto.randomUUID()) },
    translation: identity,
    createValidator: () => validator,
    createMerger: () => merger,
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
