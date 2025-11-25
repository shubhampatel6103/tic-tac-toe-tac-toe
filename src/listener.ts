// Listen to button clicks
for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 2; j++) {
        for (let k = 0; k <= 2; k++) {
            document.getElementById(`small-${i}${j}${k}`)?.addEventListener("click", function() {
                handleClick(i, j, k);
            });
        }
    }
}
