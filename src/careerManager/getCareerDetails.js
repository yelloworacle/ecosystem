const fs = require('fs').promises;
const openai = require('@cocreate/openai');
const crud = require('@cocreate/crud-client');
const careerFields = require('./career-fields.js');

let chunkSize = 100;
const CareerNames = require('./career-names-2.json');
while (CareerNames.length > 0) {
    processCareers(CareerNames.splice(0, chunkSize))
}

async function processCareers(careerNames) {
    const errors = []
    while (careerNames.length > 0) {
        const name = careerNames[0]; // Get the first name
        try {
            let careersDetails = {}
            for (let i = 0; i < careerFields.length; i++) {
                const messages = []
                messages.push({
                    role: 'system',
                    content: `Need details about the career name provided. Your response needs to be a valid Json object containing the following keys with no additional context required. please be sure it is valid JSON as it will be parsed:
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
                        errors.push(name)
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

            // await fs.writeFile('career-names.json', JSON.stringify(careerNames, null, 2));

        } catch (error) {
            errors.push(name)
            console.error(`Error processing ${name}: ${error}`);
        }
    }

    if (errors.length) {
        updateErrorLog(errors);
    }

    console.log('Processing complete.');
}

async function updateErrorLog(newErrors) {
    try {
        let errors = await fs.readFile('career-name-errors.json', 'utf8')
        errors = JSON.parse(errors);
        // Merge the existing errors with the new errors
        const mergedErrors = [...errors, ...newErrors];

        try {
            // Write the merged errors back to the file
            await fs.writeFile('career-name-errors.json', JSON.stringify(mergedErrors, null, 2), 'utf8');
            console.log('Error log updated successfully.');
        } catch (error) {
            console.error('Error writing to the file:', error);
        }

    } catch (error) {
        console.error('Error reading the existing errors file:', error);
    }
}