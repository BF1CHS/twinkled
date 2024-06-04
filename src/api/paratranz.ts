import { BaseAPI } from "./model";
import client from "../requests";

const PROJECT_ID = 8862;
const ISSUE_ID = 19077;

/**
 * A class that provides an interface to the Paratranz API.
 */
export class ParaTranzAPI extends BaseAPI {
    constructor(token: string) {
        super(token);
    }

    /**
     * Reply to specific discussion on Paratranz, with content of the specified version.
     */
    public async reply(version: string) {
        await client.post(
            `https://paratranz.cn/api/projects/${PROJECT_ID}/issues/${ISSUE_ID}`,
            {
                op: "reply",
                content: `#### **JS 文件已更新**\n版本：\`${version}\`\n\n##### 下载链接\n[Github](https://github.com/BF1CHS/twinkle/releases/tag/${version}) | [Gitee（国内推荐）](https://gitee.com/BF1CHS/twinkle/releases/tag/${version})`,
            },
            {
                headers: {
                    Authorization: this.token,
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
