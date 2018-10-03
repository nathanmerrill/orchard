+function() {

	const BOT_PLAYER = "Bot";
	const HUMAN_PLAYER = "Human";
	const MAX_PLAYERS = 4;
	
	const BOT_NAMES = ["RowandaBot", "LeonardBot", "AbernathyBot", "CatherineBot"];

	const SQUARE_EMPTY = 0;
	const SQUARE_ROTTEN = -1;
	const SQUARE_TEAM = [1, 2];


	const squaresWhere = (func, range) => {
		if (range === undefined){
			range = 1
		}
		const allSquares = _.range(-range,range+1).flatMap(x => _.range(-range,range+1).map(y => [x,y]));
		return allSquares.filter(s => func(s[0],s[1]));
	}

	const rotate90 = (tuple) => {
		return [-tuple[1],tuple[0],tuple[2]];
	}

	const mod = (n, m) => {
		if (n < 0) {
			return n % m + m;
		} else {
			return n % m;
		}
	}

	const toTuple = (offset) => {
		return [offset % 6, Math.floor(offset / 6)];
	}

	const toIndex = (tuple) => {
		return tuple[0] + tuple[1] * 6;
	}

	const shiftTuple = (tuple, offset) => {
		return [tuple[0] + offset[0], tuple[1] + offset[1], tuple[2]];
	}

	const offGridTuple = (tuple) => {
		return tuple[0] > 5 || tuple[0] < 0 || tuple[1] > 5 || tuple[1] < 0;
	}

	const offGridIndex = (index) => {
		return index < 0 || index >= 36;
	}

	const calculateOffsetsTuple = (tuple, offsets) => {
		return offsets.map(offset => shiftTuple(tuple, offset)).filter(offGridTuple);
	}

	const calculateOffsetsIndex = (index, offsets) => {
		return calculateOffsetsTuple(toTuple(index), offsets).map(toIndex);
	}

	const adjacencies = squaresWhere((x,y) => Math.abs(x+y) === 1);
	const diagonals = squaresWhere((x,y) => Math.abs(x)+Math.abs(y) === 2);
	const box = squaresWhere((x,y) => x !== 0 || y !== 0);

	const CARDS = [
		{
			harvest: [[0,1,3]]			
		},
		{
			tree: SQUARE_ROTTEN,
			harvest: box
		},
		{
			harvest: [[0,0,2]]
		},
		{
			harvest: [[-1,-1,2],[1,1,2]]
		},
		{
			harvest: [[-1,-1,2],[1,-1,2],[-1,1,2],[1,1,2]],
			limit: 1
		},
		{
			harvest: squaresWhere((x,y) => x !== 0 || y !== 0),
			limit: 1,
		},
		{
			harvest: [[-1,-1],[1,-1],[0,1,2]]
		},
		{
			harvest: [[-1,-1,2],[1,0],[0,1]]
		},
		{
			harvest: [[-1,-1],[0,-1],[-1,0]]
		},
		{
			harvest: adjacencies
		},
		{
			harvest: diagonals
		},
		{
			harvest: squaresWhere((x,y) => x === -1)
		},
		{
			harvest: squaresWhere((x,y) => x === 0)
		},
		{
			harvest: squaresWhere((x,y) => x === y)
		},
		{
			harvest: [[-1,-1],[-1,0],[1,-1],[1,0]]
		},
		{
			harvest: squaresWhere((x,y) => {y === 0 && x > 0}, 5)
		},
		{
			harvest: squaresWhere((x,y) => {Math.abs(y) === x && x !== 0}, 5)
		},
		{
			tree: SQUARE_EMPTY,
			harvest: squaresWhere((x,y) => {y === 0}, 5)
		},
		{
			tree: SQUARE_EMPTY,
			harvest: squaresWhere((x,y) => {Math.abs(x) === Math.abs(y)})
		},
		{
			tree: SQUARE_ROTTEN,
			harvest: squaresWhere(() => true, 5),
			limit: 1
		},
		{
			harvest: [[0,0]],
			act: async (game) => {
				const newSquares = new Array(36);
				game.squares.forEach((value, index) => {
					const newIndex = toIndex(rotate90(toTuple(index)));
					newSquares[newIndex] = value;
				});
				game.squares = newSquares;
			}
		},
		{
			act: async (game) => {
				const square = await game.currentPlayer.chooseLocation(_.range(36));
				const flipChoices = calculateOffsetsIndex(square, adjacencies);
				const flip = await game.currentPlayer.chooseLocation(flipChoices);
				game.squares[square] = SQUARE_TEAM[game.currentPlayer.team];
				switch(game.squares[flip]) {
					case SQUARE_ROTTEN:
						game.squares[flip] = SQUARE_TEAM[game.currentPlayer.team];
						break;
					case SQUARE_TEAM[0]:
					case SQUARE_TEAM[1]:
						game.squares[flip] = SQUARE_ROTTEN;
						break;
				}
			}
		},
		{
			
// 23. Play both remaining cards
// 24. Double tree
// 25. Rotten, Plant an adjacent tree
// 26. Plant an adjacent tree
// 27. Play two weeds
// 28. Don't lose apples to rotten apples this round
// 29. Remove an adjacent square
// 30. Play this card after all other cards
		}
	]
	
	const hideIf = (element, toggle) => {
		element.style.display = (toggle ? 'none' : '');
	};
	const element = (type, attributes, textContent) => {
		const e = document.createElement(type);
		_.forOwn(attributes, (value, key) => {
			e.setAttribute(key, value);
		});
		e.textContent = textContent;
		return e;
	};
	const select = (label, id, options, selection) => {
		const container = element("div", {id: id+"Container", class: "container"});
		const select = element("select", {id: id});
		const labelElement = element("label", {"for": id}, label);
		_.forOwn(options, (value, key) => {
			const option = element("option", {"value": key});
			if (selection === value) {
				option.selected = "selected";
			}
			option.textContent = value;
			select.appendChild(option);
		});
		container.appendChild(labelElement);
		container.appendChild(select);
		return {container: container, input: select};
	};
	const input = (label, id, value) => {
		const container = element("div", {id: id+"Container", class: "container"});
		const input = element("input", {id: id});
		input.value = value;
		const labelElement = element("label", {"for": id}, label);
		container.appendChild(labelElement);
		container.appendChild(input);
		return {container: container, input: input};
	};
	const createFormElements = () => {
		const container = element("div", {id: "gameForm"});
		const playerCount = select("Player count:", "playerCount", {"2":2, "4": 4}, 2);
		
		container.appendChild(playerCount.container);
		container.appendChild(element("br"));
							
		const players = _.range(4).map((i) => {
			const playerType = select("Player "+(i+1)+":", "playerType"+i, {[BOT_PLAYER]: BOT_NAMES[i], [HUMAN_PLAYER]: "Human"}, i === 0 ? HUMAN_PLAYER : BOT_PLAYER);
			const playerName = input("Name:", "playerName"+i, "Human");
			playerName.input.addEventListener("input", () => {
				playerType.input.options[1].textContent = playerName.input.value;
			});
			playerType.input.addEventListener("input", () => {
				hideIf(playerName.container, playerType.input.value === BOT_PLAYER);
			});

			hideIf(playerName.container, i >= 1);
			hideIf(playerType.container, i >= 2);
			
			if (i >= 2) {
				playerCount.input.addEventListener("input", () => {
					hideIf(playerType.container, playerCount.input.value === "2");
					hideIf(playerName.container, playerCount.input.value === "2" || playerType.input.value === BOT_PLAYER);
				});
			}
			container.appendChild(playerType.container);
			container.appendChild(playerName.container);
			container.appendChild(element("br"));
			return { type: playerType, name: playerName}
		});
		
		const button = element("button",null,"Start");
		
		container.appendChild(button);
		
		return {
			container: container,
			playerCount: playerCount,
			players: players,
			startButton: button
		};
		
	};
	const formElements = createFormElements();
	
	const buildPlayers = () => {
		const playerCount = parseInt(formElements.playerCount.value);
		if (playerCount !== 2 || playerCount !== 4){
			throw new Exception("Player count must be 2 or 4, "+playerCount+" given");
		}
		
		return _.range(playerCount).map((i) => {
			const player = formElements.players[i]

			const playerObject = (player.type.value === BOT_PLAYER) ? {name: names[i], ai: botAi} : {name: player.name.value, ai: humanAi} ;
			playerObject.team = i % 2;
			playerObject.index = i;
			return playerObject;
		});
	};
	
	const render = (game) => {
	};
	
	const humanAi = {
	};
	
	const botAi = {
		
	};

	const isFinished = (game) => {

	}
	
	const newGame = () => {
		const game = {};
		game.players = buildPlayers();
		game.currentPlayerIndex = -1;
		game.squares = _.fill(Array(36), SQUARE_EMPTY);
		return game;
	};
	
	const play = async () => {
		const game = newGame();
		while (!isFinished(game)){
			game.currentPlayer = game.players[game.currentPlayer.index+1];
			render(game);
			await game.currentPlayer.act();
		}
	};
	
	formElements.startButton.addEventListener("click", play);
	document.getElementById("game").appendChild(formElements.container);
}();