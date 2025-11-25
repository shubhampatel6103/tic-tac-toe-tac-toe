"use strict";
var _a;
for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 2; j++) {
        for (let k = 0; k <= 2; k++) {
            (_a = document.getElementById(`small-${i}${j}${k}`)) === null || _a === void 0 ? void 0 : _a.addEventListener("click", function () {
                handleClick(i, j, k);
            });
        }
    }
}
