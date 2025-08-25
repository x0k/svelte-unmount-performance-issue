import type { ComponentCommonProps } from "@/fields/exports.js";

export interface ParentTemplateTypes {
  field: {};
  object: {};
  array: {};
}

export type ParentTemplateType = keyof ParentTemplateTypes;

declare module "../form/index.js" {
  interface FoundationalComponents {
    title: {};
    label: {};
    description: {};
    help: {};
    errorsList: {};
  }
  interface ComponentProps {
    title: ComponentCommonProps & {
      type: ParentTemplateType;
      title: string;
    };
    label: ComponentCommonProps & {
      title: string;
    };
    description: ComponentCommonProps & {
      type: ParentTemplateType;
      description: string;
    };
    help: ComponentCommonProps & {
      help: string;
    };
    errorsList: ComponentCommonProps;
  }
  interface ComponentBindings {
    title: "";
    label: "";
    description: "";
    help: "";
    errorsList: "";
  }
}
