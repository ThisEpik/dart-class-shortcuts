// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in package.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = exports.deactivate = void 0;
const vscode_1 = require("vscode");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // Register command for generating methods
  let disposable = vscode_1.commands.registerCommand(
    "dart-method-generator.generateMethods",
    () => {
      generateDartMethods();
    },
  );
  context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;
function generateDartMethods() {
  const editor = vscode_1.window.activeTextEditor;
  if (!editor) {
    vscode_1.window.showErrorMessage("No active editor");
    return;
  }
  const document = editor.document;
  const selection = editor.selection;
  // Get the text of the selected class or current line
  let selectedText = document.getText(selection);
  // If nothing is selected, try to get the current line
  if (!selectedText) {
    const currentLine = document.lineAt(selection.active.line);
    selectedText = currentLine.text;
  }
  // Simple check if we're in a class definition
  if (selectedText.includes("class ") && selectedText.includes("{")) {
    // Show quick pick menu for method generation options
    vscode_1.window
      .showQuickPick([
        {
          label: "Generate All Methods",
          description:
            "Generate constructor, copyWith, toJson, fromJson, == and hashCode",
        },
        {
          label: "Generate Constructor",
          description: "Generate constructor with parameters",
        },
        { label: "Generate copyWith", description: "Generate copyWith method" },
        {
          label: "Generate Serialization",
          description: "Generate toJson and fromJson methods",
        },
        {
          label: "Generate Equality",
          description: "Generate == operator and hashCode",
        },
      ])
      .then((choice) => {
        if (choice) {
          const generatedCode = generateMethodsForClass(
            selectedText,
            choice.label,
          );
          if (generatedCode) {
            editor.edit((editBuilder) => {
              editBuilder.replace(selection, generatedCode);
            });
          }
        }
      });
  } else {
    vscode_1.window.showErrorMessage(
      "Please select a Dart class definition to generate methods for",
    );
  }
}
function generateMethodsForClass(classText, methodType) {
  const lines = classText.split("\n");
  let className = "";
  let fields = [];
  // Extract class name
  for (const line of lines) {
    const match = line.match(/class\s+(\w+)/);
    if (match) {
      className = match[1];
      break;
    }
  }
  if (!className) {
    return "";
  }
  // Extract fields from class definition
  let inClass = false;
  for (const line of lines) {
    if (line.includes("class ")) {
      inClass = true;
      continue;
    }
    if (inClass && line.includes("{")) {
      continue; // Skip opening brace
    }
    if (inClass && line.includes("}")) {
      break; // End of class
    }
    if (inClass) {
      // Look for field declarations
      const fieldMatch = line.match(/(final|var|static)\s+(\w+)\s+(\w+);/);
      if (fieldMatch) {
        fields.push(fieldMatch[3]); // Field name
      }
    }
  }
  // If "Generate All Methods" selected, generate everything
  if (methodType === "Generate All Methods") {
    return generateAllMethods(classText, className, fields);
  }
  // Generate individual methods based on selection
  switch (methodType) {
    case "Generate Constructor":
      return generateConstructor(classText, className, fields);
    case "Generate copyWith":
      return generateCopyWith(classText, className, fields);
    case "Generate Serialization":
      return generateSerialization(classText, className, fields);
    case "Generate Equality":
      return generateEquality(classText, className, fields);
    default:
      return "";
  }
}
function generateAllMethods(classText, className, fields) {
  const constructor = generateConstructor(classText, className, fields);
  const copyWith = generateCopyWith(classText, className, fields);
  const serialization = generateSerialization(classText, className, fields);
  const equality = generateEquality(classText, className, fields);
  // Combine all methods with proper spacing
  return (
    classText +
    "\n\n" +
    constructor +
    "\n\n" +
    copyWith +
    "\n\n" +
    serialization +
    "\n\n" +
    equality
  );
}
function generateConstructor(classText, className, fields) {
  if (fields.length === 0) {
    return `  ${className}();`;
  }
  const fieldParams = fields.map((field) => `    this.${field},`).join("\n");
  return `  ${className}({
${fieldParams}
  });`;
}
function generateCopyWith(classText, className, fields) {
  if (fields.length === 0) {
    return `  ${className} copyWith() {
    return ${className}();
  }`;
  }
  const fieldParams = fields
    .map((field) => `    ${field}: ${field} ?? this.${field},`)
    .join("\n");
  const fieldReturns = fields.map((field) => `      ${field},`).join("\n");
  return `  ${className} copyWith({
${fieldParams}
  }) {
    return ${className}(
${fieldReturns}
    );
  }`;
}
function generateSerialization(classText, className, fields) {
  if (fields.length === 0) {
    return `  Map<String, dynamic> toJson() {
    return <String, dynamic>{};
  }
  
  static ${className} fromJson(Map<String, dynamic> json) {
    return ${className}();
  }`;
  }
  const jsonFields = fields
    .map((field) => `      '${field}': ${field},`)
    .join("\n");
  const fromJsonFields = fields
    .map((field) => `      ${field}: json['${field}'],`)
    .join("\n");
  return `  Map<String, dynamic> toJson() {
    return <String, dynamic>{
${jsonFields}
    };
  }
  
  static ${className} fromJson(Map<String, dynamic> json) {
    return ${className}(
${fromJsonFields}
    );
  }`;
}
function generateEquality(classText, className, fields) {
  if (fields.length === 0) {
    return `  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is ${className};
  }
  
  @override
  int get hashCode {
    return Object.hashAll([]);
  }`;
  }
  const fieldChecks = fields
    .map((field) => `        ${field} == other.${field},`)
    .join("\n        && ");
  const hashFields = fields.join(",\n    ");
  return `  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is ${className} &&
${fieldChecks};
  }
  
  @override
  int get hashCode {
    return Object.hashAll([
${hashFields}
    ]);
  }`;
}
