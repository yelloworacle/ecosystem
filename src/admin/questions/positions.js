CoCreate.actions.init({
	name: "updatePositions",
	callback: async (action) => {
		let name = action.form.querySelector("#name");
		name = name.getValue();

		let position = action.form.querySelector("#position");
		position = position.getValue();

		let data = await CoCreate.socket.send({
			method: "object.read",
			array: "questions",
			$filter: {
				sort: [{ key: "position", direction: "asc" }]
			}
		});

		let currentPosition = 0;
		let questions = data.object;
		for (let i = 0; i < questions.length; i++) {
			currentPosition += 1;
			if (
				questions[i].position === currentPosition &&
				questions[i].position !== position
			)
				continue;
			if (questions[i].name === name) continue;
			if (
				questions[i].position === position &&
				currentPosition === position
			)
				currentPosition += 1;

			await CoCreate.crud.send({
				method: "object.update",
				array: "questions",
				object: {
					_id: questions[i]._id,
					position: currentPosition
				}
			});
		}

		action.element.dispatchEvent(
			new CustomEvent("updatePositions", {
				detail: {}
			})
		);
	}
});
