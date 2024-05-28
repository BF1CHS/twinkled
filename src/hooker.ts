import * as parser from "@babel/parser";
import * as BabelTypes from "@babel/types";
import JSLoader from "./loader";
import generate from "@babel/generator";
import log from "./logger";

/**
 * Class for storing a manifest.
 */
export class Manifest {
    public bundleVersion: string;
    public bundleJSUrl: string;

    constructor(rawManifest: string) {
        const regex = /BEGIN BUNDLE VERSION ([0-9]+)\s+([^\s]*)\s+END BUNDLE/gm;
        const match = regex.exec(rawManifest);
        if (!match) {
            log.error("Failed to parse manifest.");
            throw new Error("Failed to parse manifest.");
        }
        this.bundleVersion = match[1];
        this.bundleJSUrl = match[2];
    }
}

/**
 * Class for storing a JS bundle.
 */
export class Bundle {
    public version: string;
    public jsCodeHeaderComment: string;
    public jsCode: string;

    constructor(version: string, jsCode: string) {
        this.version = version;
        const headerCommentEnd = jsCode.indexOf("!function");
        this.jsCodeHeaderComment = jsCode.slice(0, headerCommentEnd);
        this.jsCode = jsCode.slice(headerCommentEnd);
    }
}

/**
 * Main class for hooking into JS code.
 */
export class JSHooker {
    private ast: parser.ParseResult<BabelTypes.File>;
    private readonly arrayExpression: BabelTypes.ArrayExpression;

    constructor(code: string) {
        // NOTE: All ast selector targets shall be stored as class properties and fetched in the constructor
        this.ast = parser.parse(code);

        // Find the array expression containing the module functions
        const statement = this.ast.program
            .body[0] as BabelTypes.ExpressionStatement;
        const unaryExpression =
            statement.expression as BabelTypes.UnaryExpression;
        const callExpression =
            unaryExpression.argument as BabelTypes.CallExpression;
        this.arrayExpression = callExpression
            .arguments[0] as BabelTypes.ArrayExpression;
    }

    /**
     * Generate code from the AST and format it using Prettier.
     * @returns Generated code.
     */
    public generateCode(): string {
        log.info("Generating code...");
        return generate(this.ast).code;
    }

    private getModule(moduleIndex: number): BabelTypes.FunctionExpression {
        return this.arrayExpression.elements[
            moduleIndex
        ] as BabelTypes.FunctionExpression;
    }

    // Hooks

    private hookBF1CHSDeclaration(): void {
        log.info("Hooking BF1CHS declaration...");
        const debugDeclaration = new JSLoader({
            path: "src/twinkle/debug/BF1CHS.d.js",
            mode: "statement",
        }).load();
        this.ast.program.body.unshift(
            ...(debugDeclaration as BabelTypes.Statement[])
        );
    }

    /**
     * Hook the debug-related codes into JS code.
     */
    public hookDebug(): void {
        log.info("Hooking debug-related codes...");
        this.hookBF1CHSDeclaration();
    }

    /**
     * Hook the translator function into the module functions array.
     *
     * @returns Index of the translator function in the array.
     */
    private hookTranslator(): number {
        log.info("Hooking translator function...");
        const translatorFunction = new JSLoader({
            path: "src/twinkle/translator.js",
            mode: "expression",
            props: {
                TWINKLE_EXTRA_FILE: "BF1CHS_twinkle_extra.json",
                TWINKLE_EXTRA_EXT_FILE: "BF1CHS_twinkle_extra_ext.json",
            },
        }).load() as BabelTypes.FunctionExpression;
        this.arrayExpression.elements.push(translatorFunction);
        return this.arrayExpression.elements.length - 1;
    }

    /**
     * Hook the React.createElement function into the JS code.
     *
     * The most important part to implement localization.
     */
    private hookReactCreateElement(
        moduleIndex: number,
        translatorIndex: number
    ): void {
        log.info("Hooking React.createElement function...");

        const reactModule = this.getModule(moduleIndex);
        const reactModuleInside = reactModule.body as BabelTypes.BlockStatement;
        const translatorDeclaration = new JSLoader({
            path: "src/twinkle/createElement.d.js",
            mode: "statement",
            props: {
                TRANSLATOR_INDEX: translatorIndex,
            },
        }).load() as BabelTypes.Statement[];
        const translatorStatements = new JSLoader({
            path: "src/twinkle/createElement.js",
            mode: "statement",
        }).load() as BabelTypes.Statement[];

        // Add declaration at the beginning of the module
        reactModuleInside.body.unshift(...translatorDeclaration);

        // Hook the translator statements at the beginning of the createElement function
        const reactCreateElement = reactModuleInside.body.find(
            (statement) =>
                statement.type === "FunctionDeclaration" &&
                statement.id!.name === "R"
        ) as BabelTypes.FunctionDeclaration;
        reactCreateElement.body.body.unshift(...translatorStatements);
    }

    /**
     * Hook the font into the JS code.
     */
    private hookFontConfig(moduleIndex: number, fontName: string): void {
        log.info(`Hooking font config in module ${moduleIndex}...`);
        const fontModule = this.getModule(moduleIndex);
        const fontModuleInside = fontModule.body as BabelTypes.BlockStatement;

        const zhKey = ["zh-tw", "zh-cn", "zh-sg", "zh-hk"];

        const fontConfigDeclaration =
            fontModuleInside.body.pop() as BabelTypes.ExpressionStatement;
        const assignmentExpression =
            fontConfigDeclaration.expression as BabelTypes.AssignmentExpression;
        const objectExpression =
            assignmentExpression.right as BabelTypes.ObjectExpression;
        for (const property of objectExpression.properties as BabelTypes.ObjectProperty[]) {
            const key = property.key as BabelTypes.StringLiteral;
            if (zhKey.includes(key.value)) {
                const value =
                    property.value as BabelTypes.ConditionalExpression;
                const consequent =
                    value.consequent as BabelTypes.MemberExpression;
                const prop = consequent.property as BabelTypes.Identifier;
                prop.name = fontName;
            }
        }
        fontModuleInside.body.push(fontConfigDeclaration);
    }

    /**
     * Hook the font definition into the JS code.
     */
    private hookFontDefinition(
        moduleIndex: number,
        fontConfig: {
            main: {
                name: string;
                url: string;
            };
            secondary: {
                name: string;
                url: string;
            };
        }
    ): void {
        log.info(`Hooking font definition in module ${moduleIndex}...`);
        const fontModule = this.getModule(moduleIndex);
        const fontModuleInside = fontModule.body as BabelTypes.BlockStatement;

        const setFont = (
            index: {
                fontObj: number;
                name: number;
                url: number;
            },
            name: string,
            url: string
        ) => {
            const decl = fontModuleInside.body[
                index.fontObj
            ] as BabelTypes.VariableDeclaration;
            const declInit = decl.declarations[0]
                .init as BabelTypes.CallExpression;
            const declInitFunc =
                declInit.callee as BabelTypes.FunctionExpression;
            const declInitFuncBody =
                declInitFunc.body as BabelTypes.BlockStatement;
            const attrRet = declInitFuncBody
                .body[2] as BabelTypes.ReturnStatement;
            const attrRetArg =
                attrRet.argument as BabelTypes.SequenceExpression;

            const getArgsRet = (index: number) => {
                const attrRetArgExpr = attrRetArg.expressions[
                    index
                ] as BabelTypes.AssignmentExpression;
                const attrRetArgExprRight =
                    attrRetArgExpr.right as BabelTypes.CallExpression;
                const attrRetArgExprRightArgs = attrRetArgExprRight
                    .arguments[0] as BabelTypes.FunctionExpression;
                const attrRetArgExprRightArgsRet = attrRetArgExprRightArgs.body
                    .body[0] as BabelTypes.ReturnStatement;
                return attrRetArgExprRightArgsRet.argument;
            };

            const fontName = getArgsRet(index.name) as BabelTypes.StringLiteral;
            fontName.value = name;

            const fontURLCall = getArgsRet(
                index.url
            ) as BabelTypes.CallExpression;
            const fontURL = fontURLCall
                .arguments[0] as BabelTypes.StringLiteral;
            fontURL.value = url;
        };

        setFont(
            {
                fontObj: 7,
                name: 2,
                url: 3,
            },
            fontConfig.secondary.name,
            fontConfig.secondary.url
        );
        setFont(
            {
                fontObj: 19,
                name: 1,
                url: 2,
            },
            fontConfig.main.name,
            fontConfig.main.url
        );
    }

    /**
     * Hook i18n functions into the JS code.
     */
    public hook(): void {
        log.info("Hooking i18n functions...");
        const translatorIndex = this.hookTranslator();
        this.hookReactCreateElement(876, translatorIndex);

        [574, 683].forEach((moduleIndex) => {
            this.hookFontConfig(moduleIndex, "BFTextRegularSCFonts");
        });
        this.hookFontDefinition(893, {
            main: {
                name: "FuturaMaxiBook-SC",
                url: "/sparta/jsclient/builds/assets/FuturaMaxiBook-SC.ttf",
            },
            secondary: {
                name: "M Ying Hei PRC",
                url: "/sparta/jsclient/builds/assets/BFText-Regular-SC.ttf",
            },
        });
    }
}
