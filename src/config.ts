import { config } from "dotenv";

export default class Config {
    public personaId: string;
    public debugMode: boolean;
    public octokitToken: string;

    constructor(debug: boolean = false) {
        if (debug) {
            config({ path: ".env.debug" });
        }

        this.personaId = process.env.PERSONA_ID || "";
        this.debugMode = process.env.DEBUG_MODE === "true";
        this.octokitToken = process.env.OCTOKIT_TOKEN || "";

        if (Object.values(this).some((value) => value === "")) {
            throw new Error("Missing environment variables.");
        }
    }
}
