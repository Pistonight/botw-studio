import path from "path";
import fs from "fs";

const settingsPath = () => {
    return path.join(__dirname, "settings.json");
}

export const readSettingToURIString = () => {
    const fileName = settingsPath();
    if (!fs.existsSync(fileName)){
        return undefined;
    }
    const settingJSONString =fs.readFileSync(fileName, {
        encoding: "utf-8"
    });
    const settingJSONStringCompact = JSON.stringify(JSON.parse(settingJSONString));
    const uriString = encodeURIComponent(settingJSONStringCompact);
    return uriString;
}

export const saveSettingFromURIString = (uriString: string) => {
    const settingJSONString = JSON.stringify(JSON.parse(decodeURIComponent(uriString)), null, 2);
    console.log("Saving Settings...");
    const fileName = settingsPath();
    fs.writeFileSync(fileName, settingJSONString);
}