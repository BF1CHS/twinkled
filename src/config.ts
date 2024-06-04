import { existsSync } from "fs";
import { config } from "dotenv";

export default class Config {
    public readonly personaId: string;
    public readonly githubToken: string;
    public readonly giteeToken: string;
    public readonly paratranzToken: string;
    public readonly manualMode: boolean;

    constructor() {
        if (existsSync(".env.debug")) {
            config({ path: ".env.debug" });
        }

        const rawConfig = {
            personaId: process.env.PERSONA_ID,
            githubToken: process.env.GH_TOKEN,
            giteeToken: process.env.GITEE_TOKEN,
            paratranzToken: process.env.PARATRANZ_TOKEN,
            manualMode: process.env.MANUAL_MODE,
        };

        if (Object.values(this).some((value) => value === undefined)) {
            throw new Error("Missing environment variables.");
        }

        this.personaId = rawConfig.personaId as string;
        this.githubToken = rawConfig.githubToken as string;
        this.giteeToken = rawConfig.giteeToken as string;
        this.paratranzToken = rawConfig.paratranzToken as string;
        this.manualMode = Boolean(rawConfig.manualMode as string);
    }
}
