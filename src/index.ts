import { writeFile } from "fs";
import Config from "./config";
import { Bundle, Manifest, JSHooker } from "./hooker";
import log from "./logger";

/**
 * Main class for Twinkled.
 */
class Twinkled {
    private config: Config;

    constructor() {
        this.config = new Config(true);
    }

    private async fetchBundle(): Promise<Bundle> {
        log.info("Fetching bundle...");

        // Fetch latest manifest
        const manifestResponse = await fetch(
            "https://sparta-gw.battlelog.com/js-client/sparta-client?" +
                new URLSearchParams({
                    platform: "pc",
                    personaId: this.config.personaId,
                    game: "Tunguska",
                    databaseId: "Tunguska.Shipping2PC.Win32",
                })
        );
        const manifest = new Manifest(await manifestResponse.text());
        log.info("Fetched manifest with version", manifest.bundleVersion);

        // Fetch bundle js
        return new Bundle(
            manifest.bundleVersion,
            await fetch(manifest.bundleJSUrl).then((res) => res.text())
        );
    }

    public async main() {
        const bundle = await this.fetchBundle();
        const hooker = new JSHooker(bundle.jsCode);

        // Hook the translator function into the codse
        if (this.config.debugMode) {
            hooker.hookDebug();
        }
        hooker.hook();

        // Serialize the AST back to code
        // TODO: check export code style related options
        const code = hooker.generateCode();
        writeFile(
            `bundle-${bundle.version}.modified.js`,
            bundle.jsCodeHeaderComment + code,
            () => {
                log.info("Bundle saved.");
            }
        );
    }
}

const twinkled = new Twinkled();
twinkled.main();
