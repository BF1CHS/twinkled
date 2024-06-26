import { writeFile } from "fs/promises";
import Config from "./config";
import { Bundle, Manifest, JSHooker } from "./hooker";
import log from "./logger";
import { GithubReleaseAPI, GiteeReleaseAPI } from "./api/release";
import { ParaTranzAPI } from "./api/paratranz";
import client from "./requests";
import { exit } from "process";

/**
 * Main class for Twinkled.
 */
class Twinkled {
    private config: Config;
    private githubApi: GithubReleaseAPI;
    private giteeApi: GiteeReleaseAPI;
    private paraTranzApi: ParaTranzAPI;

    constructor() {
        this.config = new Config();
        this.githubApi = new GithubReleaseAPI(this.config.githubToken);
        this.giteeApi = new GiteeReleaseAPI(this.config.giteeToken);
        this.paraTranzApi = new ParaTranzAPI(this.config.paratranzToken);
    }

    private async fetchBundleManifest(): Promise<Manifest> {
        log.info("Fetching bundle manifest...");

        // Fetch latest manifest
        try {
            const manifestResponse = await client.get(
                "https://sparta-gw.battlelog.com/js-client/sparta-client?" +
                    new URLSearchParams({
                        platform: "pc",
                        personaId: this.config.personaId,
                        game: "Tunguska",
                        databaseId: "Tunguska.Shipping2PC.Win32",
                    })
            );
            const manifest = new Manifest(manifestResponse.data);
            log.info("Fetched manifest with version", manifest.bundleVersion);

            // Fetch bundle js
            return manifest;
        } catch (error) {
            log.error("Failed to fetch manifest:", error);
            exit(-1);
        }
    }

    private async fetchBundleCode(manifest: Manifest): Promise<Bundle> {
        log.info("Fetching bundle code...");

        // Fetch bundle js
        const bundleResponse = await client.get(manifest.bundleJSUrl);
        return new Bundle(manifest.bundleVersion, bundleResponse.data);
    }

    public async main() {
        const bundleManifest = await this.fetchBundleManifest();

        log.info("Fetching latest release version from GitHub...");
        const rawGithubVersion = await this.githubApi.fetchLatestReleaseVer();

        log.info("Fetching latest release version from Gitee...");
        const rawGiteeVersion = await this.giteeApi.fetchLatestReleaseVer();

        if (rawGithubVersion !== rawGiteeVersion) {
            log.error(
                "GitHub and Gitee versions do not match. Please check the release versions."
            );
            log.error(`GitHub version: ${rawGithubVersion}`);
            log.error(`Gitee version: ${rawGiteeVersion}`);
            return;
        }

        log.info(`Github/Gitee version: ${rawGithubVersion}`);
        log.info(`Remote version: ${bundleManifest.bundleVersion}`);

        const [releaseVersion, releaseMinorVersion] =
            rawGithubVersion.split(".");

        if (
            bundleManifest.bundleVersion === releaseVersion &&
            !this.config.manualMode
        ) {
            log.info("Bundle is up to date.");
            log.info("Not in manual mode, exiting.");
            return;
        }

        if (bundleManifest.bundleVersion !== releaseVersion) {
            log.info("Bundle is outdated.");
        } else {
            log.info("Bundle is up to date, but in manual mode, continuing...");
        }

        log.info("Updating...");

        // Hook the translator function into the code
        const bundle = await this.fetchBundleCode(bundleManifest);
        const hooker = new JSHooker(bundle.jsCode);
        hooker.hook();

        // Serialize the AST back to code
        const code = hooker.generateCode();
        const fileName = `bundle-${bundle.version}.js`;
        await writeFile(fileName, bundle.jsCodeHeaderComment + code);
        log.info("Bundle saved.");

        // Create a new release
        const newVersion = `${bundle.version}.${
            releaseMinorVersion ? Number.parseInt(releaseMinorVersion) + 1 : 0
        }`;
        try {
            log.info("Creating release for GitHub...");
            await this.githubApi.createRelease(newVersion, fileName);

            log.info("Creating release for Gitee...");
            await this.giteeApi.createRelease(newVersion, fileName);

            log.info("Release created.");
        } catch (error) {
            log.error("Failed to create release: ", error);
        }

        // Reply to Paratranz thread
        try {
            log.info("Replying to Paratranz thread...");
            await this.paraTranzApi.reply(newVersion);
            log.info("Replied to Paratranz thread.");
        } catch (error) {
            log.error("Failed to reply to Paratranz thread: ", error);
        }
    }
}

const twinkled = new Twinkled();
twinkled.main();
