(function () {
	let environment = "production"; // production, test

	if (
		window.location.host.startsWith("test.") ||
		window.location.host.startsWith("dev.")
	) {
		environment = "test";
	}

	let productionPk =
		"pk_live_51OoykOIMlR98agX1eiWRfz080ZdLitzBnAF75vbXecQBfHdy8sAu5h8B0au8lVzLKqQSiI2D1xQS8ZZoSFBEuXPr007I24duUf";
	let testPk =
		"pk_test_51OoykOIMlR98agX1pLmMH5EfRTscBQKMDd6jLBJxrQILkqrKcnTxaDXjVlX65nwZ1RlF26WoEd1amURrzzQmuxbG00R21LGW40";

	let pk = environment === "production" ? productionPk : testPk;

	// Function to load Stripe library dynamically
	function loadStripeLibrary(callback) {
		var script = document.createElement("script");
		script.src = "https://js.stripe.com/v3/";
		script.onload = function () {
			callback();
		};
		document.head.appendChild(script);
	}

	// Load Stripe and initialize
	loadStripeLibrary(function () {
		const stripe = Stripe(pk);
		const elements = stripe.elements();

		const style = {
			base: {
				fontSize: "16px",
				color: "#32325d"
			}
		};

		const card = elements.create("card", { style: style });
		card.mount("#card-element");

		const form = document.getElementById("payment-form");
		form.addEventListener("submit", async function (event) {
			event.preventDefault();
			const submitButton = form.querySelector('button[type="submit"]');
			submitButton.innerHTML = "Processing";

			const customAmount =
				parseFloat(document.getElementById("customAmount").value) || 0;
			if (customAmount <= 0) {
				alert("Please enter a valid amount.");
				submitButton.innerHTML = "Submit Payment";
				return;
			}

			const destination =
				document.getElementById("ambassadorAccount").value;
			const enabled = document.getElementById("ambassador").getValue();
			let parents = document.getElementById("ambassadorParents");
			if (parents) parents = parents.getValue();

			const additionalData = {
				name: document.getElementById("name").value,
				email: document.getElementById("email").value
			};

			const customer = document.getElementById("customer").value;
			if (customer) additionalData.customer = customer;

			const result = await stripe.createToken(card, additionalData);
			if (result.error) {
				console.log(result.error.message);
				submitButton.innerHTML = "Payment Failed";
				return;
			}

			additionalData.source = result.token.id;

			if (!additionalData.customer) {
				const customerResponse = await CoCreate.socket.send({
					method: "stripe.customers.create",
					broadcast: false,
					stripe: additionalData,
					environment
				});
				if (!customerResponse.stripe || !customerResponse.stripe.id) {
					submitButton.innerHTML = "Payment Failed";
					return;
				}
				additionalData.customer = customerResponse.stripe.id;
			}

			const paymentIntentData = {
				method: "stripe.paymentIntents.create",
				broadcast: false,
				stripe: {
					amount: Math.round(customAmount * 100), // Convert to cents
					currency: "usd",
					customer: additionalData.customer,
					description: "Adding funds to account",
					payment_method_types: ["card"]
				},
				environment
			};

			// Include ambassador payout logic if applicable
			if (destination && enabled) {
				paymentIntentData.stripe.application_fee_amount = Math.round(
					((customAmount * 15) / 100) * 100
				); // 15% fee
				paymentIntentData.stripe.transfer_data = {
					destination
				};
			}

			const paymentResponse = await CoCreate.socket.send(
				paymentIntentData
			);

			if (paymentResponse.stripe.id) {
				// Handle ambassador parent payouts (5% per level, up to 4 levels)
				if (parents && enabled) {
					console.log("Ambassador parents: ", parents);
					let amount = Math.round(((customAmount * 5) / 100) * 100); // 5% of custom amount
					for (let i = 0; i < parents.length && i < 4; i++) {
						let transferData = {
							method: "stripe.transfers.create",
							broadcast: false,
							stripe: {
								amount,
								currency: "usd",
								destination: parents[i],
								description: "5% share to connected account"
							},
							environment
						};

						const response = await CoCreate.socket.send(
							transferData
						);
						console.log(
							`Transfer response for parent account ${parents[i]}:`,
							response
						);
					}
				}

				submitButton.innerHTML = "Payment Successful";
				alert("Funds added successfully!");
				setTimeout(() => window.history.back(), 3000);
			} else {
				submitButton.innerHTML = "Payment Failed";
			}
		});
	});
})();
