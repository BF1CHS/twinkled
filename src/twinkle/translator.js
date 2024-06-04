#prop TWINKLE_EXTRA_FILE
#prop TWINKLE_EXTRA_EXT_FILE

function (e, t, n) {
    var bf1chs_native_api = n(295);

    bf1chs_native_api.loadAssetRequest("http://battlebinary.battlelog.com/view/sparta/jsclient/builds/assets/translations/{{TWINKLE_EXTRA_FILE}}", function (success, result) {
        t.bf1chsDynamicTrans = (success ? JSON.parse(result) : {});
    });

    bf1chs_native_api.loadAssetRequest("http://battlebinary.battlelog.com/view/sparta/jsclient/builds/assets/translations/{{TWINKLE_EXTRA_EXT_FILE}}", function (success, result) {
        t.bf1chsDynamicTransExt = (success ? JSON.parse(result) : {});
    });

    var simpleTrans = function (text) {
        var trimedText = text.trim();
        return t.bf1chsDynamicTrans[text] || t.bf1chsDynamicTrans[trimedText] || t.bf1chsDynamicTrans[trimedText.toUpperCase()] || t.bf1chsDynamicTrans[trimedText.toLowerCase()];
    }

    var end_marker = "#".repeat(10);
    var matchPattern = function (inputString) {
        inputString += end_marker;
        var matchedPattern = null;

        for (var pattern in t.bf1chsDynamicTransExt) {
            var replacePattern = t.bf1chsDynamicTransExt[pattern];
            var patternWithMarker = RegExp.escape(pattern) + end_marker;
            var params = patternWithMarker.match(/%(\w+)%/g) || [];
            var match = new RegExp(patternWithMarker.replace(/%(\w+)%/g, "(.*?)")).exec(inputString);

            if (match) {
                var paramValues = {};
                matchedPattern = replacePattern;

                params.forEach(function (param, i) {
                    var paramName = param.replace(/%/g, '');
                    paramValues[paramName] = match[i + 1];

                    matchedPattern = matchedPattern.replace(
                        new RegExp("%" + paramName + "%", 'g'), paramValues[paramName]
                    ).replace(
                        new RegExp("\\$" + paramName + "\\$", 'g'),
                        simpleTrans(paramValues[paramName]) || paramValues[paramName]
                    );
                });

                matchedPattern = matchedPattern.replace(end_marker, "");
                break;
            }
        }

        return matchedPattern;
    };

    var dtt = function (text) {
        var simple = simpleTrans(text);
        var pattern;

        if (simple) {
            return simple;
        } else if (pattern = matchPattern(text)) {
            return pattern;
        } else {
            // BF1CHS.debugStorage.untranslatedTexts.add(text);
            return text;
        }
    };
    t.bf1chsReplaceDynamicTrans = dtt;
}
