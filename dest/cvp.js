"use strict";
var CVP;
(function (CVP) {
    let currentPlayer = 1;
    CVP.validGrids = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    let GridStatus;
    (function (GridStatus) {
        GridStatus["IN_PROGRESS"] = "IN_PROGRESS";
        GridStatus["X_WON"] = "X_WON";
        GridStatus["O_WON"] = "O_WON";
        GridStatus["DRAW"] = "DRAW";
    })(GridStatus = CVP.GridStatus || (CVP.GridStatus = {}));
    class smallGrid {
        constructor() {
            this.grid = [
                ['', '', ''],
                ['', '', ''],
                ['', '', '']
            ];
            this.gridStatus = GridStatus.IN_PROGRESS;
        }
    }
    CVP.grid = [
        new smallGrid(), new smallGrid(), new smallGrid(),
        new smallGrid(), new smallGrid(), new smallGrid(),
        new smallGrid(), new smallGrid(), new smallGrid()
    ];
    function switchPlayer() {
        const body = document.getElementById('body');
        const p1 = document.getElementById('p1');
        const p2 = document.getElementById('p2');
        if (currentPlayer == 1) {
            currentPlayer = 2;
            p2.style.animation = 'text-appear 0.5s forwards';
            p1.style.animation = 'text-disappear 0.5s forwards';
            body.style.animation = 'color2 0.7s forwards';
        }
        else if (currentPlayer == 2) {
            currentPlayer = 1;
            p1.style.animation = 'text-appear 0.5s forwards';
            p2.style.animation = 'text-disappear 0.5s forwards';
            body.style.animation = 'color1 0.7s forwards';
        }
    }
    function handleClick(g, row, col) {
        if ((CVP.validGrids.includes(g)) && (currentPlayer == 1) && CVP.grid[g].grid[row][col] == '') {
            CVP.grid[g].grid[row][col] = 'X';
            switchPlayer();
            checkGridStatus(g);
            CVP.validGrids = getValidGrids(row, col);
            printBoard();
        }
        if (![1, 2].includes(currentPlayer)) {
            const p1 = document.getElementById('p1');
            const p2 = document.getElementById('p2');
            if (currentPlayer == 0) {
                p1.innerText = 'YOU WIN!';
                p1.style.animation = 'text-appear 0.5s forwards';
                p2.style.animation = 'text-disappear 0.5s forwards';
            }
            else if (currentPlayer == 3) {
                p2.innerText = 'COMPUTER WINS!';
                p1.style.animation = 'text-disappear 0.5s forwards';
                p2.style.animation = 'text-appear 0.5s forwards';
            }
            else {
                p1.innerText = 'DRAW!';
                p2.innerText = 'DRAW!';
                p1.style.animation = 'text-appear 0.5s forwards';
                p2.style.animation = 'text-appear 0.5s forwards';
            }
            return;
        }
        if (currentPlayer == 2) {
            setTimeout(() => {
                var _a;
                const choice = (_a = CVP.getComputerMove) === null || _a === void 0 ? void 0 : _a.call(CVP);
                if (!choice)
                    return;
                const { g, r, c } = choice;
                if (!CVP.validGrids.includes(g) || CVP.grid[g].grid[r][c] !== '')
                    return;
                CVP.grid[g].grid[r][c] = 'O';
                switchPlayer();
                checkGridStatus(g);
                CVP.validGrids = getValidGrids(r, c);
                printBoard();
                if (![1, 2].includes(currentPlayer)) {
                    const p1 = document.getElementById('p1');
                    const p2 = document.getElementById('p2');
                    if (currentPlayer == 0) {
                        p1.innerText = 'YOU WIN!';
                        p1.style.animation = 'text-appear 0.5s forwards';
                        p2.style.animation = 'text-disappear 0.5s forwards';
                    }
                    else if (currentPlayer == 3) {
                        p2.innerText = 'COMPUTER WINS!';
                        p1.style.animation = 'text-disappear 0.5s forwards';
                        p2.style.animation = 'text-appear 0.5s forwards';
                    }
                    else {
                        p1.innerText = 'DRAW!';
                        p2.innerText = 'DRAW!';
                        p1.style.animation = 'text-appear 0.5s forwards';
                        p2.style.animation = 'text-appear 0.5s forwards';
                    }
                }
            }, 250);
        }
    }
    CVP.handleClick = handleClick;
    function getValidGrids(row, col) {
        let validGrids = [];
        if (CVP.grid[row * 3 + col].gridStatus == GridStatus.IN_PROGRESS) {
            validGrids.push(row * 3 + col);
        }
        else {
            for (let i = 0; i < 9; i++) {
                if (CVP.grid[i].gridStatus == GridStatus.IN_PROGRESS) {
                    validGrids.push(i);
                }
            }
        }
        if (currentPlayer == 1 || currentPlayer == 2) {
            highlightValidGrids(validGrids);
        }
        return validGrids;
    }
    function checkGridStatus(g) {
        let gStatus = checkWin(CVP.grid[g].grid);
        if (gStatus == 'X') {
            CVP.grid[g].gridStatus = GridStatus.X_WON;
            const bigGridElement = document.getElementById(`big-${g}`);
            bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>X</h1>";
        }
        else if (gStatus == 'O') {
            CVP.grid[g].gridStatus = GridStatus.O_WON;
            const bigGridElement = document.getElementById(`big-${g}`);
            bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>O</h1>";
        }
        else if (gStatus == 'D') {
            CVP.grid[g].gridStatus = GridStatus.DRAW;
            const bigGridElement = document.getElementById(`big-${g}`);
            bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>DRAW</h1>";
        }
        else {
            CVP.grid[g].gridStatus = GridStatus.IN_PROGRESS;
            return;
        }
        checkWinner();
    }
    function checkWinner() {
        let end = false;
        for (let i = 0; i < 3; i++) {
            if (CVP.grid[i * 3].gridStatus == CVP.grid[i * 3 + 1].gridStatus &&
                CVP.grid[i * 3 + 1].gridStatus == CVP.grid[i * 3 + 2].gridStatus) {
                if (CVP.grid[i * 3].gridStatus == GridStatus.X_WON) {
                    currentPlayer = 0;
                    end = true;
                }
                else if (CVP.grid[i * 3].gridStatus == GridStatus.O_WON) {
                    currentPlayer = 3;
                    end = true;
                }
            }
            if (end) {
                colorWinner([i * 3, i * 3 + 1, i * 3 + 2]);
                return;
            }
            if (CVP.grid[i].gridStatus == CVP.grid[i + 3].gridStatus &&
                CVP.grid[i + 3].gridStatus == CVP.grid[i + 6].gridStatus) {
                if (CVP.grid[i].gridStatus == GridStatus.X_WON) {
                    currentPlayer = 0;
                    end = true;
                }
                else if (CVP.grid[i].gridStatus == GridStatus.O_WON) {
                    currentPlayer = 3;
                    end = true;
                }
            }
            if (end) {
                colorWinner([i, i + 3, i + 6]);
                return;
            }
        }
        if (CVP.grid[0].gridStatus == CVP.grid[4].gridStatus &&
            CVP.grid[4].gridStatus == CVP.grid[8].gridStatus) {
            if (CVP.grid[0].gridStatus == GridStatus.X_WON) {
                currentPlayer = 0;
                end = true;
            }
            else if (CVP.grid[0].gridStatus == GridStatus.O_WON) {
                currentPlayer = 3;
                end = true;
            }
        }
        if (end) {
            colorWinner([0, 4, 8]);
            return;
        }
        if (CVP.grid[2].gridStatus == CVP.grid[4].gridStatus &&
            CVP.grid[4].gridStatus == CVP.grid[6].gridStatus) {
            if (CVP.grid[2].gridStatus == GridStatus.X_WON) {
                currentPlayer = 0;
                end = true;
            }
            else if (CVP.grid[2].gridStatus == GridStatus.O_WON) {
                currentPlayer = 3;
                end = true;
            }
        }
        if (end) {
            colorWinner([2, 4, 6]);
            return;
        }
        for (let i = 0; i < 9; i++) {
            if (CVP.grid[i].gridStatus == GridStatus.IN_PROGRESS) {
                return;
            }
        }
        let x_wins = [];
        let o_wins = [];
        for (let i = 0; i < 9; i++) {
            if (CVP.grid[i].gridStatus == GridStatus.X_WON) {
                x_wins.push(i);
            }
            else if (CVP.grid[i].gridStatus == GridStatus.O_WON) {
                o_wins.push(i);
            }
        }
        if (x_wins.length > o_wins.length) {
            currentPlayer = 0;
            colorWinner(x_wins);
        }
        else if (o_wins.length > x_wins.length) {
            currentPlayer = 3;
            colorWinner(o_wins);
        }
        else {
            currentPlayer = -1;
        }
    }
    function checkWin(grid) {
        for (let i = 0; i < 3; i++) {
            if (grid[i][0] == grid[i][1] && grid[i][1] == grid[i][2] && grid[i][0] != '') {
                return grid[i][0];
            }
            if (grid[0][i] == grid[1][i] && grid[1][i] == grid[2][i] && grid[0][i] != '') {
                return grid[0][i];
            }
        }
        if (grid[0][0] == grid[1][1] && grid[1][1] == grid[2][2] && grid[0][0] != '') {
            return grid[0][0];
        }
        if (grid[0][2] == grid[1][1] && grid[1][1] == grid[2][0] && grid[0][2] != '') {
            return grid[0][2];
        }
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[i][j] == '') {
                    return 'I';
                }
            }
        }
        return 'D';
    }
    ;
    window.handleClick = handleClick;
    ;
    window.grid = CVP.grid;
    ;
    window.currentPlayer = currentPlayer;
    ;
    window.validGrids = CVP.validGrids;
})(CVP || (CVP = {}));
