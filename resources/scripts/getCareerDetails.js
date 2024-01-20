const fs = require('fs').promises;
const careerNames = require('./career-names.json');
const openai = require('@cocreate/openai');
const crud = require('@cocreate/crud-client');


const careerFields = require('./career-fields.js');

async function processCareers() {
    const errors = []
    while (careerNames.length > 0) {
        const name = careerNames[0]; // Get the first name
        try {
            let careersDetails = {}
            for (let i = 0; i < careerFields.length; i++) {
                const messages = []
                messages.push({
                    role: 'system',
                    content: `Need details about the career name provided. Your response needs to be a valid Json object containing the following keys with no additional context required:
                    ${careerFields[i]}
                    `
                })
                messages.push({ role: 'user', content: name })

                let data = await openai.send({
                    method: 'openai.chat',
                    chat: {
                        apiKey: "REDACTED_OPENAI_KEY",
                        model: 'gpt-3.5-turbo',
                        messages,
                        max_tokens: 3300,
                        temperature: 0.6,
                        n: 1,
                        stop: '###STOP###',
                    }
                })

                if (data.chat.choices && data.chat.choices[0].message.content) {
                    let content = data.chat.choices[0].message.content;
                    content = content.replace(/```json\n|\n```/g, '');
                    content = content.replace(/```javascript\n|\n```/g, '');
                    try {
                        content = JSON.parse(content)
                        careersDetails = { ...careersDetails, ...content }
                    } catch (error) {
                        console.log(content)
                    }
                } else {
                    errors.push(name)
                }
            }

            let request = {
                organization_id: "652c8d62679eca03e0b116a7",
                host: "ws://localhost:3000",
                method: "object.create",
                array: "careers",
                object: {
                    name,
                    ...careersDetails
                }
            }

            // data = await crud.send(request)
            // if (!data || !data.object || !data.object[0]) {
            //     errors.push(name)
            // }
            crud.send(request)
            careerNames.shift(); // Removes the first element

            await fs.writeFile('career-names.json', JSON.stringify(careerNames, null, 2));

        } catch (error) {
            errors.push(name)
            console.error(`Error processing ${name}: ${error}`);
        }
    }

    if (errors.length) {
        await fs.writeFile('career-name-errors.js', `module.exports = ${JSON.stringify(errors, null, 2)};`);
    }

    console.log('Processing complete.');
}

processCareers();
