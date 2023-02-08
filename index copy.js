(async () => {
	for (let i = 0; i < process.stdout.columns; i++) {
		process.stdout.write("\b");
		process.stdout.write(" █");
		await new Promise(resolve => setTimeout(resolve, 50));
	}
})()
