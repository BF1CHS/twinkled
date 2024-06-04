import { config } from "dotenv";

export default class Config {
    public readonly personaId: string;
    public readonly githubToken: string;
    public readonly giteeToken: string;
    public readonly paratranzToken: string;

    constructor(debug: boolean = false) {
        if (debug) {
            config({ path: ".env.debug" });
        }

        this.personaId = process.env.PERSONA_ID || "";
        this.githubToken = process.env.GH_TOKEN || "";
        this.giteeToken = process.env.GITEE_TOKEN || "";
        this.paratranzToken = process.env.PARATRANZ_TOKEN || "";

        if (Object.values(this).some((value) => value === "")) {
            throw new Error("Missing environment variables.");
        }
    }
}
