(function () {
    CoCreate.actions.init({
        name: "manageCareers",
        callback: async (action) => {
            let value = action.form[0].getValue()
            const element = document.getElementById('mergedCareers');

            let preValue = element.getValue()
            let newValue = [...value, ...preValue]
            element.setValue(newValue, false)
            document.dispatchEvent(new CustomEvent('manageCareers', {
                detail: {}
            }));

            let careers = await CoCreate.socket.send({
                method: "object.read",
                array: "careers",
                $filter: {
                    query: { name: { $in: value } }
                }
            });

            for (let careerName of value) {
                const careerExists = careers.object.some(existingCareer => existingCareer.name === careerName);

                if (!careerExists) {
                    addCareer(careerName, element, newValue)
                }
            }

        }
    });

    const careerFields = [`
    name
    salary
    stress
    pros
    cons
    facts
    activities
    advancement
    alternativeQualifications
    apprentice
    areasGrowth
    areasKnowledge
    assets
    attributesPersonal
    background
    careerLongevity
    careerPathVariability
    careerReputation
    challenges
    characteristics
    constraints
    credentials
    decisionMaking
    descriptions
    effects
    entryPoint
    familyLife
    frustrations
    importantIndustryPeople
    interests
    keySkills
    professionalJournals
    professionalOrganizations
    sacrifices
    satisfaction
    supervise
    takeWorkHome
    technology
    vacation
    `
    ]


    async function addCareer(name, element, careerNames) {
        try {
            let careersDetails
            for (let i = 0; i < careerFields.length; i++) {
                const messages = []
                messages.push({
                    role: 'system',
                    content: `Need details about the career name provided. Your response needs to be a valid Json object containing the following keys with no additional context required. please be sure it is valid JSON as it will be parsed:
                    ${careerFields[i]}
                    `
                })
                messages.push({ role: 'user', content: name })

                let data = await CoCreate.socket.send({
                    method: 'openai.chat.completions.create',
                    openai: {
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
                        console.error(`Error parsing career ${name}: ${error}`);
                    }
                } else {
                    console.error(`Error AI content is empty ${name}: ${error}`);
                }
            }

            if (!careersDetails)
                return
            let request = {
                method: "object.create",
                array: "careers",
                object: {
                    ...careersDetails
                }
            }

            data = await CoCreate.crud.send(request)
            if (!data || !data.object || !data.object[0]) {
                console.error(`Error saving career ${name}: ${error}`);
            }
            else {
                element.setValue(careerNames, false)
                console.log('created career: ', data.object[0])
            }
        } catch (error) {
            console.error(`Error processing ${name}: ${error}`);
        }
    }
})();


