#prop ABOUT_TXT_FILE
#prop ABOUT_LOGO_FILE

function (e, t, n) {
    "use strict";
    (function (__) {
        Object.defineProperty(t, "__esModule", {
            value: !0
        });
        var bf1chs_native_api = n(295),
            bf1chs_components = n(6),
            bf1chs_texttype = n(29),
            bf1chs_textsize = n(22),
            bf1chs_styles = n(13),
            bf1chs_common_styles = n(18),
            bf1chs_chunk = n(315),
            bf1chs_cardsize = n(42),
            bf1chs_static_styles = n(5),
            bf1chs_wh = n(7),
            bf1chs_content = n(23),
            bf1chs_basic_card = n(89),
            bf1chs_scroll = n(34),
            bf1chs_url_api = n(51),
            bf1chs_more_styles = bf1chs_styles.Template("TunguskaMoreStyles");

        var e = n(0), r = n(1), a = n(15), c = n(647), g = n(35);

        var BF1CHSText = function (t) {
            function n(e) {
                var n = t.call(this, e) || this;
                return n.timeout = -1, n.state = {
                    show: !1
                }, n;
            }
            return e.__extends(n, t), n.prototype.componentDidMount = function () {
                var e = this;
                this.timeout = setTimeout(function () {
                    e.setState({
                        show: !0
                    });
                }, this.props.delay);
            }, n.prototype.componentWillUnmount = function () {
                clearTimeout(this.timeout);
            }, n.prototype.render = function () {
                return this.state.show ? r.createElement(bf1chs_components.Text, {
                    value: this.props.text,
                    size: "S",
                    style: bf1chs_common_styles.CommonStyles.leftAlignTextRTL,
                }) : r.createElement(bf1chs_components.Text, {
                    value: "",
                    size: "S"
                });
            }, n;
        }(r.Component);

        var sideColWidth = bf1chs_wh.getWidth(7);
        var bf1chs_custom_style = bf1chs_static_styles.StaticStyle.wrapLegacyStyleSheet({
            container: {
                flexDirection: "row",
                width: bf1chs_wh.getWidth(24),
            },
            sideCol: {
                width: sideColWidth,
                paddingRight: bf1chs_wh.getWidth(1),
            },
            mainCol: {
                flexWrap: "wrap",
                width: bf1chs_wh.getWidth(24) - sideColWidth - bf1chs_wh.getWidth(1),
                height: bf1chs_content.content.height
            }
        }, "bf1chs_custom_style");

        var b = function (t) {
            function n() {
                var e = null !== t && t.apply(this, arguments) || this;
                return e.state = {
                    text: null
                }, e;
            }

            return e.__extends(n, t), n.prototype.componentDidMount = function () {
                this.loadTextForCurrentSelected();
            }, n.prototype.loadTextForCurrentSelected = function () {
                var e = this;
                bf1chs_native_api.loadAssetRequest("http://battlebinary.battlelog.com/view/sparta/jsclient/builds/assets/translations/{{ABOUT_TXT_FILE}}", function (r, o) {
                    r ? (e.setState({
                        text: o
                    })) : (console.warn("Failed to fetch text for locale"), e.setState({
                        text: ""
                    }));
                });
            }, n.prototype.render = function () {
                var handleBtn = function () {
                    bf1chs_url_api.nativeApi.openUrl("https://paratranz.cn/projects/8862");
                };

                var t = [];

                if (this.state.text) {
                    var n = bf1chs_chunk.chunkTextByLines(this.state.text), o = 0 === n.length ? 100 : 2e3 / n.length, s = n.map(function (e, t) {
                        return r.createElement(BF1CHSText, {
                            delay: t * o,
                            key: t,
                            text: e
                        });
                    });
                    t.push.apply(t, s);
                }

                return r.createElement(g.Template, {
                    tallContent: true,
                    aboveContent: r.createElement(bf1chs_components.Text, {
                        value: "BF1CHS 项目声明",
                        type: bf1chs_texttype.TextType.LIGHT,
                        size: bf1chs_textsize.TextSize.L,
                        style: bf1chs_more_styles.wrap(function () {
                            return bf1chs_styles.style({
                                marginBottom: bf1chs_styles.Grid.getHeight(5),
                                textAlignForRTL: "left"
                            }, "bf1chs_declaration");
                        })
                    }),
                    belowContent: r.createElement(c.BundleInfo, null)
                }, [
                    r.createElement("surface", {
                        style: bf1chs_custom_style.container,
                    }, [
                        r.createElement("surface", {
                            style: bf1chs_custom_style.sideCol,
                        }, [
                            r.createElement(bf1chs_basic_card.BasicCard, {
                                layout: "split",
                                size: bf1chs_cardsize.CardSize.XL,
                                style: bf1chs_static_styles.StaticStyle.create({
                                    height: bf1chs_wh.getHeight(59)
                                }, "5da6637b:55:19"),
                                background: a.bbOfflineUrl("/sparta/jsclient/builds/assets/{{ABOUT_LOGO_FILE}}"),
                                heading: "项目主页",
                                headingType: "emphasis",
                                description: "访问 BF1CHS 项目在 ParaTranz 上的主页。",
                                textHeight: bf1chs_wh.getHeight(18),
                                onPress: handleBtn,
                                debugName: "cardOperations"
                            })
                        ]),
                        r.createElement(bf1chs_scroll.Scroller, {
                            style: bf1chs_custom_style.mainCol,
                            scrollbar: "auto",
                            scrollbarPosition: "outside",
                            softClip: [20, 0, 20, 0]
                        }, t)
                    ])
                ]);
            }, n;
        }(r.Component);
        t.TunguskaBF1CHS = b;

    }).call(this, n(3));
}