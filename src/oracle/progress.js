

CoCreate.observer.init({
    name: 'getProgress',
    observe: ['addedNodes'],
    target: '.progress',
    callback: async (mutation) => {
        let position = mutation.target.getAttribute('position');
        position = parseFloat(position)
        if (!position)
            return
        else
            position -= 1

        let data = await CoCreate.socket.send({
            method: "object.read",
            array: "questions",
            $filter: {
                sort: [
                    { key: 'position', direction: 'asc' }
                ],
                query: [
                    { key: "actions", value: 'validate, click, save, action(document; #request)', operator: '$eq' }
                ]
            }
        });

        let previousPosition, nextPosition;
        let questions = data.object
        for (let i = 0; i < questions.length; i++) {
            if (questions[i].position > position) {
                if (i > 0) {
                    previousPosition = questions[i - 1].position;
                } else
                    previousPosition = 0
                if (i < questions.length - 1) {
                    nextPosition = questions[i].position;
                }
                break;
            }
        }

        let progressBarPercentage = 0;

        if (previousPosition !== null && nextPosition !== null) {
            // Calculate relative position
            const totalRange = nextPosition - previousPosition;
            const currentPositionRelative = position - previousPosition;

            // Convert to percentage
            progressBarPercentage = (currentPositionRelative / totalRange) * 100;
        } else if (previousPosition === null && nextPosition !== null) {
            // If there is no previous position, consider only the next position
            progressBarPercentage = (position / nextPosition) * 100;
        } else if (nextPosition === null) {
            // If there is no next position, consider 100% progress
            progressBarPercentage = 100;
        }

        mutation.target.style.width = `${progressBarPercentage}%`;

    }
});

