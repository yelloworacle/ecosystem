let config = {
	dburl: "",
	openAiKey: ""
};

const { MongoClient } = require("mongodb");

let openai;

// MongoDB Configuration
const client = new MongoClient(config.dburl, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

// Function to generate descriptions using OpenAI
async function generateDescriptions(careerName) {
	const prompt = `
For the career "${careerName}", provide the following:

1. **Sense of Purpose**: A powerful description highlighting why this career exists in the world and the deeper purpose it serves. Connect this purpose to a larger vision, such as helping communities thrive, contributing to a healthier planet, or advancing human knowledge.

2. **Healing Effect**: A description of how this career path contributes to healing—whether that’s healing people, communities, the environment, or society as a whole. Healing could be literal (as in healthcare), or it could represent positive social impact, like fostering understanding or protecting the planet.

3. **Brings Joy**: A description emphasizing the joy and satisfaction this career can bring, both to those who work in it and to those who benefit from it. Mention the sense of fulfillment, creativity, or connection that comes with the role.

Please provide the responses in a JSON format with the keys: senseOfPurpose, healingEffect, bringsJoy.
`;

	try {
		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: 3000
		});

		const content = response.choices[0].message.content;

		// Attempt to parse JSON from the response
		const jsonStart = content.indexOf("{");
		const jsonEnd = content.lastIndexOf("}");
		const jsonString = content.substring(jsonStart, jsonEnd + 1);

		const descriptions = JSON.parse(jsonString);
		return descriptions;
	} catch (error) {
		console.error(
			`Error generating descriptions for "${careerName}":`,
			error.message
		);
		return null;
	}
}

async function enrichCareers() {
	let processedCount = 0;
	let updatedCount = 0;

	try {
		const { OpenAI } = await import("openai");

		openai = new OpenAI({
			apiKey: config.openAiKey
		});

		await client.connect();
		console.log("Connected to MongoDB.");

		const database = client.db("652c8d62679eca03e0b116a7"); // Use the default database from URI
		const careersCollection = database.collection("careers");

		// Create a cursor that filters documents missing any of the target fields
		const query = {
			$or: [
				{ senseOfPurpose: { $exists: false } },
				{ healingEffect: { $exists: false } },
				{ bringsJoy: { $exists: false } }
			]
		};

		const cursor = careersCollection.find(query).batchSize(100); // Adjust batchSize as needed

		while (await cursor.hasNext()) {
			try {
				const career = await cursor.next();
				const { _id, name, senseOfPurpose, healingEffect, bringsJoy } =
					career;

				// Check if all fields exist to avoid redundant processing
				if (senseOfPurpose && healingEffect && bringsJoy) {
					console.log(
						`Career "${name}" already has all fields. Skipping.`
					);
					continue;
				}

				console.log(`Processing career: "${name}"`);

				// Generate descriptions
				const descriptions = await generateDescriptions(name);

				if (descriptions) {
					// Prepare update object
					const updateFields = {};
					if (!senseOfPurpose && descriptions.senseOfPurpose) {
						updateFields.senseOfPurpose =
							descriptions.senseOfPurpose;
					}
					if (!healingEffect && descriptions.healingEffect) {
						updateFields.healingEffect = descriptions.healingEffect;
					}
					if (!bringsJoy && descriptions.bringsJoy) {
						updateFields.bringsJoy = descriptions.bringsJoy;
					}

					if (Object.keys(updateFields).length > 0) {
						try {
							// Update the document in MongoDB
							await careersCollection.updateOne(
								{ _id },
								{ $set: updateFields }
							);
							console.log(
								`Updated career "${name}" with new fields.`
							);
							updatedCount++;
						} catch (error) {
							console.error(
								`Failed to update career "${name}", _id: ${_id}.`
							);
						}
					} else {
						console.log(
							`No new fields to update for career "${name}".`
						);
					}
				} else {
					console.log(
						`Failed to generate descriptions for "${name}".`
					);
				}

				processedCount++;

				// Optional: Add a delay to respect OpenAI rate limits
				// await new Promise((resolve) => setTimeout(resolve, 500));
			} catch (docError) {
				// Handle errors related to individual document processing
				console.error(
					`Error processing a career document:`,
					docError.message
				);
				processedCount++;
				continue;
			}
		}

		console.log(
			`Enrichment process completed. Total processed: ${processedCount}, Total updated: ${updatedCount}`
		);
	} catch (error) {
		console.error(
			"An error occurred during the enrichment process:",
			error
		);
	} finally {
		await client.close();
		console.log("Disconnected from MongoDB.");
		if (processedCount) enrichCareers();
	}
}

// Execute the enrichment
enrichCareers();
