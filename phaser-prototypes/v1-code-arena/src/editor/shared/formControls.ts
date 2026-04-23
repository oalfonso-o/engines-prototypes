import { createElement } from "./dom";

export interface TextFieldController {
  field: HTMLLabelElement;
  label: HTMLSpanElement;
  input: HTMLInputElement;
  sync: (value: string, disabled: boolean) => void;
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldController {
  field: HTMLLabelElement;
  label: HTMLSpanElement;
  select: HTMLSelectElement;
  sync: (options: SelectOption[], value: string, disabled: boolean) => void;
}

export interface CheckboxFieldController {
  field: HTMLLabelElement;
  label: HTMLSpanElement;
  input: HTMLInputElement;
  sync: (checked: boolean, disabled: boolean) => void;
}

interface TextFieldOptions {
  className?: string;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  placeholder?: string;
  type?: string;
}

export function createTextFieldController(labelText: string, options: TextFieldOptions = {}): TextFieldController {
  const field = createElement("label", "form-field") as HTMLLabelElement;
  const label = createElement("span", "form-label", labelText) as HTMLSpanElement;
  const input = createElement("input", options.className ?? "text-input") as HTMLInputElement;
  input.type = options.type ?? "text";
  if (options.placeholder) {
    input.placeholder = options.placeholder;
  }
  if (options.onInput) {
    input.addEventListener("input", () => options.onInput?.(input.value));
  }
  if (options.onChange) {
    input.addEventListener("change", () => options.onChange?.(input.value));
  }
  field.append(label, input);
  return {
    field,
    label,
    input,
    sync(value, disabled) {
      if (input.value !== value) {
        input.value = value;
      }
      input.disabled = disabled;
    },
  };
}

export function createSelectFieldController(
  labelText: string,
  onChange: (value: string) => void,
  className = "text-input",
): SelectFieldController {
  const field = createElement("label", "form-field") as HTMLLabelElement;
  const label = createElement("span", "form-label", labelText) as HTMLSpanElement;
  const select = createElement("select", className) as HTMLSelectElement;
  let optionsSignature = "";

  select.addEventListener("change", () => onChange(select.value));
  field.append(label, select);

  return {
    field,
    label,
    select,
    sync(options, value, disabled) {
      const nextSignature = options.map((option) => `${option.value}:${option.label}`).join("|");
      if (nextSignature !== optionsSignature) {
        select.replaceChildren(...options.map((option) => new Option(option.label, option.value)));
        optionsSignature = nextSignature;
      }
      if (select.value !== value) {
        select.value = value;
      }
      select.disabled = disabled;
    },
  };
}

export function createCheckboxFieldController(
  labelText: string,
  onChange: (checked: boolean) => void,
): CheckboxFieldController {
  const field = createElement("label", "checkbox-field") as HTMLLabelElement;
  const input = createElement("input") as HTMLInputElement;
  const label = createElement("span", "form-label", labelText) as HTMLSpanElement;
  input.type = "checkbox";
  input.addEventListener("change", () => onChange(input.checked));
  field.append(input, label);
  return {
    field,
    label,
    input,
    sync(checked, disabled) {
      input.checked = checked;
      input.disabled = disabled;
    },
  };
}
