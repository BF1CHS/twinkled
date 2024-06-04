try {
    if (e === "surface" && t && t.text) {
        t.text = bf1chs_translator.bf1chsReplaceDynamicTrans(t.text);
    } else if (e === "imgui" && t && t.label) {
        t.label = bf1chs_translator.bf1chsReplaceDynamicTrans(t.label);
    }
} catch (e) {
    // BF1CHS.debugStorage.transErrors.push({
    //     message: e.toString(),
    //     stack: e.stack
    // });
}
