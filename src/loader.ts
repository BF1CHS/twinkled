import { readFileSync } from "fs";
import * as BabelTypes from "@babel/types";
import * as parser from "@babel/parser";

type JSLoaderStatementMode = "statement";
type JSLoaderExpressionMode = "expression";
type JSLoaderMode = JSLoaderStatementMode | JSLoaderExpressionMode;
export type JSLoaderOptions = {
    path: string;
    mode: JSLoaderMode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any>;
};

type JSLoaderLoadedObjectType<T extends JSLoaderMode> = {
    statement: BabelTypes.Statement[];
    expression: BabelTypes.Expression;
}[T];

/**
 * Class for loading JS code with custom preprocessing commands.
 *
 * Support following preprocessing commands:
 *
 * - `#prop <propName>`: Replace `{{<propName>}}` with the corresponding value in `this.options.props`.
 * - `#const <constName> <value>`: Replace `{{<constName>}}` with the literal `value`.
 * - `#comment <commentName>`: Preprocessing-time comment.
 *
 * Prepocessing commands must be placed at the beginning of the line with `#` prefix.
 */
export default class JSLoader {
    private code: string;
    private options: JSLoaderOptions;

    constructor(options: JSLoaderOptions) {
        this.options = options;
        this.code = readFileSync(options.path, "utf8");

        const codeLines = this.code.split("\n");
        const preprocessingCommandsPredicate = (line: string) =>
            line.startsWith("#");
        const preprocessingCommands = codeLines.filter(
            preprocessingCommandsPredicate
        );
        this.code = codeLines
            .filter((line) => !preprocessingCommandsPredicate(line))
            .join("\n");
        for (const command of preprocessingCommands) {
            const commandArgs = command.trim().slice(1).split(" ");
            this.executeCommand(commandArgs);
        }

        if (options.mode === "expression") {
            this.code = "!" + this.code + ";";
        }
    }

    private executeCommand(args: string[]): void {
        switch (args[0]) {
            case "prop": {
                if (!this.options.props) {
                    throw new Error(
                        "No props provided for preprocessing command 'prop'."
                    );
                }
                const propValue = this.options.props[args[1]];
                if (!propValue) {
                    throw new Error(`No value found for prop '${args[1]}'.`);
                }
                this.code = this.code.replace(`{{${args[1]}}}`, propValue);
                break;
            }
            case "const": {
                this.code = this.code.replace(
                    `{{${args[1]}}}`,
                    args.slice(2).join(" ")
                );
                break;
            }
            case "comment": {
                this.code = this.code.replace(`{{${args[1]}}}`, "");
                break;
            }
            default:
                throw new Error(`Unknown preprocessing command: ${args[0]}`);
        }
    }

    /**
     * Load the JS code as babel AST.
     * @returns Loaded AST.
     */
    public load(): JSLoaderLoadedObjectType<typeof this.options.mode> {
        const programBody = parser.parse(this.code).program.body;
        if (this.options.mode === "statement") {
            return programBody as BabelTypes.Statement[];
        } else {
            const unaryDummy = (
                programBody[0] as BabelTypes.ExpressionStatement
            ).expression as BabelTypes.UnaryExpression;
            return unaryDummy.argument;
        }
    }
}
