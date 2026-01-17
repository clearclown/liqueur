/**
 * E2E テストヘルパー関数
 */

import type { Page } from "@playwright/test";

/**
 * React controlled componentに対してテキストを入力するヘルパー
 * Reactのイベントシステムを正しくトリガーするために、
 * InputEventを使用してinputイベントを発火させる
 */
export async function fillReactInput(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.evaluate(
    ({ selector, value }) => {
      const element = document.querySelector(selector) as
        | HTMLTextAreaElement
        | HTMLInputElement
        | null;

      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }

      // フォーカスを当てる
      element.focus();

      // React 18用: nativeInputValueSetterを使用して値を設定
      const prototype =
        element instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        prototype,
        "value"
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else {
        element.value = value;
      }

      // Reactに通知するためのInputEventを発火
      // React 18では InputEvent が必要
      const inputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        inputType: "insertText",
        data: value,
      });
      element.dispatchEvent(inputEvent);

      // changeイベントも発火（念のため）
      const changeEvent = new Event("change", { bubbles: true });
      element.dispatchEvent(changeEvent);
    },
    { selector, value }
  );
}
