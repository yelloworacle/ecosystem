const fs = require('fs').promises;
const careerNames = require('./career-names');
const openai = require('@cocreate/openai');
const crud = require('@cocreate/crud-client');
const Config = require('@cocreate/config')

const systemMessages = require('./systemMessages.js');

async function processCareers() {
    let config = await Config({
        organization_id: "",
        host: "",
        apiKey: ""
    })


    const errors = []
    while (careerNames.length > 0) {
        const name = careerNames[0]; // Get the first name
        try {
            const messages = [...systemMessages]
            messages.push({ role: 'user', content: name })
            let data = await openai.send({
                method: 'openai.chat',
                chat: {
                    apiKey: "REDACTED_OPENAI_KEY",
                    model: 'gpt-4-1106-preview',
                    messages,
                    max_tokens: 3300,
                    temperature: 0.6,
                    n: 1,
                    stop: '###STOP###',
                }
            })

            if (data.chat.choices && data.chat.choices[0].message.content) {
                let content = data.chat.choices[0].message.content;
                content = JSON.parse(content)

                let request = {
                    method: "object.create",
                    array: "careers",
                    object: {
                        name,
                        ...content
                    }
                }

                data = await crud.send(request)
                if (!data || !data.object || !data.object[0]) {
                    errors.push(name)
                }
            } else {
                errors.push(name)
            }

            careerNames.shift(); // Removes the first element

            // await fs.writeFile('career-names.js', `module.exports = ${JSON.stringify(remainingCareers, null, 2)};`);

        } catch (error) {
            errors.push(name)
            console.error(`Error processing ${name}: ${error}`);
            break; // Stop processing on error
        }
    }

    if (errors.length) {
        await fs.writeFile('career-name-errors.js', `module.exports = ${JSON.stringify(errors, null, 2)};`);
    }

    console.log('Processing complete.');
}

processCareers();
