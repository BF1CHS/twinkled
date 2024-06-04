// BF1CHS
var bf1chs_section = new c.RouteDeclaration("bf1chs", {
    requireOnline: false,
    requireMpInstalled: false,
    getTitle: function () {
        return "BF1CHS";
    },
    view: W(bf1chs_view.TunguskaBF1CHS)
});
