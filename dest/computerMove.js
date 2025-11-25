"use strict";
var CVP;
(function (CVP) {
    function getComputerMove() {
        function checkWinLocal(g) {
            for (let i = 0; i < 3; i++) {
                if (g[i][0] === g[i][1] && g[i][1] === g[i][2] && g[i][0] !== '')
                    return g[i][0];
                if (g[0][i] === g[1][i] && g[1][i] === g[2][i] && g[0][i] !== '')
                    return g[0][i];
            }
            if (g[0][0] === g[1][1] && g[1][1] === g[2][2] && g[0][0] !== '')
                return g[0][0];
            if (g[0][2] === g[1][1] && g[1][1] === g[2][0] && g[0][2] !== '')
                return g[0][2];
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (g[i][j] === '')
                        return 'I';
                }
            }
            return 'D';
        }
        for (const gIndex of CVP.validGrids) {
            if (CVP.grid[gIndex].gridStatus !== CVP.GridStatus.IN_PROGRESS)
                continue;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (CVP.grid[gIndex].grid[r][c] === '') {
                        CVP.grid[gIndex].grid[r][c] = 'O';
                        const res = checkWinLocal(CVP.grid[gIndex].grid);
                        CVP.grid[gIndex].grid[r][c] = '';
                        if (res === 'O')
                            return { g: gIndex, r, c };
                    }
                }
            }
        }
        for (const gIndex of CVP.validGrids) {
            if (CVP.grid[gIndex].gridStatus !== CVP.GridStatus.IN_PROGRESS)
                continue;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (CVP.grid[gIndex].grid[r][c] === '')
                        return { g: gIndex, r, c };
                }
            }
        }
        return null;
    }
    CVP.getComputerMove = getComputerMove;
})(CVP || (CVP = {}));
