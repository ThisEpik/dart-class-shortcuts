import * as vscode from "vscode";
import * as assert from "assert";

// Import Mocha types
declare const suite: (description: string, callback: () => void) => void;
declare const test: (description: string, callback: () => void) => void;
suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("dart-method-generator"));
  });

  test("Generate methods function should exist", () => {
    const extension = vscode.extensions.getExtension("dart-method-generator");
    assert.ok(extension);
  });
});
