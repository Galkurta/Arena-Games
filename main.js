const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { DateTime } = require('luxon');
const colors = require('colors');
const readline = require('readline');

class ArenaGames {

    constructor() {
        
    }

    parseIdFileContent(content) {
        const userMatch = content.match(/user=%7B%22id%22%3A(\d+)/);
        const userId = userMatch ? userMatch[1] : null;
        const tg = content;
        return { userId, tg };
    }
	
    headers(id,tg) {
		return {
			"Accept": "application/json, text/plain, */*",
			"Accept-Encoding": "gzip, deflate, br, zstd",
			"Accept-Language": "en-US,en;q=0.9",
			"At": `${id}`,
			"Origin": "https://bot-coin.arenavs.com",
			"Priority": "u=1, i",
			"Referer": "https://bot-coin.arenavs.com/",
			"Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
			"Sec-Ch-Ua-Mobile": "?1",
			"Sec-Ch-Ua-Platform": '"Android"',
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-site",
			"User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
			"Tg": tg
			}
    }

    async getProfile(id, tg) {
        const url = "https://bot.arenavs.com/v1/profile";
        const headers = this.headers(id, tg);
        return axios.get(url, { headers });
    }

    async getTask(id, tg) {
        const url = "https://bot.arenavs.com/v1/profile/tasks?page=1&limit=20";
        const headers = this.headers(id, tg);
        return axios.get(url, { headers });
    }

    async doTask(id, tg, taskId) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}`;
        const headers = this.headers(id, tg);
        return axios.post(url, null, { headers });
    }

    async claimTask(id, tg, taskId) {
        const url = `https://bot.arenavs.com/v1/profile/tasks/${taskId}/claim`;
        const headers = this.headers(id, tg);
        return axios.post(url, null, { headers });
    }

    async farmCoin(id, tg) {
        const url = "https://bot.arenavs.com/v1/profile/farm-coin";
        const headers = this.headers(id, tg);
        return axios.post(url, null, { headers });
    }

    async checkRefCoin(id, tg) {
        const url = "https://bot.arenavs.com/v1/profile/refs/coin";
        const headers = this.headers(id, tg);
        return axios.get(url, { headers });
    }

    async getRefCoin(id, tg) {
        const url = "https://bot.arenavs.com/v1/profile/get-ref-coin";
        const headers = this.headers(id, tg);
        return axios.post(url, null, { headers });
    }

    async attemptsLeft(id, tg) {
        const url = "https://bot.arenavs.com/v1/game/attempts-left";
        const headers = this.headers(id, tg);
        const response = await axios.get(url, { headers });
        return response;
    }

    async startGame(id, tg) {
        const url = "https://bot.arenavs.com/v1/game/start";
        const headers = this.headers(id, tg);
        return axios.post(url, null, { headers });
    }

    async stopGame(id, tg, gameData) {
        const url = "https://bot.arenavs.com/v1/game/stop";
        const headers = this.headers(id, tg);

        const payload = {
            xp: gameData.xp,
            height: gameData.height,
            somersault: gameData.somersault,
            time: "60000",
        };

        headers["Content-Length"] = JSON.stringify(payload).length;
        headers["Content-Type"] = "application/json";

        return axios.post(url, payload, { headers });
    }

    async playGame(id, tg) {
        this.log(`${'Start playing the game ...'.yellow}`);
        const startGame = await this.startGame(id, tg);
        const gameData = {
            xp: Math.floor(Math.random() * (1000 - 500 + 1)) + 500,
            height: Math.floor(Math.random() * (35 - 20 + 1)) + 20,
            somersault: Math.floor(Math.random() * (80 - 50 + 1)) + 50,
        };

        try {
            const startStatus = startGame.data.data.status;
            if (startStatus) {
                await this.waitGame(60);
                const stopGame = await this.stopGame(id, tg, gameData);
                const stopStatus = stopGame.data.data.status;
                if (stopStatus) {
                    this.log(`${'XP earned:'.green} ${gameData.xp}`);
                    this.log(`${'Height:'.green} ${gameData.height}`);
                    this.log(`${'Somersault:'.green} ${gameData.somersault}`);
                } else {
                    this.log(`${'Error'.red}`);
                    return false;
                }
            } else {
                this.log(`${'Unable to start game'.red}`);
                return false;
            }
        } catch (error) {
            const stopGame = await this.stopGame(id, tg, gameData);
            const stopStatus = stopGame.data.data.status;
            if (stopStatus) {
                this.log(`${'XP earned:'.green} ${gameData.xp}`);
                this.log(`${'Height:'.green} ${gameData.height}`);
                this.log(`${'Somersault:'.green} ${gameData.somersault}`);
            } else {
                this.log(`${'Error'.red}`);
                return false;
            }
        }
    }

    async getBoosterStatus(id, tg) {
        const url = "https://bot.arenavs.com/v1/booster/active";
        const headers = this.headers(id, tg);
        return axios.get(url, { headers });
    }

    async getBoosters(id, tg) {
        const url = "https://bot.arenavs.com/v1/booster";
        const headers = this.headers(id, tg);
        return axios.get(url, { headers });
    }

    async buyBooster(id, tg, boosterId) {
        const url = "https://bot.arenavs.com/v1/booster/buy";
        const headers = this.headers(id, tg);
        headers["Content-Type"] = "application/json";

        const payload = { id: boosterId };
        return axios.post(url, payload, { headers });
    }

    async handleBooster(id, tg, balance) {
        const boosterStatus = await this.getBoosterStatus(id, tg);
        const boosterData = boosterStatus.data.data.booster;
        const currentTime = new Date();

        if (!boosterData || new Date(boosterData.exp) < currentTime) {
            const boosters = await this.getBoosters(id, tg);
            const activeBoosters = boosters.data.data.active;

            if (activeBoosters && activeBoosters.length > 0) {
                if (balance >= activeBoosters[0].price) {
                    const boosterId = activeBoosters[0].id;
                    const buyBooster = await this.buyBooster(id, tg, boosterId);
                    const boosterBuyData = buyBooster.data.data;

                    if (boosterBuyData) {
                        this.log(`${'Buy Booster successfully'.green}`);
                    } else {
                        this.log(`${'Unable buy Booster'.red}`);
                    }
                } else {
                    this.log(`${'Not enough balance to buy Booster'.red}`);
                }
            } else {
                this.log(`${'Booster is active!'.red}`);
            }
        } else {
            this.log(`${'Booster is active, unable to buy new Booster!'.red}`);
        }
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }))
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Completed all accounts, waiting ${i} seconds to continue the loop =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async waitGame(seconds) {
        for (let i = seconds; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[*] Need to wait ${i} seconds to complete`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

	async main() {
		const dataFile = path.join(__dirname, 'data.txt');
		const data = fs.readFileSync(dataFile, 'utf8')
			.replace(/\r/g, '')
			.split('\n')
			.filter(Boolean);

		const buybooster = await this.askQuestion('Do you want to buy Booster? (y/n): ');
		const buyboosterDecision = buybooster.toLowerCase() === 'y';

		while (true) {
			const endAtList = [];

			for (let no = 0; no < data.length; no++) {
				const content = data[no];
				const { userId, tg } = this.parseIdFileContent(content);

				try {
					const getProfile = await this.getProfile(userId, tg);
					const userName = getProfile.data.data.first_name;
					const balance = getProfile.data.data.balance.$numberDecimal;
					const endAt = getProfile.data.data.farmEnd / 1000;
					const readableTime = DateTime.fromSeconds(endAt).toFormat('yyyy-MM-dd HH:mm:ss');
					console.log(`========== Account ${no + 1} | ${userName.green} ==========`);
					this.log(`${'Balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
					this.log(`${'Farm completion time:'.green} ${readableTime.white}`);
					endAtList.push(endAt);
					
					if (buyboosterDecision) {
						await this.handleBooster(userId, tg, balance);
					}
				} catch (error) {
					this.log(`${'User information error'.red}`);
					console.log(error);
				}

				try {
					const getTask = await this.getTask(userId, tg);
					const tasks = getTask.data.data.docs;
					const taskInfo = tasks.map(task => ({
						task_id: task._id,
						task_name: task.title,
						task_status: task.status
					}));

					const pendingTasks = taskInfo.filter(task => task.task_status === 'pending');
					if (pendingTasks.length > 0) {
						for (const task of pendingTasks) {
							const result = (await this.doTask(userId, tg, task.task_id)).data.data.status;
							this.log(`${task.task_name.white}: ${'Are on duty ...'.yellow} ${'Status:'.white} ${result.yellow}`);
						}
					}

					const completedTasks = taskInfo.filter(task => task.task_status === 'completed');
					if (completedTasks.length > 0) {
						for (const task of completedTasks) {
							const result = (await this.claimTask(userId, tg, task.task_id)).data.data.status;
							this.log(`${task.task_name.white}: ${'Complete mission...'.yellow} ${'Status:'.white} ${result.yellow}`);
						}
					}

					const claimTasks = taskInfo.filter(task => task.task_status === 'claim');
					if (claimTasks.length > 0) {
						for (const task of claimTasks) {
							this.log(`${task.task_name.white}: ${'Complete'.green}`);
						}
					}
				} catch (error) {
					this.log(`${'Error when accepting the mission'.red}`);
				}

				try {
					this.log(`${'Start farm ...'.yellow}`);
					const farmCoin = await this.farmCoin(userId, tg);
					if (farmCoin.data.statusCode === 400) {
						this.log(`${'Are in a farm'.yellow}`);
					} else if (farmCoin.data.status === 'ok') {
						this.log(`${'Farm successful'.yellow}`);
					}

					const getProfile = await this.getProfile(userId, tg);
					const balance = getProfile.data.data.balance.$numberDecimal;
					this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
				} catch (error) {
					this.log(`${'Not up to now'.red}`);
				}

				try {
					const checkRefCoin = await this.checkRefCoin(userId, tg);
					const refCoin = checkRefCoin.data.data.allCoin.$numberDecimal;
					if (parseInt(refCoin) > 0) {
						this.log(`${'Received'.yellow} ${parseInt(refCoin)} ${'XP from friends ...'.yellow}`);
						const getRefCoin = await this.getRefCoin(userId, tg);
						const balance = getRefCoin.data.data.balance.$numberDecimal;
						this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
					}
				} catch (error) {
					this.log(`${'Error when checking XP from friends'.red}`);
				}

				try {
					while (true) {
						const attemptsLeft = await this.attemptsLeft(userId, tg);
						const gameLeft = attemptsLeft.data.data.quantity;
						this.log(`${'Game ticket:'.green} ${gameLeft}`);
						if (parseInt(gameLeft) > 0) {
							await this.playGame(userId, tg);
							const getProfile = await this.getProfile(userId, tg);
							const balance = getProfile.data.data.balance.$numberDecimal;
							this.log(`${'Current balance:'.green} ${parseFloat(balance).toFixed(2).white}`);
						} else {
							this.log(`${'Played all the tickets'.yellow}`);
							break;
						}
					}
				} catch (error) {
					this.log(`${'Error when playing games'.red}`);
				}
			}

			let waitTime;
			if (endAtList.length > 0) {
				const now = DateTime.now().toSeconds();
				const waitTimes = endAtList.map(endAt => endAt - now).filter(waitTime => waitTime > 0);
				if (waitTimes.length > 0) {
					waitTime = Math.min(...waitTimes);
				} else {
					waitTime = 15 * 60;
				}
			} else {
				waitTime = 15 * 60;
			}
			await this.waitWithCountdown(Math.floor(waitTime));
		}
	}
}

if (require.main === module) {
    const arena = new ArenaGames();
    arena.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}