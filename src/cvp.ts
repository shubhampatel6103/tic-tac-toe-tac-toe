namespace CVP {
let currentPlayer: number = 1;
export let validGrids: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export enum GridStatus {
	IN_PROGRESS = 'IN_PROGRESS',
	X_WON = 'X_WON',
	O_WON = 'O_WON',
	DRAW = 'DRAW'
}

class smallGrid {
	grid: string[][] = [
		['', '', ''],
		['', '', ''],
		['', '', '']
	];
	gridStatus: GridStatus = GridStatus.IN_PROGRESS;
}

export let grid = [ 
	new smallGrid(), new smallGrid(), new smallGrid(), 
	new smallGrid(), new smallGrid(), new smallGrid(), 
	new smallGrid(), new smallGrid(), new smallGrid() 
];

function switchPlayer() {
	const body = document.getElementById('body') as HTMLElement;
	const p1 = document.getElementById('p1') as HTMLElement;
	const p2 = document.getElementById('p2') as HTMLElement;

	if (currentPlayer == 1) {
		currentPlayer = 2;
		p2.style.animation = 'text-appear 0.5s forwards';
		p1.style.animation = 'text-disappear 0.5s forwards';
		body.style.animation = 'color2 0.7s forwards';
	} else if (currentPlayer == 2) {
		currentPlayer = 1;
		p1.style.animation = 'text-appear 0.5s forwards';
		p2.style.animation = 'text-disappear 0.5s forwards';
		body.style.animation = 'color1 0.7s forwards';
	}
}

export function handleClick(g: number, row: number, col: number) {
	// Only accept clicks when it's the human's (X) turn
	if ((validGrids.includes(g)) && (currentPlayer == 1) && grid[g].grid[row][col] == '') {
		grid[g].grid[row][col] = 'X';
		switchPlayer();
		checkGridStatus(g);
		validGrids = getValidGrids(row, col);
		printBoard();
	}

	// Check for game end after human move
	if (![1, 2].includes(currentPlayer)) {
		const p1 = document.getElementById('p1') as HTMLElement;
		const p2 = document.getElementById('p2') as HTMLElement;
		if ((currentPlayer as number) == 0) {
			p1.innerText = 'YOU WIN!';
			p1.style.animation = 'text-appear 0.5s forwards';
			p2.style.animation = 'text-disappear 0.5s forwards';
		} else if ((currentPlayer as number) == 3) {
			p2.innerText = 'COMPUTER WINS!';
			p1.style.animation = 'text-disappear 0.5s forwards';
			p2.style.animation = 'text-appear 0.5s forwards';
		} else {
			p1.innerText = 'DRAW!';
			p2.innerText = 'DRAW!';
			p1.style.animation = 'text-appear 0.5s forwards';
			p2.style.animation = 'text-appear 0.5s forwards';
		}
		return;
	}

	// If it's the computer's (O) turn, ask AI for a move
	if (currentPlayer == 2) {
		setTimeout(() => {
			const choice = CVP.getComputerMove?.();
			if (!choice) return;
			const { g, r, c } = choice;
			if (!validGrids.includes(g) || grid[g].grid[r][c] !== '') return;
			grid[g].grid[r][c] = 'O';
			switchPlayer();
			checkGridStatus(g);
			validGrids = getValidGrids(r, c);
			printBoard();

			if (![1, 2].includes(currentPlayer)) {
				const p1 = document.getElementById('p1') as HTMLElement;
				const p2 = document.getElementById('p2') as HTMLElement;
				if ((currentPlayer as number) == 0) {
					p1.innerText = 'YOU WIN!';
					p1.style.animation = 'text-appear 0.5s forwards';
					p2.style.animation = 'text-disappear 0.5s forwards';
				} else if ((currentPlayer as number) == 3) {
					p2.innerText = 'COMPUTER WINS!';
					p1.style.animation = 'text-disappear 0.5s forwards';
					p2.style.animation = 'text-appear 0.5s forwards';
				} else {
					p1.innerText = 'DRAW!';
					p2.innerText = 'DRAW!';
					p1.style.animation = 'text-appear 0.5s forwards';
					p2.style.animation = 'text-appear 0.5s forwards';
				}
			}
		}, 250);
	}
}

function getValidGrids(row: number, col: number): number[] {
	let validGrids = [] as number[];
	if (grid[row * 3 + col].gridStatus == GridStatus.IN_PROGRESS) {
		validGrids.push(row * 3 + col);
	} else {
		for (let i = 0; i < 9; i++) {
			if (grid[i].gridStatus == GridStatus.IN_PROGRESS) {
				validGrids.push(i);
			}
		}
	}
	if (currentPlayer == 1 || currentPlayer == 2) {
		highlightValidGrids(validGrids);
	}
	return validGrids;
}

function checkGridStatus(g: number) {
	let gStatus = checkWin(grid[g].grid);
	if (gStatus == 'X') {
		grid[g].gridStatus = GridStatus.X_WON;
		const bigGridElement = document.getElementById(`big-${g}`) as HTMLElement;
		bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>X</h1>";
	} else if (gStatus == 'O') {
		grid[g].gridStatus = GridStatus.O_WON;
		const bigGridElement = document.getElementById(`big-${g}`) as HTMLElement;
		bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>O</h1>";
	} else if (gStatus == 'D') {
		grid[g].gridStatus = GridStatus.DRAW;
		const bigGridElement = document.getElementById(`big-${g}`) as HTMLElement;
		bigGridElement.innerHTML = "<h1 class='d-flex align-items-center justify-content-center h-100'>DRAW</h1>";
	} else {
		grid[g].gridStatus = GridStatus.IN_PROGRESS;
		return;
	}
	checkWinner();
}

function checkWinner() {
	let end = false;
	for (let i = 0; i < 3; i++) {
		if (grid[i * 3].gridStatus == grid[i * 3 + 1].gridStatus && 
			grid[i * 3 + 1].gridStatus == grid[i * 3 + 2].gridStatus) {
				if (grid[i * 3].gridStatus == GridStatus.X_WON) {
					currentPlayer = 0;
					end = true;
				} else if (grid[i * 3].gridStatus == GridStatus.O_WON) {
					currentPlayer = 3;
					end = true;
				}
		}
		if (end) {
			colorWinner([i * 3, i * 3 + 1, i * 3 + 2]);
			return;
		}
		if (grid[i].gridStatus == grid[i + 3].gridStatus && 
			grid[i + 3].gridStatus == grid[i + 6].gridStatus) {
				if (grid[i].gridStatus == GridStatus.X_WON) {
					currentPlayer = 0;
					end = true;
				} else if (grid[i].gridStatus == GridStatus.O_WON) {
					currentPlayer = 3;
					end = true;
				}
		}
		if (end) {
			colorWinner([i, i + 3, i + 6]);
			return;
		}
	}
	if (grid[0].gridStatus == grid[4].gridStatus && 
		grid[4].gridStatus == grid[8].gridStatus) {
			if (grid[0].gridStatus == GridStatus.X_WON) {
				currentPlayer = 0;
				end = true;
			} else if (grid[0].gridStatus == GridStatus.O_WON) {
				currentPlayer = 3;
				end = true;
			}
	}
	if (end) {
		colorWinner([0, 4, 8]);
		return;
	}
	if (grid[2].gridStatus == grid[4].gridStatus && 
		grid[4].gridStatus == grid[6].gridStatus) {
			if (grid[2].gridStatus == GridStatus.X_WON) {
				currentPlayer = 0;
				end = true;
			} else if (grid[2].gridStatus == GridStatus.O_WON) {
				currentPlayer = 3;
				end = true;
			}
	}
	if (end) {
		colorWinner([2, 4, 6]);
		return;
	}
	for (let i = 0; i < 9; i++) {
		if (grid[i].gridStatus == GridStatus.IN_PROGRESS) {
			return;
		}
	}
	let x_wins: number[] = [];
	let o_wins: number[] = [];
	for (let i = 0; i < 9; i++) {
		if (grid[i].gridStatus == GridStatus.X_WON) {
			x_wins.push(i);
		} else if (grid[i].gridStatus == GridStatus.O_WON) {
			o_wins.push(i);
		}
	}
	if (x_wins.length > o_wins.length) {
		currentPlayer = 0;
		colorWinner(x_wins);
	} else if (o_wins.length > x_wins.length) {
		currentPlayer = 3;
		colorWinner(o_wins);
	} else {
		currentPlayer = -1;
	}
}

function checkWin(grid: string[][]): string {
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

;(window as any).handleClick = handleClick;
;(window as any).grid = grid;
;(window as any).currentPlayer = currentPlayer;
;(window as any).validGrids = validGrids;
}