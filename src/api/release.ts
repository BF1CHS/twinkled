import { AxiosError } from "axios";
import client from "../requests";
import { readFile } from "fs/promises";
import { createReadStream } from "fs";
import log from "../logger";
import { BaseAPI } from "./model";

const TWINKLE_REPO = "BF1CHS/twinkle";

/**
 * A class that provides an universal API to the hosted repository.
 *
 * Inherit from this class to implement a specific API version.
 */
export abstract class RepoAPI extends BaseAPI {
    constructor(token: string) {
        super(token);
    }

    /**
     * Upload a file as a release asset.
     */
    protected abstract uploadAsset(
        releaseId: number,
        path: string,
        name?: string
    ): Promise<void>;

    /**
     * Fetches the latest release version from the repository.
     */
    public abstract fetchLatestReleaseVer(): Promise<string>;

    /**
     * Creates a new release in the repository, with the specified version and code.
     */
    public abstract createRelease(version: string, code: string): Promise<void>;
}

/**
 * A class that provides an interface to the GitHub API.
 */
export class GithubReleaseAPI extends RepoAPI {
    protected async uploadAsset(
        releaseId: number,
        path: string,
        name?: string
    ): Promise<void> {
        const fileName = name ?? path.split("/").pop()!;
        const fileContent = await readFile(path);

        await client.post(
            `https://uploads.github.com/repos/${TWINKLE_REPO}/releases/${releaseId}/assets?name=${fileName}`,
            fileContent,
            {
                headers: {
                    Accept: "application/vnd.github.v3+json",
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/octet-stream",
                },
            }
        );
    }

    public async fetchLatestReleaseVer(): Promise<string> {
        try {
            const resp = await client.get(
                `https://api.github.com/repos/${TWINKLE_REPO}/releases/latest`,
                {
                    headers: {
                        Accept: "application/vnd.github+json",
                        Authorization: `Bearer ${this.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                }
            );
            return resp.data.tag_name;
        } catch (error) {
            if (error instanceof AxiosError) {
                log.error(`${error.code}: ${error.message}`);
            } else {
                throw error;
            }
        }
        return "-1";
    }

    public async createRelease(version: string, path: string): Promise<void> {
        const releaseId = (
            await client.post(
                `https://api.github.com/repos/${TWINKLE_REPO}/releases`,
                {
                    tag_name: version,
                    name: `twinkle ${version}`,
                },
                {
                    headers: {
                        Accept: "application/vnd.github+json",
                        Authorization: `Bearer ${this.token}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                }
            )
        ).data.id;
        await this.uploadAsset(releaseId, path);
    }
}

/**
 * A class that provides an interface to the Gitee API.
 */
export class GiteeReleaseAPI extends RepoAPI {
    protected async uploadAsset(
        releaseId: number,
        path: string,
        _name?: string
    ): Promise<void> {
        const fileContent = createReadStream(path);

        await client.postForm(
            `https://gitee.com/api/v5/repos/${TWINKLE_REPO}/releases/${releaseId}/attach_files`,
            {
                access_token: this.token,
                file: fileContent,
            }
        );
    }

    public async fetchLatestReleaseVer(): Promise<string> {
        try {
            const resp = await client.get(
                `https://gitee.com/api/v5/repos/${TWINKLE_REPO}/releases/latest?access_token=${this.token}`
            );
            return resp.data.tag_name;
        } catch (error) {
            if (error instanceof AxiosError) {
                log.error(`${error.code}: ${error.message}`);
            } else {
                throw error;
            }
        }
        return "-1";
    }

    public async createRelease(version: string, path: string): Promise<void> {
        const releaseId = (
            await client.post(
                `https://gitee.com/api/v5/repos/${TWINKLE_REPO}/releases`,
                {
                    access_token: this.token,
                    tag_name: version,
                    name: `twinkle ${version}`,
                    body: `twinkle ${version}`,
                    target_commitish: "main",
                }
            )
        ).data.id;
        await this.uploadAsset(releaseId, path);
    }
}
